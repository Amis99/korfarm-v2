package com.korfarm.api.pro

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "pro_chapters")
class ProChapterEntity(
    @Id
    var id: String,

    @Column(name = "level_id", nullable = false)
    var levelId: String,

    @Column(name = "book_number", nullable = false)
    var bookNumber: Int,

    @Column(name = "chapter_number", nullable = false)
    var chapterNumber: Int,

    @Column(name = "global_chapter_number", nullable = false)
    var globalChapterNumber: Int,

    @Column(nullable = false)
    var title: String,

    var description: String? = null,

    @Column(nullable = false)
    var status: String = "active",

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
@Table(
    name = "pro_chapter_items",
    uniqueConstraints = [UniqueConstraint(columnNames = ["chapter_id", "type"])]
)
class ProChapterItemEntity(
    @Id
    var id: String,

    @Column(name = "chapter_id", nullable = false)
    var chapterId: String,

    @Column(nullable = false)
    var type: String,

    @Column(name = "content_id")
    var contentId: String? = null,

    @Column(name = "item_order", nullable = false)
    var itemOrder: Int,

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
@Table(
    name = "pro_progress",
    uniqueConstraints = [UniqueConstraint(columnNames = ["user_id", "item_id"])]
)
class ProProgressEntity(
    @Id
    var id: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(name = "chapter_id", nullable = false)
    var chapterId: String,

    @Column(name = "item_id", nullable = false)
    var itemId: String,

    @Column(nullable = false)
    var completed: Boolean = false,

    @Column(name = "completed_at")
    var completedAt: LocalDateTime? = null,

    var score: Int? = null,

    @Column(name = "seed_reward")
    var seedReward: Int? = null,

    @Column(name = "seed_type")
    var seedType: String? = null,

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
@Table(name = "pro_test_sessions")
class ProTestSessionEntity(
    @Id
    var id: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(name = "test_id", nullable = false)
    var testId: String,

    @Column(name = "chapter_id", nullable = false)
    var chapterId: String,

    @Column(name = "chapter_test_id", nullable = false)
    var chapterTestId: String,

    @Column(name = "printed_at")
    var printedAt: LocalDateTime? = null,

    @Column(name = "omr_deadline")
    var omrDeadline: LocalDateTime? = null,

    @Column(nullable = false)
    var status: String = "printed",

    var score: Int? = null,

    @Column(name = "submission_id")
    var submissionId: String? = null,

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
@Table(
    name = "pro_chapter_tests",
    uniqueConstraints = [UniqueConstraint(columnNames = ["chapter_id", "version"])]
)
class ProChapterTestEntity(
    @Id
    var id: String,

    @Column(name = "chapter_id", nullable = false)
    var chapterId: String,

    @Column(nullable = false)
    var version: Int,

    @Column(name = "test_paper_id", nullable = false)
    var testPaperId: String,

    @Column(nullable = false)
    var status: String = "active",

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
