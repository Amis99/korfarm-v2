package com.korfarm.api.wisdom

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.contracts.AdminWisdomFeedbackCreateRequest
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.security.SecurityUtils
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/admin/wisdom")
class AdminWisdomController(
    private val wisdomService: WisdomService
) {
    @GetMapping("/posts")
    fun listPosts(
        @RequestParam("level_id", required = false) levelId: String?,
        @RequestParam("topic_key", required = false) topicKey: String?
    ): ApiResponse<List<AdminWisdomPostSummary>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(success = true, data = wisdomService.adminListPosts(levelId, topicKey))
    }

    @GetMapping("/posts/{postId}")
    fun getPost(@PathVariable postId: String): ApiResponse<AdminWisdomPostDetail> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(success = true, data = wisdomService.adminGetPost(postId))
    }

    @PostMapping("/posts/{postId}/feedback")
    fun createFeedback(
        @PathVariable postId: String,
        @Valid @RequestBody request: AdminWisdomFeedbackCreateRequest
    ): ApiResponse<WisdomFeedbackView> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val reviewerId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val data = wisdomService.adminCreateFeedback(postId, reviewerId, request.comment, request.correction)
        return ApiResponse(success = true, data = data)
    }

    @DeleteMapping("/comments/{commentId}")
    fun deleteComment(@PathVariable commentId: String): ApiResponse<Map<String, String>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        wisdomService.deleteComment(commentId, userId, isAdmin = true)
        return ApiResponse(success = true, data = mapOf("status" to "deleted"))
    }

    /** 어드민 글 삭제 — soft delete (status='deleted'). 작성자 확인 우회. */
    @DeleteMapping("/posts/{postId}")
    fun deletePost(@PathVariable postId: String): ApiResponse<Map<String, String>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        wisdomService.adminDeletePost(postId)
        return ApiResponse(success = true, data = mapOf("status" to "deleted"))
    }

    // ─── AI 첨삭 ───────────────────────────────────────

    /**
     * AI 첨삭 비동기 enqueue. 즉시 jobId 반환.
     * 프론트는 GET /ai-feedback/jobs/{jobId} 로 polling.
     */
    @PostMapping("/posts/{postId}/ai-feedback")
    fun aiFeedback(@PathVariable postId: String): ApiResponse<AiFeedbackJobEnqueueResponse> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val reviewerId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val result = wisdomService.enqueueAiFeedback(postId, reviewerId)
        return ApiResponse(success = true, data = result)
    }

    @GetMapping("/ai-feedback/jobs/{jobId}")
    fun aiFeedbackJob(@PathVariable jobId: String): ApiResponse<AiFeedbackJobStatusResponse> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val result = wisdomService.getAiFeedbackJob(jobId)
        return ApiResponse(success = true, data = result)
    }

    @PostMapping("/posts/{postId}/ocr")
    fun ocr(@PathVariable postId: String): ApiResponse<OcrResult> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val reviewerId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val result = wisdomService.ocrAndSaveContent(postId, reviewerId)
        return ApiResponse(success = true, data = result)
    }

    @PostMapping("/ai-feedback-batch")
    fun aiFeedbackBatch(@RequestBody request: AiBatchRequest): ApiResponse<List<AiBatchResultItem>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val reviewerId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val results = wisdomService.batchAiFeedback(request.postIds, reviewerId)
        return ApiResponse(success = true, data = results)
    }
}
