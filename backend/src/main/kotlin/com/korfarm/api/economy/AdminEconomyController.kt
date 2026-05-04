package com.korfarm.api.economy

import com.korfarm.api.common.ApiResponse
import com.korfarm.api.duel.DuelStatsView
import com.korfarm.api.learning.FarmHistoryResponse
import com.korfarm.api.org.OrgService
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.test.TestHistoryItem
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

/**
 * 학생 개인 데이터(인벤토리·로그·테스트·대결) 어드민 조회.
 *
 * 권한:
 *  - HQ_ADMIN: 모든 학생
 *  - ORG_ADMIN: 자기 기관 학생만 (OrgService.verifyOrgAdminAccessForStudent 로 강제)
 */
@RestController
@RequestMapping("/v1/admin/students")
class AdminEconomyController(
    private val adminEconomyService: AdminEconomyService,
    private val orgService: OrgService
) {
    private fun guard(userId: String) {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        orgService.verifyOrgAdminAccessForStudent(userId)
    }

    @GetMapping("/{userId}/inventory")
    fun getStudentInventory(@PathVariable userId: String): ApiResponse<Inventory> {
        guard(userId)
        return ApiResponse(success = true, data = adminEconomyService.getStudentInventory(userId))
    }

    @PostMapping("/{userId}/inventory/grant")
    fun grantInventory(
        @PathVariable userId: String,
        @Valid @RequestBody request: AdminInventoryAdjustRequest
    ): ApiResponse<AdminInventoryAdjustResult> {
        guard(userId)
        return ApiResponse(success = true, data = adminEconomyService.grantInventory(userId, request))
    }

    @PostMapping("/{userId}/inventory/deduct")
    fun deductInventory(
        @PathVariable userId: String,
        @Valid @RequestBody request: AdminInventoryAdjustRequest
    ): ApiResponse<AdminInventoryAdjustResult> {
        guard(userId)
        return ApiResponse(success = true, data = adminEconomyService.deductInventory(userId, request))
    }

    @GetMapping("/{userId}/ledger")
    fun getStudentLedger(@PathVariable userId: String): ApiResponse<List<LedgerEntry>> {
        guard(userId)
        return ApiResponse(success = true, data = adminEconomyService.getStudentLedger(userId))
    }

    @GetMapping("/{userId}/learning-logs")
    fun getStudentLearningLogs(@PathVariable userId: String): ApiResponse<FarmHistoryResponse> {
        guard(userId)
        return ApiResponse(success = true, data = adminEconomyService.getStudentLearningLogs(userId))
    }

    @GetMapping("/{userId}/test-history")
    fun getStudentTestHistory(@PathVariable userId: String): ApiResponse<List<TestHistoryItem>> {
        guard(userId)
        return ApiResponse(success = true, data = adminEconomyService.getStudentTestHistory(userId))
    }

    @GetMapping("/{userId}/duel-stats")
    fun getStudentDuelStats(
        @PathVariable userId: String,
        @RequestParam(defaultValue = "frege") serverId: String
    ): ApiResponse<DuelStatsView> {
        guard(userId)
        return ApiResponse(success = true, data = adminEconomyService.getStudentDuelStats(userId, serverId))
    }
}
