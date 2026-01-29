package com.korfarm.api.paid

import java.time.LocalDateTime

data class AdminContentImportResult(
    val contentId: String,
    val versionId: String
)

data class AdminContentSummary(
    val contentId: String,
    val contentType: String,
    val levelId: String?,
    val chapterId: String?,
    val title: String,
    val status: String
)

data class ContentPreview(
    val contentId: String,
    val contentType: String,
    val levelId: String?,
    val chapterId: String?,
    val title: String,
    val status: String,
    val schemaVersion: String,
    val content: Map<String, Any>
)

data class WritingFeedbackView(
    val feedbackId: String,
    val submissionId: String,
    val reviewerId: String,
    val comment: String?,
    val createdAt: LocalDateTime
)

data class AdminWritingSubmissionSummary(
    val submissionId: String,
    val userId: String,
    val studentName: String,
    val promptId: String,
    val status: String,
    val submittedAt: LocalDateTime?
)

data class TestPaperView(
    val testId: String,
    val title: String,
    val status: String
)

data class TestAnswerKeyView(
    val testId: String,
    val answerKeyId: String,
    val createdAt: LocalDateTime
)

data class TestGradeResult(
    val resultId: String,
    val score: Int,
    val total: Int,
    val correct: Int,
    val gradedAt: LocalDateTime
)
