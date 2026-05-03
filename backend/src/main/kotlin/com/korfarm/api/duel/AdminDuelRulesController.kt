package com.korfarm.api.duel

import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.system.FeatureFlagService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * 어드민 — 대결 룰 (AI 플레이어·매치 규칙) read-only 조회.
 * 1차는 코드에 default 박혀있는 값 노출만. 2차에서 DB·application.yml 동적화.
 */
@RestController
@RequestMapping("/v1/admin/duel/rules")
class AdminDuelRulesController(
    private val featureFlagService: FeatureFlagService
) {
    @GetMapping
    fun get(): ApiResponse<Map<String, Any?>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        return ApiResponse(success = true, data = mapOf(
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
                "modeSeparation" to "RANK / THEME (Phase 3)",
                "themeOrgScope" to "같은 기관 학생만"
            ),
            "reward" to mapOf(
                "stakeRequired" to true,
                "themeStakeRequired" to false,
                "winnerTakeAll" to true,
                "seedTypes" to listOf("wheat", "rice", "corn", "grape", "apple")
            ),
            "_note" to "본 화면은 1차 read-only 입니다. 룰 수정은 후속 작업에서 application.yml 또는 DB 화 예정."
        ))
    }
}
