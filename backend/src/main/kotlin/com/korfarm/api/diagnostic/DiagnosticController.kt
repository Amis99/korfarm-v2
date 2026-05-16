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

    /** 인쇄 OMR 답안 일괄 제출 → 진단 세션 생성 + 채점 + 리포트 */
    @PostMapping("/sessions/from-omr")
    fun submitFromOmr(@RequestBody request: FromOmrRequest): ApiResponse<FromOmrResponse> {
        val userId = currentUserId()
        return ApiResponse(success = true, data = diagnosticService.submitFromOmr(userId, request))
    }

    // ── OMR 타이머 (V0142, 2026-05-16) — 모바일·태블릿 슬립 모드 대응 ──

    @PostMapping("/omr-timer/start")
    fun startOmrTimer(@RequestBody request: OmrTimerStartRequest): ApiResponse<OmrTimerStartResponse> {
        val userId = currentUserId()
        return ApiResponse(success = true, data = diagnosticService.startOmrTimer(userId, request.tier))
    }

    @GetMapping("/omr-timer/status")
    fun omrTimerStatus(@RequestParam tier: String): ApiResponse<OmrTimerStatusResponse> {
        val userId = currentUserId()
        return ApiResponse(success = true, data = diagnosticService.getOmrTimerStatus(userId, tier))
    }

    @PostMapping("/omr-timer/save")
    fun saveOmrDraft(@RequestBody request: OmrTimerSaveRequest): ApiResponse<Map<String, Boolean>> {
        val userId = currentUserId()
        diagnosticService.saveOmrDraft(userId, request.tier, request.answers)
        return ApiResponse(success = true, data = mapOf("ok" to true))
    }

    @PostMapping("/omr-timer/submit")
    fun submitOmrDraft(@RequestBody request: OmrTimerSubmitRequest): ApiResponse<OmrTimerSubmitResponse> {
        val userId = currentUserId()
        return ApiResponse(success = true, data = diagnosticService.submitOmrDraft(userId, request.tier))
    }

    private fun currentUserId(): String {
        return SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "인증이 필요합니다", HttpStatus.UNAUTHORIZED)
    }
}
