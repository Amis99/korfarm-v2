package com.korfarm.api.learningdb

/**
 * 학습 자료DB 카테고리.
 * 제외: 콘텐츠(`/admin/content`) · 테스트(`/admin/tests`) · 일일학습 · 프로모드 콘텐츠/테스트(`/admin/pro/...`)
 */
enum class LearningDbCategory(
    val key: String,
    val label: String,
    val storage: String,
    val readOnly: Boolean = false
) {
    CORPUS("corpus", "말뭉치", "DB"),
    CONCEPT("concept", "학습 개념", "DB"),
    MANUSCRIPT("manuscript", "매니스크립트", "DB", readOnly = true),
    QB("qb", "문제은행", "DB"),
    WISDOM_POSTS("wisdom-posts", "위즈덤 포스트", "DB"),
    WISDOM_TOPICS("wisdom-topics", "위즈덤 토픽 (파일)", "FILE", readOnly = true),
    AI_LOG("ai-log", "AI 생성 로그", "DB", readOnly = true),
    AI_PROMPT("ai-prompt", "AI 첨삭 프롬프트", "DB"),
    AI_FEEDBACK("ai-feedback", "AI 첨삭 작업", "DB", readOnly = true),
    FARM_LOG("farm-log", "학습 로그", "DB", readOnly = true);

    companion object {
        fun byKey(key: String): LearningDbCategory =
            values().firstOrNull { it.key == key }
                ?: throw IllegalArgumentException("unknown category: $key")
    }
}

data class CategoryMetaDto(
    val key: String,
    val label: String,
    val storage: String,
    val readOnly: Boolean
)

/** 좌측 트리 노드. type: category / folder / db-row / file */
data class TreeNodeDto(
    val id: String,
    val type: String,
    val storage: String,
    val label: String,
    val meta: Map<String, Any?>? = null,
    val children: List<TreeNodeDto>? = null
)

/** 우측 에디터에 띄울 단일 항목 */
data class ItemDto(
    val category: String,
    val id: String,
    val storage: String,
    val data: Any
)

/** 저장 응답 */
data class SaveResultDto(
    val category: String,
    val id: String,
    val created: Boolean
)

/** 배치 import 요청 */
data class ImportRequestDto(
    val items: List<ImportItemDto>,
    val mode: String = "upsert" // create | upsert | merge
)

data class ImportItemDto(
    val id: String? = null,
    val data: Map<String, Any?>
)

data class ImportResultDto(
    val total: Int,
    val ok: Int,
    val failed: Int,
    val results: List<ImportRowResultDto>
)

data class ImportRowResultDto(
    val index: Int,
    val id: String?,
    val success: Boolean,
    val created: Boolean = false,
    val error: String? = null
)
