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

        // ai_gen_logs 전용 where (kind 포함)
        val whereGen = mutableListOf<String>()
        val paramsGen = mutableMapOf<String, Any>()
        if (!userId.isNullOrBlank()) { whereGen.add("l.user_id = :userId"); paramsGen["userId"] = userId }
        if (!kind.isNullOrBlank()) { whereGen.add("l.kind = :kind"); paramsGen["kind"] = kind }
        if (!from.isNullOrBlank()) {
            whereGen.add("l.created_at >= :fromDt"); paramsGen["fromDt"] = LocalDate.parse(from).atStartOfDay()
        }
        if (!to.isNullOrBlank()) {
            whereGen.add("l.created_at < :toDt"); paramsGen["toDt"] = LocalDate.parse(to).plusDays(1).atStartOfDay()
        }
        val whereClauseGen = if (whereGen.isEmpty()) "" else "WHERE " + whereGen.joinToString(" AND ")

        // agent_usage_log / tutor_usage_log 공통 where (user_id, created_at)
        val whereCommon = mutableListOf<String>()
        val paramsCommon = mutableMapOf<String, Any>()
        if (!userId.isNullOrBlank()) { whereCommon.add("user_id = :userId"); paramsCommon["userId"] = userId }
        if (!from.isNullOrBlank()) {
            whereCommon.add("created_at >= :fromDt"); paramsCommon["fromDt"] = LocalDate.parse(from).atStartOfDay()
        }
        if (!to.isNullOrBlank()) {
            whereCommon.add("created_at < :toDt"); paramsCommon["toDt"] = LocalDate.parse(to).plusDays(1).atStartOfDay()
        }
        val whereClauseCommon = if (whereCommon.isEmpty()) "" else "WHERE " + whereCommon.joinToString(" AND ")

        // kind 필터에 따라 어느 테이블 조회할지 결정
        val includeGen = kind.isNullOrBlank() || (!kind.startsWith("agent-call") && kind != "tutor-call")
        val includeAgent = kind.isNullOrBlank() || kind.startsWith("agent-call")
        val includeTutor = kind.isNullOrBlank() || kind == "tutor-call"

        val safeLimit = limit.coerceIn(1, 1000)

        // ai_gen_logs (콘텐츠 생성·첨삭)
        val rows1: List<Array<Any?>> = if (!includeGen) emptyList() else {
            val sql1 = """
                SELECT l.id, l.user_id, l.test_id, l.kind, l.model,
                       l.input_tokens, l.output_tokens, l.duration_ms,
                       l.passed, l.retry_count, l.status, l.error_message,
                       l.created_at
                FROM ai_gen_logs l
                $whereClauseGen
                ORDER BY l.created_at DESC
                LIMIT $safeLimit
            """.trimIndent()
            val q1 = em.createNativeQuery(sql1)
            paramsGen.forEach { (k, v) -> q1.setParameter(k, v) }
            @Suppress("UNCHECKED_CAST")
            q1.resultList as List<Array<Any?>>
        }

        // agent_usage_log (운영자 AI 비서)
        val rows2: List<Array<Any?>> = if (!includeAgent) emptyList() else try {
            // kind=agent-call-extra/free 인 경우 is_extra 도 추가 필터
            val extraFilter = when (kind) {
                "agent-call-extra" -> " AND is_extra = 1"
                "agent-call-free" -> " AND is_extra = 0"
                else -> ""
            }
            val sql2 = """
                SELECT id, user_id, NULL AS test_id,
                       CASE WHEN is_extra = 1 THEN 'agent-call-extra' ELSE 'agent-call-free' END AS kind,
                       COALESCE(model, 'claude-sonnet-4-6') AS model,
                       total_input_tokens, total_output_tokens, NULL AS duration_ms,
                       NULL AS passed, 0 AS retry_count, 'success' AS status, NULL AS error_message,
                       created_at
                FROM agent_usage_log
                ${if (whereClauseCommon.isEmpty()) (if (extraFilter.isNotEmpty()) "WHERE 1=1$extraFilter" else "") else "$whereClauseCommon$extraFilter"}
                ORDER BY created_at DESC
                LIMIT $safeLimit
            """.trimIndent()
            val q2 = em.createNativeQuery(sql2)
            paramsCommon.forEach { (k, v) -> q2.setParameter(k, v) }
            @Suppress("UNCHECKED_CAST")
            q2.resultList as List<Array<Any?>>
        } catch (_: Exception) { emptyList() }

        // tutor_usage_log (학생 튜터)
        val rows3: List<Array<Any?>> = if (!includeTutor) emptyList() else try {
            val sql3 = """
                SELECT id, user_id, NULL AS test_id,
                       'tutor-call' AS kind,
                       COALESCE(model, 'claude-sonnet-4-6') AS model,
                       total_input_tokens, total_output_tokens, NULL AS duration_ms,
                       NULL AS passed, 0 AS retry_count, 'success' AS status, NULL AS error_message,
                       created_at
                FROM tutor_usage_log
                $whereClauseCommon
                ORDER BY created_at DESC
                LIMIT $safeLimit
            """.trimIndent()
            val q3 = em.createNativeQuery(sql3)
            paramsCommon.forEach { (k, v) -> q3.setParameter(k, v) }
            @Suppress("UNCHECKED_CAST")
            q3.resultList as List<Array<Any?>>
        } catch (_: Exception) { emptyList() }

        // Kotlin 단에서 merge + sort by created_at desc + limit
        val rows = (rows1 + rows2 + rows3)
            .sortedByDescending { (it[12] as? java.sql.Timestamp)?.time ?: 0L }
            .take(safeLimit)

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

    /**
     * AI 사용 요약 — 모델별 / 일별 / 기관별 / 종류별 집계.
     * 운영 비용 모니터링용. HQ_ADMIN 만 호출 가능.
     *
     * groupBy: model (기본) / day / org / kind
     * 응답: 집계 row 들 + 전체 합계 (호출 수·input·output·USD·KRW)
     */
    @GetMapping("/summary")
    fun summary(
        @RequestParam(required = false) from: String?,   // ISO yyyy-MM-dd
        @RequestParam(required = false) to: String?,
        @RequestParam(required = false, defaultValue = "model") groupBy: String,
        @RequestParam(required = false) kind: String?,
    ): ApiResponse<UsageSummaryResponse> {
        AdminGuard.requireAnyRole("HQ_ADMIN")

        val fromDt = from?.let { LocalDate.parse(it).atStartOfDay() }
        val toDt = to?.let { LocalDate.parse(it).plusDays(1).atStartOfDay() }

        // ai_gen_logs / agent_usage_log / tutor_usage_log 통합해 메모리에서 집계
        val rows = mutableListOf<RawRow>()

        // 1) ai_gen_logs (시험 출제)
        val whereGen = mutableListOf<String>()
        val pGen = mutableMapOf<String, Any>()
        if (fromDt != null) { whereGen.add("l.created_at >= :fromDt"); pGen["fromDt"] = fromDt }
        if (toDt != null) { whereGen.add("l.created_at < :toDt"); pGen["toDt"] = toDt }
        if (!kind.isNullOrBlank()) { whereGen.add("l.kind = :kind"); pGen["kind"] = kind }
        val whereClauseGen = if (whereGen.isEmpty()) "" else "WHERE " + whereGen.joinToString(" AND ")
        val sqlGen = """
            SELECT l.created_at, l.user_id, l.kind, l.model,
                   COALESCE(l.input_tokens, 0) AS input_tokens,
                   COALESCE(l.output_tokens, 0) AS output_tokens
            FROM ai_gen_logs l
            $whereClauseGen
        """.trimIndent()
        val qGen = em.createNativeQuery(sqlGen)
        pGen.forEach { (k, v) -> qGen.setParameter(k, v) }
        @Suppress("UNCHECKED_CAST")
        val resGen = qGen.resultList as List<Array<Any?>>
        for (r in resGen) {
            rows.add(RawRow(
                createdAt = (r[0] as java.sql.Timestamp).toLocalDateTime(),
                userId = r[1] as String,
                kind = r[2] as String,
                model = (r[3] as? String) ?: "claude-sonnet-4-6",
                inputTokens = (r[4] as Number).toInt(),
                outputTokens = (r[5] as Number).toInt(),
            ))
        }

        // 2) agent_usage_log (운영자 AI)
        if (kind.isNullOrBlank() || kind == "agent_chat") {
            val whereA = mutableListOf<String>()
            val pA = mutableMapOf<String, Any>()
            if (fromDt != null) { whereA.add("u.created_at >= :fromDt"); pA["fromDt"] = fromDt }
            if (toDt != null) { whereA.add("u.created_at < :toDt"); pA["toDt"] = toDt }
            val whereClauseA = if (whereA.isEmpty()) "" else "WHERE " + whereA.joinToString(" AND ")
            val sqlA = """
                SELECT u.created_at, u.user_id, u.model,
                       u.total_input_tokens, u.total_output_tokens
                FROM agent_usage_log u
                $whereClauseA
            """.trimIndent()
            val qA = em.createNativeQuery(sqlA)
            pA.forEach { (k, v) -> qA.setParameter(k, v) }
            @Suppress("UNCHECKED_CAST")
            val resA = qA.resultList as List<Array<Any?>>
            for (r in resA) {
                rows.add(RawRow(
                    createdAt = (r[0] as java.sql.Timestamp).toLocalDateTime(),
                    userId = r[1] as String,
                    kind = "agent_chat",
                    model = (r[2] as? String) ?: "claude-sonnet-4-6",
                    inputTokens = (r[3] as Number).toInt(),
                    outputTokens = (r[4] as Number).toInt(),
                ))
            }
        }

        // 3) tutor_usage_log (학생 튜터) — 테이블 존재 시
        if (kind.isNullOrBlank() || kind == "tutor_chat") {
            try {
                val whereT = mutableListOf<String>()
                val pT = mutableMapOf<String, Any>()
                if (fromDt != null) { whereT.add("u.created_at >= :fromDt"); pT["fromDt"] = fromDt }
                if (toDt != null) { whereT.add("u.created_at < :toDt"); pT["toDt"] = toDt }
                val whereClauseT = if (whereT.isEmpty()) "" else "WHERE " + whereT.joinToString(" AND ")
                val sqlT = """
                    SELECT u.created_at, u.user_id, u.model,
                           u.total_input_tokens, u.total_output_tokens
                    FROM tutor_usage_log u
                    $whereClauseT
                """.trimIndent()
                val qT = em.createNativeQuery(sqlT)
                pT.forEach { (k, v) -> qT.setParameter(k, v) }
                @Suppress("UNCHECKED_CAST")
                val resT = qT.resultList as List<Array<Any?>>
                for (r in resT) {
                    rows.add(RawRow(
                        createdAt = (r[0] as java.sql.Timestamp).toLocalDateTime(),
                        userId = r[1] as String,
                        kind = "tutor_chat",
                        model = (r[2] as? String) ?: "claude-sonnet-4-6",
                        inputTokens = (r[3] as Number).toInt(),
                        outputTokens = (r[4] as Number).toInt(),
                    ))
                }
            } catch (_: Exception) {
                // 테이블 없으면 스킵
            }
        }

        // user → org 매핑 (groupBy=org 일 때만 필요)
        val userOrgMap: Map<String, Pair<String, String>> = if (groupBy == "org") {
            val userIds = rows.map { it.userId }.distinct()
            if (userIds.isEmpty()) emptyMap()
            else {
                val sqlOrg = """
                    SELECT m.user_id, m.org_id, o.name
                    FROM org_memberships m
                    JOIN orgs o ON o.id = m.org_id
                    WHERE m.status = 'active' AND m.user_id IN (:uids)
                """.trimIndent()
                val qOrg = em.createNativeQuery(sqlOrg)
                qOrg.setParameter("uids", userIds)
                @Suppress("UNCHECKED_CAST")
                val resOrg = qOrg.resultList as List<Array<Any?>>
                resOrg.associate { row ->
                    (row[0] as String) to ((row[1] as String) to ((row[2] as? String) ?: "(이름없음)"))
                }
            }
        } else emptyMap()

        // 그룹키 결정 함수
        val keyFn: (RawRow) -> Pair<String, String> = when (groupBy) {
            "day" -> { r -> r.createdAt.toLocalDate().toString().let { it to it } }
            "kind" -> { r -> r.kind to r.kind }
            "org" -> { r ->
                val org = userOrgMap[r.userId]
                if (org != null) org else "no_org" to "(소속 없음)"
            }
            else /* model */ -> { r -> r.model to r.model }
        }

        // 집계
        val grouped = mutableMapOf<String, SummaryRow>()
        var totalCalls = 0
        var totalIn = 0L
        var totalOut = 0L
        var totalUsd = 0.0
        var totalKrw = 0L
        for (r in rows) {
            val (key, label) = keyFn(r)
            val (usd, krw) = estimateCost(r.model, r.inputTokens, r.outputTokens)
            val agg = grouped.getOrPut(key) { SummaryRow(key, label, 0, 0L, 0L, 0.0, 0L) }
            agg.calls += 1
            agg.inputTokens += r.inputTokens
            agg.outputTokens += r.outputTokens
            agg.estimatedUsd += usd
            agg.estimatedKrw += krw
            totalCalls += 1
            totalIn += r.inputTokens
            totalOut += r.outputTokens
            totalUsd += usd
            totalKrw += krw
        }

        val sorted = grouped.values.sortedByDescending { it.calls }
        return ApiResponse(success = true, data = UsageSummaryResponse(
            groupBy = groupBy,
            from = from,
            to = to,
            kind = kind,
            rows = sorted,
            totalCalls = totalCalls,
            totalInputTokens = totalIn,
            totalOutputTokens = totalOut,
            totalUsd = totalUsd,
            totalKrw = totalKrw,
        ))
    }

    private data class RawRow(
        val createdAt: LocalDateTime,
        val userId: String,
        val kind: String,
        val model: String,
        val inputTokens: Int,
        val outputTokens: Int,
    )

    data class SummaryRow(
        val key: String,
        val label: String,
        var calls: Int,
        var inputTokens: Long,
        var outputTokens: Long,
        var estimatedUsd: Double,
        var estimatedKrw: Long,
    )

    data class UsageSummaryResponse(
        val groupBy: String,
        val from: String?,
        val to: String?,
        val kind: String?,
        val rows: List<SummaryRow>,
        val totalCalls: Int,
        val totalInputTokens: Long,
        val totalOutputTokens: Long,
        val totalUsd: Double,
        val totalKrw: Long,
    )

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
