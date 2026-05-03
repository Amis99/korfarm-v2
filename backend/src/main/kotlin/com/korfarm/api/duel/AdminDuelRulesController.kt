package com.korfarm.api.duel

import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.security.SecurityUtils
import com.korfarm.api.system.FeatureFlagService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDateTime

/**
 * 어드민 — 대결 룰 (AI 플레이어·매치 규칙·큐·보상 정책) 조회/수정.
 * DB 에 단일 행(id="default") 으로 저장. 행이 없으면 코드 default 그대로 응답.
 */
@RestController
@RequestMapping("/v1/admin/duel/rules")
class AdminDuelRulesController(
    private val featureFlagService: FeatureFlagService,
    private val duelSettingsRepository: DuelSettingsRepository,
    private val objectMapper: ObjectMapper
) {
    companion object {
        const val DEFAULT_ID = "default"

        /** 기본 룰 — DB 에 행이 없거나 일부 키가 누락된 경우 채워 넣을 값. 키·값 모두 한국어 */
        val DEFAULTS: Map<String, Any?> = mapOf(
            "매치 규칙" to mapOf(
                "한 매치당 문제 수" to 10,
                "문제 한 개 제한 시간 (초)" to 30,
                "전체 매치 제한 시간 (초)" to 300,
                "득점 방식" to "탈락제 (틀린 사람 즉시 탈락, 최후 1인까지)",
                "동점 시 우선 순위" to "정답 수 많은 순 → 응답 시간 빠른 순"
            ),
            "AI 플레이어" to mapOf(
                "사용 가능" to true,
                "난이도 단계" to listOf("쉬움", "보통", "어려움"),
                "기본 난이도" to "보통",
                "응답 시간 범위 (밀리초)" to mapOf("최소" to 3000, "최대" to 12000),
                "난이도별 정답률" to mapOf(
                    "쉬움" to 0.4,
                    "보통" to 0.65,
                    "어려움" to 0.85
                )
            ),
            "큐 매칭" to mapOf(
                "방 인원" to "2~10명 (방장이 결정)",
                "모드 분리" to "랭크 / 테마 (테마 서버는 별도 큐)",
                "테마 큐 범위" to "같은 기관 학생끼리만"
            ),
            "보상" to mapOf(
                "씨앗 베팅 필수" to true,
                "테마 모드는 씨앗 없이 진행" to true,
                "승자 독식" to true,
                "사용 가능 씨앗 종류" to listOf("밀", "쌀", "옥수수", "포도", "사과")
            )
        )
    }

    @GetMapping
    fun get(): ApiResponse<Map<String, Any?>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        val row = duelSettingsRepository.findById(DEFAULT_ID).orElse(null)
        val saved = if (row != null) {
            try {
                @Suppress("UNCHECKED_CAST")
                objectMapper.readValue(row.settingsJson, Map::class.java) as Map<String, Any?>
            } catch (e: Exception) { emptyMap() }
        } else emptyMap()
        // 기본값 + 저장값 merge — 저장값 우선
        val merged = (DEFAULTS + saved).toMutableMap()
        merged["_savedAt"] = row?.updatedAt?.toString()
        merged["_updatedBy"] = row?.updatedBy
        return ApiResponse(success = true, data = merged)
    }

    @PutMapping
    fun save(@RequestBody body: Map<String, Any?>): ApiResponse<Map<String, Any?>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        val userId = SecurityUtils.currentUserId() ?: "system"
        // _savedAt / _updatedBy 같은 메타키는 저장 대상에서 제거
        val clean = body.filterKeys { !it.startsWith("_") }
        val json = objectMapper.writeValueAsString(clean)
        val existing = duelSettingsRepository.findById(DEFAULT_ID).orElse(null)
        if (existing != null) {
            existing.settingsJson = json
            existing.updatedAt = LocalDateTime.now()
            existing.updatedBy = userId
            duelSettingsRepository.save(existing)
        } else {
            duelSettingsRepository.save(
                DuelSettingsEntity(
                    id = DEFAULT_ID,
                    settingsJson = json,
                    updatedAt = LocalDateTime.now(),
                    updatedBy = userId
                )
            )
        }
        return ApiResponse(success = true, data = mapOf("saved" to true))
    }
}
