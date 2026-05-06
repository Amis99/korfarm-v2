package com.korfarm.api.corpus

import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import org.slf4j.LoggerFactory
import org.springframework.data.domain.PageRequest
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

/**
 * 학습 자료 마스터 — 작품·지문 + 누적 항목 (체크리스트·출제포인트·구절해석 등) CRUD.
 *
 * AI 출제 하네스·LaTeX 빌드가 fetch 해 사용.
 */
@Service
class LearningCorpusService(
    private val corpusRepo: LearningCorpusRepository,
    private val itemRepo: LearningCorpusItemRepository,
    private val objectMapper: ObjectMapper,
) {
    private val log = LoggerFactory.getLogger(LearningCorpusService::class.java)

    // ── 작품·지문 CRUD ────────────────────────────────────

    @Transactional
    fun createCorpus(req: CorpusCreateRequest, createdBy: String): LearningCorpusEntity {
        val now = LocalDateTime.now()
        val ent = LearningCorpusEntity(
            id = IdGenerator.newId("corp"),
            area = req.area,
            subArea = req.subArea,
            title = req.title,
            source = req.source,
            author = req.author,
            era = req.era,
            genre = req.genre,
            topic = req.topic,
            field = req.field,
            bodyMd = req.bodyMd,
            metaJson = req.meta?.let { objectMapper.writeValueAsString(it) },
            classificationCodes = req.classificationCodes?.let { objectMapper.writeValueAsString(it) },
            levelMin = req.levelMin,
            levelMax = req.levelMax,
            status = req.status ?: "active",
            createdAt = now,
            updatedAt = now,
            createdBy = createdBy,
        )
        return corpusRepo.save(ent)
    }

    @Transactional
    fun updateCorpus(id: String, req: CorpusUpdateRequest, updatedBy: String): LearningCorpusEntity {
        val ent = corpusRepo.findById(id).orElseThrow {
            ApiException("NOT_FOUND", "작품·지문 없음: $id", HttpStatus.NOT_FOUND)
        }
        req.area?.let { ent.area = it }
        req.subArea?.let { ent.subArea = it }
        req.title?.let { ent.title = it }
        req.source?.let { ent.source = it }
        req.author?.let { ent.author = it }
        req.era?.let { ent.era = it }
        req.genre?.let { ent.genre = it }
        req.topic?.let { ent.topic = it }
        req.field?.let { ent.field = it }
        req.bodyMd?.let { ent.bodyMd = it }
        req.meta?.let { ent.metaJson = objectMapper.writeValueAsString(it) }
        req.classificationCodes?.let { ent.classificationCodes = objectMapper.writeValueAsString(it) }
        req.levelMin?.let { ent.levelMin = it }
        req.levelMax?.let { ent.levelMax = it }
        req.status?.let { ent.status = it }
        ent.updatedAt = LocalDateTime.now()
        return corpusRepo.save(ent)
    }

    @Transactional
    fun deleteCorpus(id: String) {
        // soft delete
        val ent = corpusRepo.findById(id).orElseThrow {
            ApiException("NOT_FOUND", "작품·지문 없음", HttpStatus.NOT_FOUND)
        }
        ent.status = "archived"
        ent.updatedAt = LocalDateTime.now()
        corpusRepo.save(ent)
    }

    @Transactional(readOnly = true)
    fun getCorpus(id: String): CorpusDetailView {
        val ent = corpusRepo.findById(id).orElseThrow {
            ApiException("NOT_FOUND", "작품·지문 없음", HttpStatus.NOT_FOUND)
        }
        val items = itemRepo.findByCorpusIdAndStatusOrderByCreatedAtAsc(id, "active")
        return CorpusDetailView(corpus = ent.toView(), items = items.map { it.toView() })
    }

    @Transactional(readOnly = true)
    fun search(
        area: String? = null,
        subArea: String? = null,
        genre: String? = null,
        era: String? = null,
        field: String? = null,
        keyword: String? = null,
        page: Int = 0,
        size: Int = 20,
    ): List<CorpusView> {
        val keywordPattern = keyword?.trim()?.takeIf { it.isNotBlank() }?.let { "%${it.lowercase()}%" }
        val pageable = PageRequest.of(page.coerceAtLeast(0), size.coerceIn(1, 100))
        return corpusRepo.search(area, subArea, genre, era, field, keywordPattern, pageable)
            .content.map { it.toView() }
    }

    // ── 누적 항목 (items) CRUD ────────────────────────────────────

    @Transactional
    fun addItem(corpusId: String, req: ItemAddRequest, createdBy: String): LearningCorpusItemEntity {
        // corpus 존재 확인
        corpusRepo.findById(corpusId).orElseThrow {
            ApiException("NOT_FOUND", "작품·지문 없음: $corpusId", HttpStatus.NOT_FOUND)
        }
        val now = LocalDateTime.now()
        val ent = LearningCorpusItemEntity(
            id = IdGenerator.newId("citm"),
            corpusId = corpusId,
            itemType = req.itemType,
            textMd = req.textMd,
            passageRangeStart = req.passageRangeStart,
            passageRangeEnd = req.passageRangeEnd,
            metaJson = req.meta?.let { objectMapper.writeValueAsString(it) },
            sourceType = req.sourceType ?: "manual",
            sourceContentId = req.sourceContentId,
            createdAt = now,
            updatedAt = now,
            createdBy = createdBy,
        )
        return itemRepo.save(ent)
    }

    @Transactional
    fun updateItem(itemId: String, req: ItemUpdateRequest): LearningCorpusItemEntity {
        val ent = itemRepo.findById(itemId).orElseThrow {
            ApiException("NOT_FOUND", "항목 없음", HttpStatus.NOT_FOUND)
        }
        req.itemType?.let { ent.itemType = it }
        req.textMd?.let { ent.textMd = it }
        req.passageRangeStart?.let { ent.passageRangeStart = it }
        req.passageRangeEnd?.let { ent.passageRangeEnd = it }
        req.meta?.let { ent.metaJson = objectMapper.writeValueAsString(it) }
        req.status?.let { ent.status = it }
        ent.updatedAt = LocalDateTime.now()
        return itemRepo.save(ent)
    }

    @Transactional
    fun deleteItem(itemId: String) {
        val ent = itemRepo.findById(itemId).orElseThrow {
            ApiException("NOT_FOUND", "항목 없음", HttpStatus.NOT_FOUND)
        }
        ent.status = "archived"
        ent.updatedAt = LocalDateTime.now()
        itemRepo.save(ent)
    }

    /** AI 출제 하네스용 — 단일 corpus 와 모든 active items 반환 (system 프롬프트 첨부용). */
    @Transactional(readOnly = true)
    fun fetchForExamGeneration(corpusId: String): CorpusDetailView = getCorpus(corpusId)

    /**
     * AI 출제 하네스용 — corpus + items 를 user 메시지에 붙일 수 있는 텍스트 한 덩어리로 직렬화.
     * 본문(body_md) + 체크리스트·출제포인트·구절해석 등을 섹션별로 묶음.
     * corpusId 가 NULL/비어있거나 corpus 없으면 빈 문자열.
     */
    @Transactional(readOnly = true)
    fun buildExamReferenceText(corpusId: String?): String {
        if (corpusId.isNullOrBlank()) return ""
        val ent = corpusRepo.findById(corpusId).orElse(null) ?: return ""
        val items = itemRepo.findByCorpusIdAndStatusOrderByCreatedAtAsc(corpusId, "active")

        val sb = StringBuilder()
        sb.append("### 작품·지문: ").append(ent.title)
        ent.author?.let { sb.append(" / 작가: ").append(it) }
        ent.era?.let { sb.append(" / 시대: ").append(it) }
        ent.genre?.let { sb.append(" / 장르: ").append(it) }
        ent.topic?.let { sb.append(" / 주제: ").append(it) }
        ent.field?.let { sb.append(" / 분야: ").append(it) }
        sb.append('\n')
        if (!ent.bodyMd.isNullOrBlank()) {
            sb.append("\n#### 본문\n").append(ent.bodyMd).append('\n')
        }
        // 항목 종류별 그룹
        val grouped = items.groupBy { it.itemType }
        val order = listOf("checkpoint", "exam_point", "passage_note", "background", "character", "vocabulary", "other")
        for (kind in order) {
            val list = grouped[kind] ?: continue
            if (list.isEmpty()) continue
            sb.append("\n#### ").append(kindLabel(kind)).append(" (").append(list.size).append(")\n")
            list.forEachIndexed { i, it ->
                sb.append(i + 1).append(". ").append(it.textMd.take(500)).append('\n')
            }
        }
        return sb.toString()
    }

    private fun kindLabel(kind: String): String = when (kind) {
        "checkpoint" -> "체크리스트"
        "exam_point" -> "출제 포인트"
        "passage_note" -> "구절 해석"
        "background" -> "배경지식"
        "character" -> "등장인물"
        "vocabulary" -> "어휘"
        else -> kind
    }

    // ── 변환 ────────────────────────────────────

    private fun LearningCorpusEntity.toView(): CorpusView = CorpusView(
        id = id, area = area, subArea = subArea, title = title, source = source,
        author = author, era = era, genre = genre, topic = topic, field = field,
        bodyMd = bodyMd,
        meta = metaJson?.let { runCatching { objectMapper.readValue(it, Map::class.java) as Map<String, Any?> }.getOrNull() },
        classificationCodes = classificationCodes?.let { runCatching { objectMapper.readValue(it, List::class.java) as List<String> }.getOrNull() },
        levelMin = levelMin, levelMax = levelMax,
        status = status,
        createdAt = createdAt.toString(), updatedAt = updatedAt.toString(),
        createdBy = createdBy,
    )

    private fun LearningCorpusItemEntity.toView(): ItemView = ItemView(
        id = id, corpusId = corpusId, itemType = itemType, textMd = textMd,
        passageRangeStart = passageRangeStart, passageRangeEnd = passageRangeEnd,
        meta = metaJson?.let { runCatching { objectMapper.readValue(it, Map::class.java) as Map<String, Any?> }.getOrNull() },
        sourceType = sourceType, sourceContentId = sourceContentId,
        status = status,
        createdAt = createdAt.toString(), updatedAt = updatedAt.toString(),
        createdBy = createdBy,
    )
}

