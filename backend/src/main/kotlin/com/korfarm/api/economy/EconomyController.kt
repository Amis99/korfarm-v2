package com.korfarm.api.economy

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.contracts.HarvestCraftRequest
import com.korfarm.api.security.SecurityUtils
import com.korfarm.api.system.FeatureFlagService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1")
class EconomyController(
    private val economyService: EconomyService,
    private val featureFlagService: FeatureFlagService
) {
    @GetMapping("/inventory")
    fun inventory(): ApiResponse<Inventory> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        return ApiResponse(success = true, data = economyService.getInventory(userId))
    }

    @PostMapping("/harvest/craft")
    fun harvestCraft(@Valid @RequestBody request: HarvestCraftRequest): ApiResponse<HarvestCraftResult> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        featureFlagService.requireEnabled("feature.economy.harvest", userId)
        val result = economyService.harvestCraft(userId, request.seedType, request.useFertilizer)
        return ApiResponse(success = true, data = result)
    }

    @GetMapping("/ledger")
    fun ledger(): ApiResponse<List<LedgerEntry>> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        return ApiResponse(success = true, data = economyService.getLedger(userId))
    }
}
