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

        /** 기본 룰 — DB 에 행이 없거나 일부 키가 누락된 경우 채워 넣을 값 */
        val DEFAULTS: Map<String, Any?> = mapOf(
            "matchRule" to mapOf(
                "questionsPerMatch" to 10,
                "questionTimeoutSec" to 30,
                "matchTimeLimitSec" to 300,
                "scoringMode" to "ELIMINATION (탈락제)",
                "rankingTieBreaker" to "정답 수 ↓ → 응답 시간 ↑"
            ),
            "aiPlayer" to mapOf(
                "available" to true,
                "difficultyLevels" to listOf("EASY", "NORMAL", "HARD"),
                "defaultDifficulty" to "NORMAL",
                "responseTimeRangeMs" to mapOf("min" to 3000, "max" to 12000),
                "accuracyByDifficulty" to mapOf(
                    "EASY" to 0.4,
                    "NORMAL" to 0.65,
                    "HARD" to 0.85
                )
            ),
            "queue" to mapOf(
                "matchSize" to "2~10명 (방장 결정)",
                "modeSeparation" to "RANK / THEME (테마 서버 분리)",
                "themeOrgScope" to "같은 기관 학생만"
            ),
            "reward" to mapOf(
                "stakeRequired" to true,
                "themeStakeRequired" to false,
                "winnerTakeAll" to true,
                "seedTypes" to listOf("wheat", "rice", "corn", "grape", "apple")
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
