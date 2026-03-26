package com.korfarm.api.learning

data class ContentSearchResult(
    val contentId: String,
    val contentType: String,
    val title: String,
    val levelId: String?,
    val area: String?,
    val subArea: String?,
    val dayIndex: Int?,
    val moduleKey: String?
)

data class ContentSearchResponse(
    val items: List<ContentSearchResult>,
    val totalCount: Long,
    val page: Int,
    val size: Int,
    val totalPages: Int
)
