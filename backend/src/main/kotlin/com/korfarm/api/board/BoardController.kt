package com.korfarm.api.board

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.contracts.CreateCommentRequest
import com.korfarm.api.contracts.CreatePostRequest
import com.korfarm.api.contracts.ReportRequest
import com.korfarm.api.contracts.UpdatePostRequest
import com.korfarm.api.security.SecurityUtils
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
class BoardController(
    private val boardService: BoardService,
    private val podoBoardService: PodoBoardService
) {
    @GetMapping("/v1/boards")
    fun boards(): ApiResponse<List<BoardView>> {
        val userId = SecurityUtils.currentUserId()
        return ApiResponse(success = true, data = boardService.listBoards(userId))
    }

    @GetMapping("/v1/boards/{boardId}/posts")
    fun posts(@PathVariable boardId: String): ApiResponse<List<PostSummary>> {
        val userId = SecurityUtils.currentUserId()
        val isAdmin = SecurityUtils.hasAnyRole("HQ_ADMIN", "ORG_ADMIN")
        return ApiResponse(success = true, data = boardService.listPosts(boardId, userId, isAdmin))
    }

    @PostMapping("/v1/boards/{boardId}/posts")
    fun createPost(
        @PathVariable boardId: String,
        @Valid @RequestBody request: CreatePostRequest
    ): ApiResponse<PostDetail> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val isAdmin = SecurityUtils.hasAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val data = boardService.createPost(boardId, userId, isAdmin, request)
        // 포도 AI 자동 댓글 (qna 게시판)
        podoBoardService.tryAutoComment(data.postId, boardId)
        return ApiResponse(success = true, data = data)
    }

    @GetMapping("/v1/posts/{postId}")
    fun post(@PathVariable postId: String): ApiResponse<PostDetail> {
        val userId = SecurityUtils.currentUserId()
        val isAdmin = SecurityUtils.hasAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val data = boardService.getPost(postId, userId, isAdmin)
        return ApiResponse(success = true, data = data)
    }

    @PatchMapping("/v1/posts/{postId}")
    fun updatePost(
        @PathVariable postId: String,
        @Valid @RequestBody request: UpdatePostRequest
    ): ApiResponse<PostDetail> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val isAdmin = SecurityUtils.hasAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val data = boardService.updatePost(postId, userId, isAdmin, request)
        return ApiResponse(success = true, data = data)
    }

    @DeleteMapping("/v1/posts/{postId}")
    fun deletePost(@PathVariable postId: String): ApiResponse<Map<String, String>> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val isAdmin = SecurityUtils.hasAnyRole("HQ_ADMIN", "ORG_ADMIN")
        boardService.deletePost(postId, userId, isAdmin)
        return ApiResponse(success = true, data = mapOf("status" to "deleted"))
    }

    @GetMapping("/v1/posts/{postId}/comments")
    fun listComments(@PathVariable postId: String): ApiResponse<List<CommentView>> {
        val userId = SecurityUtils.currentUserId()
        val isAdmin = SecurityUtils.hasAnyRole("HQ_ADMIN", "ORG_ADMIN")
        boardService.verifyPostAccess(postId, userId, isAdmin)
        return ApiResponse(success = true, data = boardService.listComments(postId))
    }

    @PostMapping("/v1/posts/{postId}/comments")
    fun createComment(
        @PathVariable postId: String,
        @Valid @RequestBody request: CreateCommentRequest
    ): ApiResponse<CommentView> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val data = boardService.createComment(postId, userId, request)
        return ApiResponse(success = true, data = data)
    }

    @DeleteMapping("/v1/comments/{commentId}")
    fun deleteComment(@PathVariable commentId: String): ApiResponse<Map<String, String>> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val isAdmin = SecurityUtils.hasAnyRole("HQ_ADMIN", "ORG_ADMIN")
        boardService.deleteComment(commentId, userId, isAdmin)
        return ApiResponse(success = true, data = mapOf("status" to "deleted"))
    }

    @PostMapping("/v1/posts/{postId}/like")
    fun toggleLike(@PathVariable postId: String): ApiResponse<Map<String, Any>> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val liked = boardService.togglePostLike(postId, userId)
        val count = boardService.getPostLikeCount(postId)
        return ApiResponse(success = true, data = mapOf("liked" to liked, "likeCount" to count))
    }

    @PostMapping("/v1/reports")
    fun report(@Valid @RequestBody request: ReportRequest): ApiResponse<ReportResult> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val data = boardService.report(userId, request)
        return ApiResponse(success = true, data = data)
    }
}
