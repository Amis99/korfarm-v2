package com.korfarm.api.season

import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/admin/seasons")
class AdminSeasonController(
    private val seasonRepository: SeasonRepository
) {
    @GetMapping
    fun list(): ApiResponse<List<Season>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val data = seasonRepository.findAll()
            .sortedByDescending { it.startAt }
            .map { season ->
                Season(
                    seasonId = season.id,
                    levelId = season.levelId,
                    name = season.name,
                    startAt = season.startAt.toString(),
                    endAt = season.endAt.toString(),
                    status = season.status
                )
            }
        return ApiResponse(success = true, data = data)
    }
}
