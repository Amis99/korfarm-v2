package com.korfarm.api.textbook

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.security.SecurityUtils
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/admin/textbooks")
class AdminTextbookController(
    private val textbookService: TextbookService,
) {
    private fun requireAdmin() {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
    }

    private fun currentUser(): String =
        SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)

    @GetMapping
    fun list(): ApiResponse<List<TextbookSummary>> {
        requireAdmin()
        return ApiResponse(success = true, data = textbookService.listForAdmin(currentUser()))
    }

    @PostMapping
    fun create(@RequestBody request: TextbookCreateRequest): ApiResponse<TextbookDetail> {
        requireAdmin()
        return ApiResponse(success = true, data = textbookService.create(request, currentUser()))
    }

    @GetMapping("/{textbookId}")
    fun get(@PathVariable textbookId: String): ApiResponse<TextbookDetail> {
        requireAdmin()
        return ApiResponse(success = true, data = textbookService.getDetail(textbookId, currentUser()))
    }

    @PutMapping("/{textbookId}")
    fun updateMeta(
        @PathVariable textbookId: String,
        @RequestBody request: TextbookUpdateRequest,
    ): ApiResponse<TextbookDetail> {
        requireAdmin()
        return ApiResponse(success = true, data = textbookService.updateMeta(textbookId, request, currentUser()))
    }

    @PutMapping("/{textbookId}/payload")
    fun updatePayload(
        @PathVariable textbookId: String,
        @RequestBody request: TextbookPayloadRequest,
    ): ApiResponse<TextbookDetail> {
        requireAdmin()
        return ApiResponse(success = true, data = textbookService.updatePayload(textbookId, request, currentUser()))
    }

    @DeleteMapping("/{textbookId}")
    fun delete(@PathVariable textbookId: String): ApiResponse<Map<String, Boolean>> {
        requireAdmin()
        textbookService.delete(textbookId, currentUser())
        return ApiResponse(success = true, data = mapOf("deleted" to true))
    }

    @PostMapping("/{textbookId}/pdf-generate")
    fun generatePdf(@PathVariable textbookId: String): ApiResponse<TextbookPdfResult> {
        requireAdmin()
        return ApiResponse(success = true, data = textbookService.generatePdf(textbookId, currentUser()))
    }
}
