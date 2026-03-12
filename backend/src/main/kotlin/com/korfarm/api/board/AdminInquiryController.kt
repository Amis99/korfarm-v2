package com.korfarm.api.board

import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/admin/boards/inquiry")
class AdminInquiryController(
    private val boardRepository: BoardRepository,
    private val postRepository: PostRepository
) {
    /** 문의/상담 게시글 전체 목록 (관리자 전용) */
    @GetMapping
    fun listInquiryPosts(): ApiResponse<List<PostSummary>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val boards = boardRepository.findByBoardType("inquiry")
        val posts = boards.flatMap { board ->
            postRepository.findByBoardIdOrderByCreatedAtDesc(board.id)
        }.filter { post ->
            post.status != "deleted"
        }.map { post ->
            PostSummary(
                postId = post.id,
                boardId = post.boardId,
                title = post.title,
                status = post.status,
                createdAt = post.createdAt,
                authorId = post.userId,
                isGuest = post.isGuest,
                guestName = post.guestName,
                guestContact = post.guestContact
            )
        }
        return ApiResponse(success = true, data = posts)
    }
}
