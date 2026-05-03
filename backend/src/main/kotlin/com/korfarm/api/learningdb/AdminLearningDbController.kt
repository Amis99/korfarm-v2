package com.korfarm.api.learningdb

import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

/**
 * 학습 자료DB 통합 관리 admin endpoint (1차 read-only).
 * 콘텐츠/테스트/일일학습은 별도 메뉴 — 본 컨트롤러에서 노출하지 않음.
 */
@RestController
@RequestMapping("/v1/admin/learning-db")
class AdminLearningDbController(
    private val service: AdminLearningDbService
) {
    @GetMapping("/categories")
    fun listCategories(): ApiResponse<List<CategoryMetaDto>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(success = true, data = service.listCategories())
    }

    @GetMapping("/{cat}/tree")
    fun tree(@PathVariable cat: String): ApiResponse<TreeNodeDto> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val category = LearningDbCategory.byKey(cat)
        return ApiResponse(success = true, data = service.tree(category))
    }

    @GetMapping("/{cat}/item")
    fun item(
        @PathVariable cat: String,
        @RequestParam id: String
    ): ApiResponse<ItemDto> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val category = LearningDbCategory.byKey(cat)
        return ApiResponse(success = true, data = service.item(category, id))
    }
}
