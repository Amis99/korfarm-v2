package com.korfarm.api.corpus

import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.security.SecurityUtils
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

/**
 * 학습 자료 DB v2 — 작품·지문·체크리스트·구절해석·출제포인트 마스터.
 *
 * - 작품·지문 corpus CRUD
 * - 누적 항목(체크리스트·출제포인트·구절해석 등) CRUD
 * - 임시 풀(pending_checkpoints) 조회·AI 분류·승인·거부
 *
 * 모든 엔드포인트 HQ_ADMIN 전용.
 */
@RestController
@RequestMapping("/v1/admin/learning-corpus")
class AdminLearningCorpusController(
    private val corpusService: LearningCorpusService,
    private val pendingService: PendingCheckpointService,
    private val importService: LearningCorpusImportService,
) {
    // ── Legacy JSON → DB import (1회성) ────────────────────────────────────

    /**
     * `./data/learning-data` 폴더의 기존 JSON 파일들을 learning_corpus + learning_corpus_items 로 일괄 이관.
     * dryRun=true 면 파일만 스캔하고 DB 변경 없이 통계만 반환.
     */
    @PostMapping("/import")
    fun importLegacy(
        @RequestParam(defaultValue = "false") dryRun: Boolean,
    ): ApiResponse<LearningCorpusImportService.ImportResult> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val importedBy = SecurityUtils.currentUserId() ?: "system"
        return ApiResponse(success = true, data = importService.importAll(importedBy, dryRun))
    }

    // ── 작품·지문 corpus ────────────────────────────────────

    @PostMapping
    fun create(@RequestBody req: CorpusCreateRequest): ApiResponse<CorpusView> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val createdBy = SecurityUtils.currentUserId() ?: "system"
        val ent = corpusService.createCorpus(req, createdBy)
        return ApiResponse(success = true, data = ent.toViewMap())
    }

    @PutMapping("/{id}")
    fun update(@PathVariable id: String, @RequestBody req: CorpusUpdateRequest): ApiResponse<CorpusView> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val updatedBy = SecurityUtils.currentUserId() ?: "system"
        val ent = corpusService.updateCorpus(id, req, updatedBy)
        return ApiResponse(success = true, data = ent.toViewMap())
    }

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: String): ApiResponse<Map<String, Boolean>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        corpusService.deleteCorpus(id)
        return ApiResponse(success = true, data = mapOf("deleted" to true))
    }

    @GetMapping("/{id}")
    fun get(@PathVariable id: String): ApiResponse<CorpusDetailView> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(success = true, data = corpusService.getCorpus(id))
    }

    @GetMapping("/search")
    fun search(
        @RequestParam(required = false) area: String?,
        @RequestParam(required = false) subArea: String?,
        @RequestParam(required = false) genre: String?,
        @RequestParam(required = false) era: String?,
        @RequestParam(required = false) field: String?,
        @RequestParam(required = false) keyword: String?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
    ): ApiResponse<List<CorpusView>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(success = true,
            data = corpusService.search(area, subArea, genre, era, field, keyword, page, size))
    }

    // ── 누적 항목 (items) ────────────────────────────────────

    @PostMapping("/{corpusId}/items")
    fun addItem(@PathVariable corpusId: String, @RequestBody req: ItemAddRequest): ApiResponse<ItemView> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val createdBy = SecurityUtils.currentUserId() ?: "system"
        val ent = corpusService.addItem(corpusId, req, createdBy)
        return ApiResponse(success = true, data = ent.toItemViewMap())
    }

    @PutMapping("/items/{itemId}")
    fun updateItem(@PathVariable itemId: String, @RequestBody req: ItemUpdateRequest): ApiResponse<ItemView> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val ent = corpusService.updateItem(itemId, req)
        return ApiResponse(success = true, data = ent.toItemViewMap())
    }

    @DeleteMapping("/items/{itemId}")
    fun deleteItem(@PathVariable itemId: String): ApiResponse<Map<String, Boolean>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        corpusService.deleteItem(itemId)
        return ApiResponse(success = true, data = mapOf("deleted" to true))
    }

    // ── 임시 체크포인트 풀 (pending_checkpoints) ────────────────────────────────────

    @GetMapping("/pending")
    fun listPending(@RequestParam(defaultValue = "pending") status: String): ApiResponse<List<PendingCheckpointView>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(success = true, data = pendingService.listByStatus(status))
    }

    /** 임시 체크리스트 풀 — sourceContentId 별 그룹(제목 단위 파일) 으로 묶어 반환 */
    @GetMapping("/pending/grouped")
    fun listPendingGrouped(@RequestParam(defaultValue = "pending") status: String): ApiResponse<List<PendingGroupView>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(success = true, data = pendingService.listGroupedByStatus(status))
    }

    @GetMapping("/pending/stats")
    fun pendingStats(): ApiResponse<PendingStatsView> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(success = true, data = pendingService.stats())
    }

    /**
     * 내용 숙지 학습(study_contents)의 체크리스트를 임시 풀로 추출.
     * - sourceContentId 단건 호출. 본사 관리자가 명시적으로 트리거.
     * - 동일 텍스트는 skip.
     */
    @PostMapping("/pending/extract")
    fun extractFromStudy(
        @RequestParam sourceContentId: String,
        @RequestParam(required = false) sourceUserId: String?,
        @RequestParam(required = false) sourceOrgId: String?,
    ): ApiResponse<ExtractResult> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(success = true,
            data = pendingService.extractFromStudyContent(sourceContentId, sourceUserId, sourceOrgId))
    }

    /** 모든 active study_contents 의 체크리스트를 임시 풀로 일괄 backfill. 1회성 운영 도구. */
    @PostMapping("/pending/bulk-extract")
    fun bulkExtractAll(): ApiResponse<BulkExtractResult> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(success = true, data = pendingService.bulkExtractFromAllStudyContents())
    }

    /** 단일 pending 항목 AI 분류 */
    @PostMapping("/pending/{pendingId}/classify")
    fun classifyOne(@PathVariable pendingId: String): ApiResponse<PendingCheckpointView> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val ent = pendingService.classifyOne(pendingId)
        return ApiResponse(success = true, data = ent.toViewMap())
    }

    /** pending 전체 일괄 AI 분류 */
    @PostMapping("/pending/classify-all")
    fun classifyAll(): ApiResponse<ClassifyBatchResult> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(success = true, data = pendingService.classifyAllPending())
    }

    /** pending 항목 승인 — corpus_items 로 이동 */
    @PostMapping("/pending/{pendingId}/approve")
    fun approve(
        @PathVariable pendingId: String,
        @RequestBody req: PendingApproveRequest,
    ): ApiResponse<ApprovalResult> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val approvedBy = SecurityUtils.currentUserId() ?: "system"
        return ApiResponse(success = true,
            data = pendingService.approve(pendingId, req.corpusId, req.itemType, approvedBy))
    }

    /** 한 sourceContentId 의 모든 pending 항목을 한 corpus 로 일괄 승인(머지). 그룹 단위 액션. */
    @PostMapping("/pending/bulk-approve")
    fun bulkApprove(@RequestBody req: BulkApproveRequest): ApiResponse<BulkApproveResult> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val approvedBy = SecurityUtils.currentUserId() ?: "system"
        return ApiResponse(success = true,
            data = pendingService.bulkApproveByContent(req.sourceContentId, req.corpusId, req.itemType, approvedBy))
    }

    @PostMapping("/pending/{pendingId}/reject")
    fun reject(@PathVariable pendingId: String): ApiResponse<PendingCheckpointView> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val approvedBy = SecurityUtils.currentUserId() ?: "system"
        val ent = pendingService.reject(pendingId, approvedBy)
        return ApiResponse(success = true, data = ent.toViewMap())
    }
}

