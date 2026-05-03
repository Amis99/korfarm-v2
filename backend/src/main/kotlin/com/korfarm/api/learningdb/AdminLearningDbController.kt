package com.korfarm.api.learningdb

import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

/**
 * 학습 자료DB 통합 admin 컨트롤러.
 * 콘텐츠/테스트/일일학습/프로모드 콘텐츠는 별도 메뉴 — 본 컨트롤러에서 노출하지 않음.
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
        return ApiResponse(success = true, data = service.tree(LearningDbCategory.byKey(cat)))
    }

    @GetMapping("/{cat}/item")
    fun item(
        @PathVariable cat: String,
        @RequestParam id: String
    ): ApiResponse<ItemDto> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(success = true, data = service.item(LearningDbCategory.byKey(cat), id))
    }

    @PutMapping("/{cat}/item")
    fun saveItem(
        @PathVariable cat: String,
        @RequestParam(required = false) id: String?,
        @RequestBody body: Map<String, Any?>
    ): ApiResponse<SaveResultDto> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(
            success = true,
            data = service.saveItem(LearningDbCategory.byKey(cat), id, body)
        )
    }

    @DeleteMapping("/{cat}/item")
    fun deleteItem(
        @PathVariable cat: String,
        @RequestParam id: String
    ): ApiResponse<Map<String, Boolean>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        service.deleteItem(LearningDbCategory.byKey(cat), id)
        return ApiResponse(success = true, data = mapOf("deleted" to true))
    }

    @PostMapping("/{cat}/import")
    fun importBatch(
        @PathVariable cat: String,
        @RequestBody request: ImportRequestDto
    ): ApiResponse<ImportResultDto> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(
            success = true,
            data = service.importBatch(LearningDbCategory.byKey(cat), request)
        )
    }
}
