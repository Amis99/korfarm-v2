package com.korfarm.api.wisdom

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import java.time.LocalDateTime

@Entity
@Table(name = "wisdom_posts")
class WisdomPostEntity(
    @Id
    var id: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(name = "level_id", nullable = false)
    var levelId: String,

    @Column(name = "topic_key", nullable = false)
    var topicKey: String,

    @Column(name = "topic_label", nullable = false)
    var topicLabel: String,

    @Column(name = "submission_type", nullable = false)
    var submissionType: String,

    @Column(columnDefinition = "text")
    var content: String? = null,

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
@Table(name = "wisdom_attachments")
class WisdomAttachmentEntity(
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
@Table(name = "wisdom_feedback")
class WisdomFeedbackEntity(
    @Id
    var id: String,

    @Column(name = "post_id", nullable = false, unique = true)
    var postId: String,

    @Column(name = "reviewer_id", nullable = false)
    var reviewerId: String,

    @Column(nullable = false, columnDefinition = "text")
    var comment: String,

    @Column(columnDefinition = "text")
    var correction: String? = null,

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
    name = "wisdom_likes",
    uniqueConstraints = [UniqueConstraint(columnNames = ["post_id", "user_id"])]
)
class WisdomLikeEntity(
    @Id
    var id: String,

    @Column(name = "post_id", nullable = false)
    var postId: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
) {
    @PrePersist
    fun onCreate() {
        createdAt = LocalDateTime.now()
    }
}

@Entity
@Table(name = "wisdom_comments")
class WisdomCommentEntity(
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
