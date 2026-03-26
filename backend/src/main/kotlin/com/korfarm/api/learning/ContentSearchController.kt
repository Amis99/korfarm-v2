package com.korfarm.api.learning

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/learning")
class ContentSearchController(
    private val searchService: ContentSearchService
) {
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('PAID','PREMIUM','HQ_ADMIN','ORG_ADMIN')")
    fun search(
        @RequestParam q: String,
        @RequestParam(required = false) contentType: String?,
        @RequestParam(required = false) levelId: String?,
        @RequestParam(required = false) area: String?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ApiResponse<ContentSearchResponse> {
        if (q.length < 2) {
            throw ApiException("BAD_REQUEST", "검색어는 2자 이상 입력해주세요", HttpStatus.BAD_REQUEST)
        }
        val clampedSize = size.coerceIn(1, 50)
        val data = searchService.search(q, contentType, levelId, area, page, clampedSize)
        return ApiResponse(success = true, data = data)
    }
}
