package com.korfarm.api.questionbank

import java.time.LocalDateTime

// ── 코드표 DTO ──

data class CodeGroupView(
    val id: String,
    val group_key: String,
    val label: String,
    val sort_order: Int,
    val values: List<CodeValueView>
)

data class CodeValueView(
    val id: String,
    val group_id: String,
    val value: String,
    val label: String,
    val sort_order: Int,
    val is_active: Boolean
)

data class CreateCodeGroupRequest(
    val group_key: String,
    val label: String,
    val sort_order: Int? = null
)

data class UpdateCodeGroupRequest(
    val label: String? = null,
    val sort_order: Int? = null
)

data class CreateCodeValueRequest(
    val group_id: String,
    val value: String,
    val label: String,
    val sort_order: Int? = null
)

data class UpdateCodeValueRequest(
    val label: String? = null,
    val sort_order: Int? = null,
    val is_active: Boolean? = null
)

// ── 레코드 DTO ──

data class RecordSummaryView(
    val id: String,
    val record_code: String,
    val source_type: String?,
    val exam_org: String?,
    val exam_year: Int?,
    val area: String?,
    val sub_area: String?,
    val title: String?,
    val difficulty: Int?,
    val author: String?,
    val status: String,
    val question_count: Long,
    val created_at: LocalDateTime,
    val updated_at: LocalDateTime
)

data class RecordDetailView(
    val id: String,
    val record_code: String,
    val source_type: String?,
    val exam_org: String?,
    val exam_year: Int?,
    val exam_month: Int?,
    val area: String?,
    val sub_area: String?,
    val title: String?,
    val target_grades: Any?,
    val difficulty: Int?,
    val tags: Any?,
    val author: String?,
    val status: String,
    val meta_json: Any?,
    val passages: List<PassageView>,
    val questions: List<QuestionView>,
    val created_at: LocalDateTime,
    val updated_at: LocalDateTime
)

data class PassageView(
    val id: String,
    val passage_code: String,
    val ref_type: String?,
    val title: String?,
    val body_text: String,
    val sub_passages: Any?,
    val box_items: Any?,
    val sort_order: Int
)

data class QuestionView(
    val id: String,
    val question_number: Int,
    val passage_refs: Any?,
    val question_format: String?,
    val answer_type: String?,
    val question_type: String?,
    val stem: String,
    val box_items: Any?,
    val choices: Any?,
    val correct_answer: String?,
    val difficulty: Int?,
    val explanation: String?,
    val applied_concepts: Any?,
    val choice_pattern: String?,
    val scoring_criteria: Any?,
    val points: Int?,
    val sort_order: Int
)

// ── 임포트 DTO ──

data class QbImportRequest(
    val schema_version: String? = "1.0",
    val records: List<QbImportRecord>
)

data class QbImportRecord(
    val record_code: String? = null,
    val source_type: String? = null,
    val exam_org: String? = null,
    val exam_year: Int? = null,
    val exam_month: Int? = null,
    val area: String? = null,
    val sub_area: String? = null,
    val title: String? = null,
    val target_grades: List<String>? = null,
    val difficulty: Int? = null,
    val tags: List<String>? = null,
    val author: String? = null,
    val meta: Map<String, Any?>? = null,
    val passages: List<QbImportPassage>? = null,
    val questions: List<QbImportQuestion>? = null
)

data class QbImportPassage(
    val passage_code: String? = null,
    val ref_type: String? = null,
    val title: String? = null,
    val body_text: String,
    val sub_passages: List<Map<String, Any?>>? = null,
    val box_items: List<Map<String, Any?>>? = null
)

data class QbImportQuestion(
    val question_number: Int,
    val passage_refs: List<String>? = null,
    val question_format: String? = null,
    val answer_type: String? = null,
    val question_type: String? = null,
    val stem: String,
    val box_items: List<Map<String, Any?>>? = null,
    val choices: List<Map<String, Any?>>? = null,
    val correct_answer: String? = null,
    val difficulty: Int? = null,
    val explanation: String? = null,
    val applied_concepts: List<String>? = null,
    val choice_pattern: String? = null,
    val scoring_criteria: List<Map<String, Any?>>? = null,
    val points: Int? = null
)

data class QbImportResult(
    val imported: Int,
    val failed: Int,
    val results: List<QbImportItemResult>
)

data class QbImportItemResult(
    val index: Int,
    val record_id: String? = null,
    val record_code: String? = null,
    val success: Boolean,
    val error: String? = null
)

// ── 레코드 수정 DTO ──

data class UpdateRecordRequest(
    val source_type: String? = null,
    val exam_org: String? = null,
    val exam_year: Int? = null,
    val exam_month: Int? = null,
    val area: String? = null,
    val sub_area: String? = null,
    val title: String? = null,
    val target_grades: List<String>? = null,
    val difficulty: Int? = null,
    val tags: List<String>? = null,
    val author: String? = null,
    val status: String? = null,
    val meta: Map<String, Any?>? = null,
    val passages: List<QbImportPassage>? = null,
    val questions: List<QbImportQuestion>? = null
)

// ── 내보내기 DTO ──

data class QbExportRequest(
    val record_ids: List<String>
)
