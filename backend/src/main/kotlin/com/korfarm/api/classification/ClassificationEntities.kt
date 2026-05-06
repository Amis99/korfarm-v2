package com.korfarm.api.classification

import jakarta.persistence.Column
import jakarta.persistence.Embeddable
import jakarta.persistence.EmbeddedId
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import java.io.Serializable
import java.time.LocalDateTime

/**
 * 분류 마스터 — 영역(area) / 세부영역(sub_area) / 주제(theme) 의 통합 카탈로그.
 * V0100 시드: 6 + 37 + 256 = 299 row.
 */
@Entity
@Table(name = "classification_master")
class ClassificationMasterEntity(
    @Id
    var code: String,

    @Column(nullable = false, length = 16)
    var type: String,                       // 'area' / 'sub_area' / 'theme'

    @Column(name = "parent_code", length = 64)
    var parentCode: String? = null,

    @Column(name = "label_ko", nullable = false, length = 128)
    var labelKo: String,

    @Column(columnDefinition = "TEXT")
    var description: String? = null,

    @Column(name = "sort_order", nullable = false)
    var sortOrder: Int = 0,

    @Column(nullable = false)
    var active: Boolean = true,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),
) {
    @PrePersist
    @PreUpdate
    fun touch() { updatedAt = LocalDateTime.now() }
}

@Embeddable
data class ContentClassificationId(
    @Column(name = "content_id") var contentId: String = "",
    @Column(name = "classification_code") var classificationCode: String = "",
) : Serializable

/** 콘텐츠 ↔ 분류 다대다 (복수 지정) */
@Entity
@Table(name = "content_classifications")
class ContentClassificationEntity(
    @EmbeddedId
    var id: ContentClassificationId,

    @Column(name = "classification_type", nullable = false, length = 16)
    var classificationType: String,         // 'area' / 'sub_area' / 'theme'

    @Column(name = "is_primary", nullable = false)
    var isPrimary: Boolean = false,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),
)

@Embeddable
data class TestQuestionClassificationId(
    @Column(name = "question_id") var questionId: String = "",
    @Column(name = "classification_code") var classificationCode: String = "",
) : Serializable

/** 시험 문항 ↔ 분류 다대다 (test_questions 가 콘텐츠와 별도라 별도 매핑) */
@Entity
@Table(name = "test_question_classifications")
class TestQuestionClassificationEntity(
    @EmbeddedId
    var id: TestQuestionClassificationId,

    @Column(name = "classification_type", nullable = false, length = 16)
    var classificationType: String,

    @Column(name = "is_primary", nullable = false)
    var isPrimary: Boolean = false,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),
)
