package com.korfarm.api.tutor

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.IdClass
import jakarta.persistence.PrePersist
import jakarta.persistence.Table
import java.io.Serializable
import java.time.LocalDate
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

/**
 * 학생 AI 튜터 일일 무료 quota — 매일 5턴 + 1회 자동 분석.
 * (user_id, quota_date) 복합 PK, 자정 넘기면 새 row 자동 생성.
 */
@Entity
@Table(name = "tutor_daily_quota")
@IdClass(TutorDailyQuotaId::class)
class TutorDailyQuotaEntity(
    @Id
    @Column(name = "user_id", nullable = false)
    var userId: String = "",

    @Id
    @Column(name = "quota_date", nullable = false)
    var quotaDate: LocalDate = LocalDate.now(),

    @Column(name = "used_turns", nullable = false)
    var usedTurns: Int = 0,

    @Column(name = "auto_analysis_used", nullable = false)
    var autoAnalysisUsed: Boolean = false,

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),
)

class TutorDailyQuotaId(
    var userId: String = "",
    var quotaDate: LocalDate = LocalDate.now(),
) : Serializable {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is TutorDailyQuotaId) return false
        return userId == other.userId && quotaDate == other.quotaDate
    }
    override fun hashCode(): Int = userId.hashCode() * 31 + quotaDate.hashCode()
}
