package com.korfarm.api.season

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.SecurityUtils
import com.korfarm.api.system.FeatureFlagService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/seasons")
class SeasonController(
    private val seasonService: SeasonService,
    private val lifetimeRankingService: LifetimeRankingService,
    private val featureFlagService: FeatureFlagService
) {
    @GetMapping("/current")
    fun current(): ApiResponse<Season> {
        return ApiResponse(success = true, data = seasonService.currentSeason())
    }

    @GetMapping("/{seasonId}/harvest-rankings")
    fun harvestRankings(
        @PathVariable seasonId: String,
        @RequestParam(required = false) level: String?
    ): ApiResponse<List<HarvestRankingItem>> {
        featureFlagService.requireEnabled("feature.season.ranking")
        // level 파라미터 null/blank → 레벨 통합 랭킹 (season.levelId fallback 제거)
        // 2026-05-16 fix — 프론트 scope='all' 일 때 season.levelId 로 silent fallback 되던 버그
        val effectiveLevel = if (level.isNullOrBlank()) null else level
        return ApiResponse(success = true, data = seasonService.harvestRankings(seasonId, effectiveLevel))
    }

    @GetMapping("/{seasonId}/duel-rankings")
    fun duelRankings(
        @PathVariable seasonId: String,
        @RequestParam(required = false) level: String?
    ): ApiResponse<DuelLeaderboards> {
        featureFlagService.requireEnabled("feature.season.ranking")
        val season = seasonService.getSeasonEntity(seasonId)
        val levelId = level ?: season.levelId
        return ApiResponse(success = true, data = seasonService.duelRankings(seasonId, levelId))
    }

    @GetMapping("/{seasonId}/awards")
    fun awards(@PathVariable seasonId: String): ApiResponse<SeasonAwards> {
        featureFlagService.requireEnabled("feature.season.awards")
        return ApiResponse(success = true, data = seasonService.awards(seasonId))
    }

    /**
     * 누적 (평생) 랭킹 — 시즌 무관, economy_ledger 양수 합산 기반.
     * level 파라미터 null/blank → 레벨 통합 / 값 있음 → 그 레벨만
     */
    @GetMapping("/lifetime-rankings")
    fun lifetimeRankings(
        @RequestParam(required = false) level: String?
    ): ApiResponse<List<HarvestRankingItem>> {
        featureFlagService.requireEnabled("feature.season.ranking")
        val effectiveLevel = if (level.isNullOrBlank()) null else level
        return ApiResponse(success = true, data = lifetimeRankingService.rankings(effectiveLevel))
    }

    /**
     * 새 시즌 안내 모달 — 학생·학부모·관리자 모두 호출. 첫날 1회 표시.
     *  shouldShow=true 면 클라이언트가 모달 표시, 닫기 시 markSeen 호출
     */
    @GetMapping("/current/modal-status")
    fun modalStatus(): ApiResponse<SeasonModalStatus> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val roles = SecurityUtils.currentRoles()
        return ApiResponse(success = true, data = seasonService.getModalStatus(userId, roles))
    }

    @PostMapping("/modal-seen")
    fun markModalSeen(@RequestBody request: MarkModalSeenRequest): ApiResponse<Map<String, Boolean>> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        seasonService.markModalSeen(userId, request.seasonId)
        return ApiResponse(success = true, data = mapOf("ok" to true))
    }
}
