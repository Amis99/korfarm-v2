package com.korfarm.api.board

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "boards")
class BoardEntity(
    @Id
    var id: String,

    @Column(name = "board_type", nullable = false)
    var boardType: String,

    @Column(name = "org_scope", nullable = false)
    var orgScope: String,

    @Column(nullable = false)
    var status: String,

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
@Table(name = "posts")
class PostEntity(
    @Id
    var id: String,

    @Column(name = "board_id", nullable = false)
    var boardId: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(nullable = false)
    var title: String,

    @Column(nullable = false, columnDefinition = "text")
    var content: String,

    @Column(nullable = false)
    var status: String,

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
@Table(name = "post_attachments")
class PostAttachmentEntity(
    @Id
    var id: String,

    @Column(name = "post_id", nullable = false)
    var postId: String,

    @Column(name = "file_id", nullable = false)
    var fileId: String,

    @Column(nullable = false)
    var name: String,

    @Column(nullable = false)
    var mime: String,

    @Column(nullable = false)
    var size: Long,

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
@Table(name = "post_reviews")
class PostReviewEntity(
    @Id
    var id: String,

    @Column(name = "post_id", nullable = false)
    var postId: String,

    @Column(nullable = false)
    var approved: Boolean,

    @Column(name = "reviewed_by")
    var reviewedBy: String? = null,

    @Column(name = "reviewed_at")
    var reviewedAt: LocalDateTime? = null,

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
@Table(name = "comments")
class CommentEntity(
    @Id
    var id: String,

    @Column(name = "post_id", nullable = false)
    var postId: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(nullable = false, columnDefinition = "text")
    var content: String,

    @Column(nullable = false)
    var status: String,

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
@Table(name = "reports")
class ReportEntity(
    @Id
    var id: String,

    @Column(name = "target_type", nullable = false)
    var targetType: String,

    @Column(name = "target_id", nullable = false)
    var targetId: String,

    @Column(nullable = false)
    var reason: String,

    @Column(nullable = false)
    var status: String,

    @Column(name = "processed_by")
    var processedBy: String? = null,

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
