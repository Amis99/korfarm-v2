package com.korfarm.api.wisdom

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.contracts.CreateWisdomCommentRequest
import com.korfarm.api.contracts.CreateWisdomPostRequest
import com.korfarm.api.security.SecurityUtils
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
class WisdomController(
    private val wisdomService: WisdomService
) {
    @GetMapping("/v1/wisdom/posts")
    fun listPosts(
        @RequestParam("level_id") levelId: String,
        @RequestParam("topic_key", required = false) topicKey: String?
    ): ApiResponse<WisdomPostListResponse> {
        val userId = SecurityUtils.currentUserId()
        return ApiResponse(success = true, data = wisdomService.listPosts(levelId, topicKey, userId))
    }

    @PostMapping("/v1/wisdom/posts")
    fun createPost(@Valid @RequestBody request: CreateWisdomPostRequest): ApiResponse<WisdomPostDetail> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        return ApiResponse(success = true, data = wisdomService.createPost(userId, request))
    }

    @GetMapping("/v1/wisdom/posts/{postId}")
    fun getPost(@PathVariable postId: String): ApiResponse<WisdomPostDetail> {
        val userId = SecurityUtils.currentUserId()
        return ApiResponse(success = true, data = wisdomService.getPost(postId, userId))
    }

    @DeleteMapping("/v1/wisdom/posts/{postId}")
    fun deletePost(@PathVariable postId: String): ApiResponse<Map<String, String>> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        wisdomService.deletePost(postId, userId)
        return ApiResponse(success = true, data = mapOf("status" to "deleted"))
    }

    @GetMapping("/v1/wisdom/my-posts")
    fun myPosts(): ApiResponse<List<WisdomPostSummary>> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        return ApiResponse(success = true, data = wisdomService.myPosts(userId))
    }

    @PostMapping("/v1/wisdom/posts/{postId}/like")
    fun toggleLike(@PathVariable postId: String): ApiResponse<Map<String, Any>> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val liked = wisdomService.toggleLike(postId, userId)
        return ApiResponse(success = true, data = mapOf("liked" to liked))
    }

    @GetMapping("/v1/wisdom/posts/{postId}/comments")
    fun listComments(@PathVariable postId: String): ApiResponse<List<WisdomCommentView>> {
        val userId = SecurityUtils.currentUserId()
        return ApiResponse(success = true, data = wisdomService.listComments(postId, userId))
    }

    @PostMapping("/v1/wisdom/posts/{postId}/comments")
    fun createComment(
        @PathVariable postId: String,
        @Valid @RequestBody request: CreateWisdomCommentRequest
    ): ApiResponse<WisdomCommentView> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        return ApiResponse(success = true, data = wisdomService.createComment(postId, userId, request.content))
    }

    @DeleteMapping("/v1/wisdom/comments/{commentId}")
    fun deleteComment(@PathVariable commentId: String): ApiResponse<Map<String, String>> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        wisdomService.deleteComment(commentId, userId, isAdmin = false)
        return ApiResponse(success = true, data = mapOf("status" to "deleted"))
    }
}
