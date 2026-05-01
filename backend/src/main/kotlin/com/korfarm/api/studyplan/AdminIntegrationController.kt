package com.korfarm.api.studyplan

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.security.SecurityUtils
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

/**
 * Phase D 통합 리스트 중 study-plans 외부 path 를 사용하는 두 endpoint:
 * - GET /v1/admin/submissions  — 제출물 통합
 * - GET /v1/admin/wisdom/integrated-posts  — 글쓰기 통합 (글농장)
 *
 * 학습 계획표 셀과 글농장 데이터를 가로지르는 어드민 화면용.
 */
@RestController
class AdminIntegrationController(
    private val service: StudyPlanService
) {

    private fun requireAdmin() {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
    }

    private fun currentUser(): String =
        SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)

    /** D-1) 제출물 통합 */
    @GetMapping("/v1/admin/submissions")
    fun submissions(
        @RequestParam(required = false) assetType: String?,
        @RequestParam(required = false) status: String?,
        @RequestParam(required = false) classId: String?,
        @RequestParam(required = false) userId: String?,
        @RequestParam(defaultValue = "updatedAt") sortBy: String,
        @RequestParam(defaultValue = "desc") sortDir: String,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "50") limit: Int
    ): ApiResponse<AdminSubmissionListResponse> {
        requireAdmin()
        return ApiResponse(
            success = true,
            data = service.adminListSubmissions(
                currentUser(), assetType, status, classId, userId, sortBy, sortDir, page, limit
            )
        )
    }

    /** D-2) 글쓰기 통합 */
    @GetMapping("/v1/admin/wisdom/integrated-posts")
    fun wisdomIntegrated(
        @RequestParam(required = false) levelId: String?,
        @RequestParam(required = false) classId: String?,
        @RequestParam(required = false) userId: String?,
        @RequestParam(required = false) hasPlanCell: Boolean?,
        @RequestParam(required = false) hasFeedback: Boolean?,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "desc") sortDir: String,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "50") limit: Int
    ): ApiResponse<AdminIntegratedWisdomResponse> {
        requireAdmin()
        return ApiResponse(
            success = true,
            data = service.adminListIntegratedWisdom(
                currentUser(), levelId, classId, userId, hasPlanCell, hasFeedback,
                sortBy, sortDir, page, limit
            )
        )
    }
}
