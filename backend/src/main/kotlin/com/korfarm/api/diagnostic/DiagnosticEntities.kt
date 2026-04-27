package com.korfarm.api.diagnostic

import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDateTime

@Entity
@Table(name = "diag_passages")
class DiagPassageEntity(
    @Id
    var id: String,

    @Column(nullable = false)
    var tier: String,

    @Column(nullable = false)
    var level: Int,

    @Column(nullable = false)
    var genre: String,

    @Column(name = "text_md", columnDefinition = "MEDIUMTEXT", nullable = false)
    var textMd: String,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
)

@Entity
@Table(name = "diag_questions")
class DiagQuestionEntity(
    @Id
    var id: String,

    @Column(name = "passage_id", nullable = false)
    var passageId: String,

    @Column(nullable = false)
    var tier: String,

    @Column(name = "question_type", nullable = false)
    var questionType: String,

    @Column(columnDefinition = "TEXT", nullable = false)
    var stem: String,

    @Column(name = "box_content", columnDefinition = "TEXT")
    var boxContent: String? = null,

    @Column(name = "correct_choice")
    var correctChoice: String? = null,

    @Column(name = "choices_json", columnDefinition = "json", nullable = false)
    var choicesJson: String,

    @Column(name = "model_answer", columnDefinition = "TEXT")
    var modelAnswer: String? = null,

    @Column(name = "grading_criteria_json", columnDefinition = "json")
    var gradingCriteriaJson: String? = null,

    @Column(name = "pair_id")
    var pairId: String? = null,

    @Column(name = "order_in_passage", nullable = false)
    var orderInPassage: Int,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
)

@Entity
@Table(name = "diag_sessions")
class DiagSessionEntity(
    @Id
    var id: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(nullable = false)
    var tier: String,

    @Column(nullable = false)
    var mode: String,

    @Column(nullable = false)
    var status: String = "active",

    @Column(name = "scores_json", columnDefinition = "json")
    var scoresJson: String? = null,

    /** v2: 그 세션에서 측정 가능한 최대 가중치 합 (역량별). 점수 = scores / maxScores × 100. */
    @Column(name = "max_scores_json", columnDefinition = "json")
    var maxScoresJson: String? = null,

    @Column(name = "touch_counts_json", columnDefinition = "json")
    var touchCountsJson: String? = null,

    @Column(name = "answered_count", nullable = false)
    var answeredCount: Int = 0,

    @Column(name = "correct_count", nullable = false)
    var correctCount: Int = 0,

    @Column(name = "raw_tci", precision = 5, scale = 2)
    var rawTci: BigDecimal? = null,

    @Column(name = "adjusted_tci", precision = 5, scale = 2)
    var adjustedTci: BigDecimal? = null,

    @Column(precision = 3, scale = 2)
    var confidence: BigDecimal? = null,

    @Column(name = "recommended_level")
    var recommendedLevel: String? = null,

    @Column(name = "error_analysis_json", columnDefinition = "json")
    var errorAnalysisJson: String? = null,

    @Column(name = "started_at", nullable = false)
    var startedAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "completed_at")
    var completedAt: LocalDateTime? = null,

    @Column(name = "last_response_at")
    var lastResponseAt: LocalDateTime? = null,

    @Column(name = "time_spent_sec")
    var timeSpentSec: Int? = null,

    @Column(name = "effective_speed_sec")
    var effectiveSpeedSec: Int? = null
)

@Entity
@Table(name = "diag_responses")
class DiagResponseEntity(
    @Id
    var id: String,

    @Column(name = "session_id", nullable = false)
    var sessionId: String,

    @Column(name = "question_id", nullable = false)
    var questionId: String,

    @Column(name = "selected_choice")
    var selectedChoice: String? = null,

    @Column(name = "is_correct", nullable = false)
    var isCorrect: Boolean = false,

    @Column(name = "response_order", nullable = false)
    var responseOrder: Int,

    @Column(name = "batch_number")
    var batchNumber: Int? = null,

    @Column(name = "responded_at", nullable = false)
    var respondedAt: LocalDateTime = LocalDateTime.now()
)
