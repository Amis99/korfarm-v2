package com.korfarm.api.learningdb

/**
 * 학습 자료DB 7개 카테고리. 콘텐츠(`/admin/content`)·테스트(`/admin/tests`)·일일학습(콘텐츠 메뉴 소관)은 제외.
 */
enum class LearningDbCategory(val key: String, val label: String, val storage: String) {
    CORPUS("corpus", "말뭉치", "DB"),
    QB("qb", "문제은행", "DB"),
    WISDOM("wisdom", "위즈덤", "MIXED"),
    FARM_LOG("farm-log", "학습로그", "DB"),
    PRO("pro", "프로 챕터", "DB"),
    MANUSCRIPT("manuscript", "매니스크립트", "DB"),
    MISC("misc", "학습 개념·기타", "MIXED");

    companion object {
        fun byKey(key: String): LearningDbCategory =
            values().firstOrNull { it.key == key }
                ?: throw IllegalArgumentException("unknown category: $key")
    }
}

data class CategoryMetaDto(
    val key: String,
    val label: String,
    val storage: String
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
