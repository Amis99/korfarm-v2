package com.korfarm.api.diagnostic

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.SecurityUtils
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/v1/admin/diagnostic")
class AdminDiagnosticController(
    private val diagnosticService: DiagnosticService
) {

    @GetMapping("/questions")
    fun listQuestions(
        @RequestParam(required = false) tier: String?,
        @RequestParam(required = false) genre: String?,
        @RequestParam(required = false) type: String?
    ): ApiResponse<List<AdminQuestionSummary>> {
        requireHq()
        return ApiResponse(success = true, data = diagnosticService.adminListQuestions(tier, genre, type))
    }

    @GetMapping("/sessions")
    fun listSessions(
        @RequestParam(required = false) userId: String?,
        @RequestParam(required = false) tier: String?
    ): ApiResponse<List<AdminSessionSummary>> {
        requireAdmin()
        return ApiResponse(success = true, data = diagnosticService.adminListSessions(userId, tier))
    }

    @GetMapping("/sessions/{id}")
    fun getSession(@PathVariable id: String): ApiResponse<AdminSessionDetail> {
        requireAdmin()
        return ApiResponse(success = true, data = diagnosticService.adminGetSession(id))
    }

    @GetMapping("/statistics")
    fun getStatistics(): ApiResponse<DiagnosticStatistics> {
        requireHq()
        return ApiResponse(success = true, data = diagnosticService.adminGetStatistics())
    }

    private fun requireAdmin() {
        if (!SecurityUtils.hasAnyRole("HQ_ADMIN", "ORG_ADMIN")) {
            throw ApiException("FORBIDDEN", "관리자 권한이 필요합니다", HttpStatus.FORBIDDEN)
        }
    }

    private fun requireHq() {
        if (!SecurityUtils.hasAnyRole("HQ_ADMIN")) {
            throw ApiException("FORBIDDEN", "본사 관리자 권한이 필요합니다", HttpStatus.FORBIDDEN)
        }
    }
}
