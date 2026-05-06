package com.korfarm.api.classification

import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * 분류 마스터 + 콘텐츠/문항 매핑 API.
 * - 트리 조회: HQ + ORG (양쪽 어드민이 분류 입력 시 같은 카탈로그 사용)
 * - 콘텐츠 매핑 PUT: 본사가 콘텐츠 풀 분류 — HQ 전용
 * - 시험 문항 매핑 PUT: 본 기관 + 본사 (자기가 만든 시험 분류)
 */
@RestController
@RequestMapping("/v1/admin/classifications")
class ClassificationController(
    private val service: ClassificationService,
) {
    @GetMapping("/tree")
    fun getTree(): ApiResponse<ClassificationTree> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        return ApiResponse(success = true, data = service.getTree())
    }

    @GetMapping("/all")
    fun listAll(): ApiResponse<List<ClassificationFlatView>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val data = service.listAll().map {
            ClassificationFlatView(
                code = it.code, type = it.type, parentCode = it.parentCode,
                labelKo = it.labelKo, sortOrder = it.sortOrder,
            )
        }
        return ApiResponse(success = true, data = data)
    }

    @GetMapping("/contents/{contentId}")
    fun getForContent(@PathVariable contentId: String): ApiResponse<List<ContentClassificationView>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        return ApiResponse(success = true, data = service.getContentClassifications(contentId))
    }

    @PutMapping("/contents/{contentId}")
    fun putForContent(@PathVariable contentId: String, @RequestBody req: ReplaceRequest): ApiResponse<List<ContentClassificationView>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        service.replaceContentClassifications(contentId, req.items)
        return ApiResponse(success = true, data = service.getContentClassifications(contentId))
    }

    @GetMapping("/test-questions/{questionId}")
    fun getForTestQuestion(@PathVariable questionId: String): ApiResponse<List<ContentClassificationView>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        return ApiResponse(success = true, data = service.getTestQuestionClassifications(questionId))
    }

    @PutMapping("/test-questions/{questionId}")
    fun putForTestQuestion(@PathVariable questionId: String, @RequestBody req: ReplaceRequest): ApiResponse<List<ContentClassificationView>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        service.replaceTestQuestionClassifications(questionId, req.items)
        return ApiResponse(success = true, data = service.getTestQuestionClassifications(questionId))
    }
}

data class ClassificationFlatView(
    val code: String, val type: String, val parentCode: String?,
    val labelKo: String, val sortOrder: Int,
)

data class ReplaceRequest(
    val items: List<ClassificationItemRequest>,
)
