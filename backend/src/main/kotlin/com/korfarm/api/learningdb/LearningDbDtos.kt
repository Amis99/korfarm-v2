package com.korfarm.api.learningdb

/**
 * 학습 자료 DB — 영역.
 * 출제·교재 제작에 활용할 raw 자료의 1차 분류.
 */
enum class LearningArea(val key: String, val label: String) {
    READING("reading", "독서(비문학)"),
    LITERATURE("literature", "문학"),
    GRAMMAR("grammar", "문법"),
    VOCAB("vocab", "어휘"),
    SPEAKING("speaking", "화법"),
    WRITING("writing", "작문"),
    MEDIA("media", "매체");

    companion object {
        fun byKey(key: String): LearningArea =
            values().firstOrNull { it.key == key }
                ?: throw IllegalArgumentException("unknown area: $key")
    }
}

/**
 * 학습 자료 DB — 자료 종류.
 */
enum class LearningKind(val key: String, val label: String) {
    COMMENTARY("commentary", "해설서"),
    QUESTION_BANK("question-bank", "문제은행"),
    QUESTION_ANALYSIS("question-analysis", "문제분석");

    companion object {
        fun byKey(key: String): LearningKind =
            values().firstOrNull { it.key == key }
                ?: throw IllegalArgumentException("unknown kind: $key")
    }
}

data class AreaMetaDto(val key: String, val label: String)
data class KindMetaDto(val key: String, val label: String)
data class LearningDataMetaDto(
    val areas: List<AreaMetaDto>,
    val kinds: List<KindMetaDto>
)

/** 트리 노드. type: root/area/subArea/kind/file */
data class LearningDataNodeDto(
    val type: String,
    val key: String,
    val label: String,
    val path: String,
    val children: List<LearningDataNodeDto>? = null,
    val meta: Map<String, Any?>? = null
)

data class FileSaveResultDto(
    val path: String,
    val size: Long,
    val created: Boolean
)

data class FileImportItemDto(
    val area: String,
    val subArea: String,
    val kind: String,
    val filename: String,
    val data: Any? = null
)

data class FileImportRequestDto(
    val items: List<FileImportItemDto>
)

data class FileImportResultDto(
    val total: Int,
    val ok: Int,
    val failed: Int,
    val okPaths: List<String>,
    val errors: List<Map<String, Any?>>
)
