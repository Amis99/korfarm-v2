package com.korfarm.api.studyplan

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.learning.FarmLearningLogRepository
import com.korfarm.api.org.*
import com.korfarm.api.paid.ContentRepository
import com.korfarm.api.security.SecurityUtils
import com.korfarm.api.test.TestPaperEntity
import com.korfarm.api.test.TestPaperRepo
import com.korfarm.api.test.TestSubmissionEntity
import com.korfarm.api.test.TestSubmissionRepo
import com.korfarm.api.user.UserRepository
import com.korfarm.api.wisdom.WisdomFeedbackRepository
import com.korfarm.api.wisdom.WisdomPostEntity
import com.korfarm.api.wisdom.WisdomPostRepository
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
    private val cellAssignmentRepo: StudyPlanCellAssignmentRepository,
    private val scheduleRepo: StudyPlanScheduleRepository,
    private val eventRepo: StudyPlanEventRepository,
    private val classMembershipRepo: ClassMembershipRepository,
    private val orgMembershipRepo: OrgMembershipRepository,
    private val classRepo: ClassRepository,
    private val userRepo: UserRepository,
    private val farmLearningLogRepo: FarmLearningLogRepository,
    private val testSubmissionRepo: TestSubmissionRepo,
    private val testPaperRepo: TestPaperRepo,
    private val contentRepo: ContentRepository,
    private val wisdomPostRepo: WisdomPostRepository,
    private val wisdomFeedbackRepo: WisdomFeedbackRepository,
    private val objectMapper: ObjectMapper
) {

    companion object {
        // 허용된 asset_type 값 (DB 스키마 변경 없이 코드에서 검증)
        private val ALLOWED_ASSET_TYPES = setOf("korfarm", "writing", "test", "activity")
    }

    /** 신규/수정 시 asset_type 유효성 검사 */
    private fun validateAssetType(assetType: String) {
        if (assetType !in ALLOWED_ASSET_TYPES) {
            throw ApiException(
                "BAD_REQUEST",
                "허용되지 않은 asset_type 입니다: $assetType (허용: ${ALLOWED_ASSET_TYPES.joinToString()})",
                HttpStatus.BAD_REQUEST
            )
        }
    }
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
            validateAssetType(a.assetType)
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

    /**
     * 학생 1명이 target 인 plan 목록. 학생별 탭의 매트릭스 진입점.
     * 정책: 모든 학생은 매트릭스를 갖고 있어야 한다. plan 이 없으면 lazy 생성.
     */
    @Transactional
    fun listPlansForStudent(userId: String): List<StudyPlanSummaryResponse> {
        val targets = targetRepo.findByTargetTypeAndTargetId("user", userId)
        val planIds = targets.map { it.planId }.distinct()
        val activePlans = if (planIds.isEmpty()) emptyList() else
            planRepo.findAllById(planIds).filter { it.status == "active" }

        if (activePlans.isEmpty()) {
            val membership = orgMembershipRepo
                .findByUserIdAndStatus(userId, "active")
                .firstOrNull()
                ?: return emptyList()
            val newPlan = createDefaultPlanForStudent(membership.orgId, userId)
            return listOf(newPlan.toSummary(1))
        }

        return activePlans
            .sortedByDescending { it.createdAt }
            .map { plan ->
                val targetCount = targetRepo.findByPlanId(plan.id).size
                plan.toSummary(targetCount)
            }
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
            scopes = scopes, assets = assets, createdAt = plan.createdAt.toString(),
            isTemplate = plan.isTemplate
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
        req.isTemplate?.let { plan.isTemplate = it }
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
        // sortOrder 자동 결정 — 기본은 기존 max+1 (신규 행이 가장 아래로 들어감)
        val nextSortOrder = scopeRepo.findByPlanIdOrderBySortOrder(planId)
            .maxOfOrNull { it.sortOrder + 1 } ?: 0
        val effectiveSortOrder = if (req.sortOrder > 0) req.sortOrder else nextSortOrder
        val scope = StudyPlanScopeEntity(
            id = IdGenerator.newId("sps"),
            planId = planId,
            label = req.label,
            sortOrder = effectiveSortOrder
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
        validateAssetType(req.assetType)
        // sortOrder 자동 결정 — 기본은 기존 min-1 (신규 열이 가장 좌측으로 들어감)
        val prevSortOrder = assetRepo.findByPlanIdOrderBySortOrder(planId)
            .minOfOrNull { it.sortOrder - 1 } ?: 0
        val effectiveSortOrder = if (req.sortOrder != 0) req.sortOrder else prevSortOrder
        val asset = StudyPlanAssetEntity(
            id = IdGenerator.newId("spa"),
            planId = planId,
            assetType = req.assetType,
            label = req.label,
            assetKind = req.assetKind,
            refId = req.refId,
            sortOrder = effectiveSortOrder,
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
        req.assetType?.let { validateAssetType(it); asset.assetType = it }
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

        // korfarm 자산 셀의 assignment 일괄 조회 — 복수 배정 진행률용
        val assets = assetRepo.findByPlanIdOrderBySortOrder(planId)
        val korfarmAssetIds = assets.filter { it.assetType == "korfarm" }.map { it.id }.toSet()
        val korfarmCellIds = allCells.filter { it.assetId in korfarmAssetIds }.map { it.id }
        val assignmentsByCellId: Map<String, List<StudyPlanCellAssignmentEntity>> =
            if (korfarmCellIds.isNotEmpty())
                cellAssignmentRepo.findByCellIdIn(korfarmCellIds).groupBy { it.cellId }
            else emptyMap()

        // 셀 카운트 헬퍼 — korfarm 셀은 assignment 단위, 다른 자산은 cell 단위
        fun countForCell(
            cell: StudyPlanCellEntity,
            isKorfarm: Boolean,
            cellMatch: (StudyPlanCellEntity) -> Boolean,
            assignMatch: (StudyPlanCellAssignmentEntity) -> Boolean
        ): Pair<Int, Int> {
            return if (isKorfarm) {
                val assigns = assignmentsByCellId[cell.id]
                if (assigns.isNullOrEmpty()) {
                    Pair(1, if (cellMatch(cell)) 1 else 0)
                } else {
                    Pair(assigns.size, assigns.count { assignMatch(it) })
                }
            } else {
                Pair(1, if (cellMatch(cell)) 1 else 0)
            }
        }

        return userIds.map { userId ->
            val cells = cellsByUser[userId] ?: emptyList()
            var total = 0; var completed = 0; var pending = 0; var submitted = 0
            var unassigned = 0; var inProgress = 0; var partial = 0
            cells.forEach { cell ->
                val isKorfarm = cell.assetId in korfarmAssetIds
                val (t, c) = countForCell(cell, isKorfarm, { it.status in setOf("completed", "passed") }, { it.status == "completed" })
                total += t; completed += c

                if (isKorfarm) {
                    val assigns = assignmentsByCellId[cell.id] ?: emptyList()
                    if (assigns.isEmpty()) {
                        if (cell.status == "pending") pending += 1
                        if (cell.status == "in_progress") inProgress += 1
                        if (cell.status == "unassigned") unassigned += 1
                    } else {
                        pending += assigns.count { it.status == "pending" }
                        inProgress += assigns.count { it.status == "in_progress" }
                    }
                } else {
                    if (cell.status == "pending") pending += 1
                    if (cell.status in listOf("submitted", "scored")) submitted += 1
                    if (cell.status == "unassigned") unassigned += 1
                    if (cell.status == "in_progress") inProgress += 1
                    if (cell.status == "partial") partial += 1
                }
            }
            StudentProgressResponse(
                userId = userId,
                userName = userMap[userId]?.name,
                totalCells = total,
                completedCells = completed,
                pendingCells = pending,
                submittedCells = submitted,
                unassignedCells = unassigned,
                inProgressCells = inProgress,
                partialCells = partial
            )
        }
    }

    @Transactional(readOnly = true)
    fun getSubmissions(planId: String): List<SubmissionResponse> {
        val allCells = cellRepo.findByPlanId(planId)
            .filter { it.submissionCount > 0 || it.status in listOf("submitted", "partial", "completed", "scored", "passed") }
        if (allCells.isEmpty()) return emptyList()

        val userIds = allCells.map { it.userId }.toSet()
        val userMap = if (userIds.isNotEmpty()) userRepo.findAllById(userIds).associateBy { it.id } else emptyMap()
        val scopeMap = scopeRepo.findByPlanIdOrderBySortOrder(planId).associateBy { it.id }
        val assetMap = assetRepo.findByPlanIdOrderBySortOrder(planId).associateBy { it.id }

        return allCells.sortedByDescending { it.updatedAt }.map { cell ->
            SubmissionResponse(
                cellId = cell.id,
                userId = cell.userId,
                userName = userMap[cell.userId]?.name ?: cell.userId,
                scopeLabel = scopeMap[cell.scopeId]?.label ?: "",
                assetLabel = assetMap[cell.assetId]?.label ?: "",
                assetType = assetMap[cell.assetId]?.assetType ?: "",
                status = cell.status,
                submissionCount = cell.submissionCount,
                score = cell.score,
                adminNote = cell.adminNote,
                updatedAt = cell.updatedAt?.toString()
            )
        }
    }

    // ── 관리자: 매트릭스 조회 (자동 동기화 포함) ──

    @Transactional
    fun getMatrix(planId: String, userId: String, isAdmin: Boolean = false): MatrixResponse {
        val scopeEntities = scopeRepo.findByPlanIdOrderBySortOrder(planId)
        val scopes = scopeEntities.map { it.toResponse() }
        val assets = assetRepo.findByPlanIdOrderBySortOrder(planId)
        val assetMap = assets.associateBy { it.id }
        var cells = cellRepo.findByPlanIdAndUserId(planId, userId)

        // 누락된 (scope × asset) 조합에 대해 cell 자동 생성 — 매트릭스의 빈 셀이 클릭 안 되던 회귀 방지
        val existingPairs = cells.map { it.scopeId to it.assetId }.toHashSet()
        val missing = scopeEntities.flatMap { s ->
            assets.map { a -> s.id to a.id }
        }.filter { it !in existingPairs }
        if (missing.isNotEmpty()) {
            missing.forEach { (scopeId, assetId) ->
                val asset = assetMap[assetId] ?: return@forEach
                createCell(planId, scopeId, asset, userId)
            }
            cells = cellRepo.findByPlanIdAndUserId(planId, userId)
        }

        // 자동 상태 동기화
        syncKorfarmCellStatus(cells, userId, assetMap)
        syncTestCellStatus(cells, userId, assetMap)

        // 학생 본인 레벨 (글쓰기 cellAction 의 levelId fallback 용)
        val studentLevelId = userRepo.findById(userId).orElse(null)?.levelId

        // 글쓰기 셀에 연결된 wisdom_post 일괄 조회 (cellAction 의 wisdomPostId 채우기 용)
        val writingCellIds = cells.filter { assetMap[it.assetId]?.assetType == "writing" }.map { it.id }
        val wisdomPostByCellId: Map<String, String> = if (writingCellIds.isNotEmpty()) {
            wisdomPostRepo.findByPlanCellIdIn(writingCellIds)
                .filter { it.status == "active" }
                .associate { it.planCellId!! to it.id }
        } else emptyMap()

        // 테스트 셀의 제출 여부 확인 — cell.cellRefId 우선
        val testSubmissionCellIds: Set<String> = cells.filter {
            assetMap[it.assetId]?.assetType == "test" && (it.cellRefId != null || assetMap[it.assetId]?.refId != null)
        }.mapNotNull { cell ->
            val testId = cell.cellRefId ?: assetMap[cell.assetId]?.refId ?: return@mapNotNull null
            if (testSubmissionRepo.findByTestIdAndUserId(testId, userId) != null) cell.id else null
        }.toSet()

        // 국어농장 셀의 assignment 일괄 조회 (복수 배정)
        val korfarmCellIds = cells.filter { assetMap[it.assetId]?.assetType == "korfarm" }.map { it.id }
        val assignmentsByCellId: Map<String, List<StudyPlanCellAssignmentEntity>> =
            if (korfarmCellIds.isNotEmpty())
                cellAssignmentRepo.findByCellIdIn(korfarmCellIds).groupBy { it.cellId }
            else emptyMap()

        // 시험 자산의 PDF fileId 일괄 조회 (통합 PDF 정책 — 시험지·정답해설 동일 fileId)
        // testId 후보: cell.cellRefId (셀 단위 배정) + asset.refId (자산 단위 default) — 둘 다 모음
        val testIdsFromAssets = assets.filter { it.assetType == "test" && !it.refId.isNullOrBlank() }
            .mapNotNull { it.refId }
        val testIdsFromCells = cells.filter {
            assetMap[it.assetId]?.assetType == "test" && !it.cellRefId.isNullOrBlank()
        }.mapNotNull { it.cellRefId }
        val allTestIds = (testIdsFromAssets + testIdsFromCells).distinct()
        val pdfByTestId: Map<String, String?> = if (allTestIds.isNotEmpty()) {
            testPaperRepo.findAllById(allTestIds).associate { it.id to it.pdfFileId }
        } else emptyMap()

        val cellResponses = cells.map { cell ->
            val asset = assetMap[cell.assetId]
            val action = buildCellAction(
                cell = cell,
                asset = asset,
                userId = userId,
                studentLevelId = studentLevelId,
                wisdomPostByCellId = wisdomPostByCellId,
                testSubmissionCellIds = testSubmissionCellIds,
                isAdmin = isAdmin
            )
            val assigns = assignmentsByCellId[cell.id]
                ?.sortedWith(compareBy({ it.sortOrder }, { it.createdAt }))
                ?.map { it.toResponse() }
                ?: emptyList()
            // 시험 셀이면 cell.cellRefId 우선 → asset.refId fallback 으로 PDF fileId 매핑
            val cellTestPdf = if (asset?.assetType == "test") {
                val tid = cell.cellRefId ?: asset.refId
                tid?.let { pdfByTestId[it] }
            } else null
            cell.toResponse(asset, action, assigns, cellTestPdf)
        }

        val assetResponses = assets.map { asset ->
            val pdf = if (asset.assetType == "test") pdfByTestId[asset.refId] else null
            asset.toResponse(testPdfFileId = pdf, answerPdfFileId = pdf)
        }

        return MatrixResponse(
            scopes = scopes,
            assets = assetResponses,
            cells = cellResponses
        )
    }

    /**
     * 셀 클릭 시 화면 라우팅 정보 (cellAction) 생성.
     * - korfarm: { kind:"learn", contentId, learningHistoryUrl }
     * - writing: { kind:"write", levelId, topicKey, topicLabel, wisdomPostId }
     * - test: { kind:"test", testId, hasSubmission }
     * - activity: { kind:"activity" }
     */
    private fun buildCellAction(
        cell: StudyPlanCellEntity,
        asset: StudyPlanAssetEntity?,
        userId: String,
        studentLevelId: String? = null,
        wisdomPostByCellId: Map<String, String>,
        testSubmissionCellIds: Set<String>,
        isAdmin: Boolean
    ): CellAction? {
        if (asset == null) return null
        return when (asset.assetType) {
            "korfarm" -> {
                val contentId = cell.cellRefId ?: asset.refId
                CellAction(
                    kind = "learn",
                    contentId = contentId,
                    learningHistoryUrl = if (isAdmin && contentId != null) {
                        "/admin/students/$userId/learning-history?contentId=$contentId"
                    } else null
                )
            }
            "writing" -> {
                val cfg = parseWritingConfig(asset.configJson)
                // Phase 3: 셀 단위 배정이 우선 — cell.cellRefId(topicKey), cell.assignedLabel(라벨)
                // 글쓰기 levelId 는 학생 본인 레벨이 정답 (asset.refId 옛 모델 fallback 후순위)
                CellAction(
                    kind = "write",
                    levelId = cfg["levelId"] ?: studentLevelId ?: asset.refId,
                    topicKey = cell.cellRefId ?: cfg["topicKey"],
                    topicLabel = cell.assignedLabel ?: cfg["topicLabel"] ?: asset.label,
                    wisdomPostId = wisdomPostByCellId[cell.id]
                )
            }
            "test" -> CellAction(
                kind = "test",
                testId = cell.cellRefId ?: asset.refId,
                hasSubmission = cell.id in testSubmissionCellIds
            )
            "activity" -> CellAction(kind = "activity")
            else -> null
        }
    }

    private fun parseWritingConfig(configJson: String?): Map<String, String> {
        if (configJson.isNullOrBlank()) return emptyMap()
        return try {
            val raw: Map<String, Any?> = objectMapper.readValue(
                configJson, object : TypeReference<Map<String, Any?>>() {}
            )
            raw.mapNotNull { (k, v) -> v?.toString()?.let { k to it } }.toMap()
        } catch (e: Exception) {
            emptyMap()
        }
    }

    // ── 관리자: 셀 배정 (모든 자산 종류 통일) ──

    /**
     * 셀에 콘텐츠/테스트/주제/활동을 배정한다.
     * - korfarm: cellRefId 필수 (contents.id), assignedLabel 선택
     * - test:    cellRefId 필수 (tests.id), assignedLabel 선택
     * - writing: cellRefId 선택 (wisdom_topics.id 또는 자유주제 표시), assignedLabel 선택 (자유주제 학생 제목)
     * - activity: cellRefId 없음, assignedLabel 필수
     *
     * 마감일(dueAt) 은 필수. 클라이언트가 안 주면 default = 오늘 + 7일 23:59.
     * 재배정도 허용 (만료/완료 셀 다시 사용).
     */
    @Transactional
    fun assignCellContent(cellId: String, req: AssignCellContentRequest): StudyPlanCellEntity {
        val cell = findCell(cellId)
        val asset = assetRepo.findById(cell.assetId).orElseThrow {
            ApiException("NOT_FOUND", "asset not found", HttpStatus.NOT_FOUND)
        }
        when (asset.assetType) {
            "activity" -> {
                if (req.assignedLabel.isNullOrBlank()) {
                    throw ApiException("BAD_REQUEST", "활동 이름을 입력해 주세요", HttpStatus.BAD_REQUEST)
                }
            }
            "korfarm", "test" -> {
                if (req.cellRefId.isNullOrBlank()) {
                    throw ApiException("BAD_REQUEST", "${asset.assetType} 자산은 ref id 가 필요합니다", HttpStatus.BAD_REQUEST)
                }
            }
            "writing" -> {
                // ref 없거나 자유주제일 수 있음 — 단 어느 쪽이든 라벨이 있어야
                if (req.cellRefId.isNullOrBlank() && req.assignedLabel.isNullOrBlank()) {
                    throw ApiException("BAD_REQUEST", "주제를 선택하거나 자유주제 제목을 입력해 주세요", HttpStatus.BAD_REQUEST)
                }
            }
        }

        cell.cellRefId = req.cellRefId
        // assignedLabel 누락 시 콘텐츠/테스트 title 로 자동 채움 (모달에 학습명 표시)
        cell.assignedLabel = req.assignedLabel ?: req.cellRefId?.let { ref ->
            when (asset.assetType) {
                "korfarm" -> contentRepo.findById(ref).orElse(null)?.title
                "test" -> testPaperRepo.findById(ref).orElse(null)?.title
                else -> null
            }
        }
        cell.dueAt = parseDueAt(req.dueAt) ?: LocalDate.now().plusDays(7).atTime(23, 59)
        // 재배정 허용 — 이전이 completed/expired 였더라도 배정됨 상태로 리셋
        cell.status = "pending"
        cell.score = null
        cell.reviewedBy = null
        cell.reviewedAt = null
        cellRepo.save(cell)

        // korfarm 셀: 같은 ref_id 의 assignment 가 없으면 row 생성 (복수 배정 정책)
        if (asset.assetType == "korfarm" && !req.cellRefId.isNullOrBlank()) {
            val existing = cellAssignmentRepo.findByCellIdOrderBySortOrderAscCreatedAtAsc(cell.id)
            if (existing.none { it.refId == req.cellRefId }) {
                val nextOrder = existing.maxOfOrNull { it.sortOrder + 1 } ?: 0
                cellAssignmentRepo.save(StudyPlanCellAssignmentEntity(
                    id = IdGenerator.newId("spca"),
                    cellId = cell.id,
                    refId = req.cellRefId,
                    assignedLabel = req.assignedLabel,
                    status = "pending",
                    sortOrder = nextOrder
                ))
            }
        }
        createEvent(cell, "assigned")
        return cell
    }

    /**
     * 국어농장 셀에 콘텐츠 추가 배정 (복수 배정).
     * cell.cellRefId 는 첫 배정만 유지. 두 번째 이상은 assignment row 만.
     */
    /**
     * 통합 분석표 추천 학습 일괄 등록.
     *   1. 학생의 활성 plan 중 가장 최근 plan 자동 선택. 없으면 createDefaultPlanForStudent 로 신규 생성.
     *   2. 그 plan 의 korfarm asset 의 첫 번째 셀에 contentIds 를 cellAssignment 로 추가.
     *   3. cell.dueAt = parsed dueAt 또는 LocalDate.now().plusDays(7).atTime(23,59).
     *   4. 이미 같은 refId 가 등록되어 있으면 skip (BAD_REQUEST 던지지 않음).
     *
     * 권한 체크는 컨트롤러 책임. 여기서는 studentId 기준으로 일괄 처리만.
     */
    @Transactional
    fun bulkAssignFromRecommendations(
        studentId: String,
        contentIds: List<String>,
        dueAtRaw: String?,
        actorId: String
    ): BulkFromRecommendationsResponse {
        if (contentIds.isEmpty()) {
            throw ApiException("BAD_REQUEST", "추천 콘텐츠가 비어 있습니다", HttpStatus.BAD_REQUEST)
        }
        val due = parseDueAt(dueAtRaw) ?: LocalDate.now().plusDays(7).atTime(23, 59)

        // 활성 plan 자동 결정
        val planIds = targetRepo.findByTargetTypeAndTargetId("user", studentId).map { it.planId }.distinct()
        val activePlans = if (planIds.isEmpty()) emptyList() else
            planRepo.findAllById(planIds).filter { it.status == "active" }

        var planCreated = false
        val plan = activePlans.maxByOrNull { it.createdAt } ?: run {
            val membership = orgMembershipRepo.findByUserIdAndStatus(studentId, "active").firstOrNull()
                ?: throw ApiException(
                    "BAD_REQUEST",
                    "학생의 활성 기관 멤버십이 없어 학습 계획표를 자동 생성할 수 없습니다",
                    HttpStatus.BAD_REQUEST
                )
            planCreated = true
            createDefaultPlanForStudent(membership.orgId, studentId)
        }

        // korfarm asset + 첫 scope 의 cell 1개 확보
        val assets = assetRepo.findByPlanIdOrderBySortOrder(plan.id).filter { it.assetType == "korfarm" }
        if (assets.isEmpty()) {
            throw ApiException(
                "INTERNAL",
                "학습 계획표에 국어농장 자산이 없습니다. 강사에게 문의해 주세요.",
                HttpStatus.INTERNAL_SERVER_ERROR
            )
        }
        val asset = assets.first()
        val scopes = scopeRepo.findByPlanIdOrderBySortOrder(plan.id)
        val scope = scopes.firstOrNull()
            ?: throw ApiException(
                "INTERNAL",
                "학습 계획표에 범위가 없습니다.",
                HttpStatus.INTERNAL_SERVER_ERROR
            )
        val cells = cellRepo.findByPlanIdAndUserId(plan.id, studentId)
        val cell = cells.firstOrNull { it.scopeId == scope.id && it.assetId == asset.id }
            ?: createCell(plan.id, scope.id, asset, studentId)

        // 셀 dueAt / status 갱신
        cell.dueAt = due
        if (cell.status == "unassigned" || cell.status == "expired" || cell.status == "completed") {
            cell.status = "pending"
            cell.score = null
            cell.reviewedBy = null
            cell.reviewedAt = null
        }
        cellRepo.save(cell)

        // contentIds 일괄 등록 — 이미 있는 refId 는 skip
        val existing = cellAssignmentRepo.findByCellIdOrderBySortOrderAscCreatedAtAsc(cell.id)
        val existingRefs = existing.map { it.refId }.toSet()
        var nextOrder = (existing.maxOfOrNull { it.sortOrder } ?: -1) + 1
        var created = 0
        var skipped = 0

        contentIds.distinct().forEach { contentId ->
            if (contentId.isBlank()) {
                skipped += 1
                return@forEach
            }
            if (contentId in existingRefs) {
                skipped += 1
                return@forEach
            }
            val title = contentRepo.findById(contentId).orElse(null)?.title
            cellAssignmentRepo.save(StudyPlanCellAssignmentEntity(
                id = IdGenerator.newId("spca"),
                cellId = cell.id,
                refId = contentId,
                assignedLabel = title,
                status = "pending",
                sortOrder = nextOrder
            ))
            nextOrder += 1
            created += 1
        }

        // 첫 배정이면 cell.cellRefId / assignedLabel 도 갱신 (matrix 표시 호환)
        if (existing.isEmpty() && created > 0) {
            val firstNew = cellAssignmentRepo.findByCellIdOrderBySortOrderAscCreatedAtAsc(cell.id).firstOrNull()
            if (firstNew != null) {
                cell.cellRefId = firstNew.refId
                cell.assignedLabel = firstNew.assignedLabel ?: "AI 추천 학습"
                cellRepo.save(cell)
            }
        }

        if (created > 0) createEvent(cell, "assigned", "AI 추천 ${created}건 일괄 등록 (by $actorId)")

        return BulkFromRecommendationsResponse(
            planId = plan.id,
            cellId = cell.id,
            dueAt = due.toString(),
            createdAssignments = created,
            skippedAssignments = skipped,
            planCreated = planCreated
        )
    }

    /**
     * 학생 본인 plan 의 글쓰기 셀을 학생이 아직 쓰지 않은 토픽으로 채운다.
     *  - 학생 levelId 의 wisdom-topics JSON(/wisdom-topics/{levelId}.json) 로드
     *  - 학생이 (levelId, topicKey) 로 작성한 글 제외
     *  - 안 쓴 토픽 count 개를 글쓰기 셀의 cellAssignment 로 등록
     *  - refId = topicKey, assignedLabel = 토픽 라벨
     *  - cell.dueAt = +7일 23:59
     *
     * 권한: 호출자 == studentId 이거나 컨트롤러 측 검증된 admin/parent.
     */
    @Transactional
    fun fillWritingCellWithUnusedTopics(
        studentId: String,
        count: Int,
        actorId: String
    ): WritingFillResult {
        val capped = count.coerceIn(1, 12)
        val user = userRepo.findById(studentId).orElseThrow {
            ApiException("NOT_FOUND", "학생을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        val levelId = user.levelId
            ?: throw ApiException("BAD_REQUEST", "학생 레벨이 지정되어 있지 않습니다", HttpStatus.BAD_REQUEST)

        // 활성 plan 자동 결정 — bulkAssignFromRecommendations 와 동일한 로직
        val planIds = targetRepo.findByTargetTypeAndTargetId("user", studentId).map { it.planId }.distinct()
        val activePlans = if (planIds.isEmpty()) emptyList() else
            planRepo.findAllById(planIds).filter { it.status == "active" }
        var planCreated = false
        val plan = activePlans.maxByOrNull { it.createdAt } ?: run {
            val membership = orgMembershipRepo.findByUserIdAndStatus(studentId, "active").firstOrNull()
                ?: throw ApiException(
                    "BAD_REQUEST",
                    "학생의 활성 기관 멤버십이 없어 학습 계획표를 자동 생성할 수 없습니다",
                    HttpStatus.BAD_REQUEST
                )
            planCreated = true
            createDefaultPlanForStudent(membership.orgId, studentId)
        }

        val writingAsset = assetRepo.findByPlanIdOrderBySortOrder(plan.id).firstOrNull { it.assetType == "writing" }
            ?: throw ApiException("INTERNAL", "학습 계획표에 글쓰기 자산이 없습니다", HttpStatus.INTERNAL_SERVER_ERROR)
        val scope = scopeRepo.findByPlanIdOrderBySortOrder(plan.id).firstOrNull()
            ?: throw ApiException("INTERNAL", "학습 계획표에 범위가 없습니다", HttpStatus.INTERNAL_SERVER_ERROR)
        val cells = cellRepo.findByPlanIdAndUserId(plan.id, studentId)
        val cell = cells.firstOrNull { it.scopeId == scope.id && it.assetId == writingAsset.id }
            ?: createCell(plan.id, scope.id, writingAsset, studentId)

        // 토픽 풀 로드 — backend resources/wisdom-topics/{levelId}.json
        val resource = org.springframework.core.io.ClassPathResource("wisdom-topics/${levelId}.json")
        if (!resource.exists()) {
            throw ApiException("NOT_FOUND", "$levelId 레벨의 글쓰기 주제 풀이 없습니다", HttpStatus.NOT_FOUND)
        }
        val topics: List<Map<String, String>> = resource.inputStream.use { stream ->
            objectMapper.readValue(stream, object : TypeReference<List<Map<String, String>>>() {})
        }

        // 학생이 쓴 (level, topicKey) — 본인 levelId 만 필터
        val written = wisdomPostRepo.findByUserIdAndStatusOrderByCreatedAtDesc(studentId, "active")
            .filter { it.levelId == levelId }
            .map { it.topicKey }
            .toSet()

        val unused = topics.filter { (it["key"] ?: "") !in written && (it["key"] ?: "").isNotBlank() }
        if (unused.isEmpty()) {
            return WritingFillResult(
                planId = plan.id, cellId = cell.id, levelId = levelId,
                createdAssignments = 0, skippedAssignments = 0,
                totalTopics = topics.size, alreadyWrittenCount = written.size,
                planCreated = planCreated, message = "이미 모든 글쓰기 주제를 작성했어요!"
            )
        }

        val due = LocalDate.now().plusDays(7).atTime(23, 59)
        cell.dueAt = due
        if (cell.status == "unassigned" || cell.status == "expired" || cell.status == "completed") {
            cell.status = "pending"
            cell.score = null
            cell.reviewedBy = null
            cell.reviewedAt = null
        }
        cellRepo.save(cell)

        val existing = cellAssignmentRepo.findByCellIdOrderBySortOrderAscCreatedAtAsc(cell.id)
        val existingRefs = existing.map { it.refId }.toSet()
        var nextOrder = (existing.maxOfOrNull { it.sortOrder } ?: -1) + 1
        var created = 0
        var skipped = 0

        unused.take(capped).forEach { topic ->
            val key = topic["key"] ?: return@forEach
            val label = topic["label"] ?: key
            if (key in existingRefs) {
                skipped += 1
                return@forEach
            }
            cellAssignmentRepo.save(StudyPlanCellAssignmentEntity(
                id = IdGenerator.newId("spca"),
                cellId = cell.id,
                refId = key,
                assignedLabel = label,
                status = "pending",
                sortOrder = nextOrder
            ))
            nextOrder += 1
            created += 1
        }

        if (existing.isEmpty() && created > 0) {
            val firstNew = cellAssignmentRepo.findByCellIdOrderBySortOrderAscCreatedAtAsc(cell.id).firstOrNull()
            if (firstNew != null) {
                cell.cellRefId = firstNew.refId
                cell.assignedLabel = firstNew.assignedLabel ?: "글쓰기 주제"
                cellRepo.save(cell)
            }
        }

        if (created > 0) createEvent(cell, "assigned", "AI 글쓰기 추천 ${created}건 일괄 등록 (by $actorId)")

        return WritingFillResult(
            planId = plan.id, cellId = cell.id, levelId = levelId,
            createdAssignments = created, skippedAssignments = skipped,
            totalTopics = topics.size, alreadyWrittenCount = written.size,
            planCreated = planCreated, message = null
        )
    }

    data class WritingFillResult(
        val planId: String,
        val cellId: String,
        val levelId: String,
        val createdAssignments: Int,
        val skippedAssignments: Int,
        val totalTopics: Int,
        val alreadyWrittenCount: Int,
        val planCreated: Boolean,
        val message: String?
    )

    @Transactional
    fun addCellAssignment(cellId: String, refId: String, label: String?): StudyPlanCellAssignmentEntity {
        val cell = findCell(cellId)
        val asset = assetRepo.findById(cell.assetId).orElseThrow {
            ApiException("NOT_FOUND", "asset not found", HttpStatus.NOT_FOUND)
        }
        if (asset.assetType != "korfarm") {
            throw ApiException("BAD_REQUEST", "복수 배정은 국어농장 자산만 지원합니다", HttpStatus.BAD_REQUEST)
        }
        if (refId.isBlank()) throw ApiException("BAD_REQUEST", "콘텐츠 ID 가 비어 있습니다", HttpStatus.BAD_REQUEST)
        val existing = cellAssignmentRepo.findByCellIdOrderBySortOrderAscCreatedAtAsc(cell.id)
        if (existing.any { it.refId == refId }) {
            throw ApiException("BAD_REQUEST", "이미 배정된 콘텐츠입니다", HttpStatus.BAD_REQUEST)
        }
        val nextOrder = existing.maxOfOrNull { it.sortOrder + 1 } ?: 0
        val saved = cellAssignmentRepo.save(StudyPlanCellAssignmentEntity(
            id = IdGenerator.newId("spca"),
            cellId = cell.id,
            refId = refId,
            assignedLabel = label,
            status = "pending",
            sortOrder = nextOrder
        ))
        // 첫 배정이면 cell.cellRefId 도 설정 (호환)
        if (existing.isEmpty()) {
            cell.cellRefId = refId
            if (cell.assignedLabel.isNullOrBlank()) cell.assignedLabel = label
            if (cell.status == "unassigned") cell.status = "pending"
            cellRepo.save(cell)
        }
        return saved
    }

    @Transactional
    fun removeCellAssignment(cellId: String, assignmentId: String) {
        val a = cellAssignmentRepo.findById(assignmentId).orElseThrow {
            ApiException("NOT_FOUND", "assignment not found", HttpStatus.NOT_FOUND)
        }
        if (a.cellId != cellId) {
            throw ApiException("BAD_REQUEST", "assignment 가 셀에 속하지 않습니다", HttpStatus.BAD_REQUEST)
        }
        cellAssignmentRepo.deleteById(assignmentId)
        // 남은 assignment 가 0 이면 cell.cellRefId 비우고 unassigned 로
        val cell = findCell(cellId)
        val remaining = cellAssignmentRepo.findByCellIdOrderBySortOrderAscCreatedAtAsc(cellId)
        if (remaining.isEmpty()) {
            cell.cellRefId = null
            cell.status = "unassigned"
            cellRepo.save(cell)
        } else if (cell.cellRefId == a.refId) {
            // 삭제된 게 첫 배정이었으면 다음 row 의 ref 로 갱신
            cell.cellRefId = remaining.first().refId
            cellRepo.save(cell)
        }
    }

    /** "yyyy-MM-dd" 또는 ISO LocalDateTime 모두 받기 */
    private fun parseDueAt(s: String?): LocalDateTime? {
        if (s.isNullOrBlank()) return null
        return try {
            if (s.length == 10) LocalDate.parse(s).atTime(23, 59)
            else LocalDateTime.parse(s)
        } catch (e: Exception) {
            null
        }
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
            "writing" -> mapOf(
                "pending" to setOf("submitted"),
                "submitted" to setOf("reviewed", "partial"),
                "partial" to setOf("submitted"),
                "reviewed" to setOf("completed")
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

        // assignment row 들 일괄 조회
        val cellIds = korfarmCells.map { it.id }
        val assignmentsByCell = cellAssignmentRepo.findByCellIdIn(cellIds).groupBy { it.cellId }

        // 모든 ref_id 모아 학습 로그 일괄 조회 (cell.cellRefId fallback 포함)
        val refIds = (assignmentsByCell.values.flatten().map { it.refId } +
            korfarmCells.mapNotNull { it.cellRefId ?: assetMap[it.assetId]?.refId }).distinct()
        if (refIds.isEmpty()) return

        val logs = farmLearningLogRepo.findByUserIdAndContentIdIn(userId, refIds)
        val logMap = logs.groupBy { it.contentId }

        korfarmCells.forEach { cell ->
            val cellAssigns = assignmentsByCell[cell.id] ?: emptyList()

            // assignment 별 status 동기화
            cellAssigns.forEach { a ->
                val contentLogs = logMap[a.refId] ?: return@forEach
                val hasCompleted = contentLogs.any { it.status == "COMPLETED" }
                val hasStarted = contentLogs.isNotEmpty()
                val newStatus = when {
                    hasCompleted && a.status != "completed" -> "completed"
                    hasStarted && a.status == "pending" -> "in_progress"
                    else -> null
                }
                if (newStatus != null) {
                    a.status = newStatus
                    if (newStatus == "completed" && a.completedAt == null) {
                        a.completedAt = LocalDateTime.now()
                    }
                    cellAssignmentRepo.save(a)
                }
            }

            // cell 의 종합 status 계산
            val newCellStatus = when {
                cellAssigns.isEmpty() -> {
                    // assignment 가 없는 (옛 단일 배정만 있는) 셀은 기존 fallback 사용
                    val contentId = cell.cellRefId ?: assetMap[cell.assetId]?.refId
                    val cellLogs = contentId?.let { logMap[it] } ?: return@forEach
                    val hasCompleted = cellLogs.any { it.status == "COMPLETED" }
                    val hasStarted = cellLogs.isNotEmpty()
                    when {
                        hasCompleted && cell.status != "completed" -> "completed"
                        hasStarted && cell.status == "pending" -> "in_progress"
                        else -> null
                    }
                }
                cellAssigns.all { it.status == "completed" } -> "completed"
                cellAssigns.any { it.status == "completed" || it.status == "in_progress" } -> "in_progress"
                else -> null
            }

            if (newCellStatus != null && newCellStatus != cell.status) {
                cell.status = newCellStatus
                cellRepo.save(cell)
                createEvent(cell, newCellStatus)
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
            // 셀 단위 배정이 우선, asset.refId 는 옛 모델 fallback
            val testId = cell.cellRefId ?: assetMap[cell.assetId]?.refId ?: return@forEach
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

    /**
     * 모든 자산 종류는 셀 생성 시 'unassigned' (배정 전) 으로 시작.
     * 셀 클릭 → 배정 모달 → 자산 종류별 ref 또는 라벨 + 마감일 입력.
     */
    private fun initialCellStatus(asset: StudyPlanAssetEntity): String = "unassigned"

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

    // ── 기관 default 템플릿 → 학생용 복제 ──

    /**
     * 기관의 active 상태 default 템플릿(is_template=true) 들을 새 학생용으로 복제.
     * 학생이 기관에 가입(또는 활성화)될 때 호출됨.
     * 이미 복제 이력이 있는 템플릿은 skip — 중복 생성 방지.
     */
    @Transactional
    fun cloneTemplatesForStudent(orgId: String, userId: String): Int {
        val templates = planRepo.findByOrgIdAndIsTemplateAndStatus(orgId, true, "active")
        if (templates.isEmpty()) return 0

        var cloned = 0
        templates.forEach { template ->
            // 이미 이 학생용 복제본이 존재하면 skip
            val existingCopies = planRepo.findByTemplateOriginId(template.id)
            val alreadyHas = existingCopies.any { copy ->
                // copy.targets 에 user 가 있는지 확인
                targetRepo.findByPlanId(copy.id).any {
                    it.targetType == "user" && it.targetId == userId
                }
            }
            if (alreadyHas) return@forEach

            cloneTemplateInternal(template, listOf(userId))
            cloned += 1
        }
        return cloned
    }

    /**
     * 어드민 액션: 템플릿을 현재 active 학생들에게 일괄 반영.
     * 이미 복제본이 있는 학생은 skip, 새 학생만 복제.
     * 반환값: 새로 복제된 학생 수.
     */
    @Transactional
    fun applyTemplateToCurrentStudents(templateId: String): Int {
        val template = planRepo.findById(templateId).orElseThrow {
            ApiException("NOT_FOUND", "template not found", HttpStatus.NOT_FOUND)
        }
        if (!template.isTemplate) {
            throw ApiException("BAD_REQUEST", "템플릿이 아닙니다", HttpStatus.BAD_REQUEST)
        }

        // 기관의 active 학생 전부
        val activeStudents = orgMembershipRepo.findByOrgIdAndStatus(template.orgId, "active")
            .filter { it.role == "STUDENT" }
            .map { it.userId }
            .toSet()

        if (activeStudents.isEmpty()) return 0

        // 이미 이 템플릿으로 만들어진 복제본의 학생들
        val existingCopies = planRepo.findByTemplateOriginId(template.id)
        val alreadyClonedUsers = existingCopies.flatMap { copy ->
            targetRepo.findByPlanId(copy.id)
                .filter { it.targetType == "user" }
                .map { it.targetId }
        }.toSet()

        val newStudents = activeStudents - alreadyClonedUsers
        if (newStudents.isEmpty()) return 0

        cloneTemplateInternal(template, newStudents.toList())
        return newStudents.size
    }

    /**
     * 내부 헬퍼: 템플릿 → 새 학생용 plan 생성 (scopes/assets/cells 복사).
     * 학생들마다 별도의 plan 을 만드는 게 아니라, 한 plan 에 여러 학생을 target 으로 묶음.
     */
    private fun cloneTemplateInternal(template: StudyPlanEntity, userIds: List<String>) {
        if (userIds.isEmpty()) return

        // 1) 새 plan 생성
        val newPlan = StudyPlanEntity(
            id = IdGenerator.newId("sp"),
            orgId = template.orgId,
            title = template.title,
            description = template.description,
            examScope = template.examScope,
            startDate = template.startDate,
            endDate = template.endDate,
            status = "active",
            isTemplate = false,
            templateOriginId = template.id,
            createdBy = template.createdBy
        )
        planRepo.save(newPlan)

        // 2) targets 복사 (학생 user 들)
        userIds.forEach { uid ->
            targetRepo.save(StudyPlanTargetEntity(
                id = IdGenerator.newId("spt"),
                planId = newPlan.id,
                targetType = "user",
                targetId = uid
            ))
        }

        // 3) scopes 복사
        val srcScopes = scopeRepo.findByPlanIdOrderBySortOrder(template.id)
        val newScopes = srcScopes.map { s ->
            val ns = StudyPlanScopeEntity(
                id = IdGenerator.newId("sps"),
                planId = newPlan.id,
                label = s.label,
                sortOrder = s.sortOrder
            )
            scopeRepo.save(ns)
            ns
        }

        // 4) assets 복사
        val srcAssets = assetRepo.findByPlanIdOrderBySortOrder(template.id)
        val newAssets = srcAssets.map { a ->
            val na = StudyPlanAssetEntity(
                id = IdGenerator.newId("spa"),
                planId = newPlan.id,
                assetType = a.assetType,
                label = a.label,
                assetKind = a.assetKind,
                refId = a.refId,
                sortOrder = a.sortOrder,
                configJson = a.configJson
            )
            assetRepo.save(na)
            na
        }

        // 5) cells 자동 생성 (학생 × scope × asset)
        createCellsForUsers(newPlan.id, newScopes, newAssets, userIds.toSet())
    }

    // ── 학생 단위 default plan 백필 ──
    //
    // 새 모델: 학생 1명당 자체 default plan 1개를 가진다.
    // V0083 마이그레이션으로 기존 plan 이 모두 초기화된 후, 활성 학생 전원에게
    // default plan 을 일괄 생성하기 위한 진입점.
    //
    // 구현 정책: 학생에게 plan 이 0개일 때만 생성. 이미 plan(=target) 이 있으면 skip.
    // 실제 default plan 본문(scopes·assets·cells) 생성은 createDefaultPlanForStudent 가 책임진다.
    // ※ createDefaultPlanForStudent 의 정식 구현은 백엔드 다른 에이전트가 작업 중이며,
    //   현재 구현은 새 모델이 도착하기 전까지의 안전 stub.

    /**
     * 활성 학생 중 plan 이 0개인 자에게 default plan 을 일괄 생성한다.
     * @return 새로 default plan 이 만들어진 학생 수
     */
    @Transactional
    fun backfillDefaultPlansForActiveStudents(): BackfillResult {
        // 활성 상태 학생 + 활성 기관멤버십 전체 조회
        val activeMemberships = orgMembershipRepo.findByStatus("active")
            .filter { it.role == "STUDENT" }
        if (activeMemberships.isEmpty()) {
            return BackfillResult(scanned = 0, created = 0, skipped = 0)
        }

        var created = 0
        var skipped = 0
        activeMemberships.forEach { m ->
            // 이미 학생 user 로 잡힌 plan 이 1개라도 있으면 skip
            val existing = targetRepo.findByTargetTypeAndTargetId("user", m.userId)
            if (existing.isNotEmpty()) {
                skipped += 1
                return@forEach
            }
            try {
                createDefaultPlanForStudent(m.orgId, m.userId)
                created += 1
            } catch (e: Exception) {
                // 한 학생 실패가 전체를 막지 않도록 — 실패 건은 skip 으로 집계
                skipped += 1
            }
        }
        return BackfillResult(scanned = activeMemberships.size, created = created, skipped = skipped)
    }

    /** 학생이 plan(target=user) 1개라도 가지는지 — 호출처에서 자동 생성 여부 판단에 사용 */
    @Transactional(readOnly = true)
    fun hasAnyPlan(userId: String): Boolean {
        return targetRepo.findByTargetTypeAndTargetId("user", userId).isNotEmpty()
    }

    /**
     * 한 학생에게 default plan 1개를 생성한다.
     *
     * - 행: "기본" 1개
     * - 열: 국어농장(korfarm) · 테스트(test) · 글쓰기(writing) 3개
     * - 셀: 1 × 3 = 3개
     */
    @Transactional
    fun createDefaultPlanForStudent(orgId: String, userId: String): StudyPlanEntity {
        val user = userRepo.findById(userId).orElse(null)
        val studentName = user?.name ?: "학생"
        val today = LocalDate.now()
        val now = LocalDateTime.now()
        val plan = StudyPlanEntity(
            id = IdGenerator.newId("sp"),
            orgId = orgId,
            title = "${studentName}의 학습 계획표",
            description = null,
            examScope = null,
            startDate = today,
            endDate = today.plusDays(365),
            status = "active",
            isTemplate = false,
            templateOriginId = null,
            createdBy = "system",
            createdAt = now,
            updatedAt = now
        )
        planRepo.save(plan)

        // target = user
        targetRepo.save(
            StudyPlanTargetEntity(
                id = IdGenerator.newId("spt"),
                planId = plan.id,
                targetType = "user",
                targetId = userId,
                createdAt = now
            )
        )

        // scope: 기본
        val scope = StudyPlanScopeEntity(
            id = IdGenerator.newId("sps"),
            planId = plan.id,
            label = "기본",
            sortOrder = 0
        )
        scopeRepo.save(scope)

        // assets: 국어농장 / 테스트 / 글쓰기
        val korfarmAsset = StudyPlanAssetEntity(
            id = IdGenerator.newId("spa"),
            planId = plan.id,
            assetType = "korfarm",
            label = "국어농장",
            assetKind = "study",
            sortOrder = 0
        )
        val testAsset = StudyPlanAssetEntity(
            id = IdGenerator.newId("spa"),
            planId = plan.id,
            assetType = "test",
            label = "테스트",
            assetKind = "test",
            sortOrder = 1
        )
        val writingAsset = StudyPlanAssetEntity(
            id = IdGenerator.newId("spa"),
            planId = plan.id,
            assetType = "writing",
            label = "글쓰기",
            assetKind = "writing",
            sortOrder = 2
        )
        assetRepo.save(korfarmAsset)
        assetRepo.save(testAsset)
        assetRepo.save(writingAsset)

        // cells (1 scope × 3 assets)
        listOf(korfarmAsset, testAsset, writingAsset).forEach { asset ->
            createCell(plan.id, scope.id, asset, userId)
        }
        return plan
    }

    /**
     * 학생당 기본 plan 백필. AdminController 의 전용 endpoint 에서 사용.
     * - 모든 active 학생 멤버십을 본 뒤 plan 0개인 자에게 createDefaultPlanForStudent 호출.
     */
    @Transactional
    fun backfillDefaultPlansHQ(): BackfillDefaultPlanResponse {
        val allActive = orgMembershipRepo.findByStatus("active")
            .filter { it.role == "STUDENT" }
        var created = 0
        var alreadyHas = 0
        val seen = mutableSetOf<String>()
        allActive.forEach { m ->
            if (!seen.add(m.userId)) return@forEach
            val existing = targetRepo.findByTargetTypeAndTargetId("user", m.userId)
            if (existing.isNotEmpty()) {
                alreadyHas += 1
            } else {
                try {
                    createDefaultPlanForStudent(m.orgId, m.userId)
                    created += 1
                } catch (_: Exception) {
                    // 실패 건은 둘 다 카운트 X
                }
            }
        }
        return BackfillDefaultPlanResponse(created = created, alreadyHas = alreadyHas)
    }

    // ─────────────────────────────────────────────────────────────
    // Phase C: 행/열 일괄 적용 (충돌 감지)
    // ─────────────────────────────────────────────────────────────

    @Transactional
    fun propagateDelta(
        sourcePlanId: String,
        currentUserId: String,
        req: PropagateDeltaRequest
    ): PropagateDeltaResponse {
        val sourcePlan = findPlan(sourcePlanId)
        val sourceScopes = scopeRepo.findByPlanIdOrderBySortOrder(sourcePlanId)
            .filter { req.scopeIds.isNullOrEmpty() || it.id in req.scopeIds }
        val sourceAssets = assetRepo.findByPlanIdOrderBySortOrder(sourcePlanId)
            .filter { req.assetIds.isNullOrEmpty() || it.id in req.assetIds }

        if (sourceScopes.isEmpty() && sourceAssets.isEmpty()) {
            return PropagateDeltaResponse()
        }

        val scope = resolveAdminScope(currentUserId)
        val targetUserIds = resolveTargetUserIdsForPropagation(scope, req, sourcePlan)
        if (targetUserIds.isEmpty()) {
            return PropagateDeltaResponse()
        }

        // 학생당 plan 1개 가정 — 각 학생의 active non-template plan 을 찾음
        val userPlanMap = mutableMapOf<String, StudyPlanEntity>()
        targetUserIds.forEach { uid ->
            val planIds = targetRepo.findByTargetTypeAndTargetId("user", uid).map { it.planId }
            if (planIds.isEmpty()) return@forEach
            val candidates = planRepo.findAllById(planIds)
                .filter { !it.isTemplate && it.status == "active" }
                .sortedByDescending { it.createdAt }
            if (candidates.isNotEmpty()) {
                userPlanMap[uid] = candidates.first()
            }
        }

        // 충돌 감지
        val conflicts = mutableListOf<PropagateConflict>()
        val perUserConflictLabels = mutableMapOf<String, Pair<MutableSet<String>, MutableSet<String>>>()
        userPlanMap.forEach { (uid, plan) ->
            val existingScopeLabels = scopeRepo.findByPlanIdOrderBySortOrder(plan.id).map { it.label }.toSet()
            val existingAssetLabels = assetRepo.findByPlanIdOrderBySortOrder(plan.id).map { it.label }.toSet()
            val scopeConflicts = mutableSetOf<String>()
            val assetConflicts = mutableSetOf<String>()
            sourceScopes.forEach { s -> if (s.label in existingScopeLabels) scopeConflicts.add(s.label) }
            sourceAssets.forEach { a -> if (a.label in existingAssetLabels) assetConflicts.add(a.label) }
            if (scopeConflicts.isNotEmpty() || assetConflicts.isNotEmpty()) {
                perUserConflictLabels[uid] = scopeConflicts to assetConflicts
                val userName = userRepo.findById(uid).orElse(null)?.name
                scopeConflicts.forEach { conflicts.add(PropagateConflict(uid, userName, "scope", it)) }
                assetConflicts.forEach { conflicts.add(PropagateConflict(uid, userName, "asset", it)) }
            }
        }

        // policy 미지정 + 충돌 있음 → dry-run
        if (req.conflictPolicy == null && conflicts.isNotEmpty()) {
            return PropagateDeltaResponse(conflicts = conflicts, appliedCount = 0)
        }

        // 실제 적용
        var appliedCount = 0
        var skippedCount = 0
        var overwrittenCount = 0
        val results = mutableListOf<PropagateUserResult>()

        userPlanMap.forEach { (uid, plan) ->
            val (scopeConflictLabels, assetConflictLabels) = perUserConflictLabels[uid]
                ?: (emptySet<String>() to emptySet<String>())
            var applied = false

            val existingScopesByLabel = scopeRepo.findByPlanIdOrderBySortOrder(plan.id).associateBy { it.label }
            val existingAssetsByLabel = assetRepo.findByPlanIdOrderBySortOrder(plan.id).associateBy { it.label }

            sourceScopes.forEach { s ->
                if (s.label in scopeConflictLabels) {
                    when (req.conflictPolicy) {
                        "skip" -> skippedCount += 1
                        "overwrite" -> {
                            existingScopesByLabel[s.label]?.let { existing ->
                                existing.sortOrder = s.sortOrder
                                scopeRepo.save(existing)
                            }
                            overwrittenCount += 1
                            applied = true
                        }
                    }
                } else {
                    val newScope = StudyPlanScopeEntity(
                        id = IdGenerator.newId("sps"),
                        planId = plan.id,
                        label = s.label,
                        sortOrder = s.sortOrder
                    )
                    scopeRepo.save(newScope)
                    val planAssets = assetRepo.findByPlanIdOrderBySortOrder(plan.id)
                    planAssets.forEach { a ->
                        if (cellRepo.findByScopeIdAndAssetIdAndUserId(newScope.id, a.id, uid) == null) {
                            createCell(plan.id, newScope.id, a, uid)
                        }
                    }
                    appliedCount += 1
                    applied = true
                }
            }

            sourceAssets.forEach { a ->
                if (a.label in assetConflictLabels) {
                    when (req.conflictPolicy) {
                        "skip" -> skippedCount += 1
                        "overwrite" -> {
                            existingAssetsByLabel[a.label]?.let { existing ->
                                existing.refId = a.refId
                                existing.configJson = a.configJson
                                existing.sortOrder = a.sortOrder
                                existing.assetKind = a.assetKind
                                existing.assetType = a.assetType
                                assetRepo.save(existing)
                            }
                            overwrittenCount += 1
                            applied = true
                        }
                    }
                } else {
                    validateAssetType(a.assetType)
                    val newAsset = StudyPlanAssetEntity(
                        id = IdGenerator.newId("spa"),
                        planId = plan.id,
                        assetType = a.assetType,
                        label = a.label,
                        assetKind = a.assetKind,
                        refId = a.refId,
                        sortOrder = a.sortOrder,
                        configJson = a.configJson
                    )
                    assetRepo.save(newAsset)
                    val planScopes = scopeRepo.findByPlanIdOrderBySortOrder(plan.id)
                    planScopes.forEach { sc ->
                        if (cellRepo.findByScopeIdAndAssetIdAndUserId(sc.id, newAsset.id, uid) == null) {
                            createCell(plan.id, sc.id, newAsset, uid)
                        }
                    }
                    appliedCount += 1
                    applied = true
                }
            }

            results.add(PropagateUserResult(uid, applied))
        }

        return PropagateDeltaResponse(
            conflicts = if (req.conflictPolicy == null) conflicts else emptyList(),
            appliedCount = appliedCount,
            skippedCount = skippedCount,
            overwrittenCount = overwrittenCount,
            results = results
        )
    }

    private fun resolveTargetUserIdsForPropagation(
        scope: AdminScope,
        req: PropagateDeltaRequest,
        sourcePlan: StudyPlanEntity
    ): Set<String> {
        val candidate: Set<String> = when (req.targetScope) {
            "org" -> {
                val orgId = when (scope) {
                    is AdminScope.All -> sourcePlan.orgId
                    is AdminScope.Org -> scope.orgId
                }
                orgMembershipRepo.findByOrgIdAndStatus(orgId, "active")
                    .filter { it.role == "STUDENT" }
                    .map { it.userId }.toSet()
            }
            "class" -> {
                val cid = req.classId ?: return emptySet()
                classMembershipRepo.findByClassIdAndStatus(cid, "active").map { it.userId }.toSet()
            }
            "users" -> req.userIds?.toSet() ?: emptySet()
            else -> emptySet()
        }
        return when (scope) {
            is AdminScope.All -> candidate
            is AdminScope.Org -> {
                val orgUserIds = orgMembershipRepo.findByOrgIdAndStatus(scope.orgId, "active")
                    .filter { it.role == "STUDENT" }
                    .map { it.userId }.toSet()
                candidate.intersect(orgUserIds)
            }
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Phase D: 통합 리스트
    // ─────────────────────────────────────────────────────────────

    private fun listPlansInScope(scope: AdminScope): List<StudyPlanEntity> {
        return when (scope) {
            is AdminScope.All -> planRepo.findAll()
            is AdminScope.Org -> planRepo.findByOrgIdOrderByCreatedAtDesc(scope.orgId)
        }
    }

    /** 1) 제출물 통합 */
    @Transactional(readOnly = true)
    fun adminListSubmissions(
        currentUserId: String,
        assetType: String?,
        status: String?,
        classId: String?,
        userIdFilter: String?,
        sortBy: String,
        sortDir: String,
        page: Int,
        limit: Int
    ): AdminSubmissionListResponse {
        val scope = resolveAdminScope(currentUserId)
        val plans = listPlansInScope(scope)
        val planMap = plans.associateBy { it.id }
        if (planMap.isEmpty()) return AdminSubmissionListResponse(emptyList(), 0, page, limit, false)

        val classUserIds: Set<String>? = classId?.let {
            classMembershipRepo.findByClassIdAndStatus(it, "active").map { m -> m.userId }.toSet()
        }

        val allCells = plans.flatMap { cellRepo.findByPlanId(it.id) }
            .filter {
                it.submissionCount > 0 ||
                it.status in listOf("submitted", "partial", "completed", "scored", "passed")
            }
            .filter { c -> userIdFilter == null || c.userId == userIdFilter }
            .filter { c -> classUserIds == null || c.userId in classUserIds }
            .filter { c -> status == null || c.status == status }

        val scopeMap = scopeRepo.findAll().associateBy { it.id }
        val assetMap = assetRepo.findAll().associateBy { it.id }
        val filteredByAsset = if (assetType != null) {
            allCells.filter { assetMap[it.assetId]?.assetType == assetType }
        } else allCells

        val userIds = filteredByAsset.map { it.userId }.toSet()
        val userMap = if (userIds.isNotEmpty()) userRepo.findAllById(userIds).associateBy { it.id } else emptyMap()

        val userClassMap = mutableMapOf<String, ClassEntity>()
        userIds.forEach { uid ->
            val firstClassId = classMembershipRepo.findByUserIdAndStatus(uid, "active").firstOrNull()?.classId
            if (firstClassId != null) {
                classRepo.findById(firstClassId).ifPresent { userClassMap[uid] = it }
            }
        }

        val sorted = filteredByAsset.sortedWith(
            when (sortBy) {
                "score" -> compareBy<StudyPlanCellEntity> { it.score ?: -1 }
                "status" -> compareBy { it.status }
                else -> compareBy { it.updatedAt }
            }
        ).let { if (sortDir == "asc") it else it.reversed() }

        val total = sorted.size
        val from = ((page - 1).coerceAtLeast(0)) * limit
        val to = (from + limit).coerceAtMost(total)
        val paged = if (from < total) sorted.subList(from, to) else emptyList()

        val items = paged.map { cell ->
            val sc = scopeMap[cell.scopeId]
            val ast = assetMap[cell.assetId]
            val u = userMap[cell.userId]
            val cls = userClassMap[cell.userId]
            AdminSubmissionItem(
                cellId = cell.id,
                planId = cell.planId,
                planTitle = planMap[cell.planId]?.title ?: "",
                scopeId = cell.scopeId,
                scopeLabel = sc?.label ?: "",
                assetId = cell.assetId,
                assetLabel = ast?.label ?: "",
                assetType = ast?.assetType ?: "",
                userId = cell.userId,
                userName = u?.name ?: cell.userId,
                classId = cls?.id,
                className = cls?.name,
                status = cell.status,
                submissionCount = cell.submissionCount,
                score = cell.score,
                reviewedBy = cell.reviewedBy,
                reviewedAt = cell.reviewedAt?.toString(),
                updatedAt = cell.updatedAt.toString(),
                adminNote = cell.adminNote
            )
        }

        return AdminSubmissionListResponse(
            items = items,
            total = total,
            page = page,
            limit = limit,
            hasMore = to < total
        )
    }

    /** 2) 글쓰기 통합 */
    @Transactional(readOnly = true)
    fun adminListIntegratedWisdom(
        currentUserId: String,
        levelId: String?,
        classId: String?,
        userIdFilter: String?,
        hasPlanCell: Boolean?,
        hasFeedback: Boolean?,
        sortBy: String,
        sortDir: String,
        page: Int,
        limit: Int
    ): AdminIntegratedWisdomResponse {
        val scope = resolveAdminScope(currentUserId)

        val scopedUserIds: Set<String>? = when (scope) {
            is AdminScope.All -> null
            is AdminScope.Org -> orgMembershipRepo.findByOrgIdAndStatus(scope.orgId, "active")
                .map { it.userId }.toSet()
        }

        val classUserIds: Set<String>? = classId?.let {
            classMembershipRepo.findByClassIdAndStatus(it, "active").map { m -> m.userId }.toSet()
        }

        val all = wisdomPostRepo.findAll()
            .filter { p ->
                (scopedUserIds == null || p.userId in scopedUserIds) &&
                (levelId == null || p.levelId == levelId) &&
                (userIdFilter == null || p.userId == userIdFilter) &&
                (classUserIds == null || p.userId in classUserIds)
            }
            .filter { hasPlanCell == null || (it.planCellId != null) == hasPlanCell }

        val postIds = all.map { it.id }
        val feedbackByPostId = if (postIds.isNotEmpty()) {
            wisdomFeedbackRepo.findByPostIdIn(postIds).associateBy { it.postId }
        } else emptyMap()

        val filteredByFeedback = if (hasFeedback != null) {
            all.filter { (it.id in feedbackByPostId) == hasFeedback }
        } else all

        val sorted = filteredByFeedback.sortedWith(compareBy<WisdomPostEntity> { it.createdAt })
            .let { if (sortDir == "asc") it else it.reversed() }

        val total = sorted.size
        val from = ((page - 1).coerceAtLeast(0)) * limit
        val to = (from + limit).coerceAtMost(total)
        val paged = if (from < total) sorted.subList(from, to) else emptyList()

        val pagedUserIds = paged.map { it.userId }.toSet()
        val userMap = if (pagedUserIds.isNotEmpty()) userRepo.findAllById(pagedUserIds).associateBy { it.id } else emptyMap()
        val userClassMap = mutableMapOf<String, ClassEntity>()
        pagedUserIds.forEach { uid ->
            val firstClassId = classMembershipRepo.findByUserIdAndStatus(uid, "active").firstOrNull()?.classId
            if (firstClassId != null) {
                classRepo.findById(firstClassId).ifPresent { userClassMap[uid] = it }
            }
        }

        val planCellIds = paged.mapNotNull { it.planCellId }.toSet()
        val cellById = if (planCellIds.isNotEmpty()) {
            cellRepo.findAllById(planCellIds).associateBy { it.id }
        } else emptyMap()
        val planIdsForCells = cellById.values.map { it.planId }.toSet()
        val planByIdLocal = if (planIdsForCells.isNotEmpty()) {
            planRepo.findAllById(planIdsForCells).associateBy { it.id }
        } else emptyMap()

        val items = paged.map { post ->
            val u = userMap[post.userId]
            val cls = userClassMap[post.userId]
            val fb = feedbackByPostId[post.id]
            val planTitle: String? = post.planCellId?.let { cellById[it]?.planId }?.let { planByIdLocal[it]?.title }
            AdminIntegratedWisdomItem(
                postId = post.id,
                levelId = post.levelId,
                topicKey = post.topicKey,
                topicLabel = post.topicLabel,
                userId = post.userId,
                userName = u?.name ?: post.userId,
                classId = cls?.id,
                className = cls?.name,
                submissionType = post.submissionType,
                status = post.status,
                planCellId = post.planCellId,
                planTitle = planTitle,
                hasFeedback = fb != null,
                feedbackBy = fb?.reviewerId,
                feedbackAt = fb?.createdAt?.toString(),
                createdAt = post.createdAt.toString()
            )
        }
        return AdminIntegratedWisdomResponse(items, total, page, limit, to < total)
    }

    /** 3) 테스트 통합 */
    @Transactional(readOnly = true)
    fun adminListTestAssets(
        currentUserId: String,
        from: String?,
        to: String?,
        classId: String?,
        page: Int,
        limit: Int
    ): AdminTestAssetListResponse {
        val scope = resolveAdminScope(currentUserId)
        val plans = listPlansInScope(scope)
        if (plans.isEmpty()) return AdminTestAssetListResponse(emptyList(), 0, page, limit, false)
        val planMap = plans.associateBy { it.id }

        val classUserIds: Set<String>? = classId?.let {
            classMembershipRepo.findByClassIdAndStatus(it, "active").map { m -> m.userId }.toSet()
        }

        val testAssets = plans.flatMap { p ->
            assetRepo.findByPlanIdOrderBySortOrder(p.id).filter { it.assetType == "test" }
        }

        val testIds = testAssets.mapNotNull { it.refId }.toSet()
        val paperMap: Map<String, TestPaperEntity> = if (testIds.isNotEmpty()) {
            testPaperRepo.findAllById(testIds).associateBy { it.id }
        } else emptyMap()

        val items = testAssets.map { asset ->
            val cells = cellRepo.findByAssetId(asset.id)
                .filter { classUserIds == null || it.userId in classUserIds }
            val total = cells.size
            val completed = cells.count { it.status in listOf("completed", "scored", "passed") }
            val pending = cells.count { it.status in listOf("pending", "retry") }
            val avg = cells.mapNotNull { it.score }.let { if (it.isEmpty()) null else it.average() }
            val paper = asset.refId?.let { paperMap[it] }
            AdminTestAssetItem(
                assetId = asset.id,
                planId = asset.planId,
                planTitle = planMap[asset.planId]?.title ?: "",
                testTitle = paper?.title ?: asset.label,
                testId = asset.refId,
                dueAt = paper?.examDate?.toString(),
                totalAssigned = total,
                completed = completed,
                pending = pending,
                avgScore = avg
            )
        }

        val filtered = items.filter { item ->
            val d = item.dueAt
            (from == null || (d != null && d >= from)) && (to == null || (d != null && d <= to))
        }

        val totalCount = filtered.size
        val fromIdx = ((page - 1).coerceAtLeast(0)) * limit
        val toIdx = (fromIdx + limit).coerceAtMost(totalCount)
        val paged = if (fromIdx < totalCount) filtered.subList(fromIdx, toIdx) else emptyList()

        return AdminTestAssetListResponse(paged, totalCount, page, limit, toIdx < totalCount)
    }

    /** 3-drilldown */
    @Transactional(readOnly = true)
    fun adminGetTestAssetStudents(
        currentUserId: String,
        assetId: String
    ): AdminTestAssetStudentListResponse {
        val asset = assetRepo.findById(assetId).orElseThrow {
            ApiException("NOT_FOUND", "asset not found", HttpStatus.NOT_FOUND)
        }
        val plan = findPlan(asset.planId)
        val scope = resolveAdminScope(currentUserId)
        if (scope is AdminScope.Org && scope.orgId != plan.orgId) {
            throw ApiException("FORBIDDEN", "권한이 없습니다", HttpStatus.FORBIDDEN)
        }

        val cells = cellRepo.findByAssetId(assetId)
        val userIds = cells.map { it.userId }.toSet()
        val userMap = if (userIds.isNotEmpty()) userRepo.findAllById(userIds).associateBy { it.id } else emptyMap()
        val userClassMap = mutableMapOf<String, ClassEntity>()
        userIds.forEach { uid ->
            val firstClassId = classMembershipRepo.findByUserIdAndStatus(uid, "active").firstOrNull()?.classId
            if (firstClassId != null) {
                classRepo.findById(firstClassId).ifPresent { userClassMap[uid] = it }
            }
        }

        val testId = asset.refId
        val submissionByUser: Map<String, TestSubmissionEntity> = if (testId != null) {
            cells.mapNotNull { c ->
                testSubmissionRepo.findByTestIdAndUserId(testId, c.userId)?.let { c.userId to it }
            }.toMap()
        } else emptyMap()

        return AdminTestAssetStudentListResponse(
            students = cells.map { cell ->
                AdminTestAssetStudent(
                    userId = cell.userId,
                    userName = userMap[cell.userId]?.name,
                    className = userClassMap[cell.userId]?.name,
                    status = cell.status,
                    score = cell.score,
                    attemptedAt = submissionByUser[cell.userId]?.createdAt?.toString()
                )
            }
        )
    }

    /** 4) 통합 캘린더 */
    @Transactional(readOnly = true)
    fun adminGetCalendar(
        currentUserId: String,
        from: String,
        to: String,
        classId: String?
    ): AdminCalendarResponse {
        val scope = resolveAdminScope(currentUserId)
        val plans = listPlansInScope(scope)
        val planIds = plans.map { it.id }.toSet()
        if (planIds.isEmpty()) return AdminCalendarResponse(emptyList())

        val fromDate = LocalDate.parse(from)
        val toDate = LocalDate.parse(to)

        val classUserIds: Set<String>? = classId?.let {
            classMembershipRepo.findByClassIdAndStatus(it, "active").map { m -> m.userId }.toSet()
        }

        // 권한 범위 셀 모두 — 배정된 (status != unassigned) + dueAt 있음
        val allCells = cellRepo.findAll().filter { c ->
            c.planId in planIds &&
                c.status != "unassigned" &&
                c.dueAt != null &&
                (classUserIds == null || c.userId in classUserIds)
        }
        val assetMap = if (allCells.isNotEmpty()) {
            assetRepo.findAllById(allCells.map { it.assetId }.toSet()).associateBy { it.id }
        } else emptyMap()

        val DONE = setOf("completed", "scored", "passed", "reviewed")
        val PENDING = setOf("pending", "in_progress", "retry")

        // 매일 active 매트릭싱: assigned ~ dueAt 범위에 cell 추가
        // assignedAt 정보가 없으니 dueAt - 7d 윈도우 기본 (재배정 후엔 cell.updatedAt 기준이 더 정확)
        data class CellOnDate(val cell: StudyPlanCellEntity, val assetId: String, val assetLabel: String)
        val dayCells = mutableMapOf<String, MutableList<CellOnDate>>()

        allCells.forEach { c ->
            val due = c.dueAt!!.toLocalDate()
            val updated = c.updatedAt.toLocalDate()
            val windowStart = if (updated.isBefore(due)) updated else due.minusDays(7)
            val rangeStart = if (windowStart.isBefore(fromDate)) fromDate else windowStart
            val rangeEnd = if (due.isAfter(toDate)) toDate else due
            if (rangeEnd.isBefore(rangeStart)) return@forEach
            val asset = assetMap[c.assetId]
            val label = c.assignedLabel ?: asset?.label ?: "액션"
            var t = rangeStart
            while (!t.isAfter(rangeEnd)) {
                dayCells.getOrPut(t.toString()) { mutableListOf() }.add(
                    CellOnDate(c, c.assetId, label)
                )
                t = t.plusDays(1)
            }
        }

        // 매트릭싱 → AdminCalendarItem (자산 단위 그룹)
        val days = dayCells.entries.sortedBy { it.key }.map { (date, list) ->
            val grouped = list.groupBy { it.assetId }
            val items = grouped.map { (assetId, sublist) ->
                val cells = sublist.map { it.cell }
                val total = cells.size
                val completed = cells.count { it.status in DONE }
                val pending = cells.count { it.status in PENDING || it.status == "submitted" }
                val asset = assetMap[assetId]
                AdminCalendarItem(
                    type = "asset",
                    refId = assetId,
                    label = sublist.first().assetLabel,
                    totalAssigned = total,
                    pending = pending,
                    completed = completed,
                    assetType = asset?.assetType
                )
            }
            AdminCalendarDay(date = date, count = items.sumOf { it.totalAssigned }, items = items)
        }
        return AdminCalendarResponse(days)
    }

    /** 4-drilldown — adminGetCalendar 와 같은 active 매트릭싱 정책 적용 */
    @Transactional(readOnly = true)
    fun adminGetCalendarDate(
        currentUserId: String,
        date: String
    ): AdminCalendarDateDetailResponse {
        val scope = resolveAdminScope(currentUserId)
        val plans = listPlansInScope(scope)
        val planIds = plans.map { it.id }.toSet()
        if (planIds.isEmpty()) return AdminCalendarDateDetailResponse(emptyList())

        val target = LocalDate.parse(date)

        // 그 날 active 한 cells (배정~마감 사이) — adminGetCalendar 와 동일한 정책
        val activeCells = cellRepo.findAll().filter { c ->
            if (c.planId !in planIds) return@filter false
            if (c.status == "unassigned") return@filter false
            val due = c.dueAt?.toLocalDate() ?: return@filter false
            val updated = c.updatedAt.toLocalDate()
            val windowStart = if (updated.isBefore(due)) updated else due.minusDays(7)
            !target.isBefore(windowStart) && !target.isAfter(due)
        }
        if (activeCells.isEmpty()) return AdminCalendarDateDetailResponse(emptyList())

        val assetMap = assetRepo.findAllById(activeCells.map { it.assetId }.toSet()).associateBy { it.id }
        val userIds = activeCells.map { it.userId }.toSet()
        val userMap = if (userIds.isNotEmpty()) userRepo.findAllById(userIds).associateBy { it.id } else emptyMap()

        // 학생별 수강반 매핑
        val classMap = mutableMapOf<String, String>()
        userIds.forEach { uid ->
            val classNames = classMembershipRepo.findByUserIdAndStatus(uid, "active")
                .mapNotNull { classRepo.findById(it.classId).orElse(null)?.name }
            if (classNames.isNotEmpty()) classMap[uid] = classNames.joinToString(", ")
        }

        val now = java.time.LocalDateTime.now()
        val DONE = setOf("completed", "scored", "passed", "reviewed")

        // 자산 단위 그룹 — 같은 학생이 자산 1개에 여러 cell(여러 행) 있으면 가장 진행된 cell 1개만 노출
        val statusPriority = mapOf(
            "completed" to 5, "passed" to 5, "reviewed" to 5,
            "scored" to 4, "submitted" to 4, "in_progress" to 3,
            "retry" to 3, "partial" to 3,
            "pending" to 2, "unassigned" to 1
        )
        val grouped = activeCells.groupBy { it.assetId }
        val actions = grouped.mapNotNull { (assetId, cells) ->
            val asset = assetMap[assetId] ?: return@mapNotNull null
            val firstCell = cells.first()
            // 같은 (userId, assetId) 의 cells 가 여러 개면 가장 진행된 것 1개만
            val byUser = cells.groupBy { it.userId }
            val pickedCells = byUser.values.map { list ->
                list.maxByOrNull { statusPriority[it.status] ?: 0 } ?: list.first()
            }
            AdminCalendarAction(
                assetId = asset.id,
                label = firstCell.assignedLabel ?: asset.label,
                assetType = asset.assetType,
                dueAt = firstCell.dueAt?.toString(),
                totalAssigned = pickedCells.size,
                students = pickedCells.map { cell ->
                    val due = cell.dueAt
                    val isOverdue = due != null && due.isBefore(now) && cell.status !in DONE
                    AdminCalendarActionStudent(
                        userId = cell.userId,
                        userName = userMap[cell.userId]?.name,
                        className = classMap[cell.userId],
                        status = cell.status,
                        isOverdue = isOverdue,
                        cellId = cell.id,
                        cellRefId = cell.cellRefId,
                        score = cell.score,
                        submissionCount = cell.submissionCount
                    )
                }.sortedBy { it.userName ?: it.userId }
            )
        }
        return AdminCalendarDateDetailResponse(actions)
    }

    // ─────────────────────────────────────────────────────────────
    // 권한 헬퍼
    // ─────────────────────────────────────────────────────────────

    private fun resolveAdminScope(userId: String): AdminScope {
        if (SecurityUtils.hasAnyRole("HQ_ADMIN")) return AdminScope.All
        val orgId = orgMembershipRepo.findByUserIdAndStatus(userId, "active").firstOrNull()?.orgId
            ?: throw ApiException("FORBIDDEN", "기관 정보 없음", HttpStatus.FORBIDDEN)
        return AdminScope.Org(orgId)
    }
}

sealed class AdminScope {
    object All : AdminScope()
    data class Org(val orgId: String) : AdminScope()
}

/** 백필 결과 요약 */
data class BackfillResult(
    val scanned: Int,
    val created: Int,
    val skipped: Int
)
