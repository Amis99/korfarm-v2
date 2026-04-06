package com.korfarm.api.study

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.IdClass
import jakarta.persistence.PrePersist
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import java.io.Serializable
import java.time.LocalDateTime

// ─────────────────────────────────────────────
// 1. study_contents — 정적 콘텐츠 메타·본문·체크리스트
// ─────────────────────────────────────────────
@Entity
@Table(name = "study_contents")
class StudyContentEntity(
    @Id
    var id: String,

    @Column(nullable = false)
    var title: String,

    @Column(columnDefinition = "text")
    var description: String? = null,

    @Column(name = "level_id")
    var levelId: String? = null,

    @Column(nullable = false)
    var area: String = "CONTENT",

    @Column(nullable = false)
    var visibility: String,

    @Column(name = "owner_org_id")
    var ownerOrgId: String? = null,

    @Column(name = "creator_id", nullable = false)
    var creatorId: String,

    @Column(columnDefinition = "longtext", nullable = false)
    var markdown: String,

    @Column(name = "eval_points", columnDefinition = "json", nullable = false)
    var evalPoints: String, // JSON array string: ["당쟁의 정의", ...]

    @Column(name = "error_patterns", columnDefinition = "json", nullable = false)
    var errorPatterns: String, // JSON array string: ["조선/명청 혼동", ...]

    @Column(name = "question_count", nullable = false)
    var questionCount: Int = 0,

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

// ─────────────────────────────────────────────
// 2. study_questions — 문제
// ─────────────────────────────────────────────
@Entity
@Table(name = "study_questions")
class StudyQuestionEntity(
    @Id
    var id: String,

    @Column(name = "content_id", nullable = false)
    var contentId: String,

    @Column(name = "question_no", nullable = false)
    var questionNo: Int,

    @Column(name = "question_type", nullable = false)
    var questionType: String, // MULTI_CHOICE | OX | ESSAY

    @Column(columnDefinition = "text", nullable = false)
    var stem: String,

    @Column(columnDefinition = "json")
    var choices: String? = null, // JSON: [{id, text, isCorrect, errorPatternIdx?}]

    @Column(name = "model_answer", columnDefinition = "text")
    var modelAnswer: String? = null,

    @Column(name = "fill_blanks", columnDefinition = "json")
    var fillBlanks: String? = null, // JSON: [{phrase, position}]

    @Column(name = "eval_point_idx", columnDefinition = "json", nullable = false)
    var evalPointIdx: String, // JSON int array

    @Column(nullable = false)
    var difficulty: Int = 3,

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

// ─────────────────────────────────────────────
// 3. study_attempts — 학생 답안 단위 상세
// ─────────────────────────────────────────────
@Entity
@Table(name = "study_attempts")
class StudyAttemptEntity(
    @Id
    var id: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(name = "content_id", nullable = false)
    var contentId: String,

    @Column(name = "question_id", nullable = false)
    var questionId: String,

    @Column(name = "session_id", nullable = false)
    var sessionId: String,

    @Column(name = "is_correct", nullable = false)
    var isCorrect: Boolean,

    @Column(name = "selected_choice_idx")
    var selectedChoiceIdx: Int? = null,

    @Column(name = "user_answer", columnDefinition = "text")
    var userAnswer: String? = null,

    @Column(name = "triggered_error_pattern_idx", columnDefinition = "json")
    var triggeredErrorPatternIdx: String? = null,

    @Column(name = "attempted_at", nullable = false)
    var attemptedAt: LocalDateTime = LocalDateTime.now()
)

// ─────────────────────────────────────────────
// 4. study_progress — 사용자×콘텐츠 누적 stats (캐시)
// ─────────────────────────────────────────────
class StudyProgressId(
    var userId: String = "",
    var contentId: String = ""
) : Serializable {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is StudyProgressId) return false
        return userId == other.userId && contentId == other.contentId
    }
    override fun hashCode(): Int = userId.hashCode() * 31 + contentId.hashCode()
}

@Entity
@Table(name = "study_progress")
@IdClass(StudyProgressId::class)
class StudyProgressEntity(
    @Id
    @Column(name = "user_id")
    var userId: String,

    @Id
    @Column(name = "content_id")
    var contentId: String,

    @Column(name = "seen_question_ids", columnDefinition = "json", nullable = false)
    var seenQuestionIds: String = "[]",

    @Column(name = "eval_point_correct", columnDefinition = "json", nullable = false)
    var evalPointCorrect: String = "[]",

    @Column(name = "eval_point_attempted", columnDefinition = "json", nullable = false)
    var evalPointAttempted: String = "[]",

    @Column(name = "error_pattern_count", columnDefinition = "json", nullable = false)
    var errorPatternCount: String = "[]",

    @Column(name = "total_sessions", nullable = false)
    var totalSessions: Int = 0,

    @Column(name = "total_correct", nullable = false)
    var totalCorrect: Int = 0,

    @Column(name = "total_attempted", nullable = false)
    var totalAttempted: Int = 0,

    @Column(name = "last_session_at")
    var lastSessionAt: LocalDateTime? = null,

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }
}
