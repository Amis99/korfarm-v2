package com.korfarm.api.diagnostic

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.SecurityUtils
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/v1/diagnostic")
class DiagnosticController(
    private val diagnosticService: DiagnosticService
) {

    @GetMapping("/tiers")
    fun getTiers(): ApiResponse<List<TierInfo>> {
        val userId = currentUserId()
        return ApiResponse(success = true, data = diagnosticService.getTiers(userId))
    }

    @PostMapping("/sessions")
    fun createSession(@RequestBody request: CreateSessionRequest): ApiResponse<SessionCreatedResponse> {
        val userId = currentUserId()
        return ApiResponse(success = true, data = diagnosticService.createSession(userId, request))
    }

    @GetMapping("/sessions/{id}")
    fun getSession(@PathVariable id: String): ApiResponse<SessionStatusResponse> {
        val userId = currentUserId()
        return ApiResponse(success = true, data = diagnosticService.getSessionStatus(id, userId))
    }

    @PostMapping("/sessions/{id}/respond")
    fun submitResponses(
        @PathVariable id: String,
        @RequestBody request: SubmitResponsesRequest
    ): ApiResponse<SubmitResponsesResponse> {
        val userId = currentUserId()
        return ApiResponse(success = true, data = diagnosticService.submitResponses(id, userId, request))
    }

    @PostMapping("/sessions/{id}/complete")
    fun completeSession(@PathVariable id: String): ApiResponse<DiagnosticReport> {
        val userId = currentUserId()
        return ApiResponse(success = true, data = diagnosticService.completeSession(id, userId))
    }

    @GetMapping("/sessions/{id}/report")
    fun getReport(@PathVariable id: String): ApiResponse<DiagnosticReport> {
        val userId = currentUserId()
        return ApiResponse(success = true, data = diagnosticService.getReport(id, userId))
    }

    @GetMapping("/history")
    fun getHistory(): ApiResponse<List<SessionHistoryItem>> {
        val userId = currentUserId()
        return ApiResponse(success = true, data = diagnosticService.getHistory(userId))
    }

    private fun currentUserId(): String {
        return SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "인증이 필요합니다", HttpStatus.UNAUTHORIZED)
    }
}
