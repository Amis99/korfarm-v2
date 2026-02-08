package com.korfarm.api.board

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.security.SecurityUtils
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/admin/boards/materials")
class AdminBoardController(
    private val boardService: BoardService,
    private val boardRepository: BoardRepository,
    private val postRepository: PostRepository
) {
    /** 학습 자료 게시글 목록 조회 (관리자 전용) */
    @GetMapping
    fun listMaterialsPosts(
        @RequestParam(required = false) status: String?
    ): ApiResponse<List<PostSummary>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        // materials 타입 게시판 조회
        val boards = boardRepository.findByBoardType("materials")
        val posts = boards.flatMap { board ->
            postRepository.findByBoardIdOrderByCreatedAtDesc(board.id)
        }.filter { post ->
            // 삭제된 게시글 제외, 상태 필터 적용
            post.status != "deleted" && (status == null || post.status == status)
        }.map { post ->
            PostSummary(
                postId = post.id,
                boardId = post.boardId,
                title = post.title,
                status = post.status,
                createdAt = post.createdAt,
                authorId = post.userId
            )
        }
        return ApiResponse(success = true, data = posts)
    }

    @PostMapping("/{postId}/approve")
    fun approve(@PathVariable postId: String): ApiResponse<PostDetail> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val reviewerId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val data = boardService.reviewMaterialsPost(postId, true, reviewerId)
        return ApiResponse(success = true, data = data)
    }

    @PostMapping("/{postId}/reject")
    fun reject(@PathVariable postId: String): ApiResponse<PostDetail> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val reviewerId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val data = boardService.reviewMaterialsPost(postId, false, reviewerId)
        return ApiResponse(success = true, data = data)
    }
}
