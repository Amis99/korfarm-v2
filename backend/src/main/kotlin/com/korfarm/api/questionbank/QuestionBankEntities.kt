package com.korfarm.api.questionbank

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "qb_code_groups")
class QbCodeGroupEntity(
    @Id
    var id: String,

    @Column(name = "group_key", nullable = false, unique = true)
    var groupKey: String,

    @Column(nullable = false)
    var label: String,

    @Column(name = "sort_order", nullable = false)
    var sortOrder: Int = 0,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    @PrePersist
    fun onCreate() {
        val now = LocalDateTime.now()
        createdAt = now; updatedAt = now
    }

    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }
}

@Entity
@Table(name = "qb_code_values")
class QbCodeValueEntity(
    @Id
    var id: String,

    @Column(name = "group_id", nullable = false)
    var groupId: String,

    @Column(nullable = false)
    var value: String,

    @Column(nullable = false)
    var label: String = "",

    @Column(name = "sort_order", nullable = false)
    var sortOrder: Int = 0,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    @PrePersist
    fun onCreate() {
        val now = LocalDateTime.now()
        createdAt = now; updatedAt = now
    }

    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }
}

@Entity
@Table(name = "qb_records")
class QbRecordEntity(
    @Id
    var id: String,

    @Column(name = "record_code", nullable = false, unique = true)
    var recordCode: String,

    @Column(name = "source_type")
    var sourceType: String? = null,

    @Column(name = "exam_org")
    var examOrg: String? = null,

    @Column(name = "exam_year")
    var examYear: Int? = null,

    @Column(name = "exam_month")
    var examMonth: Int? = null,

    @Column
    var area: String? = null,

    @Column(name = "sub_area")
    var subArea: String? = null,

    @Column
    var title: String? = null,

    @Column(name = "target_grades", columnDefinition = "json")
    var targetGrades: String? = null,

    @Column
    var difficulty: Int? = null,

    @Column(columnDefinition = "json")
    var tags: String? = null,

    @Column
    var author: String? = null,

    @Column(nullable = false)
    var status: String = "draft",

    @Column(name = "meta_json", columnDefinition = "json")
    var metaJson: String? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    @PrePersist
    fun onCreate() {
        val now = LocalDateTime.now()
        createdAt = now; updatedAt = now
    }

    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }
}

@Entity
@Table(name = "qb_passages")
class QbPassageEntity(
    @Id
    var id: String,

    @Column(name = "record_id", nullable = false)
    var recordId: String,

    @Column(name = "passage_code", nullable = false)
    var passageCode: String,

    @Column(name = "ref_type")
    var refType: String? = null,

    @Column
    var title: String? = null,

    @Column(name = "body_text", columnDefinition = "LONGTEXT", nullable = false)
    var bodyText: String,

    @Column(name = "sub_passages", columnDefinition = "json")
    var subPassages: String? = null,

    @Column(name = "box_items", columnDefinition = "json")
    var boxItems: String? = null,

    @Column(name = "sort_order", nullable = false)
    var sortOrder: Int = 0,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    @PrePersist
    fun onCreate() {
        val now = LocalDateTime.now()
        createdAt = now; updatedAt = now
    }

    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }
}

@Entity
@Table(name = "qb_questions")
class QbQuestionEntity(
    @Id
    var id: String,

    @Column(name = "record_id", nullable = false)
    var recordId: String,

    @Column(name = "question_number", nullable = false)
    var questionNumber: Int,

    @Column(name = "passage_refs", columnDefinition = "json")
    var passageRefs: String? = null,

    @Column(name = "question_format")
    var questionFormat: String? = null,

    @Column(name = "answer_type")
    var answerType: String? = null,

    @Column(name = "question_type")
    var questionType: String? = null,

    @Column(nullable = false, columnDefinition = "TEXT")
    var stem: String,

    @Column(name = "box_items", columnDefinition = "json")
    var boxItems: String? = null,

    @Column(columnDefinition = "json")
    var choices: String? = null,

    @Column(name = "correct_answer")
    var correctAnswer: String? = null,

    @Column
    var difficulty: Int? = null,

    @Column(columnDefinition = "LONGTEXT")
    var explanation: String? = null,

    @Column(name = "applied_concepts", columnDefinition = "json")
    var appliedConcepts: String? = null,

    @Column(name = "choice_pattern")
    var choicePattern: String? = null,

    @Column(name = "scoring_criteria", columnDefinition = "json")
    var scoringCriteria: String? = null,

    @Column
    var points: Int? = null,

    @Column(name = "sort_order", nullable = false)
    var sortOrder: Int = 0,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    @PrePersist
    fun onCreate() {
        val now = LocalDateTime.now()
        createdAt = now; updatedAt = now
    }

    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }
}

@Entity
@Table(name = "qb_record_versions")
class QbRecordVersionEntity(
    @Id
    var id: String,

    @Column(name = "record_id", nullable = false)
    var recordId: String,

    @Column(name = "schema_version", nullable = false)
    var schemaVersion: String = "1.0",

    @Column(name = "full_json", columnDefinition = "LONGTEXT", nullable = false)
    var fullJson: String,

    @Column(name = "uploaded_by", nullable = false)
    var uploadedBy: String,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
) {
    @PrePersist
    fun onCreate() {
        createdAt = LocalDateTime.now()
    }
}
