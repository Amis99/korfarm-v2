package com.korfarm.api.tutor

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "tutor_chat_sessions")
class TutorChatSessionEntity(
    @Id
    var id: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(length = 200)
    var title: String? = null,

    @Column(nullable = false, length = 16)
    var status: String = "active",

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),
)

@Entity
@Table(name = "tutor_chat_messages")
class TutorChatMessageEntity(
    @Id
    var id: String,

    @Column(name = "session_id", nullable = false)
    var sessionId: String,

    @Column(nullable = false, length = 32)
    var role: String,

    @Column(columnDefinition = "LONGTEXT")
    var content: String? = null,

    @Column(name = "tool_use_json", columnDefinition = "JSON")
    var toolUseJson: String? = null,

    @Column(name = "function_name", length = 64)
    var functionName: String? = null,

    @Column(length = 16)
    var status: String? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),
)

@Entity
@Table(name = "tutor_usage_log")
class TutorUsageLogEntity(
    @Id
    var id: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(name = "session_id")
    var sessionId: String? = null,

    /** 'grapefruit' / 'crop_<type>' / 'free' */
    @Column(nullable = false, length = 32)
    var currency: String,

    @Column(name = "amount_spent", nullable = false)
    var amountSpent: Int = 0,

    @Column(name = "total_input_tokens", nullable = false)
    var totalInputTokens: Int = 0,

    @Column(name = "total_output_tokens", nullable = false)
    var totalOutputTokens: Int = 0,

    @Column(length = 64)
    var model: String = "claude-sonnet-4-6",

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),
) {
    @PrePersist
    fun onCreate() {
        if (createdAt == LocalDateTime.MIN) createdAt = LocalDateTime.now()
    }
}
