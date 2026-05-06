package com.korfarm.api.agent

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.Table
import java.time.LocalDateTime

/** AI 비서 채팅 세션 — 사이드바 대화 목록의 한 항목 */
@Entity
@Table(name = "agent_chat_sessions")
class AgentChatSessionEntity(
    @Id
    var id: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(name = "user_role", nullable = false, length = 16)
    var userRole: String,

    @Column(name = "org_id")
    var orgId: String? = null,

    @Column(length = 200)
    var title: String? = null,

    @Column(nullable = false, length = 16)
    var status: String = "active",

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),
)

/** AI 채팅 메시지 (user / assistant / tool) */
@Entity
@Table(name = "agent_chat_messages")
class AgentChatMessageEntity(
    @Id
    var id: String,

    @Column(name = "session_id", nullable = false)
    var sessionId: String,

    @Column(nullable = false, length = 32)
    var role: String,                 // "user" / "assistant" / "assistant_tool_use" / "tool"

    @Column(columnDefinition = "LONGTEXT")
    var content: String? = null,

    @Column(name = "tool_use_json", columnDefinition = "JSON")
    var toolUseJson: String? = null,

    @Column(name = "function_name", length = 64)
    var functionName: String? = null,

    @Column(length = 16)
    var status: String? = null,       // "success" / "error" / "pending_confirm"

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),
)

/** 사용 한도 카운터 (turn 단위) */
@Entity
@Table(name = "agent_usage_log")
class AgentUsageLogEntity(
    @Id
    var id: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(name = "user_role", nullable = false, length = 16)
    var userRole: String,

    @Column(name = "session_id")
    var sessionId: String? = null,

    @Column(name = "is_extra", nullable = false)
    var isExtra: Boolean = false,

    @Column(name = "grapefruit_spent", nullable = false)
    var grapefruitSpent: Int = 0,

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

/** 사이트 내 알림 — 헤더 종 아이콘 */
@Entity
@Table(name = "notifications")
class NotificationEntity(
    @Id
    var id: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(nullable = false, length = 32)
    var category: String,             // schedule / billing / agent / system / wisdom

    @Column(nullable = false, length = 200)
    var title: String,

    @Column(columnDefinition = "TEXT")
    var body: String? = null,

    @Column(name = "link_path", length = 512)
    var linkPath: String? = null,

    @Column(name = "read_at")
    var readAt: LocalDateTime? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),
) {
    @PrePersist
    fun onCreate() {
        if (createdAt == LocalDateTime.MIN) createdAt = LocalDateTime.now()
    }
}
