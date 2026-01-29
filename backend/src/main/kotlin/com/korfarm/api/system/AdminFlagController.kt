package com.korfarm.api.system

import com.korfarm.api.common.ApiResponse
import com.korfarm.api.contracts.AdminFlagUpdateRequest
import com.korfarm.api.security.AdminGuard
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/admin/flags")
class AdminFlagController(
    private val featureFlagService: FeatureFlagService
) {
    @GetMapping
    fun list(): ApiResponse<List<FeatureFlagView>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(success = true, data = featureFlagService.listFlags())
    }

    @PatchMapping("/{flagKey}")
    fun update(
        @PathVariable flagKey: String,
        @Valid @RequestBody request: AdminFlagUpdateRequest
    ): ApiResponse<FeatureFlagView> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(success = true, data = featureFlagService.updateFlag(flagKey, request))
    }
}
