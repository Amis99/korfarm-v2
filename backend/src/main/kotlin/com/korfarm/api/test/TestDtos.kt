package com.korfarm.api.test

import java.time.LocalDateTime

// ── Student: Test list ──
data class TestPaperSummary(
    val testId: String,
    val title: String,
    val description: String?,
    val levelId: String?,
    val totalQuestions: Int,
    val totalPoints: Int,
    val timeLimitMinutes: Int?,
    val examDate: String?,
    val series: String?,
    val orgId: String?,
    val orgName: String?,
    val hasSubmitted: Boolean,
    val score: Int?,
    val createdAt: LocalDateTime
)

// ── Student: Test detail ──
data class TestPaperDetail(
    val testId: String,
    val title: String,
    val description: String?,
    val pdfFileId: String?,
    val levelId: String?,
    val totalQuestions: Int,
    val totalPoints: Int,
    val timeLimitMinutes: Int?,
    val examDate: String?,
    val series: String?,
    val hasQuestions: Boolean,
    val hasSubmitted: Boolean,
    val createdAt: LocalDateTime
)

// ── Admin: Question view ──
data class TestQuestionView(
    val questionId: String,
    val number: Int,
    val type: String,
    val domain: String?,
    val subDomain: String?,
    val passage: String?,
    val points: Int,
    val correctAnswer: String?,
    val choiceExplanations: Map<String, String>?,
    val intent: String?
)

// ── Student: Question stubs (no correct answer) ──
data class TestQuestionStub(
    val number: Int,
    val type: String,
    val domain: String?,
    val points: Int
)

// ── Student: OMR submit request ──
data class SubmitOmrRequest(
    val answers: Map<String, String>,
    val userId: String? = null
)

// ── Student: Report (성적표) ──
data class TestReportResponse(
    val testId: String,
    val testTitle: String,
    val totalQuestions: Int,
    val totalPoints: Int,
    val score: Int,
    val correctCount: Int,
    val accuracy: Double,
    val submittedAt: LocalDateTime,
    val details: List<QuestionResult>,
    val domainScores: Map<String, DomainScore>
)

data class QuestionResult(
    val questionNumber: Int,
    val type: String,
    val domain: String?,
    val passage: String?,
    val myAnswer: String,
    val correctAnswer: String,
    val isCorrect: Boolean,
    val points: Int,
    val earnedPoints: Int,
    val choiceExplanation: String?,
    val intent: String?
)

data class DomainScore(
    val score: Int,
    val maxScore: Int,
    val correct: Int,
    val total: Int
)

// ── Student: Wrong note (오답 노트) ──
data class WrongNoteResponse(
    val testId: String,
    val testTitle: String,
    val wrongItems: List<WrongNoteItem>
)

data class WrongNoteItem(
    val questionNumber: Int,
    val type: String,
    val domain: String?,
    val passage: String?,
    val myAnswer: String,
    val correctAnswer: String,
    val points: Int,
    val intent: String?,
    val feedback: String
)

// ── Admin: Create test ──
data class CreateTestRequest(
    val title: String,
    val description: String? = null,
    val levelId: String? = null,
    val totalQuestions: Int = 0,
    val totalPoints: Int = 0,
    val timeLimitMinutes: Int? = null,
    val examDate: String? = null,
    val series: String? = null
)

// ── Admin: Update test ──
data class UpdateTestRequest(
    val title: String? = null,
    val description: String? = null,
    val levelId: String? = null,
    val totalQuestions: Int? = null,
    val totalPoints: Int? = null,
    val timeLimitMinutes: Int? = null,
    val examDate: String? = null,
    val series: String? = null,
    val status: String? = null
)

// ── Admin: Set questions ──
data class SetQuestionsRequest(
    val questions: List<QuestionInput>
)

data class QuestionInput(
    val number: Int,
    val type: String = "객관식",
    val domain: String? = null,
    val subDomain: String? = null,
    val passage: String? = null,
    val points: Int = 0,
    val correctAnswer: String? = null,
    val choiceExplanations: Map<String, String>? = null,
    val intent: String? = null
)

// ── Admin: Submission summary ──
data class SubmissionSummary(
    val userId: String,
    val userName: String?,
    val score: Int,
    val correctCount: Int,
    val accuracy: Double,
    val submittedBy: String?,
    val submittedAt: LocalDateTime
)

// ── Student: History ──
data class TestHistoryItem(
    val testId: String,
    val testTitle: String,
    val examDate: String?,
    val score: Int,
    val totalPoints: Int,
    val correctCount: Int,
    val totalQuestions: Int,
    val accuracy: Double,
    val submittedAt: LocalDateTime
)

// ── Admin: Student list for answer entry ──
data class StudentForTest(
    val userId: String,
    val name: String?,
    val hasSubmitted: Boolean,
    val score: Int?
)
