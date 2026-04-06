package com.korfarm.api.study

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.security.SecurityUtils
import jakarta.validation.Valid
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
}
