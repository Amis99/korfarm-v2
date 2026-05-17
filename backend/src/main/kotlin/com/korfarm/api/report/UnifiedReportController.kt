package com.korfarm.api.report

import com.korfarm.api.security.AdminGuard
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.SecurityUtils
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*
import java.time.LocalDate

@RestController
class UnifiedReportController(
    private val reportService: UnifiedReportService,
    private val orgService: com.korfarm.api.org.OrgService,
    private val farmLearningService: com.korfarm.api.learning.FarmLearningService,
) {
    // 학생 본인. refresh=true 일 때만 Claude AI 코멘트·추천 사유 생성 (일 1회 제한).
    @GetMapping("/v1/report/unified")
    fun getStudentReport(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) startDate: LocalDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) endDate: LocalDate,
        @RequestParam(required = false) refresh: Boolean?,
    ): ApiResponse<UnifiedReportResponse> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "로그인이 필요합니다.", HttpStatus.UNAUTHORIZED)
        val data = reportService.getReportCached(userId, startDate, endDate, refresh == true)
        return ApiResponse(success = true, data = data)
    }

    // 학부모. 학부모는 새로고침 X — 학생 본인이 갱신해야 함.
    @GetMapping("/v1/parents/children/{studentId}/report/unified")
    fun getParentReport(
        @PathVariable studentId: String,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) startDate: LocalDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) endDate: LocalDate
    ): ApiResponse<UnifiedReportResponse> {
        val parentId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "로그인이 필요합니다.", HttpStatus.UNAUTHORIZED)
        if (!SecurityUtils.hasAnyRole("PARENT")) {
            throw ApiException("FORBIDDEN", "학부모 권한이 필요합니다.", HttpStatus.FORBIDDEN)
        }
        val data = reportService.getReportForParent(parentId, studentId, startDate, endDate)
        return ApiResponse(success = true, data = data)
    }

    // 관리자. refresh 허용 (학생 별 일 1회 제한 동일 적용).
    @GetMapping("/v1/admin/students/{studentId}/report/unified")
    fun getAdminReport(
        @PathVariable studentId: String,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) startDate: LocalDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) endDate: LocalDate,
        @RequestParam(required = false) refresh: Boolean?,
    ): ApiResponse<UnifiedReportResponse> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        orgService.verifyOrgAdminAccessForStudent(studentId)
        val data = reportService.getReportCached(studentId, startDate, endDate, refresh == true)
        return ApiResponse(success = true, data = data)
    }

    /**
     * HQ 관리자 — 학생 한 명의 10대 역량 누적을 처음부터 다시 계산.
     * fallback 정책 변경·과거 silent fail 복구·테스트 후 정리 등에 사용.
     */
    @PostMapping("/v1/admin/students/{studentId}/competency/rebuild")
    fun rebuildStudentCompetency(
        @PathVariable studentId: String
    ): ApiResponse<com.korfarm.api.learning.RebuildCompetencyResult> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val result = farmLearningService.rebuildUserCompetency(studentId)
        return ApiResponse(success = true, data = result)
    }

    /**
     * 학생 본인 — 통합 분석표 추천 학습 갱신 (2026-05-18).
     * 하루 1회 제한. 24h 이내 재호출 시 success=false + 다음 가능 시각 반환.
     */
    @PostMapping("/v1/learning/recommendations/regenerate")
    fun regenerateRecommendations(): ApiResponse<RegenerateRecommendationsResponse> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "로그인이 필요합니다.", HttpStatus.UNAUTHORIZED)
        val result = reportService.regenerateBundleForUser(userId)
        return ApiResponse(success = true, data = RegenerateRecommendationsResponse(
            success = result.success,
            bundle = result.bundle,
            nextAvailableAt = result.nextAvailableAt.toString(),
            message = result.message,
        ))
    }
}

data class RegenerateRecommendationsResponse(
    val success: Boolean,
    val bundle: RecommendationBundleDto?,
    val nextAvailableAt: String,
    val message: String,
)
