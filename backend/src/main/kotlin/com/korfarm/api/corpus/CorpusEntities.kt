package com.korfarm.api.corpus

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.LocalDateTime

/**
 * learning_corpus — 작품·지문 마스터.
 * 영역별 다른 메타는 meta_json 자유 키로 (등장인물·줄거리·예시·관련개념 등).
 */
@Entity
@Table(name = "learning_corpus")
class LearningCorpusEntity(
    @Id
    var id: String,

    @Column(nullable = false, length = 32)
    var area: String,

    @Column(name = "sub_area", length = 64)
    var subArea: String? = null,

    @Column(nullable = false, length = 200)
    var title: String,

    @Column(length = 200)
    var source: String? = null,

    @Column(length = 100)
    var author: String? = null,

    @Column(length = 64)
    var era: String? = null,

    @Column(length = 64)
    var genre: String? = null,

    @Column(length = 200)
    var topic: String? = null,

    @Column(length = 64)
    var field: String? = null,

    @Column(name = "body_md", columnDefinition = "MEDIUMTEXT")
    var bodyMd: String? = null,

    @Column(name = "meta_json", columnDefinition = "JSON")
    var metaJson: String? = null,

    @Column(name = "classification_codes", columnDefinition = "JSON")
    var classificationCodes: String? = null,

    @Column(name = "level_min")
    var levelMin: Int? = null,

    @Column(name = "level_max")
    var levelMax: Int? = null,

    @Column(nullable = false, length = 16)
    var status: String = "active",

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "created_by", length = 64)
    var createdBy: String? = null,
)

/** 작품·지문에 누적되는 체크리스트·출제포인트·구절해석 등 */
@Entity
@Table(name = "learning_corpus_items")
class LearningCorpusItemEntity(
    @Id
    var id: String,

    @Column(name = "corpus_id", nullable = false)
    var corpusId: String,

    @Column(name = "item_type", nullable = false, length = 32)
    var itemType: String,    // checkpoint / exam_point / passage_note / background / character / vocabulary / other

    @Column(name = "text_md", nullable = false, columnDefinition = "TEXT")
    var textMd: String,

    @Column(name = "passage_range_start")
    var passageRangeStart: Int? = null,

    @Column(name = "passage_range_end")
    var passageRangeEnd: Int? = null,

    @Column(name = "meta_json", columnDefinition = "JSON")
    var metaJson: String? = null,

    @Column(name = "source_type", length = 32)
    var sourceType: String? = null,    // manual / ai-classified / study-content

    @Column(name = "source_content_id", length = 64)
    var sourceContentId: String? = null,

    @Column(nullable = false, length = 16)
    var status: String = "active",

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "created_by", length = 64)
    var createdBy: String? = null,
)

/** AI 분류 대기 임시 풀 — 내용 숙지 학습에서 자동 추출 */
@Entity
@Table(name = "pending_checkpoints")
class PendingCheckpointEntity(
    @Id
    var id: String,

    @Column(name = "source_content_id", nullable = false, length = 64)
    var sourceContentId: String,

    @Column(name = "source_user_id", length = 64)
    var sourceUserId: String? = null,

    @Column(name = "source_org_id", length = 64)
    var sourceOrgId: String? = null,

    @Column(name = "text_md", nullable = false, columnDefinition = "TEXT")
    var textMd: String,

    @Column(name = "context_md", columnDefinition = "TEXT")
    var contextMd: String? = null,

    @Column(name = "suggested_corpus_id", length = 64)
    var suggestedCorpusId: String? = null,

    @Column(name = "suggested_item_type", length = 32)
    var suggestedItemType: String? = null,

    @Column(name = "ai_confidence")
    var aiConfidence: Double? = null,

    @Column(name = "ai_reason", columnDefinition = "TEXT")
    var aiReason: String? = null,

    @Column(nullable = false, length = 16)
    var status: String = "pending",   // pending / classified / approved / rejected

    @Column(name = "approved_at")
    var approvedAt: LocalDateTime? = null,

    @Column(name = "approved_by", length = 64)
    var approvedBy: String? = null,

    @Column(name = "approved_corpus_id", length = 64)
    var approvedCorpusId: String? = null,

    @Column(name = "approved_item_id", length = 64)
    var approvedItemId: String? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),
)
