package com.korfarm.api.season

import com.korfarm.api.common.ApiResponse
import com.korfarm.api.system.FeatureFlagService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/seasons")
class SeasonController(
    private val seasonService: SeasonService,
    private val featureFlagService: FeatureFlagService
) {
    @GetMapping("/current")
    fun current(): ApiResponse<Season> {
        return ApiResponse(success = true, data = seasonService.currentSeason())
    }

    @GetMapping("/{seasonId}/harvest-rankings")
    fun harvestRankings(@PathVariable seasonId: String): ApiResponse<List<HarvestRankingItem>> {
        featureFlagService.requireEnabled("feature.season.ranking")
        val season = seasonService.getSeasonEntity(seasonId)
        return ApiResponse(success = true, data = seasonService.harvestRankings(seasonId, season.levelId))
    }

    @GetMapping("/{seasonId}/duel-rankings")
    fun duelRankings(@PathVariable seasonId: String): ApiResponse<DuelLeaderboards> {
        featureFlagService.requireEnabled("feature.season.ranking")
        val season = seasonService.getSeasonEntity(seasonId)
        return ApiResponse(success = true, data = seasonService.duelRankings(seasonId, season.levelId))
    }

    @GetMapping("/{seasonId}/awards")
    fun awards(@PathVariable seasonId: String): ApiResponse<SeasonAwards> {
        featureFlagService.requireEnabled("feature.season.awards")
        return ApiResponse(success = true, data = seasonService.awards(seasonId))
    }
}
