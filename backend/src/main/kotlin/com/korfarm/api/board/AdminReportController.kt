package com.korfarm.api.board

import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import org.springframework.web.bind.annotation.GetMapping
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
}
