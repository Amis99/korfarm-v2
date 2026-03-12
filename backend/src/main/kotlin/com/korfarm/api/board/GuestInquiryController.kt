package com.korfarm.api.board

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.contracts.CreateGuestInquiryRequest
import com.korfarm.api.contracts.VerifyGuestInquiryRequest
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/public/inquiry")
class GuestInquiryController(
    private val boardRepository: BoardRepository,
    private val postRepository: PostRepository,
    private val commentRepository: CommentRepository,
    private val postAttachmentRepository: PostAttachmentRepository
) {
    /** 비회원 문의 작성 */
    @PostMapping
    fun createGuestInquiry(
        @Valid @RequestBody request: CreateGuestInquiryRequest
    ): ApiResponse<PostDetail> {
        val board = boardRepository.findByBoardType("inquiry").firstOrNull()
            ?: throw ApiException("NOT_FOUND", "inquiry board not found", HttpStatus.NOT_FOUND)

        val entity = PostEntity(
            id = IdGenerator.newId("post"),
            boardId = board.id,
            userId = "guest",
            guestName = request.guestName.trim(),
            guestContact = request.guestContact.trim(),
            isGuest = true,
            title = request.title.trim(),
            content = request.content.trim(),
            status = "active"
        )
        postRepository.save(entity)
        return ApiResponse(success = true, data = entity.toGuestDetail())
    }

    /** 비회원 본인 문의 목록 조회 (이름 + 연락처 인증) */
    @PostMapping("/verify")
    fun verifyAndList(
        @Valid @RequestBody request: VerifyGuestInquiryRequest
    ): ApiResponse<List<PostSummary>> {
        val board = boardRepository.findByBoardType("inquiry").firstOrNull()
            ?: throw ApiException("NOT_FOUND", "inquiry board not found", HttpStatus.NOT_FOUND)

        val posts = postRepository
            .findByBoardIdAndIsGuestAndGuestNameAndGuestContactOrderByCreatedAtDesc(
                board.id, true, request.guestName.trim(), request.guestContact.trim()
            )
            .filter { it.status != "deleted" }
            .map { it.toGuestSummary() }

        return ApiResponse(success = true, data = posts)
    }

    /** 비회원 본인 문의 상세 조회 (이름 + 연락처 인증) */
    @PostMapping("/{postId}/verify")
    fun verifyAndGetDetail(
        @PathVariable postId: String,
        @Valid @RequestBody request: VerifyGuestInquiryRequest
    ): ApiResponse<Map<String, Any>> {
        val post = postRepository.findById(postId).orElseThrow {
            ApiException("NOT_FOUND", "post not found", HttpStatus.NOT_FOUND)
        }
        if (!post.isGuest || post.guestName != request.guestName.trim()
            || post.guestContact != request.guestContact.trim()
        ) {
            throw ApiException("NOT_FOUND", "post not found", HttpStatus.NOT_FOUND)
        }
        if (post.status == "deleted") {
            throw ApiException("NOT_FOUND", "post not found", HttpStatus.NOT_FOUND)
        }

        val attachments = postAttachmentRepository.findByPostId(post.id).map {
            PostAttachmentView(fileId = it.fileId, name = it.name, mime = it.mime, size = it.size)
        }
        val comments = commentRepository.findByPostIdOrderByCreatedAtAsc(post.id)
            .filter { it.status != "deleted" }
            .map { CommentView(
                commentId = it.id,
                postId = it.postId,
                authorId = it.userId,
                content = it.content,
                status = it.status,
                createdAt = it.createdAt
            ) }

        val detail = post.toGuestDetail(attachments)
        return ApiResponse(success = true, data = mapOf(
            "post" to detail,
            "comments" to comments
        ))
    }

    private fun PostEntity.toGuestSummary(): PostSummary {
        return PostSummary(
            postId = id,
            boardId = boardId,
            title = title,
            status = status,
            createdAt = createdAt,
            authorId = userId,
            isGuest = isGuest,
            guestName = guestName
        )
    }

    private fun PostEntity.toGuestDetail(attachments: List<PostAttachmentView> = emptyList()): PostDetail {
        return PostDetail(
            postId = id,
            boardId = boardId,
            title = title,
            content = content,
            status = status,
            createdAt = createdAt,
            updatedAt = updatedAt,
            authorId = userId,
            attachments = attachments,
            isGuest = isGuest,
            guestName = guestName
        )
    }
}
