package com.korfarm.api.corpus

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.aigen.AiCallHelper
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.study.StudyPageRepository
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

/**
 * AI 분류 대기 체크리스트 풀 서비스.
 *
 * 흐름:
 *  1. 본사·기관·개인이 내용 숙지 학습(study_contents)에서 체크리스트 작성
 *     → extractFromStudyContent() 자동 hook 으로 pending_checkpoints 에 INSERT
 *  2. 본사 관리자가 "AI 분류" 버튼 클릭
 *     → classifyOne() / classifyAllPending() 호출
 *     → Claude 가 corpus_id 후보 + item_type 추천 (suggested_*, ai_confidence, ai_reason)
 *     → status: pending → classified
 *  3. 본사 관리자가 검토 후 "승인" 또는 "거부"
 *     → approve(): learning_corpus_items 에 INSERT, status: approved + approved_corpus_id/approved_item_id 기록
 *     → reject(): status: rejected
 *
 * 자동화 금지 규칙: 분류·승인은 사람의 판단이 들어가야 한다.
 *   AI 는 후보만 제안, 본사 관리자가 1건씩 승인.
 */
@Service
class PendingCheckpointService(
    private val pendingRepo: PendingCheckpointRepository,
    private val corpusRepo: LearningCorpusRepository,
    private val itemRepo: LearningCorpusItemRepository,
    private val studyPageRepo: StudyPageRepository,
    private val aiCallHelper: AiCallHelper,
    private val objectMapper: ObjectMapper,
) {
    private val log = LoggerFactory.getLogger(PendingCheckpointService::class.java)

    // ── 추출 hook ────────────────────────────────────

    /**
     * StudyContent 저장 hook — 페이지의 checkpoints JSON 을 파싱해 pending_checkpoints 에 INSERT.
     * 동일 sourceContentId 로 이미 INSERT 된 항목은 skip (중복 방지).
     */
    @Transactional
    fun extractFromStudyContent(
        sourceContentId: String,
        sourceUserId: String?,
        sourceOrgId: String?,
    ): ExtractResult {
        val pages = studyPageRepo.findAllByContentIdOrderByPageNoAsc(sourceContentId)
        val existingForContent = pendingRepo.findBySourceContentId(sourceContentId)
        val existingTexts = existingForContent.map { it.textMd.trim() }.toSet()

        var inserted = 0
        var skipped = 0
        val now = LocalDateTime.now()

        for (page in pages) {
            val cps = parseCheckpointsJson(page.checkpoints)
            for (cp in cps) {
                val text = (cp["text"] as? String)?.trim().orEmpty()
                if (text.isBlank()) continue
                if (existingTexts.contains(text)) {
                    skipped++
                    continue
                }
                val context = page.markdown.take(800)  // 주변 본문 800자 (AI 분류 시 참고)
                val ent = PendingCheckpointEntity(
                    id = IdGenerator.newId("pchk"),
                    sourceContentId = sourceContentId,
                    sourceUserId = sourceUserId,
                    sourceOrgId = sourceOrgId,
                    textMd = text,
                    contextMd = context,
                    status = "pending",
                    createdAt = now,
                )
                pendingRepo.save(ent)
                inserted++
            }
        }

        log.info("pending_checkpoints 추출 완료 — sourceContentId={}, inserted={}, skipped={}",
            sourceContentId, inserted, skipped)
        return ExtractResult(sourceContentId = sourceContentId, inserted = inserted, skipped = skipped)
    }

    // ── AI 분류 ────────────────────────────────────

    /**
     * 단일 pending checkpoint AI 분류.
     * Claude 가 가장 어울리는 corpus 와 item_type 을 제안.
     */
    @Transactional
    fun classifyOne(pendingId: String): PendingCheckpointEntity {
        val pending = pendingRepo.findById(pendingId).orElseThrow {
            ApiException("NOT_FOUND", "대기 항목 없음: $pendingId", HttpStatus.NOT_FOUND)
        }
        if (!aiCallHelper.isConfigured()) {
            throw ApiException("AI_NOT_CONFIGURED", "Claude API 키 미설정", HttpStatus.SERVICE_UNAVAILABLE)
        }

        // 후보 corpus 30개 — 최근 갱신 active
        val candidates = corpusRepo.findByStatusOrderByUpdatedAtDesc("active").take(30)
        if (candidates.isEmpty()) {
            throw ApiException("NO_CORPUS", "분류할 작품·지문이 없음. 먼저 corpus 를 생성하세요.", HttpStatus.BAD_REQUEST)
        }

        val systemPrompt = buildClassifySystemPrompt(candidates)
        val userPrompt = buildClassifyUserPrompt(pending)

        val result = aiCallHelper.call(
            model = AiCallHelper.MODEL_SONNET,
            systemBlocks = listOf(aiCallHelper.systemBlock(systemPrompt, ephemeralCache = true)),
            userText = userPrompt,
            maxTokens = 1024,
        )
        val parsed = parseClassifyResponse(result.text)

        pending.suggestedCorpusId = parsed.corpusId
        pending.suggestedItemType = parsed.itemType
        pending.aiConfidence = parsed.confidence
        pending.aiReason = parsed.reason
        pending.status = "classified"
        return pendingRepo.save(pending)
    }

    /**
     * 모든 pending 항목 일괄 AI 분류.
     */
    @Transactional
    fun classifyAllPending(): ClassifyBatchResult {
        val pendings = pendingRepo.findByStatusOrderByCreatedAtDesc("pending")
        var classified = 0
        var errors = 0
        for (p in pendings) {
            try {
                classifyOne(p.id)
                classified++
            } catch (e: Exception) {
                log.warn("AI 분류 실패 — pendingId={}: {}", p.id, e.message)
                errors++
            }
        }
        return ClassifyBatchResult(total = pendings.size, classified = classified, errors = errors)
    }

    // ── 승인·거부 ────────────────────────────────────

    /**
     * 본사 관리자 승인 — pending 의 텍스트를 learning_corpus_items 로 옮기고 status=approved 표시.
     * corpusId, itemType 은 관리자가 변경 가능 (AI 추천 무시 가능).
     */
    @Transactional
    fun approve(
        pendingId: String,
        corpusId: String,
        itemType: String,
        approvedBy: String,
    ): ApprovalResult {
        val pending = pendingRepo.findById(pendingId).orElseThrow {
            ApiException("NOT_FOUND", "대기 항목 없음: $pendingId", HttpStatus.NOT_FOUND)
        }
        if (pending.status == "approved") {
            throw ApiException("ALREADY_APPROVED", "이미 승인된 항목", HttpStatus.BAD_REQUEST)
        }
        // corpus 존재 확인
        corpusRepo.findById(corpusId).orElseThrow {
            ApiException("NOT_FOUND", "작품·지문 없음: $corpusId", HttpStatus.NOT_FOUND)
        }
        val now = LocalDateTime.now()
        val item = LearningCorpusItemEntity(
            id = IdGenerator.newId("citm"),
            corpusId = corpusId,
            itemType = itemType,
            textMd = pending.textMd,
            sourceType = "ai-classified",
            sourceContentId = pending.sourceContentId,
            createdAt = now,
            updatedAt = now,
            createdBy = approvedBy,
        )
        itemRepo.save(item)

        pending.status = "approved"
        pending.approvedAt = now
        pending.approvedBy = approvedBy
        pending.approvedCorpusId = corpusId
        pending.approvedItemId = item.id
        pendingRepo.save(pending)

        return ApprovalResult(pendingId = pendingId, corpusId = corpusId, itemId = item.id)
    }

    @Transactional
    fun reject(pendingId: String, approvedBy: String): PendingCheckpointEntity {
        val pending = pendingRepo.findById(pendingId).orElseThrow {
            ApiException("NOT_FOUND", "대기 항목 없음: $pendingId", HttpStatus.NOT_FOUND)
        }
        pending.status = "rejected"
        pending.approvedAt = LocalDateTime.now()
        pending.approvedBy = approvedBy
        return pendingRepo.save(pending)
    }

    // ── 조회 ────────────────────────────────────

    @Transactional(readOnly = true)
    fun listByStatus(status: String): List<PendingCheckpointView> =
        pendingRepo.findByStatusOrderByCreatedAtDesc(status).map { it.toView() }

    @Transactional(readOnly = true)
    fun listByOrg(orgId: String, status: String = "pending"): List<PendingCheckpointView> =
        pendingRepo.findBySourceOrgIdAndStatusOrderByCreatedAtDesc(orgId, status).map { it.toView() }

    @Transactional(readOnly = true)
    fun stats(): PendingStatsView = PendingStatsView(
        pending = pendingRepo.countByStatus("pending"),
        classified = pendingRepo.countByStatus("classified"),
        approved = pendingRepo.countByStatus("approved"),
        rejected = pendingRepo.countByStatus("rejected"),
    )

    // ── AI 프롬프트 빌더 ────────────────────────────────────

    private fun buildClassifySystemPrompt(candidates: List<LearningCorpusEntity>): String {
        val candidateList = candidates.joinToString("\n") { c ->
            val meta = listOfNotNull(
                c.area,
                c.subArea?.let { "세부=$it" },
                c.author?.let { "작가=$it" },
                c.era?.let { "시대=$it" },
                c.genre?.let { "장르=$it" },
                c.field?.let { "분야=$it" },
                c.topic?.let { "주제=$it" },
            ).joinToString(" / ")
            "- ${c.id} | ${c.title} | $meta"
        }
        return """
당신은 국어 학습 자료 분류 보조 AI 입니다.
주어진 체크리스트(학습 포인트) 한 건을 보고, 가장 어울리는 작품·지문 corpus 1개와 item_type 1개를 제안하세요.

[item_type 종류]
- checkpoint: 일반 체크리스트
- exam_point: 출제 포인트 (시험에 나올 만한 핵심)
- passage_note: 구절 해석 (특정 본문 구간 풀이)
- background: 배경지식 (작품 외적 지식)
- character: 등장인물 분석
- vocabulary: 어휘·표현
- other: 기타

[후보 corpus 목록]
$candidateList

[응답 형식 — 반드시 JSON 한 객체만]
{"corpusId": "corp-xxx", "itemType": "checkpoint", "confidence": 0.85, "reason": "왜 이 corpus·item_type 인지 1~2 문장"}

confidence 는 0.0~1.0. 적합한 corpus 가 후보에 없으면 corpusId 를 빈 문자열로, confidence 를 0.0 으로 설정.
""".trim()
    }

    private fun buildClassifyUserPrompt(pending: PendingCheckpointEntity): String = """
[체크리스트 본문]
${pending.textMd}

[주변 본문(참고)]
${pending.contextMd ?: "(없음)"}
""".trim()

    private data class ClassifyParsed(
        val corpusId: String?,
        val itemType: String?,
        val confidence: Double?,
        val reason: String?,
    )

    private fun parseClassifyResponse(text: String): ClassifyParsed {
        val jsonStart = text.indexOf('{')
        val jsonEnd = text.lastIndexOf('}')
        if (jsonStart < 0 || jsonEnd <= jsonStart) {
            log.warn("AI 분류 응답 파싱 실패 — JSON 미발견: {}", text.take(200))
            return ClassifyParsed(null, null, null, "AI 응답 파싱 실패")
        }
        val json = text.substring(jsonStart, jsonEnd + 1)
        return try {
            @Suppress("UNCHECKED_CAST")
            val map = objectMapper.readValue(json, Map::class.java) as Map<String, Any?>
            val corpusId = (map["corpusId"] as? String)?.takeIf { it.isNotBlank() }
            val itemType = (map["itemType"] as? String)?.takeIf { it.isNotBlank() }
            val conf = (map["confidence"] as? Number)?.toDouble()
            val reason = (map["reason"] as? String)
            ClassifyParsed(corpusId, itemType, conf, reason)
        } catch (e: Exception) {
            log.warn("AI 분류 응답 JSON 파싱 실패: {} / {}", e.message, json.take(200))
            ClassifyParsed(null, null, null, "AI 응답 JSON 파싱 실패: ${e.message}")
        }
    }

    private fun parseCheckpointsJson(json: String?): List<Map<String, Any?>> {
        if (json.isNullOrBlank()) return emptyList()
        return try {
            @Suppress("UNCHECKED_CAST")
            objectMapper.readValue(json, object : TypeReference<List<Map<String, Any?>>>() {})
        } catch (e: Exception) {
            log.warn("checkpoints JSON 파싱 실패: {}", e.message)
            emptyList()
        }
    }

    // ── 변환 ────────────────────────────────────

    private fun PendingCheckpointEntity.toView(): PendingCheckpointView = PendingCheckpointView(
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
}

// ── DTO ────────────────────────────────────

data class ExtractResult(
    val sourceContentId: String,
    val inserted: Int,
    val skipped: Int,
)

data class ClassifyBatchResult(
    val total: Int,
    val classified: Int,
    val errors: Int,
)

data class ApprovalResult(
    val pendingId: String,
    val corpusId: String,
    val itemId: String,
)

data class PendingCheckpointView(
    val id: String,
    val sourceContentId: String,
    val sourceUserId: String?,
    val sourceOrgId: String?,
    val textMd: String,
    val contextMd: String?,
    val suggestedCorpusId: String?,
    val suggestedItemType: String?,
    val aiConfidence: Double?,
    val aiReason: String?,
    val status: String,
    val approvedAt: String?,
    val approvedBy: String?,
    val approvedCorpusId: String?,
    val approvedItemId: String?,
    val createdAt: String,
)

data class PendingStatsView(
    val pending: Long,
    val classified: Long,
    val approved: Long,
    val rejected: Long,
)
