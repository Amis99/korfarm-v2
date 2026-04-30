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

    /** 학습 영역 코드: LIT/READ/GRAM/SPEAK/WRITE/MEDIA (NULL = 미설정) */
    @Column
    var area: String? = null,

    /** 세부 영역 (현대시·고전시·논설 등) */
    @Column(name = "sub_area")
    var subArea: String? = null,

    /** 원본 자료 출처: manual(직접 작성) / pdf / image */
    @Column(name = "source_type", nullable = false)
    var sourceType: String = "manual",

    /** 원본 파일 URL (PDF/이미지 업로드 시) */
    @Column(name = "source_file_url")
    var sourceFileUrl: String? = null,

    @Column(name = "source_file_name")
    var sourceFileName: String? = null,

    /** SHA-256 hash — 같은 파일 재업로드 시 dedup */
    @Column(name = "source_file_hash")
    var sourceFileHash: String? = null,

    @Column(name = "source_file_size_bytes")
    var sourceFileSizeBytes: Long? = null,

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
// 1-b. study_pages — 페이지 단위 본문 (1:N from study_contents)
// 학습 진행: 페이지1 본문 → 페이지1 문제(최대 30) → 페이지2 본문 → 페이지2 문제 → ...
// ─────────────────────────────────────────────
@Entity
@Table(name = "study_pages")
class StudyPageEntity(
    @Id
    var id: String,

    @Column(name = "content_id", nullable = false)
    var contentId: String,

    @Column(name = "page_no", nullable = false)
    var pageNo: Int,

    @Column
    var title: String? = null,

    @Column(columnDefinition = "longtext", nullable = false)
    var markdown: String,

    /** 출제 포인트 리스트 JSON: [{id, text, kind, evidence?}] */
    @Column(columnDefinition = "json")
    var checkpoints: String? = null,

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
// 2. study_questions — 문제 (페이지별 최대 30문제)
// ─────────────────────────────────────────────
@Entity
@Table(name = "study_questions")
class StudyQuestionEntity(
    @Id
    var id: String,

    @Column(name = "content_id", nullable = false)
    var contentId: String,

    /** 소속 페이지 (V0076 이후) */
    @Column(name = "page_id")
    var pageId: String? = null,

    @Column(name = "question_no", nullable = false)
    var questionNo: Int,

    @Column(name = "question_type", nullable = false)
    var questionType: String, // MULTI_CHOICE | OX | SHORT_ANSWER | ESSAY

    @Column(columnDefinition = "text", nullable = false)
    var stem: String,

    /**
     * MULTI_CHOICE/OX choices JSON:
     *   [{id, text, isCorrect, wrongVector: {역량명: 가중치}, errorPatternIdx?}]
     * SHORT_ANSWER/ESSAY 는 사용 안 함.
     */
    @Column(columnDefinition = "json")
    var choices: String? = null,

    /** ESSAY: 모범답안 / SHORT_ANSWER: 정답 (글자 그대로) */
    @Column(name = "model_answer", columnDefinition = "text")
    var modelAnswer: String? = null,

    /** ESSAY: [{phrase, position}] 빈칸 — 학생이 클릭해서 채우는 영역 */
    @Column(name = "fill_blanks", columnDefinition = "json")
    var fillBlanks: String? = null,

    @Column(name = "eval_point_idx", columnDefinition = "json", nullable = false)
    var evalPointIdx: String,

    @Column(nullable = false)
    var difficulty: Int = 3,

    /** 정답 시 누적될 10대 역량 가중치: {"역량명": 0.4, ...} */
    @Column(name = "competency_vector", columnDefinition = "json")
    var competencyVector: String? = null,

    /**
     * 오답 시 마이너스로 누적될 가중치.
     * MULTI_CHOICE/OX: 사용 안 함 (choices 안의 wrongVector 사용)
     * SHORT_ANSWER/ESSAY: {"역량명": 0.3, ...}
     */
    @Column(name = "wrong_vector", columnDefinition = "json")
    var wrongVector: String? = null,

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
