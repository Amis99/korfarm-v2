package com.korfarm.api.studyplan

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.learning.FarmLearningLogRepository
import com.korfarm.api.org.*
import com.korfarm.api.security.SecurityUtils
import com.korfarm.api.test.TestSubmissionRepo
import com.korfarm.api.user.UserRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalDateTime

@Service
class StudyPlanService(
    private val planRepo: StudyPlanRepository,
    private val targetRepo: StudyPlanTargetRepository,
    private val scopeRepo: StudyPlanScopeRepository,
    private val assetRepo: StudyPlanAssetRepository,
    private val cellRepo: StudyPlanCellRepository,
    private val cellFileRepo: StudyPlanCellFileRepository,
    private val scheduleRepo: StudyPlanScheduleRepository,
    private val eventRepo: StudyPlanEventRepository,
    private val classMembershipRepo: ClassMembershipRepository,
    private val orgMembershipRepo: OrgMembershipRepository,
    private val classRepo: ClassRepository,
    private val userRepo: UserRepository,
    private val farmLearningLogRepo: FarmLearningLogRepository,
    private val testSubmissionRepo: TestSubmissionRepo
) {
    // ── 관리자: 계획표 CRUD ──

    @Transactional
    fun createPlan(orgId: String, createdBy: String, req: CreateStudyPlanRequest): StudyPlanEntity {
        val plan = StudyPlanEntity(
            id = IdGenerator.newId("sp"),
            orgId = orgId,
            title = req.title,
            description = req.description,
            examScope = req.examScope,
            startDate = LocalDate.parse(req.startDate),
            endDate = LocalDate.parse(req.endDate),
            createdBy = createdBy
        )
        planRepo.save(plan)

        // 대상 저장
        req.targets.forEach { t ->
            targetRepo.save(StudyPlanTargetEntity(
                id = IdGenerator.newId("spt"),
                planId = plan.id,
                targetType = t.targetType,
                targetId = t.targetId
            ))
        }

        // 범위(행) 저장
        req.scopes.forEachIndexed { idx, s ->
            val scope = StudyPlanScopeEntity(
                id = IdGenerator.newId("sps"),
                planId = plan.id,
                label = s.label,
                sortOrder = s.sortOrder.takeIf { it != 0 } ?: idx
            )
            scopeRepo.save(scope)
        }

        // 에셋(열) 저장
        req.assets.forEachIndexed { idx, a ->
            val asset = StudyPlanAssetEntity(
                id = IdGenerator.newId("spa"),
                planId = plan.id,
                assetType = a.assetType,
                label = a.label,
                assetKind = a.assetKind,
                refId = a.refId,
                sortOrder = a.sortOrder.takeIf { it != 0 } ?: idx,
                configJson = a.configJson
            )
            assetRepo.save(asset)
        }

        // 셀 자동 생성 (대상 학생 × 범위 × 에셋)
        val userIds = resolveTargetUserIds(req.targets.map { StudyPlanTargetEntity(
            id = "", planId = "", targetType = it.targetType, targetId = it.targetId
        ) })
        val scopes = scopeRepo.findByPlanIdOrderBySortOrder(plan.id)
        val assets = assetRepo.findByPlanIdOrderBySortOrder(plan.id)
        createCellsForUsers(plan.id, scopes, assets, userIds)

        // 일정 저장
        req.schedules.forEach { s ->
            scheduleRepo.save(StudyPlanScheduleEntity(
                id = IdGenerator.newId("spsc"),
                planId = plan.id,
                scopeId = s.scopeId,
                assetId = s.assetId,
                scheduledDate = LocalDate.parse(s.scheduledDate),
                label = s.label,
                memo = s.memo
            ))
        }

        return plan
    }

    @Transactional(readOnly = true)
    fun listPlans(userId: String, status: String? = null, search: String? = null): List<StudyPlanSummaryResponse> {
        val isHqAdmin = SecurityUtils.hasAnyRole("HQ_ADMIN")
        val plans = if (isHqAdmin) {
            if (status != null) {
                planRepo.findByStatusOrderByCreatedAtDesc(status)
            } else {
                planRepo.findAll().sortedByDescending { it.createdAt }
            }
        } else {
            val orgId = orgMembershipRepo.findByUserIdAndStatus(userId, "active")
                .firstOrNull()?.orgId ?: return emptyList()
            if (status != null) {
                planRepo.findByOrgIdAndStatusOrderByCreatedAtDesc(orgId, status)
            } else {
                planRepo.findByOrgIdOrderByCreatedAtDesc(orgId)
            }
        }
        val filtered = if (!search.isNullOrBlank()) {
            plans.filter { it.title.contains(search, ignoreCase = true) }
        } else plans
        return filtered.map { plan ->
            val targetCount = targetRepo.findByPlanId(plan.id).size
            plan.toSummary(targetCount)
        }
    }

    @Transactional(readOnly = true)
    fun getPlanDetail(planId: String): StudyPlanDetailResponse {
        val plan = findPlan(planId)
        val targets = targetRepo.findByPlanId(planId).map { t ->
            val name = when (t.targetType) {
                "class" -> classRepo.findById(t.targetId).orElse(null)?.name
                "user" -> userRepo.findById(t.targetId).orElse(null)?.name
                else -> null
            }
            TargetResponse(id = t.id, targetType = t.targetType, targetId = t.targetId, targetName = name)
        }
        val scopes = scopeRepo.findByPlanIdOrderBySortOrder(planId).map { it.toResponse() }
        val assets = assetRepo.findByPlanIdOrderBySortOrder(planId).map { it.toResponse() }

        return StudyPlanDetailResponse(
            planId = plan.id, title = plan.title, description = plan.description,
            examScope = plan.examScope, startDate = plan.startDate.toString(),
            endDate = plan.endDate.toString(), status = plan.status,
            createdBy = plan.createdBy, targets = targets,
            scopes = scopes, assets = assets, createdAt = plan.createdAt.toString()
        )
    }

    @Transactional
    fun updatePlan(planId: String, req: UpdateStudyPlanRequest): StudyPlanEntity {
        val plan = findPlan(planId)
        req.title?.let { plan.title = it }
        req.description?.let { plan.description = it }
        req.examScope?.let { plan.examScope = it }
        req.startDate?.let { plan.startDate = LocalDate.parse(it) }
        req.endDate?.let { plan.endDate = LocalDate.parse(it) }
        return planRepo.save(plan)
    }

    @Transactional
    fun archivePlan(planId: String) {
        val plan = findPlan(planId)
        plan.status = "archived"
        planRepo.save(plan)
    }

    @Transactional
    fun unarchivePlan(planId: String) {
        val plan = findPlan(planId)
        plan.status = "active"
        planRepo.save(plan)
    }

    @Transactional
    fun deletePlan(planId: String) {
        findPlan(planId)
        val cellIds = cellRepo.findByPlanId(planId).map { it.id }
        if (cellIds.isNotEmpty()) {
            cellFileRepo.deleteByCellIdIn(cellIds)
        }
        cellRepo.deleteByPlanId(planId)
        scopeRepo.deleteByPlanId(planId)
        assetRepo.deleteByPlanId(planId)
        targetRepo.deleteByPlanId(planId)
        scheduleRepo.deleteByPlanId(planId)
        eventRepo.deleteByPlanId(planId)
        planRepo.deleteById(planId)
    }

    // ── 관리자: 범위(행) 관리 ──

    @Transactional
    fun addScope(planId: String, req: AddScopeRequest): StudyPlanScopeEntity {
        findPlan(planId)
        val scope = StudyPlanScopeEntity(
            id = IdGenerator.newId("sps"),
            planId = planId,
            label = req.label,
            sortOrder = req.sortOrder
        )
        scopeRepo.save(scope)
        val userIds = resolveAllPlanUserIds(planId)
        val assets = assetRepo.findByPlanIdOrderBySortOrder(planId)
        userIds.forEach { userId ->
            assets.forEach { asset ->
                val existing = cellRepo.findByScopeIdAndAssetIdAndUserId(scope.id, asset.id, userId)
                if (existing == null) {
                    createCell(planId, scope.id, asset, userId)
                }
            }
        }
        return scope
    }

    @Transactional
    fun updateScope(planId: String, scopeId: String, req: UpdateScopeRequest): StudyPlanScopeEntity {
        val scope = scopeRepo.findById(scopeId).orElseThrow {
            ApiException("NOT_FOUND", "scope not found", HttpStatus.NOT_FOUND)
        }
        req.label?.let { scope.label = it }
        req.sortOrder?.let { scope.sortOrder = it }
        return scopeRepo.save(scope)
    }

    @Transactional
    fun deleteScope(planId: String, scopeId: String) {
        val cells = cellRepo.findByScopeId(scopeId)
        cells.forEach { cellFileRepo.deleteByCellId(it.id) }
        cellRepo.deleteByScopeId(scopeId)
        scopeRepo.deleteById(scopeId)
    }

    @Transactional
    fun reorderScopes(planId: String, ids: List<String>) {
        ids.forEachIndexed { idx, id ->
            scopeRepo.findById(id).ifPresent { it.sortOrder = idx; scopeRepo.save(it) }
        }
    }

    // ── 관리자: 에셋(열) 관리 ──

    @Transactional
    fun addAsset(planId: String, req: AddAssetRequest): StudyPlanAssetEntity {
        findPlan(planId)
        val asset = StudyPlanAssetEntity(
            id = IdGenerator.newId("spa"),
            planId = planId,
            assetType = req.assetType,
            label = req.label,
            assetKind = req.assetKind,
            refId = req.refId,
            sortOrder = req.sortOrder,
            configJson = req.configJson
        )
        assetRepo.save(asset)
        val userIds = resolveAllPlanUserIds(planId)
        val scopes = scopeRepo.findByPlanIdOrderBySortOrder(planId)
        userIds.forEach { userId ->
            scopes.forEach { scope ->
                val existing = cellRepo.findByScopeIdAndAssetIdAndUserId(scope.id, asset.id, userId)
                if (existing == null) {
                    createCell(planId, scope.id, asset, userId)
                }
            }
        }
        return asset
    }

    @Transactional
    fun updateAsset(planId: String, assetId: String, req: UpdateAssetRequest): StudyPlanAssetEntity {
        val asset = assetRepo.findById(assetId).orElseThrow {
            ApiException("NOT_FOUND", "asset not found", HttpStatus.NOT_FOUND)
        }
        req.label?.let { asset.label = it }
        req.assetType?.let { asset.assetType = it }
        req.assetKind?.let { asset.assetKind = it }
        req.refId?.let { asset.refId = it }
        req.configJson?.let { asset.configJson = it }
        return assetRepo.save(asset)
    }

    @Transactional
    fun deleteAsset(planId: String, assetId: String) {
        val cells = cellRepo.findByAssetId(assetId)
        cells.forEach { cellFileRepo.deleteByCellId(it.id) }
        cellRepo.deleteByAssetId(assetId)
        assetRepo.deleteById(assetId)
    }

    @Transactional
    fun reorderAssets(planId: String, ids: List<String>) {
        ids.forEachIndexed { idx, id ->
            assetRepo.findById(id).ifPresent { it.sortOrder = idx; assetRepo.save(it) }
        }
    }

    // ── 관리자: 학생 목록 + 진행률 ──

    @Transactional(readOnly = true)
    fun getStudentsWithProgress(planId: String): List<StudentProgressResponse> {
        val userIds = resolveAllPlanUserIds(planId)
        val allCells = cellRepo.findByPlanId(planId)
        val cellsByUser = allCells.groupBy { it.userId }
        val userMap = if (userIds.isNotEmpty()) userRepo.findAllById(userIds).associateBy { it.id } else emptyMap()

        return userIds.map { userId ->
            val cells = cellsByUser[userId] ?: emptyList()
            StudentProgressResponse(
                userId = userId,
                userName = userMap[userId]?.name,
                totalCells = cells.size,
                completedCells = cells.count { it.status in listOf("completed", "passed") },
                pendingCells = cells.count { it.status == "pending" },
                submittedCells = cells.count { it.status in listOf("submitted", "scored") },
                unassignedCells = cells.count { it.status == "unassigned" },
                inProgressCells = cells.count { it.status == "in_progress" },
                partialCells = cells.count { it.status == "partial" }
            )
        }
    }

    // ── 관리자: 매트릭스 조회 (자동 동기화 포함) ──

    @Transactional
    fun getMatrix(planId: String, userId: String): MatrixResponse {
        val scopes = scopeRepo.findByPlanIdOrderBySortOrder(planId).map { it.toResponse() }
        val assets = assetRepo.findByPlanIdOrderBySortOrder(planId)
        val assetMap = assets.associateBy { it.id }
        val cells = cellRepo.findByPlanIdAndUserId(planId, userId)

        // 자동 상태 동기화
        syncKorfarmCellStatus(cells, userId, assetMap)
        syncTestCellStatus(cells, userId, assetMap)

        val cellResponses = cells.map { it.toResponse(assetMap[it.assetId]) }
        return MatrixResponse(
            scopes = scopes,
            assets = assets.map { it.toResponse() },
            cells = cellResponses
        )
    }

    // ── 관리자: 국어농장 셀 콘텐츠 배정 ──

    @Transactional
    fun assignCellContent(cellId: String, req: AssignCellContentRequest): StudyPlanCellEntity {
        val cell = findCell(cellId)
        val asset = assetRepo.findById(cell.assetId).orElseThrow {
            ApiException("NOT_FOUND", "asset not found", HttpStatus.NOT_FOUND)
        }
        if (asset.assetType != "korfarm") {
            throw ApiException("BAD_REQUEST", "국어농장 에셋만 콘텐츠 배정이 가능합니다", HttpStatus.BAD_REQUEST)
        }
        if (cell.status != "unassigned") {
            throw ApiException("BAD_REQUEST", "배정 전 상태의 셀만 콘텐츠를 배정할 수 있습니다", HttpStatus.BAD_REQUEST)
        }
        cell.cellRefId = req.cellRefId
        cell.status = "pending"
        cellRepo.save(cell)
        createEvent(cell, "assigned")
        return cell
    }

    // ── 관리자: 통합 상태 변경 ──

    @Transactional
    fun updateCellStatus(cellId: String, adminId: String, req: UpdateCellStatusRequest): StudyPlanCellEntity {
        val cell = findCell(cellId)
        val asset = assetRepo.findById(cell.assetId).orElseThrow {
            ApiException("NOT_FOUND", "asset not found", HttpStatus.NOT_FOUND)
        }
        if (!validateStatusTransition(asset.assetType, cell.status, req.status)) {
            throw ApiException(
                "BAD_REQUEST",
                "${asset.assetType} 에셋에서 ${cell.status} → ${req.status} 전이는 허용되지 않습니다",
                HttpStatus.BAD_REQUEST
            )
        }
        cell.status = req.status
        req.score?.let { cell.score = it }
        req.adminNote?.let { cell.adminNote = it }
        cell.reviewedBy = adminId
        cell.reviewedAt = LocalDateTime.now()
        cellRepo.save(cell)

        val memo = if (req.score != null) "점수: ${req.score}" else null
        createEvent(cell, req.status, memo)
        return cell
    }

    // ── 관리자: 셀 승인/거부 (하위 호환) ──

    @Transactional
    fun reviewCell(cellId: String, adminId: String, req: ReviewCellRequest): StudyPlanCellEntity {
        val mappedStatus = when (req.status) {
            "approved" -> "completed"
            "rejected" -> "partial"
            else -> req.status
        }
        return updateCellStatus(cellId, adminId, UpdateCellStatusRequest(
            status = mappedStatus,
            adminNote = req.adminNote
        ))
    }

    // ── 관리자: 테스트 채점 (하위 호환) ──

    @Transactional
    fun gradeCell(cellId: String, adminId: String, req: GradeCellRequest): StudyPlanCellEntity {
        val mappedStatus = when (req.status) {
            "failed" -> "retry"
            else -> req.status
        }
        return updateCellStatus(cellId, adminId, UpdateCellStatusRequest(
            status = mappedStatus,
            score = req.score,
            adminNote = req.adminNote
        ))
    }

    // ── 관리자: 셀 파일 조회 ──

    @Transactional(readOnly = true)
    fun getCellFiles(cellId: String): List<CellFileResponse> {
        return cellFileRepo.findByCellId(cellId).map { it.toResponse() }
    }

    // ── 관리자: 캘린더 일정 CRUD ──

    @Transactional
    fun createSchedule(planId: String, req: CreateScheduleRequest): StudyPlanScheduleEntity {
        findPlan(planId)
        val schedule = StudyPlanScheduleEntity(
            id = IdGenerator.newId("spsc"),
            planId = planId,
            scopeId = req.scopeId,
            assetId = req.assetId,
            scheduledDate = LocalDate.parse(req.scheduledDate),
            label = req.label,
            memo = req.memo
        )
        return scheduleRepo.save(schedule)
    }

    @Transactional
    fun updateSchedule(scheduleId: String, req: UpdateScheduleRequest): StudyPlanScheduleEntity {
        val schedule = scheduleRepo.findById(scheduleId).orElseThrow {
            ApiException("NOT_FOUND", "schedule not found", HttpStatus.NOT_FOUND)
        }
        req.scopeId?.let { schedule.scopeId = it }
        req.assetId?.let { schedule.assetId = it }
        req.scheduledDate?.let { schedule.scheduledDate = LocalDate.parse(it) }
        req.label?.let { schedule.label = it }
        req.memo?.let { schedule.memo = it }
        return scheduleRepo.save(schedule)
    }

    @Transactional
    fun deleteSchedule(scheduleId: String) {
        scheduleRepo.deleteById(scheduleId)
    }

    @Transactional(readOnly = true)
    fun getCalendar(planId: String): List<ScheduleResponse> {
        return scheduleRepo.findByPlanIdOrderByScheduledDate(planId).map { it.toResponse() }
    }

    // ── 학생: 내게 배정된 계획표 ──

    @Transactional(readOnly = true)
    fun getMyPlans(userId: String): List<StudyPlanSummaryResponse> {
        val planIds = resolveMyPlanIds(userId)
        if (planIds.isEmpty()) return emptyList()
        return planRepo.findAllById(planIds)
            .filter { it.status == "active" }
            .sortedByDescending { it.createdAt }
            .map { plan ->
                val targetCount = targetRepo.findByPlanId(plan.id).size
                plan.toSummary(targetCount)
            }
    }

    // ── 학생: 대시보드 요약 ──

    @Transactional(readOnly = true)
    fun getDashboardSummary(userId: String): StudentDashboardSummary {
        val planIds = resolveMyPlanIds(userId)
        if (planIds.isEmpty()) {
            return StudentDashboardSummary(0, 0, 0, 0, 0)
        }
        val activePlans = planRepo.findAllById(planIds).filter { it.status == "active" }
        val activePlanIds = activePlans.map { it.id }.toSet()

        val cells = cellRepo.findByPlanIdInAndUserId(activePlanIds, userId)
        val totalPending = cells.count { it.status == "pending" }
        val totalSubmitted = cells.count { it.status in listOf("submitted", "scored") }
        val totalUnassigned = cells.count { it.status == "unassigned" }

        val today = LocalDate.now()
        val weekLater = today.plusDays(7)
        val upcomingSchedules = scheduleRepo.findByPlanIdInAndScheduledDateBetween(
            activePlanIds, today, weekLater
        ).size

        return StudentDashboardSummary(
            activePlans = activePlans.size,
            totalPending = totalPending,
            totalSubmitted = totalSubmitted,
            totalUnassigned = totalUnassigned,
            upcomingSchedules = upcomingSchedules
        )
    }

    @Transactional(readOnly = true)
    fun getUpcomingItems(userId: String): List<UpcomingItemResponse> {
        val planIds = resolveMyPlanIds(userId)
        if (planIds.isEmpty()) return emptyList()
        val activePlans = planRepo.findAllById(planIds).filter { it.status == "active" }
        val activePlanIds = activePlans.map { it.id }.toSet()
        val planMap = activePlans.associateBy { it.id }

        val today = LocalDate.now()
        val weekLater = today.plusDays(7)

        // 임박 스케줄
        val schedules = scheduleRepo.findByPlanIdInAndScheduledDateBetween(activePlanIds, today, weekLater)
        val result = mutableListOf<UpcomingItemResponse>()
        for (s in schedules) {
            val asset = s.assetId?.let { assetRepo.findById(it).orElse(null) }
            result.add(
                UpcomingItemResponse(
                    assetType = asset?.assetType ?: "activity",
                    label = s.label ?: asset?.label ?: "활동",
                    scheduledDate = s.scheduledDate.toString(),
                    dueDate = null,
                    planTitle = planMap[s.planId]?.title ?: ""
                )
            )
        }

        // 미수행 셀 중 기한 임박 (pending 상태)
        val cells = cellRepo.findByPlanIdInAndUserId(activePlanIds, userId)
            .filter { it.status == "pending" }
            .take(5)
        for (c in cells) {
            val asset = assetRepo.findById(c.assetId).orElse(null)
            if (asset != null && result.size < 3) {
                result.add(
                    UpcomingItemResponse(
                        assetType = asset.assetType,
                        label = asset.label,
                        scheduledDate = null,
                        dueDate = null,
                        planTitle = planMap[c.planId]?.title
                    )
                )
            }
        }

        return result.take(3)
    }

    // ── 학생: 셀 제출 (학습활동만) ──

    @Transactional
    fun submitCell(cellId: String, userId: String, req: SubmitCellRequest): StudyPlanCellEntity {
        val cell = findCell(cellId)
        if (cell.userId != userId) {
            throw ApiException("FORBIDDEN", "not your cell", HttpStatus.FORBIDDEN)
        }
        val asset = assetRepo.findById(cell.assetId).orElse(null)
        if (asset?.assetType != "activity") {
            throw ApiException("BAD_REQUEST", "학습활동 에셋만 제출이 가능합니다", HttpStatus.BAD_REQUEST)
        }
        if (cell.status !in listOf("pending", "partial")) {
            throw ApiException("BAD_REQUEST", "제출 가능한 상태가 아닙니다 (미수행/일부 완료만 가능)", HttpStatus.BAD_REQUEST)
        }
        // 파일 첨부
        req.fileIds.forEach { fileId ->
            cellFileRepo.save(StudyPlanCellFileEntity(
                id = IdGenerator.newId("spcf"),
                cellId = cellId,
                fileId = fileId,
                uploadedBy = userId
            ))
        }
        cell.status = "submitted"
        cell.submissionCount += 1
        cell.adminNote = null
        cellRepo.save(cell)
        createEvent(cell, "submitted")
        return cell
    }

    // ── 캘린더 이벤트 조회 ──

    @Transactional(readOnly = true)
    fun getCalendarEvents(planId: String, userId: String?, yearMonth: String): List<CalendarEventResponse> {
        val ym = java.time.YearMonth.parse(yearMonth)
        val start = ym.atDay(1)
        val end = ym.atEndOfMonth()
        val events = if (userId != null) {
            eventRepo.findByPlanIdAndUserIdAndEventDateBetweenOrderByEventDate(planId, userId, start, end)
        } else {
            eventRepo.findByPlanIdAndEventDateBetweenOrderByEventDate(planId, start, end)
        }
        return events.map { it.toCalendarEvent() }
    }

    // ── 학생 API 접근 검증 ──

    fun verifyPlanAccess(planId: String, userId: String) {
        val myPlanIds = resolveMyPlanIds(userId)
        if (planId !in myPlanIds) {
            throw ApiException("FORBIDDEN", "해당 계획표에 접근 권한이 없습니다", HttpStatus.FORBIDDEN)
        }
    }

    // ── 상태 전이 검증 ──

    private fun validateStatusTransition(assetType: String, from: String, to: String): Boolean {
        val validTransitions = when (assetType) {
            "korfarm" -> mapOf(
                "unassigned" to setOf("pending"),
                "pending" to setOf("in_progress"),
                "in_progress" to setOf("completed")
            )
            "activity" -> mapOf(
                "unassigned" to setOf("pending"),
                "pending" to setOf("submitted"),
                "submitted" to setOf("completed", "partial"),
                "partial" to setOf("submitted")
            )
            "test" -> mapOf(
                "pending" to setOf("scored"),
                "scored" to setOf("passed", "retry"),
                "retry" to setOf("scored")
            )
            else -> emptyMap()
        }
        return validTransitions[from]?.contains(to) ?: false
    }

    // ── 자동 동기화: 국어농장 학습 로그 ──

    private fun syncKorfarmCellStatus(
        cells: List<StudyPlanCellEntity>,
        userId: String,
        assetMap: Map<String, StudyPlanAssetEntity>
    ) {
        val korfarmCells = cells.filter {
            assetMap[it.assetId]?.assetType == "korfarm" && it.status in listOf("pending", "in_progress")
        }
        if (korfarmCells.isEmpty()) return

        val contentIds = korfarmCells.mapNotNull { it.cellRefId ?: assetMap[it.assetId]?.refId }.distinct()
        if (contentIds.isEmpty()) return

        val logs = farmLearningLogRepo.findByUserIdAndContentIdIn(userId, contentIds)
        val logMap = logs.groupBy { it.contentId }

        korfarmCells.forEach { cell ->
            val contentId = cell.cellRefId ?: assetMap[cell.assetId]?.refId ?: return@forEach
            val cellLogs = logMap[contentId] ?: return@forEach

            val hasCompleted = cellLogs.any { it.status == "COMPLETED" }
            val hasStarted = cellLogs.isNotEmpty()

            val newStatus = when {
                hasCompleted && cell.status != "completed" -> "completed"
                hasStarted && cell.status == "pending" -> "in_progress"
                else -> null
            }

            if (newStatus != null) {
                cell.status = newStatus
                cellRepo.save(cell)
                createEvent(cell, newStatus)
            }
        }
    }

    // ── 자동 동기화: 테스트 제출 ──

    private fun syncTestCellStatus(
        cells: List<StudyPlanCellEntity>,
        userId: String,
        assetMap: Map<String, StudyPlanAssetEntity>
    ) {
        val testCells = cells.filter {
            assetMap[it.assetId]?.assetType == "test" && it.status in listOf("pending", "retry")
        }
        if (testCells.isEmpty()) return

        testCells.forEach { cell ->
            val testId = assetMap[cell.assetId]?.refId ?: return@forEach
            val submission = testSubmissionRepo.findByTestIdAndUserId(testId, userId) ?: return@forEach

            // 재시험인 경우: 제출이 판정 이후인지 확인
            if (cell.status == "retry") {
                val retrySetAt = cell.reviewedAt ?: return@forEach
                if (submission.createdAt <= retrySetAt) return@forEach
            }

            cell.status = "scored"
            cell.score = submission.score
            cellRepo.save(cell)
            createEvent(cell, "scored", "점수: ${submission.score}")
        }
    }

    // ── 내부 헬퍼 ──

    private fun findPlan(planId: String): StudyPlanEntity {
        return planRepo.findById(planId).orElseThrow {
            ApiException("NOT_FOUND", "study plan not found", HttpStatus.NOT_FOUND)
        }
    }

    private fun findCell(cellId: String): StudyPlanCellEntity {
        return cellRepo.findById(cellId).orElseThrow {
            ApiException("NOT_FOUND", "cell not found", HttpStatus.NOT_FOUND)
        }
    }

    private fun resolveAllPlanUserIds(planId: String): Set<String> {
        val targets = targetRepo.findByPlanId(planId)
        return resolveTargetUserIds(targets)
    }

    private fun resolveTargetUserIds(targets: List<StudyPlanTargetEntity>): Set<String> {
        val userIds = mutableSetOf<String>()
        targets.forEach { target ->
            when (target.targetType) {
                "class" -> {
                    classMembershipRepo.findByClassIdAndStatus(target.targetId, "active")
                        .forEach { userIds.add(it.userId) }
                }
                "user" -> userIds.add(target.targetId)
            }
        }
        return userIds
    }

    private fun resolveMyPlanIds(userId: String): Set<String> {
        val planIds = mutableSetOf<String>()
        targetRepo.findByTargetTypeAndTargetId("user", userId).forEach { planIds.add(it.planId) }
        val classIds = classMembershipRepo.findByUserIdAndStatus(userId, "active").map { it.classId }
        classIds.forEach { classId ->
            targetRepo.findByTargetTypeAndTargetId("class", classId).forEach { planIds.add(it.planId) }
        }
        return planIds
    }

    private fun createEvent(cell: StudyPlanCellEntity, eventType: String, memo: String? = null) {
        val scope = scopeRepo.findById(cell.scopeId).orElse(null)
        val asset = assetRepo.findById(cell.assetId).orElse(null)
        val label = listOfNotNull(scope?.label, asset?.label).joinToString(" / ")
        eventRepo.save(StudyPlanEventEntity(
            id = IdGenerator.newId("spe"),
            planId = cell.planId,
            userId = cell.userId,
            eventType = eventType,
            eventDate = LocalDate.now(),
            cellId = cell.id,
            refLabel = label.ifBlank { null },
            memo = memo
        ))
    }

    private fun initialCellStatus(asset: StudyPlanAssetEntity): String {
        return when (asset.assetType) {
            "korfarm" -> if (asset.refId != null) "pending" else "unassigned"
            "activity" -> "unassigned"
            "test" -> "pending"
            else -> "pending"
        }
    }

    private fun createCell(planId: String, scopeId: String, asset: StudyPlanAssetEntity, userId: String): StudyPlanCellEntity {
        val status = initialCellStatus(asset)
        val cellRefId = if (asset.assetType == "korfarm" && asset.refId != null) asset.refId else null
        return cellRepo.save(StudyPlanCellEntity(
            id = IdGenerator.newId("spc"),
            planId = planId,
            scopeId = scopeId,
            assetId = asset.id,
            userId = userId,
            status = status,
            cellRefId = cellRefId
        ))
    }

    private fun createCellsForUsers(
        planId: String,
        scopes: List<StudyPlanScopeEntity>,
        assets: List<StudyPlanAssetEntity>,
        userIds: Set<String>
    ) {
        userIds.forEach { userId ->
            scopes.forEach { scope ->
                assets.forEach { asset ->
                    createCell(planId, scope.id, asset, userId)
                }
            }
        }
    }
}
