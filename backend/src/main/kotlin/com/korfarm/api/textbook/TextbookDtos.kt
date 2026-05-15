package com.korfarm.api.textbook

data class TextbookCreateRequest(
    val title: String,
    val orgId: String? = null,
    val series: String? = null,
    val level: Int? = null,
    val volume: Int? = null,
    /** 업로드 JSON. 비어 있으면 빈 교재로 시작. */
    val payload: Any? = null,
    /** 업로드 원본 (round-trip 검증용). 보통 payload 와 같지만 다를 수도 있음. */
    val sourceJson: Any? = null,
)

data class TextbookUpdateRequest(
    val title: String? = null,
    val series: String? = null,
    val level: Int? = null,
    val volume: Int? = null,
    val status: String? = null,
)

data class TextbookPayloadRequest(
    val payload: Any,
)

data class TextbookSummary(
    val textbookId: String,
    val orgId: String,
    val title: String,
    val series: String?,
    val level: Int?,
    val volume: Int?,
    val status: String,
    val studentPdfFileId: String?,
    val answerPdfFileId: String?,
    val createdBy: String?,
    val createdAt: String,
    val updatedAt: String,
    /** true 면 본사 교재 (org_hq). 프론트 뱃지 표시용. */
    val hq: Boolean,
)

data class TextbookDetail(
    val textbookId: String,
    val orgId: String,
    val title: String,
    val series: String?,
    val level: Int?,
    val volume: Int?,
    val status: String,
    val studentPdfFileId: String?,
    val answerPdfFileId: String?,
    val payload: Any?,
    val createdBy: String?,
    val createdAt: String,
    val updatedAt: String,
    val hq: Boolean,
)

data class TextbookPdfResult(
    val textbookId: String,
    val studentFileId: String?,
    val studentDownloadUrl: String?,
    val answerFileId: String?,
    val answerDownloadUrl: String?,
)
