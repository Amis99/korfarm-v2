package com.korfarm.api.studyplan

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.SecurityUtils
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/v1/study-plans")
class StudyPlanController(
    private val service: StudyPlanService
) {
    private fun currentUser(): String =
        SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)

    @GetMapping
    fun myPlans(): ApiResponse<List<StudyPlanSummaryResponse>> {
        return ApiResponse(success = true, data = service.getMyPlans(currentUser()))
    }

    @GetMapping("/summary")
    fun summary(): ApiResponse<StudentDashboardSummary> {
        return ApiResponse(success = true, data = service.getDashboardSummary(currentUser()))
    }

    @GetMapping("/{planId}/matrix")
    fun matrix(@PathVariable planId: String): ApiResponse<MatrixResponse> {
        val userId = currentUser()
        service.verifyPlanAccess(planId, userId)
        return ApiResponse(success = true, data = service.getMatrix(planId, userId))
    }

    @GetMapping("/{planId}/calendar")
    fun calendar(@PathVariable planId: String): ApiResponse<List<ScheduleResponse>> {
        service.verifyPlanAccess(planId, currentUser())
        return ApiResponse(success = true, data = service.getCalendar(planId))
    }

    @PostMapping("/cells/{cellId}/submit")
    fun submit(
        @PathVariable cellId: String,
        @RequestBody request: SubmitCellRequest
    ): ApiResponse<CellResponse> {
        val cell = service.submitCell(cellId, currentUser(), request)
        return ApiResponse(success = true, data = cell.toResponse())
    }

    @GetMapping("/cells/{cellId}/files")
    fun cellFiles(@PathVariable cellId: String): ApiResponse<List<CellFileResponse>> {
        return ApiResponse(success = true, data = service.getCellFiles(cellId))
    }
}
