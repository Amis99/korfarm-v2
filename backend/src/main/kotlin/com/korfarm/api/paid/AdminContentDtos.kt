package com.korfarm.api.paid

import java.time.LocalDateTime

data class AdminContentImportResult(
    val contentId: String,
    val versionId: String
)

data class AdminContentSummary(
    val contentId: String,
    /** 다중 분류 카테고리 array (예: ["DAILY_READING","READING"]) */
    val contentType: List<String>,
    val levelId: String?,
    val chapterId: String?,
    val dayIndex: Int? = null,
    val area: String? = null,
    val subArea: String? = null,
    val title: String,
    val status: String,
    val videoUrl: String? = null,
    /** 가장 최근 수정자 user_id (content_edit_logs 최근 row). 수정 이력 없으면 null */
    val lastEditorId: String? = null,
    val lastEditorName: String? = null,
    /** 본문/문제 검색 결과의 매칭 컨텍스트(전후 ±20자). 검색 endpoint 응답에만 포함, 일반 목록에서는 null */
    val matchSnippet: String? = null
)

data class ContentPreview(
    val contentId: String,
    /** 다중 분류 카테고리 array */
    val contentType: List<String>,
    val moduleKey: String?,
    val levelId: String?,
    val chapterId: String?,
    val area: String?,
    val subArea: String?,
    val dayIndex: Int?,
    val title: String,
    val status: String,
    val videoUrl: String?,
    val schemaVersion: String,
    val content: Map<String, Any>
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

// 배치 Import DTO
data class AdminContentBatchImportRequest(
    val items: List<BatchImportItem>
)

data class BatchImportItem(
    /** 다중 분류 카테고리 array */
    val contentType: List<String>,
    val levelId: String? = null,
    val area: String? = null,
    val subArea: String? = null,
    val dayIndex: Int? = null,
    val moduleKey: String? = null,
    val schemaVersion: String = "1.0",
    val content: Map<String, Any>
)

data class BatchItemResult(
    val index: Int,
    val contentId: String? = null,
    val success: Boolean,
    val error: String? = null
)

data class AdminContentBatchImportResult(
    val imported: Int,
    val failed: Int,
    val results: List<BatchItemResult>
)

data class ContentEditLogDto(
    val id: String,
    val contentId: String,
    val contentTitle: String?,
    val editorId: String,
    val editorName: String?,
    val action: String,
    val summary: String?,
    val versionId: String?,
    val createdAt: LocalDateTime
)

data class AdminUserDto(
    val userId: String,
    val email: String,
    val name: String?,
    val editCount: Int,
    val lastEditAt: LocalDateTime?
)

data class ManuscriptSummary(
    val contentId: String,
    val levelId: String?,
    val dayIndex: Int?,
    val title: String
)
