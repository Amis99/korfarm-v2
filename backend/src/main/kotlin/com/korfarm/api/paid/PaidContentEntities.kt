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

    /**
     * 다중 분류 카테고리 — JSON array string으로 저장 (예: ["DAILY_READING","READING","STORY"]).
     * 한 콘텐츠가 여러 카테고리(일일 학습/농장별 학습/프로 모드/이야기·고전 농장 등)에
     * 동시 노출되도록 하기 위함. content_type 컬럼은 학생용 API 호환을 위해
     * array의 primary 카테고리(첫 항목)를 그대로 유지.
     * categories가 null이면 fallback으로 contentType 단일 값을 사용한다.
     */
    @Column(name = "categories", columnDefinition = "longtext")
    var categories: String? = null,

    @Column(name = "level_id")
    var levelId: String? = null,

    @Column(name = "chapter_id")
    var chapterId: String? = null,

    @Column
    var area: String? = null,

    @Column(name = "sub_area")
    var subArea: String? = null,

    @Column(name = "day_index")
    var dayIndex: Int? = null,

    @Column(name = "module_key")
    var moduleKey: String? = null,

    @Column(nullable = false)
    var title: String,

    @Column(nullable = false)
    var status: String,

    @Column(name = "video_url")
    var videoUrl: String? = null,

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

    @Column(name = "content_json", columnDefinition = "longtext", nullable = false)
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
@Table(name = "content_edit_logs")
class ContentEditLogEntity(
    @Id
    var id: String,

    @Column(name = "content_id", nullable = false)
    var contentId: String,

    @Column(name = "editor_id", nullable = false)
    var editorId: String,

    @Column(nullable = false)
    var action: String,

    var summary: String? = null,

    @Column(name = "version_id")
    var versionId: String? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
) {
    @PrePersist
    fun onCreate() {
        createdAt = LocalDateTime.now()
    }
}

// TestPaperEntity moved to com.korfarm.api.test.TestEntities

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
