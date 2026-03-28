package com.korfarm.api.learning

import com.korfarm.api.paid.ContentRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class ContentCatalogService(
    private val contentRepository: ContentRepository
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
    fun getCatalogByContentType(contentType: String, levelId: String?): List<CatalogItem> {
        val items = if (levelId != null) {
            contentRepository.findByContentTypeAndLevelIdAndStatus(contentType, levelId, "active")
        } else {
            contentRepository.findByContentTypeAndStatus(contentType, "active")
        }
        return items.map { toCatalogItem(it) }
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
