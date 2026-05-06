package com.korfarm.api.aigen

import com.korfarm.api.common.ApiResponse
import com.korfarm.api.org.OrgMembershipRepository
import com.korfarm.api.org.OrgRepository
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.user.UserRepository
import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import org.springframework.web.bind.annotation.*
import java.time.LocalDate
import java.time.LocalDateTime

/**
 * AI 사용 내역 어드민 페이지 전용 API.
 *
 * Claude API 가격 (2025-04 기준, USD per 1M tokens — 추정 단가):
 *   - Sonnet 4.6: $3 input, $15 output
 *   - Opus 4.7:   $15 input, $75 output
 *   - 캐시 read 는 input 단가의 10% (Anthropic prompt caching)
 *
 * input_tokens 가 NULL 인 옛 row 는 비용 0원으로 표시.
 * 환율: 1 USD = 1370 KRW (대략).
 */
@RestController
@RequestMapping("/v1/admin/ai-usage")
class AiUsageController(
    private val userRepository: UserRepository,
    private val orgRepository: OrgRepository,
    private val orgMembershipRepository: OrgMembershipRepository,
) {
    @PersistenceContext
    private lateinit var em: EntityManager

    @GetMapping
    fun list(
        @RequestParam(required = false) userId: String?,
        @RequestParam(required = false) orgId: String?,
        @RequestParam(required = false) kind: String?,
        @RequestParam(required = false) from: String?,   // ISO yyyy-MM-dd
        @RequestParam(required = false) to: String?,
        @RequestParam(required = false, defaultValue = "200") limit: Int,
    ): ApiResponse<UsageListResponse> {
        AdminGuard.requireAnyRole("HQ_ADMIN")

        val where = mutableListOf<String>()
        val params = mutableMapOf<String, Any>()
        if (!userId.isNullOrBlank()) { where.add("l.user_id = :userId"); params["userId"] = userId }
        if (!kind.isNullOrBlank()) { where.add("l.kind = :kind"); params["kind"] = kind }
        if (!from.isNullOrBlank()) {
            where.add("l.created_at >= :fromDt"); params["fromDt"] = LocalDate.parse(from).atStartOfDay()
        }
        if (!to.isNullOrBlank()) {
            where.add("l.created_at < :toDt"); params["toDt"] = LocalDate.parse(to).plusDays(1).atStartOfDay()
        }
        val whereClause = if (where.isEmpty()) "" else "WHERE " + where.joinToString(" AND ")

        val safeLimit = limit.coerceIn(1, 1000)
        // 3개 테이블 UNION ALL — ai_gen_logs (콘텐츠 생성·첨삭) + agent_usage_log (운영자 AI 비서) + tutor_usage_log (학생 튜터)
        // 컬럼 정렬: id / user_id / test_id / kind / model / input / output / duration / passed / retry / status / error / created_at
        val sql = """
            SELECT * FROM (
                SELECT l.id, l.user_id, l.test_id, l.kind, l.model,
                       l.input_tokens, l.output_tokens, l.duration_ms,
                       l.passed, l.retry_count, l.status, l.error_message,
                       l.created_at
                FROM ai_gen_logs l
                UNION ALL
                SELECT a.id, a.user_id, NULL AS test_id,
                       CASE WHEN a.is_extra = 1 THEN 'agent-call-extra' ELSE 'agent-call-free' END AS kind,
                       'sonnet' AS model,
                       a.total_input_tokens, a.total_output_tokens, NULL AS duration_ms,
                       NULL AS passed, 0 AS retry_count, 'success' AS status, NULL AS error_message,
                       a.created_at
                FROM agent_usage_log a
                UNION ALL
                SELECT t.id, t.user_id, NULL AS test_id,
                       'tutor-call' AS kind,
                       'sonnet' AS model,
                       t.total_input_tokens, t.total_output_tokens, NULL AS duration_ms,
                       NULL AS passed, 0 AS retry_count, 'success' AS status, NULL AS error_message,
                       t.created_at
                FROM tutor_usage_log t
            ) l
            $whereClause
            ORDER BY l.created_at DESC
            LIMIT $safeLimit
        """.trimIndent()
        val q = em.createNativeQuery(sql)
        params.forEach { (k, v) -> q.setParameter(k, v) }
        @Suppress("UNCHECKED_CAST")
        val rows = q.resultList as List<Array<Any?>>

        // 사용자·기관 join
        val userIds = rows.mapNotNull { it[1] as? String }.distinct()
        val users = userRepository.findAllById(userIds).associateBy { it.id }
        val membershipsByUser = userIds.associateWith { uid ->
            orgMembershipRepository.findByUserIdAndStatus(uid, "active").firstOrNull()
        }
        val orgIds = membershipsByUser.values.mapNotNull { it?.orgId }.distinct()
        val orgs = if (orgIds.isNotEmpty()) orgRepository.findAllById(orgIds).associateBy { it.id } else emptyMap()

        val items = rows.map { r ->
            val uid = r[1] as? String
            val model = (r[4] as? String) ?: ""
            val inTok = (r[5] as? Number)?.toInt() ?: 0
            val outTok = (r[6] as? Number)?.toInt() ?: 0
            val (usd, krw) = estimateCost(model, inTok, outTok)
            val membership = membershipsByUser[uid]
            UsageItem(
                id = r[0] as String,
                createdAt = (r[12] as? java.sql.Timestamp)?.toLocalDateTime() ?: LocalDateTime.now(),
                userId = uid ?: "-",
                userName = users[uid]?.name ?: "-",
                orgId = membership?.orgId,
                orgName = membership?.orgId?.let { orgs[it]?.name },
                kind = r[3] as? String ?: "-",
                model = model,
                inputTokens = inTok,
                outputTokens = outTok,
                durationMs = (r[7] as? Number)?.toInt(),
                passed = r[8] as? Boolean,
                retryCount = (r[9] as? Number)?.toInt() ?: 0,
                status = r[10] as? String ?: "-",
                estimatedUsd = usd,
                estimatedKrw = krw,
                testId = r[2] as? String,
            )
        }
        // 필터 — orgId 는 사용자 기관 기준 후필터링
        val filtered = if (!orgId.isNullOrBlank()) items.filter { it.orgId == orgId } else items

        // 합계
        val totalUsd = filtered.sumOf { it.estimatedUsd }
        val totalKrw = filtered.sumOf { it.estimatedKrw }
        val totalCalls = filtered.size

        // 사용자/기관 분포 (드롭다운 옵션)
        val allUsers = items.map { Pair(it.userId, it.userName) }.distinct()
        val allOrgs = items.mapNotNull { it.orgId?.let { id -> Pair(id, it.orgName ?: "") } }.distinct()

        return ApiResponse(success = true, data = UsageListResponse(
            items = filtered,
            totalCalls = totalCalls,
            totalUsd = totalUsd,
            totalKrw = totalKrw,
            userOptions = allUsers.map { UsageUserOption(it.first, it.second) },
            orgOptions = allOrgs.map { UsageOrgOption(it.first, it.second) },
        ))
    }

    private fun estimateCost(model: String, inputTokens: Int, outputTokens: Int): Pair<Double, Long> {
        // Claude API 단가 (USD per 1M tokens)
        val (inPer1M, outPer1M) = when {
            model.contains("opus") -> 15.0 to 75.0
            model.contains("sonnet") -> 3.0 to 15.0
            model.contains("haiku") -> 0.8 to 4.0
            else -> 3.0 to 15.0
        }
        val usd = (inputTokens / 1_000_000.0) * inPer1M + (outputTokens / 1_000_000.0) * outPer1M
        val krw = (usd * 1500).toLong()
        return Pair(usd, krw)
    }

    data class UsageListResponse(
        val items: List<UsageItem>,
        val totalCalls: Int,
        val totalUsd: Double,
        val totalKrw: Long,
        val userOptions: List<UsageUserOption>,
        val orgOptions: List<UsageOrgOption>,
    )

    data class UsageItem(
        val id: String,
        val createdAt: LocalDateTime,
        val userId: String,
        val userName: String,
        val orgId: String?,
        val orgName: String?,
        val kind: String,
        val model: String,
        val inputTokens: Int,
        val outputTokens: Int,
        val durationMs: Int?,
        val passed: Boolean?,
        val retryCount: Int,
        val status: String,
        val estimatedUsd: Double,
        val estimatedKrw: Long,
        val testId: String?,
    )

    data class UsageUserOption(val userId: String, val userName: String)
    data class UsageOrgOption(val orgId: String, val orgName: String)
}
