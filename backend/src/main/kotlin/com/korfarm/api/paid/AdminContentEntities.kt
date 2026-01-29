package com.korfarm.api.paid

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "writing_feedback")
class WritingFeedbackEntity(
    @Id
    var id: String,

    @Column(name = "submission_id", nullable = false)
    var submissionId: String,

    @Column(name = "reviewer_id", nullable = false)
    var reviewerId: String,

    @Column(name = "rubric_json", columnDefinition = "json")
    var rubricJson: String? = null,

    @Column(columnDefinition = "text")
    var comment: String? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    @PrePersist
    fun onCreate() {
        val now = LocalDateTime.now()
        createdAt = now
        updatedAt = now
    }

    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }
}

@Entity
@Table(name = "test_answer_keys")
class TestAnswerKeyEntity(
    @Id
    var id: String,

    @Column(name = "test_id", nullable = false)
    var testId: String,

    @Column(name = "answers_json", columnDefinition = "json", nullable = false)
    var answersJson: String,

    @Column(name = "created_by", nullable = false)
    var createdBy: String,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    @PrePersist
    fun onCreate() {
        val now = LocalDateTime.now()
        createdAt = now
        updatedAt = now
    }

    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }
}

@Entity
@Table(name = "test_results")
class TestResultEntity(
    @Id
    var id: String,

    @Column(name = "test_id", nullable = false)
    var testId: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(nullable = false)
    var score: Int,

    @Column(name = "stats_json", columnDefinition = "json")
    var statsJson: String? = null,

    @Column(name = "graded_at")
    var gradedAt: LocalDateTime? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    @PrePersist
    fun onCreate() {
        val now = LocalDateTime.now()
        createdAt = now
        updatedAt = now
    }

    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }
}
