package com.korfarm.api.paid

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.contracts.AdminContentImportRequest
import com.korfarm.api.contracts.AdminTestAnswersRequest
import com.korfarm.api.contracts.AdminTestCreateRequest
import com.korfarm.api.contracts.AdminTestGradeRequest
import com.korfarm.api.contracts.AdminWritingFeedbackRequest
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.security.SecurityUtils
import com.korfarm.api.system.FeatureFlagService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/admin")
class AdminContentController(
    private val adminContentService: AdminContentService,
    private val featureFlagService: FeatureFlagService
) {
    @PostMapping("/content/import")
    fun importContent(@Valid @RequestBody request: AdminContentImportRequest): ApiResponse<AdminContentImportResult> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val data = adminContentService.importContent(request, userId)
        return ApiResponse(success = true, data = data)
    }

    @GetMapping("/content")
    fun listContent(): ApiResponse<List<AdminContentSummary>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        val data = adminContentService.listContents()
        return ApiResponse(success = true, data = data)
    }

    @PutMapping("/content/{contentId}")
    fun updateContent(
        @PathVariable contentId: String,
        @Valid @RequestBody request: AdminContentImportRequest
    ): ApiResponse<AdminContentImportResult> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val data = adminContentService.updateContent(contentId, request, userId)
        return ApiResponse(success = true, data = data)
    }

    @GetMapping("/content/{contentId}/preview")
    fun preview(@PathVariable contentId: String): ApiResponse<ContentPreview> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        val data = adminContentService.previewContent(contentId)
        return ApiResponse(success = true, data = data)
    }

    @PostMapping("/writing/{submissionId}/feedback")
    fun feedback(
        @PathVariable submissionId: String,
        @Valid @RequestBody request: AdminWritingFeedbackRequest
    ): ApiResponse<WritingFeedbackView> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        featureFlagService.requireEnabled("feature.paid.writing")
        val reviewerId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val data = adminContentService.submitWritingFeedback(submissionId, reviewerId, request)
        return ApiResponse(success = true, data = data)
    }

    @GetMapping("/writing/submissions")
    fun listWritingSubmissions(): ApiResponse<List<AdminWritingSubmissionSummary>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        featureFlagService.requireEnabled("feature.paid.writing")
        val data = adminContentService.listWritingSubmissions()
        return ApiResponse(success = true, data = data)
    }

    @PostMapping("/tests")
    fun createTest(@Valid @RequestBody request: AdminTestCreateRequest): ApiResponse<TestPaperView> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        featureFlagService.requireEnabled("feature.paid.test_bank")
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val data = adminContentService.createTest(request, userId)
        return ApiResponse(success = true, data = data)
    }

    @PostMapping("/tests/{testId}/answers")
    fun saveAnswers(
        @PathVariable testId: String,
        @Valid @RequestBody request: AdminTestAnswersRequest
    ): ApiResponse<TestAnswerKeyView> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        featureFlagService.requireEnabled("feature.paid.test_bank")
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val data = adminContentService.saveAnswerKey(testId, request, userId)
        return ApiResponse(success = true, data = data)
    }

    @PostMapping("/tests/{testId}/grade")
    fun grade(
        @PathVariable testId: String,
        @Valid @RequestBody request: AdminTestGradeRequest
    ): ApiResponse<TestGradeResult> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        featureFlagService.requireEnabled("feature.paid.test_bank")
        val data = adminContentService.gradeTest(testId, request)
        return ApiResponse(success = true, data = data)
    }
}
