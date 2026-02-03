package com.korfarm.api.learning

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "learning_attempts")
class LearningAttemptEntity(
    @Id
    var id: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(name = "content_id", nullable = false)
    var contentId: String,

    @Column(name = "activity_type", nullable = false)
    var activityType: String,

    @Column(nullable = false)
    var status: String,

    var score: Int? = null,

    @Column(name = "started_at")
    var startedAt: LocalDateTime? = null,

    @Column(name = "submitted_at")
    var submittedAt: LocalDateTime? = null,

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
@Table(name = "learning_streaks")
class LearningStreakEntity(
    @Id
    @Column(name = "user_id")
    var userId: String,

    @Column(name = "current_streak", nullable = false)
    var currentStreak: Int = 0,

    @Column(name = "best_streak", nullable = false)
    var bestStreak: Int = 0,

    @Column(name = "last_submission_date")
    var lastSubmissionDate: java.time.LocalDate? = null
)
