package com.korfarm.api.pro

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.security.SecurityUtils
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/v1/admin/essay")
class AdminEssayGradingController(
    private val essayGradingService: EssayGradingService
) {
    private fun requireAdminUserId(): String {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "로그인이 필요합니다.", HttpStatus.UNAUTHORIZED)
    }

    @PostMapping("/keyword-grade")
    fun keywordGrade(@RequestBody request: KeywordGradeRequest): ApiResponse<EssayGradingView> {
        requireAdminUserId()
        val result = essayGradingService.keywordGrade(request)
        return ApiResponse(success = true, data = result)
    }

    @PostMapping("/ai-grade")
    fun aiGrade(@RequestBody request: AiGradeRequest): ApiResponse<EssayGradingView> {
        requireAdminUserId()
        val result = essayGradingService.aiGrade(request)
        return ApiResponse(success = true, data = result)
    }

    @PostMapping("/ai-grade-batch")
    fun aiGradeBatch(@RequestBody request: AiGradeBatchRequest): ApiResponse<List<EssayGradingView>> {
        requireAdminUserId()
        val result = essayGradingService.aiGradeBatch(request)
        return ApiResponse(success = true, data = result)
    }

    @PutMapping("/confirm")
    fun confirmGrade(@RequestBody request: ConfirmGradeRequest): ApiResponse<EssayGradingView> {
        val adminId = requireAdminUserId()
        val result = essayGradingService.confirmGrade(request, adminId)
        return ApiResponse(success = true, data = result)
    }

    @GetMapping("/gradings")
    fun getGradings(
        @RequestParam(required = false) testId: String?,
        @RequestParam(required = false) userId: String?
    ): ApiResponse<List<EssayGradingView>> {
        requireAdminUserId()
        val result = essayGradingService.getGradings(testId, userId)
        return ApiResponse(success = true, data = result)
    }
}
