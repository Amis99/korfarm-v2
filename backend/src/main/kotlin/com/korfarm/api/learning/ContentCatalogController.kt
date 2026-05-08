package com.korfarm.api.learning

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.paid.ContentPreview
import com.korfarm.api.paid.ContentRepository
import com.korfarm.api.paid.ContentVersionRepository
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/learning")
class ContentCatalogController(
    private val catalogService: ContentCatalogService,
    private val contentRepository: ContentRepository,
    private val contentVersionRepository: ContentVersionRepository,
    private val objectMapper: ObjectMapper
) {
    // 전체 카탈로그 (농장별 그룹)
    @GetMapping("/catalog")
    fun getCatalog(): ApiResponse<CatalogResponse> {
        val data = catalogService.getCatalog()
        return ApiResponse(success = true, data = data)
    }

    // 농장(area)별 콘텐츠 목록
    @GetMapping("/catalog/{area}")
    fun getCatalogByArea(
        @PathVariable area: String,
        @RequestParam(required = false) levelId: String?,
        @RequestParam(required = false) contentType: String?,
        @RequestParam(required = false) search: String?,
        @RequestParam(required = false) subArea: String?
    ): ApiResponse<List<CatalogItem>> {
        val data = if (contentType != null) {
            // 콤마 구분 다중 카테고리 지원: ?contentType=A,B,C → JSON_OVERLAPS 매칭
            val types = contentType.split(",").map { it.trim() }.filter { it.isNotBlank() }
            if (types.size > 1) {
                catalogService.getCatalogByContentTypes(types, levelId, search, subArea)
            } else {
                catalogService.getCatalogByContentType(types.first(), levelId, search, subArea)
            }
        } else {
            catalogService.getCatalogByArea(area, levelId, search, subArea)
        }
        return ApiResponse(success = true, data = data)
    }

    // 콘텐츠 서빙: content_versions 최신 JSON 반환
    @GetMapping("/content/{contentId}")
    fun getContent(@PathVariable contentId: String): ApiResponse<ContentPreview> {
        val content = contentRepository.findById(contentId).orElseThrow {
            ApiException("NOT_FOUND", "콘텐츠를 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        val version = contentVersionRepository.findTopByContentIdOrderByCreatedAtDesc(contentId)
            ?: throw ApiException("NOT_FOUND", "콘텐츠 버전을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        val contentMap: Map<String, Any> = objectMapper.readValue(
            version.contentJson,
            object : TypeReference<Map<String, Any>>() {}
        )
        // categories(JSON array string) → List<String> 파싱. fallback: contentType 단일 값
        val categories: List<String> = try {
            val raw = content.categories
            if (raw.isNullOrBlank()) listOf(content.contentType)
            else objectMapper.readValue(raw, object : TypeReference<List<String>>() {})
        } catch (e: Exception) {
            listOf(content.contentType)
        }
        return ApiResponse(
            success = true,
            data = ContentPreview(
                contentId = content.id,
                contentType = categories,
                moduleKey = content.moduleKey,
                levelId = content.levelId,
                chapterId = content.chapterId,
                area = content.area,
                subArea = content.subArea,
                dayIndex = content.dayIndex,
                title = content.title,
                status = content.status,
                videoUrl = content.videoUrl,
                schemaVersion = version.schemaVersion,
                content = contentMap
            )
        )
    }
}
