package com.korfarm.api.study

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.security.SecurityUtils
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/admin/study")
class AdminStudyContentController(
    private val studyContentService: StudyContentService
) {
    @GetMapping("/contents")
    fun listContents(): ApiResponse<List<StudyContentSummary>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        return ApiResponse(success = true, data = studyContentService.listForAdmin(userId))
    }

    /** 본사 — 학생들이 만든 OWN 학습 검수 목록 (Phase C-2) */
    @GetMapping("/contents/own")
    fun listOwnContents(): ApiResponse<List<StudyContentSummary>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(success = true, data = studyContentService.listOwnContentsForHq())
    }

    @GetMapping("/contents/{contentId}")
    fun getContent(@PathVariable contentId: String): ApiResponse<StudyContentDetail> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        return ApiResponse(success = true, data = studyContentService.getForAdmin(contentId, userId))
    }

    @PostMapping("/contents")
    fun createContent(@Valid @RequestBody request: StudyContentCreateRequest): ApiResponse<StudyContentDetail> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        return ApiResponse(success = true, data = studyContentService.createContent(request, userId))
    }

    @PutMapping("/contents/{contentId}")
    fun updateContent(
        @PathVariable contentId: String,
        @Valid @RequestBody request: StudyContentUpdateRequest
    ): ApiResponse<StudyContentDetail> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        return ApiResponse(success = true, data = studyContentService.updateContent(contentId, request, userId))
    }

    @DeleteMapping("/contents/{contentId}")
    fun deleteContent(@PathVariable contentId: String): ApiResponse<Map<String, Boolean>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        studyContentService.deleteContent(contentId, userId)
        return ApiResponse(success = true, data = mapOf("deleted" to true))
    }

    @PostMapping("/contents/{contentId}/questions:bulk")
    fun replaceQuestions(
        @PathVariable contentId: String,
        @Valid @RequestBody request: StudyQuestionsBulkRequest
    ): ApiResponse<StudyContentDetail> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        return ApiResponse(success = true, data = studyContentService.replaceQuestions(contentId, request, userId))
    }

    // ─── 페이지 CRUD (V0076 이후) ───
    @GetMapping("/contents/{contentId}/pages")
    fun listPages(@PathVariable contentId: String): ApiResponse<List<StudyPageDto>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val userId = currentUserOrThrow()
        return ApiResponse(success = true, data = studyContentService.listPages(contentId, userId))
    }

    @PostMapping("/contents/{contentId}/pages")
    fun createPage(
        @PathVariable contentId: String,
        @RequestBody request: StudyPageCreateRequest
    ): ApiResponse<StudyPageDto> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val userId = currentUserOrThrow()
        return ApiResponse(success = true, data = studyContentService.createPage(contentId, request, userId))
    }

    @PatchMapping("/contents/{contentId}/pages/{pageId}")
    fun updatePage(
        @PathVariable contentId: String,
        @PathVariable pageId: String,
        @RequestBody request: StudyPageUpdateRequest
    ): ApiResponse<StudyPageDto> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val userId = currentUserOrThrow()
        return ApiResponse(success = true, data = studyContentService.updatePage(contentId, pageId, request, userId))
    }

    @DeleteMapping("/contents/{contentId}/pages/{pageId}")
    fun deletePage(
        @PathVariable contentId: String,
        @PathVariable pageId: String
    ): ApiResponse<Map<String, Boolean>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val userId = currentUserOrThrow()
        studyContentService.deletePage(contentId, pageId, userId)
        return ApiResponse(success = true, data = mapOf("deleted" to true))
    }

    @PostMapping("/contents/{contentId}/pages/{pageId}/questions:bulk")
    fun replacePageQuestions(
        @PathVariable contentId: String,
        @PathVariable pageId: String,
        @RequestBody request: StudyPageQuestionsBulkRequest
    ): ApiResponse<StudyPageDto> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val userId = currentUserOrThrow()
        return ApiResponse(success = true, data = studyContentService.replacePageQuestions(contentId, pageId, request, userId))
    }

    private fun currentUserOrThrow(): String =
        SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
}
