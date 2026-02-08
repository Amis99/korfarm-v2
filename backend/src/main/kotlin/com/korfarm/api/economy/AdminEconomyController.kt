package com.korfarm.api.economy

import com.korfarm.api.common.ApiResponse
import com.korfarm.api.duel.DuelStatsView
import com.korfarm.api.learning.FarmHistoryResponse
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

@RestController
@RequestMapping("/v1/admin/students")
class AdminEconomyController(
    private val adminEconomyService: AdminEconomyService
) {
    /** 특정 학생의 인벤토리 조회 */
    @GetMapping("/{userId}/inventory")
    fun getStudentInventory(@PathVariable userId: String): ApiResponse<Inventory> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        return ApiResponse(success = true, data = adminEconomyService.getStudentInventory(userId))
    }

    /** 씨앗/수확물/비료 지급 */
    @PostMapping("/{userId}/inventory/grant")
    fun grantInventory(
        @PathVariable userId: String,
        @Valid @RequestBody request: AdminInventoryAdjustRequest
    ): ApiResponse<AdminInventoryAdjustResult> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        return ApiResponse(success = true, data = adminEconomyService.grantInventory(userId, request))
    }

    /** 씨앗/수확물/비료 차감 */
    @PostMapping("/{userId}/inventory/deduct")
    fun deductInventory(
        @PathVariable userId: String,
        @Valid @RequestBody request: AdminInventoryAdjustRequest
    ): ApiResponse<AdminInventoryAdjustResult> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        return ApiResponse(success = true, data = adminEconomyService.deductInventory(userId, request))
    }

    /** 학생 경제 내역(레저) 조회 */
    @GetMapping("/{userId}/ledger")
    fun getStudentLedger(@PathVariable userId: String): ApiResponse<List<LedgerEntry>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        return ApiResponse(success = true, data = adminEconomyService.getStudentLedger(userId))
    }

    /** 학생 학습 로그 조회 */
    @GetMapping("/{userId}/learning-logs")
    fun getStudentLearningLogs(@PathVariable userId: String): ApiResponse<FarmHistoryResponse> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        return ApiResponse(success = true, data = adminEconomyService.getStudentLearningLogs(userId))
    }

    /** 학생 테스트 응시 이력 조회 */
    @GetMapping("/{userId}/test-history")
    fun getStudentTestHistory(@PathVariable userId: String): ApiResponse<List<TestHistoryItem>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        return ApiResponse(success = true, data = adminEconomyService.getStudentTestHistory(userId))
    }

    /** 학생 대결 전적 조회 */
    @GetMapping("/{userId}/duel-stats")
    fun getStudentDuelStats(
        @PathVariable userId: String,
        @RequestParam(defaultValue = "frege") serverId: String
    ): ApiResponse<DuelStatsView> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        return ApiResponse(success = true, data = adminEconomyService.getStudentDuelStats(userId, serverId))
    }
}
