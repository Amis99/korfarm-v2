package com.korfarm.api.learning

data class CatalogItem(
    val contentId: String,
    val contentType: String,
    val title: String,
    val levelId: String?,
    val area: String?,
    val subArea: String?,
    val dayIndex: Int?,
    val moduleKey: String?,
    val status: String,
    val videoUrl: String? = null
)

data class FarmCatalog(
    val area: String,
    val items: List<CatalogItem>,
    val totalCount: Int
)

data class CatalogResponse(
    val farms: List<FarmCatalog>,
    val totalCount: Int
)
