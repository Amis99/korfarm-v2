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
    // 학생 본인
    @GetMapping("/v1/report/unified")
    fun getStudentReport(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) startDate: LocalDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) endDate: LocalDate
    ): ApiResponse<UnifiedReportResponse> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "로그인이 필요합니다.", HttpStatus.UNAUTHORIZED)
        val data = reportService.getReport(userId, startDate, endDate)
        return ApiResponse(success = true, data = data)
    }

    // 학부모
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

    // 관리자
    @GetMapping("/v1/admin/students/{studentId}/report/unified")
    fun getAdminReport(
        @PathVariable studentId: String,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) startDate: LocalDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) endDate: LocalDate
    ): ApiResponse<UnifiedReportResponse> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        orgService.verifyOrgAdminAccessForStudent(studentId)
        val data = reportService.getReport(studentId, startDate, endDate)
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
}
