package com.korfarm.api.pro

import java.time.LocalDateTime

// ─── 학생용 응답 ───

data class ProChapterSummary(
    val chapterId: String,
    val levelId: String,
    val bookNumber: Int,
    val chapterNumber: Int,
    val globalChapterNumber: Int,
    val title: String,
    val description: String?,
    val progressPercent: Int,
    val isTestPassed: Boolean,
    val isAccessible: Boolean
)

data class ProChapterItemView(
    val itemId: String,
    val type: String,
    val contentId: String?,
    val order: Int,
    val isLocked: Boolean,
    val isCompleted: Boolean,
    val completedAt: LocalDateTime?,
    val score: Int?
)

data class ProCompleteRequest(
    val itemId: String
)

data class ProCompleteResponse(
    val success: Boolean,
    val seedReward: Int,
    val seedType: String,
    val unlocked: List<String>
)

data class ProTestPrintRequest(
    val chapterId: String
)

data class ProTestPrintResponse(
    val sessionId: String,
    val testId: String,
    val pdfFileId: String?,
    val omrDeadline: LocalDateTime,
    val remainingMinutes: Long,
    val totalQuestions: Int,
    val totalPoints: Int
)

data class ProTestSubmitRequest(
    val sessionId: String,
    val answers: Map<String, String>
)

data class ProTestSubmitResponse(
    val score: Int,
    val totalPoints: Int,
    val passed: Boolean,
    val nextAction: String
)

data class ProTestStatusResponse(
    val activeSession: ProTestSessionView?,
    val history: List<ProTestSessionView>,
    val remainingVersions: Int,
    val isTestPassed: Boolean
)

data class ProTestSessionView(
    val sessionId: String,
    val version: Int,
    val status: String,
    val score: Int?,
    val printedAt: LocalDateTime?,
    val omrDeadline: LocalDateTime?,
    val createdAt: LocalDateTime
)

// ─── 관리자용 요청 ───

data class CreateProChapterRequest(
    val levelId: String,
    val bookNumber: Int,
    val chapterNumber: Int,
    val globalChapterNumber: Int,
    val title: String,
    val description: String? = null
)

data class UpdateProChapterRequest(
    val title: String? = null,
    val description: String? = null,
    val status: String? = null
)

data class SetProChapterItemsRequest(
    val items: List<ProChapterItemInput>
)

data class ProChapterItemInput(
    val type: String,
    val contentId: String? = null,
    val order: Int
)

data class RegisterProChapterTestRequest(
    val version: Int,
    val testPaperId: String
)
