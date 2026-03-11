package com.korfarm.api.studyplan

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.org.*
import com.korfarm.api.security.SecurityUtils
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
    private val classMembershipRepo: ClassMembershipRepository,
    private val orgMembershipRepo: OrgMembershipRepository,
    private val classRepo: ClassRepository,
    private val userRepo: UserRepository
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
        val scopeIdMap = mutableMapOf<Int, String>() // sortOrder → id (일정 매핑용)
        req.scopes.forEachIndexed { idx, s ->
            val scope = StudyPlanScopeEntity(
                id = IdGenerator.newId("sps"),
                planId = plan.id,
                label = s.label,
                sortOrder = s.sortOrder.takeIf { it != 0 } ?: idx
            )
            scopeRepo.save(scope)
            scopeIdMap[idx] = scope.id
        }

        // 에셋(열) 저장
        val assetIdMap = mutableMapOf<Int, String>()
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
            assetIdMap[idx] = asset.id
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
    fun listPlans(userId: String): List<StudyPlanSummaryResponse> {
        val isHqAdmin = SecurityUtils.hasAnyRole("HQ_ADMIN")
        val plans = if (isHqAdmin) {
            planRepo.findAll().sortedByDescending { it.createdAt }
        } else {
            val orgId = orgMembershipRepo.findByUserIdAndStatus(userId, "active")
                .firstOrNull()?.orgId ?: return emptyList()
            planRepo.findByOrgIdAndStatusOrderByCreatedAtDesc(orgId, "active")
        }
        return plans.map { plan ->
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
        // 대상 학생 전원에 대해 셀 보충
        val userIds = resolveAllPlanUserIds(planId)
        val assets = assetRepo.findByPlanIdOrderBySortOrder(planId)
        userIds.forEach { userId ->
            assets.forEach { asset ->
                val existing = cellRepo.findByScopeIdAndAssetIdAndUserId(scope.id, asset.id, userId)
                if (existing == null) {
                    cellRepo.save(StudyPlanCellEntity(
                        id = IdGenerator.newId("spc"),
                        planId = planId, scopeId = scope.id,
                        assetId = asset.id, userId = userId
                    ))
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
        // 관련 셀 파일 삭제
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
        // 셀 보충
        val userIds = resolveAllPlanUserIds(planId)
        val scopes = scopeRepo.findByPlanIdOrderBySortOrder(planId)
        userIds.forEach { userId ->
            scopes.forEach { scope ->
                val existing = cellRepo.findByScopeIdAndAssetIdAndUserId(scope.id, asset.id, userId)
                if (existing == null) {
                    cellRepo.save(StudyPlanCellEntity(
                        id = IdGenerator.newId("spc"),
                        planId = planId, scopeId = scope.id,
                        assetId = asset.id, userId = userId
                    ))
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
                completedCells = cells.count { it.status in listOf("approved", "passed") },
                pendingCells = cells.count { it.status == "pending" },
                submittedCells = cells.count { it.status in listOf("submitted", "grading") },
                rejectedCells = cells.count { it.status == "rejected" }
            )
        }
    }

    // ── 관리자: 매트릭스 조회 ──

    @Transactional(readOnly = true)
    fun getMatrix(planId: String, userId: String): MatrixResponse {
        val scopes = scopeRepo.findByPlanIdOrderBySortOrder(planId).map { it.toResponse() }
        val assets = assetRepo.findByPlanIdOrderBySortOrder(planId)
        val assetMap = assets.associateBy { it.id }
        val cells = cellRepo.findByPlanIdAndUserId(planId, userId).map { it.toResponse(assetMap[it.assetId]) }
        return MatrixResponse(
            scopes = scopes,
            assets = assets.map { it.toResponse() },
            cells = cells
        )
    }

    // ── 관리자: 셀 승인/거부 ──

    @Transactional
    fun reviewCell(cellId: String, adminId: String, req: ReviewCellRequest): StudyPlanCellEntity {
        val cell = findCell(cellId)
        if (req.status !in listOf("approved", "rejected")) {
            throw ApiException("BAD_REQUEST", "status must be approved or rejected", HttpStatus.BAD_REQUEST)
        }
        cell.status = req.status
        cell.adminNote = req.adminNote
        cell.reviewedBy = adminId
        cell.reviewedAt = LocalDateTime.now()
        return cellRepo.save(cell)
    }

    // ── 관리자: 테스트 채점 ──

    @Transactional
    fun gradeCell(cellId: String, adminId: String, req: GradeCellRequest): StudyPlanCellEntity {
        val cell = findCell(cellId)
        if (req.status !in listOf("passed", "retry", "failed")) {
            throw ApiException("BAD_REQUEST", "status must be passed, retry, or failed", HttpStatus.BAD_REQUEST)
        }
        cell.status = req.status
        cell.score = req.score
        cell.adminNote = req.adminNote
        cell.reviewedBy = adminId
        cell.reviewedAt = LocalDateTime.now()
        return cellRepo.save(cell)
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
        val totalSubmitted = cells.count { it.status in listOf("submitted", "grading") }
        val totalRejected = cells.count { it.status == "rejected" }

        val today = LocalDate.now()
        val weekLater = today.plusDays(7)
        val upcomingSchedules = scheduleRepo.findByPlanIdInAndScheduledDateBetween(
            activePlanIds, today, weekLater
        ).size

        return StudentDashboardSummary(
            activePlans = activePlans.size,
            totalPending = totalPending,
            totalSubmitted = totalSubmitted,
            totalRejected = totalRejected,
            upcomingSchedules = upcomingSchedules
        )
    }

    // ── 학생: 셀 제출 ──

    @Transactional
    fun submitCell(cellId: String, userId: String, req: SubmitCellRequest): StudyPlanCellEntity {
        val cell = findCell(cellId)
        if (cell.userId != userId) {
            throw ApiException("FORBIDDEN", "not your cell", HttpStatus.FORBIDDEN)
        }
        if (cell.status !in listOf("pending", "rejected")) {
            throw ApiException("BAD_REQUEST", "cell is not in submittable state", HttpStatus.BAD_REQUEST)
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
        cell.adminNote = null // 이전 거부 사유 초기화
        return cellRepo.save(cell)
    }

    // ── 학생 API 접근 검증 ──

    fun verifyPlanAccess(planId: String, userId: String) {
        val myPlanIds = resolveMyPlanIds(userId)
        if (planId !in myPlanIds) {
            throw ApiException("FORBIDDEN", "해당 계획표에 접근 권한이 없습니다", HttpStatus.FORBIDDEN)
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
        // 직접 배정
        targetRepo.findByTargetTypeAndTargetId("user", userId).forEach { planIds.add(it.planId) }
        // 수강반 소속으로 배정
        val classIds = classMembershipRepo.findByUserIdAndStatus(userId, "active").map { it.classId }
        classIds.forEach { classId ->
            targetRepo.findByTargetTypeAndTargetId("class", classId).forEach { planIds.add(it.planId) }
        }
        return planIds
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
                    cellRepo.save(StudyPlanCellEntity(
                        id = IdGenerator.newId("spc"),
                        planId = planId,
                        scopeId = scope.id,
                        assetId = asset.id,
                        userId = userId
                    ))
                }
            }
        }
    }
}