// ── DTO ────────────────────────────────────

data class CorpusCreateRequest(
    val area: String,
    val subArea: String? = null,
    val title: String,
    val source: String? = null,
    val author: String? = null,
    val era: String? = null,
    val genre: String? = null,
    val topic: String? = null,
    val field: String? = null,
    val bodyMd: String? = null,
    val meta: Map<String, Any?>? = null,
    val classificationCodes: List<String>? = null,
    val levelMin: Int? = null,
    val levelMax: Int? = null,
    val status: String? = null,
)

data class CorpusUpdateRequest(
    val area: String? = null,
    val subArea: String? = null,
    val title: String? = null,
    val source: String? = null,
    val author: String? = null,
    val era: String? = null,
    val genre: String? = null,
    val topic: String? = null,
    val field: String? = null,
    val bodyMd: String? = null,
    val meta: Map<String, Any?>? = null,
    val classificationCodes: List<String>? = null,
    val levelMin: Int? = null,
    val levelMax: Int? = null,
    val status: String? = null,
)

data class ItemAddRequest(
    val itemType: String,
    val textMd: String,
    val passageRangeStart: Int? = null,
    val passageRangeEnd: Int? = null,
    val meta: Map<String, Any?>? = null,
    val sourceType: String? = null,
    val sourceContentId: String? = null,
)

data class ItemUpdateRequest(
    val itemType: String? = null,
    val textMd: String? = null,
    val passageRangeStart: Int? = null,
    val passageRangeEnd: Int? = null,
    val meta: Map<String, Any?>? = null,
    val status: String? = null,
)

data class CorpusView(
    val id: String, val area: String, val subArea: String?, val title: String, val source: String?,
    val author: String?, val era: String?, val genre: String?, val topic: String?, val field: String?,
    val bodyMd: String?,
    val meta: Map<String, Any?>?,
    val classificationCodes: List<String>?,
    val levelMin: Int?, val levelMax: Int?,
    val status: String,
    val createdAt: String, val updatedAt: String,
    val createdBy: String?,
)

data class ItemView(
    val id: String, val corpusId: String, val itemType: String, val textMd: String,
    val passageRangeStart: Int?, val passageRangeEnd: Int?,
    val meta: Map<String, Any?>?,
    val sourceType: String?, val sourceContentId: String?,
    val status: String,
    val createdAt: String, val updatedAt: String,
    val createdBy: String?,
)

data class CorpusDetailView(val corpus: CorpusView, val items: List<ItemView>)
