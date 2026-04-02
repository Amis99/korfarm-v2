package com.korfarm.api.studyplan

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.SecurityUtils
import com.korfarm.api.user.ParentLinkService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/v1/study-plans")
class StudyPlanController(
    private val service: StudyPlanService,
    private val parentLinkService: ParentLinkService
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

    @GetMapping("/upcoming")
    fun upcoming(): ApiResponse<List<UpcomingItemResponse>> {
        return ApiResponse(success = true, data = service.getUpcomingItems(currentUser()))
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

    @GetMapping("/{planId}/calendar/events")
    fun calendarEvents(
        @PathVariable planId: String,
        @RequestParam month: String
    ): ApiResponse<List<CalendarEventResponse>> {
        val userId = currentUser()
        service.verifyPlanAccess(planId, userId)
        return ApiResponse(success = true, data = service.getCalendarEvents(planId, userId, month))
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

// ── 학부모 학습 계획표 컨트롤러 ──

@RestController
@RequestMapping("/v1/parents/children/{studentId}/study-plans")
class ParentStudyPlanController(
    private val service: StudyPlanService,
    private val parentLinkService: ParentLinkService
) {
    private fun currentUser(): String =
        SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)

    private fun verifyLink(studentId: String) {
        val linked = parentLinkService.verifyParentChildLink(currentUser(), studentId)
        if (!linked) {
            throw ApiException("FORBIDDEN", "자녀 연결이 확인되지 않습니다.", HttpStatus.FORBIDDEN)
        }
    }

    @GetMapping
    fun plans(@PathVariable studentId: String): ApiResponse<List<StudyPlanSummaryResponse>> {
        verifyLink(studentId)
        return ApiResponse(success = true, data = service.getMyPlans(studentId))
    }

    @GetMapping("/{planId}/matrix")
    fun matrix(
        @PathVariable studentId: String,
        @PathVariable planId: String
    ): ApiResponse<MatrixResponse> {
        verifyLink(studentId)
        service.verifyPlanAccess(planId, studentId)
        return ApiResponse(success = true, data = service.getMatrix(planId, studentId))
    }

    @GetMapping("/{planId}/calendar")
    fun calendar(
        @PathVariable studentId: String,
        @PathVariable planId: String
    ): ApiResponse<List<ScheduleResponse>> {
        verifyLink(studentId)
        service.verifyPlanAccess(planId, studentId)
        return ApiResponse(success = true, data = service.getCalendar(planId))
    }

    @GetMapping("/{planId}/calendar/events")
    fun calendarEvents(
        @PathVariable studentId: String,
        @PathVariable planId: String,
        @RequestParam month: String
    ): ApiResponse<List<CalendarEventResponse>> {
        verifyLink(studentId)
        service.verifyPlanAccess(planId, studentId)
        return ApiResponse(success = true, data = service.getCalendarEvents(planId, studentId, month))
    }
}
