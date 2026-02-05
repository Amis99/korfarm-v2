package com.korfarm.api.board

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/admin/reports")
class AdminReportController(
    private val reportRepository: ReportRepository
) {
    @GetMapping
    fun list(): ApiResponse<List<AdminReportView>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val data = reportRepository.findAll()
            .sortedByDescending { it.createdAt }
            .map { report ->
                AdminReportView(
                    reportId = report.id,
                    targetType = report.targetType,
                    targetId = report.targetId,
                    reason = report.reason,
                    status = report.status,
                    createdAt = report.createdAt
                )
            }
        return ApiResponse(success = true, data = data)
    }

    @PostMapping("/{reportId}/approve")
    fun approveReport(@PathVariable reportId: String): ApiResponse<Map<String, String>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val report = reportRepository.findById(reportId).orElseThrow {
            ApiException("NOT_FOUND", "신고를 찾을 수 없습니다.", HttpStatus.NOT_FOUND)
        }
        report.status = "done"
        reportRepository.save(report)
        return ApiResponse(success = true, data = mapOf("reportId" to reportId, "status" to "done"))
    }

    @PostMapping("/{reportId}/reject")
    fun rejectReport(@PathVariable reportId: String): ApiResponse<Map<String, String>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val report = reportRepository.findById(reportId).orElseThrow {
            ApiException("NOT_FOUND", "신고를 찾을 수 없습니다.", HttpStatus.NOT_FOUND)
        }
        report.status = "rejected"
        reportRepository.save(report)
        return ApiResponse(success = true, data = mapOf("reportId" to reportId, "status" to "rejected"))
    }
}
