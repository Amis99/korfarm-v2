package com.korfarm.api.studyplan

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.org.OrgMembershipRepository
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.security.SecurityUtils
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/v1/admin/study-plans")
class AdminStudyPlanController(
    private val service: StudyPlanService,
    private val orgMembershipRepo: OrgMembershipRepository
) {
    private fun requireAdmin() {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
    }

    private fun currentUser(): String =
        SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)

    private fun currentOrgId(): String {
        val userId = currentUser()
        return orgMembershipRepo.findByUserIdAndStatus(userId, "active")
            .firstOrNull()?.orgId
            ?: throw ApiException("FORBIDDEN", "no org membership", HttpStatus.FORBIDDEN)
    }

    // ── 계획표 CRUD ──

    @PostMapping
    fun create(@RequestBody request: CreateStudyPlanRequest): ApiResponse<Map<String, String>> {
        requireAdmin()
        val plan = service.createPlan(currentOrgId(), currentUser(), request)
        return ApiResponse(success = true, data = mapOf("planId" to plan.id))
    }

    @GetMapping
    fun list(
        @RequestParam(required = false) status: String?,
        @RequestParam(required = false) search: String?
    ): ApiResponse<List<StudyPlanSummaryResponse>> {
        requireAdmin()
        return ApiResponse(success = true, data = service.listPlans(currentUser(), status, search))
    }

    @GetMapping("/{planId}")
    fun detail(@PathVariable planId: String): ApiResponse<StudyPlanDetailResponse> {
        requireAdmin()
        return ApiResponse(success = true, data = service.getPlanDetail(planId))
    }

    @PatchMapping("/{planId}")
    fun update(
        @PathVariable planId: String,
        @RequestBody request: UpdateStudyPlanRequest
    ): ApiResponse<Map<String, String>> {
        requireAdmin()
        service.updatePlan(planId, request)
        return ApiResponse(success = true, data = mapOf("planId" to planId))
    }

    @PostMapping("/{planId}/archive")
    fun archive(@PathVariable planId: String): ApiResponse<Map<String, String>> {
        requireAdmin()
        service.archivePlan(planId)
        return ApiResponse(success = true, data = mapOf("planId" to planId))
    }

    @PostMapping("/{planId}/unarchive")
    fun unarchive(@PathVariable planId: String): ApiResponse<Map<String, String>> {
        requireAdmin()
        service.unarchivePlan(planId)
        return ApiResponse(success = true, data = mapOf("planId" to planId))
    }

    @DeleteMapping("/{planId}")
    fun delete(@PathVariable planId: String): ApiResponse<Map<String, String>> {
        requireAdmin()
        service.deletePlan(planId)
        return ApiResponse(success = true, data = mapOf("planId" to planId))
    }

    /**
     * 템플릿(is_template=true) 을 현재 기관 active 학생들에게 일괄 반영.
     * 이미 복제본이 있는 학생은 skip — 새 학생만 추가됨.
     */
    @PostMapping("/{planId}/apply-to-students")
    fun applyTemplateToStudents(@PathVariable planId: String): ApiResponse<Map<String, Any>> {
        requireAdmin()
        val cloned = service.applyTemplateToCurrentStudents(planId)
        return ApiResponse(success = true, data = mapOf("planId" to planId, "newlyCloned" to cloned))
    }

    // backfill-default 는 Phase B 섹션에 단일 정의를 둔다 (이 위치 내용 제거 — 아래 통합)

    // ── 범위(행) 관리 ──

    @PostMapping("/{planId}/scopes")
    fun addScope(
        @PathVariable planId: String,
        @RequestBody request: AddScopeRequest
    ): ApiResponse<ScopeResponse> {
        requireAdmin()
        val scope = service.addScope(planId, request)
        return ApiResponse(success = true, data = scope.toResponse())
    }

    @PatchMapping("/{planId}/scopes/{scopeId}")
    fun updateScope(
        @PathVariable planId: String,
        @PathVariable scopeId: String,
        @RequestBody request: UpdateScopeRequest
    ): ApiResponse<ScopeResponse> {
        requireAdmin()
        val scope = service.updateScope(planId, scopeId, request)
        return ApiResponse(success = true, data = scope.toResponse())
    }

    @DeleteMapping("/{planId}/scopes/{scopeId}")
    fun deleteScope(
        @PathVariable planId: String,
        @PathVariable scopeId: String
    ): ApiResponse<Map<String, String>> {
        requireAdmin()
        service.deleteScope(planId, scopeId)
        return ApiResponse(success = true, data = mapOf("scopeId" to scopeId))
    }

    @PutMapping("/{planId}/scopes/reorder")
    fun reorderScopes(
        @PathVariable planId: String,
        @RequestBody request: ReorderRequest
    ): ApiResponse<Map<String, String>> {
        requireAdmin()
        service.reorderScopes(planId, request.ids)
        return ApiResponse(success = true, data = mapOf("planId" to planId))
    }

    // ── 에셋(열) 관리 ──

    @PostMapping("/{planId}/assets")
    fun addAsset(
        @PathVariable planId: String,
        @RequestBody request: AddAssetRequest
    ): ApiResponse<AssetResponse> {
        requireAdmin()
        val asset = service.addAsset(planId, request)
        return ApiResponse(success = true, data = asset.toResponse())
    }

    @PatchMapping("/{planId}/assets/{assetId}")
    fun updateAsset(
        @PathVariable planId: String,
        @PathVariable assetId: String,
        @RequestBody request: UpdateAssetRequest
    ): ApiResponse<AssetResponse> {
        requireAdmin()
        val asset = service.updateAsset(planId, assetId, request)
        return ApiResponse(success = true, data = asset.toResponse())
    }

    @DeleteMapping("/{planId}/assets/{assetId}")
    fun deleteAsset(
        @PathVariable planId: String,
        @PathVariable assetId: String
    ): ApiResponse<Map<String, String>> {
        requireAdmin()
        service.deleteAsset(planId, assetId)
        return ApiResponse(success = true, data = mapOf("assetId" to assetId))
    }

    @PutMapping("/{planId}/assets/reorder")
    fun reorderAssets(
        @PathVariable planId: String,
        @RequestBody request: ReorderRequest
    ): ApiResponse<Map<String, String>> {
        requireAdmin()
        service.reorderAssets(planId, request.ids)
        return ApiResponse(success = true, data = mapOf("planId" to planId))
    }

    // ── 제출물 모아보기 ──

    @GetMapping("/{planId}/submissions")
    fun submissions(@PathVariable planId: String): ApiResponse<List<SubmissionResponse>> {
        requireAdmin()
        return ApiResponse(success = true, data = service.getSubmissions(planId))
    }

    // ── 학생 + 매트릭스 ──

    @GetMapping("/{planId}/students")
    fun students(@PathVariable planId: String): ApiResponse<List<StudentProgressResponse>> {
        requireAdmin()
        return ApiResponse(success = true, data = service.getStudentsWithProgress(planId))
    }

    @GetMapping("/{planId}/matrix")
    fun matrix(
        @PathVariable planId: String,
        @RequestParam userId: String
    ): ApiResponse<MatrixResponse> {
        requireAdmin()
        return ApiResponse(success = true, data = service.getMatrix(planId, userId, isAdmin = true))
    }

    // ── 셀 관리 ──

    @PatchMapping("/cells/{cellId}/assign")
    fun assignCellContent(
        @PathVariable cellId: String,
        @RequestBody request: AssignCellContentRequest
    ): ApiResponse<CellResponse> {
        requireAdmin()
        val cell = service.assignCellContent(cellId, request)
        return ApiResponse(success = true, data = cell.toResponse())
    }

    @PatchMapping("/cells/{cellId}/status")
    fun updateCellStatus(
        @PathVariable cellId: String,
        @RequestBody request: UpdateCellStatusRequest
    ): ApiResponse<CellResponse> {
        requireAdmin()
        val cell = service.updateCellStatus(cellId, currentUser(), request)
        return ApiResponse(success = true, data = cell.toResponse())
    }

    @PatchMapping("/cells/{cellId}/review")
    fun reviewCell(
        @PathVariable cellId: String,
        @RequestBody request: ReviewCellRequest
    ): ApiResponse<CellResponse> {
        requireAdmin()
        val cell = service.reviewCell(cellId, currentUser(), request)
        return ApiResponse(success = true, data = cell.toResponse())
    }

    @PatchMapping("/cells/{cellId}/grade")
    fun gradeCell(
        @PathVariable cellId: String,
        @RequestBody request: GradeCellRequest
    ): ApiResponse<CellResponse> {
        requireAdmin()
        val cell = service.gradeCell(cellId, currentUser(), request)
        return ApiResponse(success = true, data = cell.toResponse())
    }

    @GetMapping("/cells/{cellId}/files")
    fun cellFiles(@PathVariable cellId: String): ApiResponse<List<CellFileResponse>> {
        requireAdmin()
        return ApiResponse(success = true, data = service.getCellFiles(cellId))
    }

    // ── 캘린더 일정 ──

    @PostMapping("/{planId}/schedules")
    fun createSchedule(
        @PathVariable planId: String,
        @RequestBody request: CreateScheduleRequest
    ): ApiResponse<ScheduleResponse> {
        requireAdmin()
        val schedule = service.createSchedule(planId, request)
        return ApiResponse(success = true, data = schedule.toResponse())
    }

    @PatchMapping("/schedules/{scheduleId}")
    fun updateSchedule(
        @PathVariable scheduleId: String,
        @RequestBody request: UpdateScheduleRequest
    ): ApiResponse<ScheduleResponse> {
        requireAdmin()
        val schedule = service.updateSchedule(scheduleId, request)
        return ApiResponse(success = true, data = schedule.toResponse())
    }

    @DeleteMapping("/schedules/{scheduleId}")
    fun deleteSchedule(@PathVariable scheduleId: String): ApiResponse<Map<String, String>> {
        requireAdmin()
        service.deleteSchedule(scheduleId)
        return ApiResponse(success = true, data = mapOf("scheduleId" to scheduleId))
    }

    @GetMapping("/{planId}/calendar")
    fun calendar(@PathVariable planId: String): ApiResponse<List<ScheduleResponse>> {
        requireAdmin()
        return ApiResponse(success = true, data = service.getCalendar(planId))
    }

    @GetMapping("/{planId}/calendar/events")
    fun calendarEvents(
        @PathVariable planId: String,
        @RequestParam month: String,
        @RequestParam(required = false) userId: String?
    ): ApiResponse<List<CalendarEventResponse>> {
        requireAdmin()
        return ApiResponse(success = true, data = service.getCalendarEvents(planId, userId, month))
    }

    // ─────────────────────────────────────────────────────────────
    // Phase B: 학생별 default plan 자동 생성 — backfill (HQ_ADMIN)
    // ─────────────────────────────────────────────────────────────

    @PostMapping("/backfill-default")
    fun backfillDefault(): ApiResponse<BackfillDefaultPlanResponse> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(success = true, data = service.backfillDefaultPlansHQ())
    }

    // ─────────────────────────────────────────────────────────────
    // Phase C: 행/열 일괄 적용 (충돌 감지)
    // ─────────────────────────────────────────────────────────────

    @PostMapping("/{planId}/propagate-delta")
    fun propagateDelta(
        @PathVariable planId: String,
        @RequestBody request: PropagateDeltaRequest
    ): ApiResponse<PropagateDeltaResponse> {
        requireAdmin()
        return ApiResponse(success = true, data = service.propagateDelta(planId, currentUser(), request))
    }

    // ─────────────────────────────────────────────────────────────
    // Phase D: 통합 — 테스트 자산 / 캘린더
    // ─────────────────────────────────────────────────────────────

    @GetMapping("/test-assets")
    fun listTestAssets(
        @RequestParam(required = false) from: String?,
        @RequestParam(required = false) to: String?,
        @RequestParam(required = false) classId: String?,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "50") limit: Int
    ): ApiResponse<AdminTestAssetListResponse> {
        requireAdmin()
        return ApiResponse(
            success = true,
            data = service.adminListTestAssets(currentUser(), from, to, classId, page, limit)
        )
    }

    @GetMapping("/test-assets/{assetId}/students")
    fun testAssetStudents(@PathVariable assetId: String): ApiResponse<AdminTestAssetStudentListResponse> {
        requireAdmin()
        return ApiResponse(
            success = true,
            data = service.adminGetTestAssetStudents(currentUser(), assetId)
        )
    }

    @GetMapping("/calendar")
    fun adminCalendar(
        @RequestParam from: String,
        @RequestParam to: String,
        @RequestParam(required = false) classId: String?
    ): ApiResponse<AdminCalendarResponse> {
        requireAdmin()
        return ApiResponse(
            success = true,
            data = service.adminGetCalendar(currentUser(), from, to, classId)
        )
    }

    @GetMapping("/calendar/{date}")
    fun adminCalendarDate(@PathVariable date: String): ApiResponse<AdminCalendarDateDetailResponse> {
        requireAdmin()
        return ApiResponse(
            success = true,
            data = service.adminGetCalendarDate(currentUser(), date)
        )
    }
}
