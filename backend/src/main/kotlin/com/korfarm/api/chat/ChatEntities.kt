package com.korfarm.api.chat

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.Table
import java.time.LocalDate
import java.time.LocalDateTime

@Entity
@Table(name = "chat_messages")
class ChatMessageEntity(
    @Id
    var id: String,

    @Column(name = "room_id", nullable = false)
    var roomId: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(name = "user_name", nullable = false)
    var userName: String,

    @Column(name = "user_avatar_url", length = 1024)
    var userAvatarUrl: String? = null,

    @Column(name = "message_type", nullable = false)
    var messageType: String,  // text|image|file|voice|notice

    @Column(columnDefinition = "TEXT")
    var content: String? = null,

    @Column(name = "file_id")
    var fileId: String? = null,

    @Column(name = "thumbnail_path")
    var thumbnailPath: String? = null,

    @Column(name = "attachment_state", nullable = false)
    var attachmentState: String = "live",  // live|archived|purged

    @Column(name = "archived_at")
    var archivedAt: LocalDateTime? = null,

    @Column(name = "is_admin", nullable = false)
    var isAdmin: Boolean = false,

    @Column(nullable = false)
    var status: String = "active",  // active|deleted

    @Column(name = "deleted_by")
    var deletedBy: String? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
) {
    @PrePersist
    fun onCreate() {
        if (createdAt == LocalDateTime.MIN) createdAt = LocalDateTime.now()
    }
}

@Entity
@Table(name = "chat_user_mutes")
class ChatUserMuteEntity(
    @Id
    var id: String,

    @Column(name = "room_id", nullable = false)
    var roomId: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(name = "muted_until")
    var mutedUntil: LocalDateTime? = null,

    @Column
    var reason: String? = null,

    @Column(name = "muted_by", nullable = false)
    var mutedBy: String,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
) {
    @PrePersist
    fun onCreate() {
        if (createdAt == LocalDateTime.MIN) createdAt = LocalDateTime.now()
    }
}

@Entity
@Table(name = "chat_emoticons")
class ChatEmoticonEntity(
    @Id
    var id: String,

    @Column(nullable = false)
    var name: String,

    @Column(name = "file_id", nullable = false)
    var fileId: String,

    @Column(name = "sort_order", nullable = false)
    var sortOrder: Int = 0,

    @Column(nullable = false)
    var status: String = "active",  // active|deleted

    @Column(name = "created_by", nullable = false)
    var createdBy: String,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
)

@Entity
@Table(name = "chat_attachment_archives")
class ChatAttachmentArchiveEntity(
    @Id
    var id: String,

    @Column(name = "room_id", nullable = false)
    var roomId: String,

    @Column(name = "period_start", nullable = false)
    var periodStart: LocalDate,

    @Column(name = "period_end", nullable = false)
    var periodEnd: LocalDate,

    @Column(name = "zip_path", nullable = false)
    var zipPath: String,

    @Column(name = "zip_size", nullable = false)
    var zipSize: Long,

    @Column(name = "file_count", nullable = false)
    var fileCount: Int,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "expires_at", nullable = false)
    var expiresAt: LocalDateTime,

    @Column(nullable = false)
    var status: String = "available"  // available|purged
)
