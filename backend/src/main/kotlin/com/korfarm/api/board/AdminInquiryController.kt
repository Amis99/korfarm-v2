package com.korfarm.api.board

import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.user.UserRepository
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/admin/boards/inquiry")
class AdminInquiryController(
    private val boardRepository: BoardRepository,
    private val postRepository: PostRepository,
    private val userRepository: UserRepository
) {
    /** 문의/상담 게시글 전체 목록 (관리자 전용). 회원 작성자는 이름·연락처·학교/학년 함께 응답. */
    @GetMapping
    fun listInquiryPosts(): ApiResponse<List<PostSummary>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val boards = boardRepository.findByBoardType("inquiry")
        val raw = boards.flatMap { board ->
            postRepository.findByBoardIdOrderByCreatedAtDesc(board.id)
        }.filter { post -> post.status != "deleted" }
        // 회원 user 메타 일괄 조회
        val memberIds = raw.filter { !it.isGuest }.map { it.userId }.distinct()
        val userMap = if (memberIds.isEmpty()) emptyMap()
                      else userRepository.findAllById(memberIds).associateBy { it.id }
        val posts = raw.map { post ->
            val u = if (!post.isGuest) userMap[post.userId] else null
            PostSummary(
                postId = post.id,
                boardId = post.boardId,
                title = post.title,
                status = post.status,
                createdAt = post.createdAt,
                authorId = post.userId,
                authorName = if (post.isGuest) post.guestName
                              else u?.name?.takeIf { it.isNotBlank() } ?: u?.email,
                authorPhone = u?.studentPhone?.takeIf { it.isNotBlank() }
                              ?: u?.parentPhone?.takeIf { it.isNotBlank() },
                authorSchool = u?.school?.takeIf { it.isNotBlank() },
                authorGrade = u?.gradeLabel?.takeIf { it.isNotBlank() },
                isGuest = post.isGuest,
                guestName = post.guestName,
                guestContact = post.guestContact
            )
        }
        return ApiResponse(success = true, data = posts)
    }
}
