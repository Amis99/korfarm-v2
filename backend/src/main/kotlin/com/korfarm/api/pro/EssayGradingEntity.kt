package com.korfarm.api.pro

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(
    name = "essay_gradings",
    uniqueConstraints = [UniqueConstraint(columnNames = ["submission_id", "question_number"])]
)
class EssayGradingEntity(
    @Id
    var id: String,

    @Column(name = "submission_id", nullable = false)
    var submissionId: String,

    @Column(name = "test_id", nullable = false)
    var testId: String,

    @Column(name = "question_number", nullable = false)
    var questionNumber: Int,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(name = "student_answer", columnDefinition = "TEXT")
    var studentAnswer: String? = null,

    @Column(name = "keyword_score")
    var keywordScore: Int? = null,

    @Column(name = "keyword_detail", columnDefinition = "JSON")
    var keywordDetail: String? = null,

    @Column(name = "ai_score")
    var aiScore: Int? = null,

    @Column(name = "ai_feedback", columnDefinition = "TEXT")
    var aiFeedback: String? = null,

    @Column(name = "ai_graded_at")
    var aiGradedAt: LocalDateTime? = null,

    @Column(name = "ai_model")
    var aiModel: String? = null,

    @Column(name = "final_score")
    var finalScore: Int? = null,

    @Column(name = "graded_by")
    var gradedBy: String? = null,

    @Column(name = "graded_at")
    var gradedAt: LocalDateTime? = null,

    @Column(nullable = false)
    var status: String = "pending",

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
