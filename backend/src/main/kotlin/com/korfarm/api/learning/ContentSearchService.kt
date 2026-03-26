package com.korfarm.api.learning

import com.korfarm.api.paid.ContentRepository
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.stereotype.Service

@Service
class ContentSearchService(
    private val contentRepository: ContentRepository
) {
    fun search(
        keyword: String,
        contentType: String?,
        levelId: String?,
        area: String?,
        page: Int,
        size: Int
    ): ContentSearchResponse {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"))
        val likeKeyword = "%$keyword%"

        val resultPage = contentRepository.searchByKeyword(
            keyword = likeKeyword,
            contentType = contentType,
            levelId = levelId,
            area = area,
            pageable = pageable
        )

        val items = resultPage.content.map { entity ->
            ContentSearchResult(
                contentId = entity.id,
                contentType = entity.contentType,
                title = entity.title,
                levelId = entity.levelId,
                area = entity.area,
                subArea = entity.subArea,
                dayIndex = entity.dayIndex,
                moduleKey = entity.moduleKey
            )
        }

        return ContentSearchResponse(
            items = items,
            totalCount = resultPage.totalElements,
            page = page,
            size = size,
            totalPages = resultPage.totalPages
        )
    }
}
