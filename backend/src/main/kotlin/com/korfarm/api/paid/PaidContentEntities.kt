package com.korfarm.api.paid

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "contents")
class ContentEntity(
    @Id
    var id: String,

    @Column(name = "content_type", nullable = false)
    var contentType: String,

    @Column(name = "level_id")
    var levelId: String? = null,

    @Column(name = "chapter_id")
    var chapterId: String? = null,

    @Column(nullable = false)
    var title: String,

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
@Table(name = "content_versions")
class ContentVersionEntity(
    @Id
    var id: String,

    @Column(name = "content_id", nullable = false)
    var contentId: String,

    @Column(name = "schema_version", nullable = false)
    var schemaVersion: String,

    @Column(name = "content_json", columnDefinition = "json", nullable = false)
    var contentJson: String,

    @Column(name = "uploaded_by", nullable = false)
    var uploadedBy: String,

    @Column(name = "approved_by")
    var approvedBy: String? = null,

    @Column(name = "approved_at")
    var approvedAt: LocalDateTime? = null,

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
@Table(name = "test_papers")
class TestPaperEntity(
    @Id
    var id: String,

    @Column(name = "org_id", nullable = false)
    var orgId: String,

    @Column(nullable = false)
    var title: String,

    @Column(name = "pdf_file_id", nullable = false)
    var pdfFileId: String,

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
@Table(name = "writing_submissions")
class WritingSubmissionEntity(
    @Id
    var id: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(name = "prompt_id", nullable = false)
    var promptId: String,

    @Column(nullable = false)
    var content: String,

    @Column(nullable = false)
    var status: String,

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
