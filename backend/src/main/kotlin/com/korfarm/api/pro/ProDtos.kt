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
    val videoUrl: String?,
    val progressPercent: Int,
    val isTestPassed: Boolean,
    val isAccessible: Boolean
)

data class ProChapterItemView(
    val itemId: String,
    val type: String,
    val contentId: String?,
    val order: Int,
    val label: String?,
    val isLocked: Boolean,
    val isCompleted: Boolean,
    val completedAt: LocalDateTime?,
    val score: Int?,
    /** type='answer' 의 정답·해설 PDF (신규 단순화). null 이면 옛 contents.contentJson */
    val pdfFileId: String? = null
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

data class ProTestStartRequest(
    val chapterId: String,
    val mode: String = "print"
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

data class ProTestStartResponse(
    val sessionId: String,
    val testId: String,
    val mode: String,
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
    val nextAction: String,
    val competencyScores: Map<String, CompetencyScore>? = null
)

data class CompetencyScore(
    val correct: Int,
    val total: Int,
    val accuracy: Double
)

data class ProTestStatusResponse(
    val activeSession: ProTestSessionView?,
    val history: List<ProTestSessionView>,
    val remainingVersions: Int,
    val isTestPassed: Boolean
)

data class ProTestSessionView(
    val sessionId: String,
    val testId: String,
    val version: Int,
    val status: String,
    val mode: String,
    val score: Int?,
    val totalPoints: Int? = null,
    val printedAt: LocalDateTime?,
    val omrDeadline: LocalDateTime?,
    val remainingMinutes: Long,
    val createdAt: LocalDateTime,
    val competencyScores: Map<String, CompetencyScore>? = null
)

// ─── 관리자용 요청 ───

data class CreateProChapterRequest(
    val levelId: String,
    val bookNumber: Int,
    val chapterNumber: Int,
    val globalChapterNumber: Int,
    val title: String,
    val description: String? = null,
    val videoUrl: String? = null
)

data class UpdateProChapterRequest(
    val title: String? = null,
    val description: String? = null,
    val status: String? = null,
    val videoUrl: String? = null
)

data class SetProChapterItemsRequest(
    val items: List<ProChapterItemInput>
)

data class ProChapterItemInput(
    val type: String,
    val contentId: String? = null,
    val order: Int,
    val label: String? = null
)

data class RegisterProChapterTestRequest(
    val version: Int,
    val testPaperId: String
)

// 모범답안 응답
data class AnswerKeyResponse(
    val contentId: String,
    val title: String,
    val payload: String?,
    /** 신규 단순화 — pdfFileId 가 있으면 학생 화면에서 PDF 우선 표시 */
    val pdfFileId: String? = null
)

// ─── 관리자용 콘텐츠 현황/정답해설 DTO ───

data class ChapterContentStatusResponse(
    val chapterId: String,
    val title: String,
    val levelId: String,
    val chapterNumber: Int,
    val items: List<ContentTypeStatus>,
    val testVersions: List<TestVersionInfo>
)

data class ContentTypeStatus(
    val type: String,
    val count: Int,
    val contents: List<LinkedContentInfo>
)

data class LinkedContentInfo(
    val contentId: String,
    val title: String,
    val updatedAt: LocalDateTime?
)

data class TestVersionInfo(
    val version: Int,
    val testPaperId: String,
    val status: String,
    val pdfFileId: String? = null
)

data class AdminAnswerContentResponse(
    val contentId: String?,
    val title: String?,
    val payload: String?,
    val lastUpdatedAt: LocalDateTime?,
    /** 신규 단순화 — pdfFileId 가 있으면 PDF 우선 표시 */
    val pdfFileId: String? = null
)

data class UpdateAnswerContentRequest(
    val title: String,
    val payload: Map<String, Any>
)
