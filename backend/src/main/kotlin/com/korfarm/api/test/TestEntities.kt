package com.korfarm.api.test

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import java.time.LocalDate
import java.time.LocalDateTime

@Entity
@Table(name = "test_papers")
class TestPaperEntity(
    @Id
    var id: String,

    @Column(name = "org_id")
    var orgId: String? = null,

    @Column(nullable = false)
    var title: String,

    @Column(columnDefinition = "TEXT")
    var description: String? = null,

    @Column(name = "pdf_file_id")
    var pdfFileId: String? = null,

    @Column(name = "level_id")
    var levelId: String? = null,

    @Column(name = "total_questions")
    var totalQuestions: Int = 0,

    @Column(name = "total_points")
    var totalPoints: Int = 0,

    @Column(name = "time_limit_minutes")
    var timeLimitMinutes: Int? = null,

    @Column(name = "exam_date")
    var examDate: LocalDate? = null,

    @Column
    var series: String? = null,

    @Column(nullable = false)
    var status: String = "draft",

    @Column(name = "payload_json", columnDefinition = "LONGTEXT")
    var payloadJson: String? = null,

    /** 시험지 시각 레이아웃 (디자인 에디터). null 이면 미디자인 — 어드민이 자동 채우기 후 편집 */
    @Column(name = "layout_json", columnDefinition = "LONGTEXT")
    var layoutJson: String? = null,

    /** 정답·해설 시각 레이아웃. null 이면 미디자인 */
    @Column(name = "answer_layout_json", columnDefinition = "LONGTEXT")
    var answerLayoutJson: String? = null,

    /** 시험지 Typst 소스 — 자동 생성 + 어드민 편집. CLI 컴파일하여 PDF 생산 */
    @Column(name = "typst_source", columnDefinition = "LONGTEXT")
    var typstSource: String? = null,

    /** 정답·해설 Typst 소스 */
    @Column(name = "answer_typst_source", columnDefinition = "LONGTEXT")
    var answerTypstSource: String? = null,

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
@Table(name = "test_paper_statistics")
class TestPaperStatisticsEntity(
    @Id
    @Column(name = "paper_id")
    var paperId: String,

    @Column(name = "submission_count", nullable = false)
    var submissionCount: Int = 0,

    @Column(name = "avg_score")
    var avgScore: Double? = null,

    @Column(name = "max_score")
    var maxScore: Int? = null,

    @Column(name = "min_score")
    var minScore: Int? = null,

    @Column(name = "std_dev")
    var stdDev: Double? = null,

    @Column(name = "grade_stats_json", columnDefinition = "LONGTEXT")
    var gradeStatsJson: String? = null,

    @Column(name = "question_stats_json", columnDefinition = "LONGTEXT")
    var questionStatsJson: String? = null,

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }
}

@Entity
@Table(name = "test_questions")
class TestQuestionEntity(
    @Id
    var id: String,

    @Column(name = "test_id", nullable = false)
    var testId: String,

    @Column(nullable = false)
    var number: Int,

    @Column(nullable = false)
    var type: String = "객관식",

    @Column
    var domain: String? = null,

    @Column(name = "sub_domain")
    var subDomain: String? = null,

    @Column
    var passage: String? = null,

    @Column(columnDefinition = "TEXT")
    var stem: String? = null,

    @Column(nullable = false)
    var points: Int = 0,

    @Column(name = "correct_answer")
    var correctAnswer: String? = null,

    @Column(name = "choices_json", columnDefinition = "TEXT")
    var choicesJson: String? = null,

    @Column(name = "choice_explanations_json", columnDefinition = "TEXT")
    var choiceExplanationsJson: String? = null,

    @Column(columnDefinition = "TEXT")
    var intent: String? = null,

    @Column(name = "essay_keywords_json", columnDefinition = "TEXT")
    var essayKeywordsJson: String? = null,

    @Column(name = "essay_rubric_json", columnDefinition = "TEXT")
    var essayRubricJson: String? = null,

    @Column(name = "model_answer", columnDefinition = "TEXT")
    var modelAnswer: String? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
) {
    @PrePersist
    fun onCreate() {
        createdAt = LocalDateTime.now()
    }
}

@Entity
@Table(
    name = "test_submissions",
    uniqueConstraints = [UniqueConstraint(columnNames = ["test_id", "user_id"])]
)
class TestSubmissionEntity(
    @Id
    var id: String,

    @Column(name = "test_id", nullable = false)
    var testId: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(name = "submitted_by")
    var submittedBy: String? = null,

    @Column(name = "answers_json", columnDefinition = "TEXT")
    var answersJson: String? = null,

    @Column
    var score: Int = 0,

    @Column(name = "correct_count")
    var correctCount: Int = 0,

    @Column(name = "stats_json", columnDefinition = "TEXT")
    var statsJson: String? = null,

    @Column(nullable = false)
    var status: String = "submitted",

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
) {
    @PrePersist
    fun onCreate() {
        createdAt = LocalDateTime.now()
    }
}
