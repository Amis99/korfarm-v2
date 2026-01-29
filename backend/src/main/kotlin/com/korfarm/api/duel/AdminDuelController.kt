package com.korfarm.api.duel

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.contracts.AdminDuelSeasonRequest
import com.korfarm.api.contracts.AdminDuelSnapshotRequest
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.season.SeasonEntity
import com.korfarm.api.security.SecurityUtils
import com.korfarm.api.system.FeatureFlagService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/admin/duel")
class AdminDuelController(
    private val adminDuelService: AdminDuelService,
    private val featureFlagService: FeatureFlagService,
    private val seasonService: com.korfarm.api.season.SeasonService
) {
    @PostMapping("/seasons")
    fun createSeason(@Valid @RequestBody request: AdminDuelSeasonRequest): ApiResponse<Map<String, String>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        val season: SeasonEntity = adminDuelService.createSeason(request)
        return ApiResponse(success = true, data = mapOf("season_id" to season.id))
    }

    @PostMapping("/snapshots")
    fun snapshot(@Valid @RequestBody request: AdminDuelSnapshotRequest): ApiResponse<Map<String, String>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        val snapshot = adminDuelService.snapshot(request)
        return ApiResponse(success = true, data = mapOf("snapshot_id" to snapshot.id))
    }

    @PostMapping("/recalculate")
    fun recalc(@RequestBody(required = false) request: AdminDuelSnapshotRequest?): ApiResponse<Map<String, String>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        val season = if (request == null) {
            seasonService.currentSeason()
        } else {
            seasonService.getSeasonEntity(request.seasonId).let {
                com.korfarm.api.season.Season(
                    seasonId = it.id,
                    levelId = it.levelId,
                    name = it.name,
                    startAt = it.startAt.toString(),
                    endAt = it.endAt.toString(),
                    status = it.status
                )
            }
        }
        val seasonId = season.seasonId
        val levelId = request?.levelId ?: season.levelId
        val ranking = adminDuelService.recalculate(seasonId, levelId)
        return ApiResponse(success = true, data = mapOf("ranking_id" to ranking.id))
    }
}