data class PendingApproveRequest(
    val corpusId: String,
    val itemType: String,
)

data class BulkApproveRequest(
    val sourceContentId: String,
    val corpusId: String,
    val itemType: String,
)

// ── Entity → View 헬퍼 ────────────────────────────────────

private fun LearningCorpusEntity.toViewMap(): CorpusView = CorpusView(
    id = id, area = area, subArea = subArea, title = title, source = source,
    author = author, era = era, genre = genre, topic = topic, field = field,
    bodyMd = bodyMd,
    meta = null, classificationCodes = null,  // detail 조회 시 별도 파싱
    levelMin = levelMin, levelMax = levelMax,
    status = status,
    createdAt = createdAt.toString(), updatedAt = updatedAt.toString(),
    createdBy = createdBy,
)

private fun LearningCorpusItemEntity.toItemViewMap(): ItemView = ItemView(
    id = id, corpusId = corpusId, itemType = itemType, textMd = textMd,
    passageRangeStart = passageRangeStart, passageRangeEnd = passageRangeEnd,
    meta = null,
    sourceType = sourceType, sourceContentId = sourceContentId,
    status = status,
    createdAt = createdAt.toString(), updatedAt = updatedAt.toString(),
    createdBy = createdBy,
)

private fun PendingCheckpointEntity.toViewMap(): PendingCheckpointView = PendingCheckpointView(
    id = id,
    sourceContentId = sourceContentId,
    sourceUserId = sourceUserId,
    sourceOrgId = sourceOrgId,
    textMd = textMd,
    contextMd = contextMd,
    suggestedCorpusId = suggestedCorpusId,
    suggestedItemType = suggestedItemType,
    aiConfidence = aiConfidence,
    aiReason = aiReason,
    status = status,
    approvedAt = approvedAt?.toString(),
    approvedBy = approvedBy,
    approvedCorpusId = approvedCorpusId,
    approvedItemId = approvedItemId,
    createdAt = createdAt.toString(),
)
