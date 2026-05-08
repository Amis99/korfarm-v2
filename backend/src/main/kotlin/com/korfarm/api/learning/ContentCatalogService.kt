package com.korfarm.api.learning

import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.paid.ContentRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class ContentCatalogService(
    private val contentRepository: ContentRepository,
    private val objectMapper: ObjectMapper
) {
    @Transactional(readOnly = true)
    fun getCatalog(): CatalogResponse {
        val all = contentRepository.findByStatus("active")
        val grouped = all.groupBy { it.area ?: "unknown" }
        val farms = grouped.map { (area, items) ->
            FarmCatalog(
                area = area,
                items = items.map { toCatalogItem(it) },
                totalCount = items.size
            )
        }.sortedBy { it.area }
        return CatalogResponse(farms = farms, totalCount = all.size)
    }

    @Transactional(readOnly = true)
    fun getCatalogByArea(area: String, levelId: String?, search: String? = null, subArea: String? = null): List<CatalogItem> {
        val items = if (levelId != null) {
            contentRepository.findByAreaAndLevelIdAndStatus(area, levelId, "active")
        } else {
            contentRepository.findByAreaAndStatus(area, "active")
        }
        var filtered = items
        if (!search.isNullOrBlank()) {
            val term = search.trim().lowercase()
            filtered = filtered.filter { it.title.lowercase().contains(term) }
        }
        if (!subArea.isNullOrBlank()) {
            filtered = filtered.filter { it.subArea == subArea }
        }
        return filtered.map { toCatalogItem(it) }
    }

    @Transactional(readOnly = true)
    fun getCatalogByContentType(contentType: String, levelId: String?, search: String? = null, subArea: String? = null): List<CatalogItem> {
        val items = if (levelId != null) {
            contentRepository.findByCategoryAndLevelIdAndStatus(contentType, levelId, "active")
        } else {
            contentRepository.findByCategoryAndStatus(contentType, "active")
        }
        var filtered = items
        if (!search.isNullOrBlank()) {
            val term = search.trim().lowercase()
            filtered = filtered.filter { it.title.lowercase().contains(term) }
        }
        if (!subArea.isNullOrBlank()) {
            filtered = filtered.filter { it.subArea == subArea }
        }
        return filtered.map { toCatalogItem(it) }
    }

    /**
     * 다중 카테고리 OR 검색.
     * 콘텐츠의 content_type 또는 categories(JSON 배열)에 contentTypes 중 하나라도 매칭되면 노출.
     * 예: 이야기 농장(STORY+READING)에서 categories=["READING","STORY"] 콘텐츠가 양쪽에 노출.
     * 결과는 contentId 기준 중복 제거.
     */
    @Transactional(readOnly = true)
    fun getCatalogByContentTypes(contentTypes: List<String>, levelId: String?, search: String? = null, subArea: String? = null): List<CatalogItem> {
        if (contentTypes.isEmpty()) return emptyList()
        val ctsJson = objectMapper.writeValueAsString(contentTypes)
        val items = if (levelId != null) {
            contentRepository.findByCategoriesInAndLevelIdAndStatus(contentTypes, ctsJson, levelId, "active")
        } else {
            contentRepository.findByCategoriesInAndStatus(contentTypes, ctsJson, "active")
        }
        var filtered = items.distinctBy { it.id }
        if (!search.isNullOrBlank()) {
            val term = search.trim().lowercase()
            filtered = filtered.filter { it.title.lowercase().contains(term) }
        }
        if (!subArea.isNullOrBlank()) {
            filtered = filtered.filter { it.subArea == subArea }
        }
        return filtered.map { toCatalogItem(it) }
    }

    private fun toCatalogItem(entity: com.korfarm.api.paid.ContentEntity) = CatalogItem(
        contentId = entity.id,
        contentType = entity.contentType,
        title = entity.title,
        levelId = entity.levelId,
        area = entity.area,
        subArea = entity.subArea,
        dayIndex = entity.dayIndex,
        moduleKey = entity.moduleKey,
        status = entity.status,
        videoUrl = entity.videoUrl
    )
}
