package com.korfarm.api.study

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.payment.SubscriptionService
import com.korfarm.api.security.SecurityUtils
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/learning/study")
class StudyContentController(
    private val studyContentService: StudyContentService,
    private val subscriptionService: SubscriptionService
) {
    @GetMapping("/contents")
    fun listContents(): ApiResponse<List<StudyContentStudentItem>> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        subscriptionService.requireActive(userId)
        return ApiResponse(success = true, data = studyContentService.listForStudent(userId))
    }

    @GetMapping("/contents/{contentId}")
    fun getContent(@PathVariable contentId: String): ApiResponse<StudyContentStudentDetail> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        subscriptionService.requireActive(userId)
        return ApiResponse(success = true, data = studyContentService.getForStudent(contentId, userId))
    }

    @PostMapping("/contents/{contentId}/start-session")
    fun startSession(
        @PathVariable contentId: String,
        @RequestBody(required = false) request: StudySessionStartRequest?
    ): ApiResponse<StudySessionStartResponse> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        subscriptionService.requireActive(userId)
        val target = request?.target ?: 20
        return ApiResponse(success = true, data = studyContentService.startSession(contentId, userId, target))
    }

    /**
     * V0076 이후 — 페이지 단위 시험지 디자인 학생 학습.
     * 모든 페이지(본문 + 정답 마스킹된 문제 + 음절 카드 / 모범답안 마스킹) + 세션 시작.
     */
    @PostMapping("/contents/{contentId}/full")
    fun getFullForStudent(@PathVariable contentId: String): ApiResponse<StudyContentFullStudentDto> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        subscriptionService.requireActive(userId)
        return ApiResponse(success = true, data = studyContentService.getFullForStudent(contentId, userId))
    }

    @PostMapping("/contents/{contentId}/submit-attempt")
    fun submitAttempt(
        @PathVariable contentId: String,
        @Valid @RequestBody request: StudyAttemptSubmitRequest
    ): ApiResponse<StudyAttemptSubmitResponse> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        subscriptionService.requireActive(userId)
        return ApiResponse(success = true, data = studyContentService.submitAttempt(contentId, userId, request))
    }

    @PostMapping("/contents/{contentId}/complete-session")
    fun completeSession(
        @PathVariable contentId: String,
        @RequestParam logId: String,
        @Valid @RequestBody request: StudySessionCompleteRequest
    ): ApiResponse<StudySessionCompleteResponse> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        subscriptionService.requireActive(userId)
        return ApiResponse(success = true, data = studyContentService.completeSession(contentId, userId, request, logId))
    }
}
