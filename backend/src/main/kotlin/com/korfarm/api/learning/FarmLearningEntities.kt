package com.korfarm.api.learning

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "farm_learning_logs")
class FarmLearningLogEntity(
    @Id
    var id: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(name = "content_id", nullable = false)
    var contentId: String,

    @Column(name = "content_type", nullable = false)
    var contentType: String,

    @Column(nullable = false)
    var status: String = "STARTED",

    var score: Int? = null,

    var accuracy: Int? = null,

    @Column(name = "earned_seed")
    var earnedSeed: Int = 0,

    @Column(name = "earned_seed_type")
    var earnedSeedType: String? = null,

    @Column(name = "started_at", nullable = false)
    var startedAt: LocalDateTime,

    @Column(name = "completed_at")
    var completedAt: LocalDateTime? = null,

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
@Table(name = "content_page_progress")
class ContentPageProgressEntity(
    @Id
    var id: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(name = "content_id", nullable = false)
    var contentId: String,

    @Column(name = "log_id", nullable = false)
    var logId: String,

    @Column(name = "page_no", nullable = false)
    var pageNo: Int,

    var score: Int = 0,

    var accuracy: Int = 0,

    @Column(name = "earned_seed")
    var earnedSeed: Int = 0,

    @Column(name = "earned_seed_type")
    var earnedSeedType: String? = null,

    @Column(name = "completed_at", nullable = false)
    var completedAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
) {
    @PrePersist
    fun onCreate() {
        createdAt = LocalDateTime.now()
    }
}
