package com.korfarm.api.board

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.contracts.CreateCommentRequest
import com.korfarm.api.contracts.CreatePostRequest
import com.korfarm.api.contracts.ReportRequest
import com.korfarm.api.contracts.UpdatePostRequest
import com.korfarm.api.files.FileRepository
import com.korfarm.api.system.FeatureFlagService
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class BoardService(
    private val boardRepository: BoardRepository,
    private val postRepository: PostRepository,
    private val postAttachmentRepository: PostAttachmentRepository,
    private val postReviewRepository: PostReviewRepository,
    private val commentRepository: CommentRepository,
    private val reportRepository: ReportRepository,
    private val fileRepository: FileRepository,
    private val featureFlagService: FeatureFlagService
) {
    @Transactional(readOnly = true)
    fun listBoards(userId: String?): List<BoardView> {
        val boards = boardRepository.findByStatusOrderByBoardTypeAsc("active")
        return boards.filter { board ->
            val flagKey = flagKeyForBoard(board.boardType)
            flagKey == null || featureFlagService.isEnabled(flagKey, userId)
        }.map { it.toView() }
    }

    @Transactional(readOnly = true)
    fun listPosts(boardId: String, userId: String?, isAdmin: Boolean): List<PostSummary> {
        val board = getBoard(boardId)
        requireBoardEnabled(board, userId)
        val posts = postRepository.findByBoardIdOrderByCreatedAtDesc(boardId)
        val visible = posts.filter { post ->
            when {
                isAdmin -> post.status != "deleted"
                post.status == "active" -> true
                post.userId == userId && post.status == "pending" -> true
                else -> false
            }
        }
        return visible.map { it.toSummary() }
    }

    @Transactional
    fun createPost(boardId: String, userId: String, isAdmin: Boolean, request: CreatePostRequest): PostDetail {
        val board = getBoard(boardId)
        requireBoardEnabled(board, userId)
        if (board.boardType == "materials" && !isAdmin) {
            throw ApiException("FORBIDDEN", "materials board requires admin", HttpStatus.FORBIDDEN)
        }
        val status = if (board.boardType == "materials") "pending" else "active"
        val entity = PostEntity(
            id = IdGenerator.newId("post"),
            boardId = board.id,
            userId = userId,
            title = request.title,
            content = request.content,
            status = status
        )
        postRepository.save(entity)
        val attachments = attachFiles(entity.id, userId, request.attachmentIds, false)
        return entity.toDetail(attachments)
    }

    @Transactional(readOnly = true)
    fun getPost(postId: String, userId: String?, isAdmin: Boolean): PostDetail {
        val post = postRepository.findById(postId).orElseThrow {
            ApiException("NOT_FOUND", "post not found", HttpStatus.NOT_FOUND)
        }
        val board = getBoard(post.boardId)
        requireBoardEnabled(board, userId)
        if (!isAdmin && post.status != "active" && post.userId != userId) {
            throw ApiException("NOT_FOUND", "post not found", HttpStatus.NOT_FOUND)
        }
        val attachments = postAttachmentRepository.findByPostId(post.id).map { it.toView() }
        return post.toDetail(attachments)
    }

    @Transactional
    fun updatePost(postId: String, userId: String, isAdmin: Boolean, request: UpdatePostRequest): PostDetail {
        val post = postRepository.findById(postId).orElseThrow {
            ApiException("NOT_FOUND", "post not found", HttpStatus.NOT_FOUND)
        }
        val board = getBoard(post.boardId)
        requireBoardEnabled(board, userId)
        if (board.boardType == "materials" && !isAdmin) {
            throw ApiException("FORBIDDEN", "materials board requires admin", HttpStatus.FORBIDDEN)
        }
        if (!isAdmin && post.userId != userId) {
            throw ApiException("FORBIDDEN", "not allowed", HttpStatus.FORBIDDEN)
        }
        if (post.status == "deleted") {
            throw ApiException("NOT_FOUND", "post not found", HttpStatus.NOT_FOUND)
        }
        request.title?.let { post.title = it }
        request.content?.let { post.content = it }
        if (request.attachmentIds.isNotEmpty()) {
            postAttachmentRepository.deleteByPostId(post.id)
            attachFiles(post.id, userId, request.attachmentIds, isAdmin)
        }
        if (board.boardType == "materials" && !isAdmin) {
            post.status = "pending"
        }
        val saved = postRepository.save(post)
        val attachments = postAttachmentRepository.findByPostId(saved.id).map { it.toView() }
        return saved.toDetail(attachments)
    }

    @Transactional
    fun deletePost(postId: String, userId: String, isAdmin: Boolean) {
        val post = postRepository.findById(postId).orElseThrow {
            ApiException("NOT_FOUND", "post not found", HttpStatus.NOT_FOUND)
        }
        if (!isAdmin && post.userId != userId) {
            throw ApiException("FORBIDDEN", "not allowed", HttpStatus.FORBIDDEN)
        }
        post.status = "deleted"
        postRepository.save(post)
    }

    @Transactional
    fun createComment(postId: String, userId: String, request: CreateCommentRequest): CommentView {
        val post = postRepository.findById(postId).orElseThrow {
            ApiException("NOT_FOUND", "post not found", HttpStatus.NOT_FOUND)
        }
        if (post.status != "active") {
            throw ApiException("NOT_FOUND", "post not found", HttpStatus.NOT_FOUND)
        }
        val comment = CommentEntity(
            id = IdGenerator.newId("cmt"),
            postId = post.id,
            userId = userId,
            content = request.content,
            status = "active"
        )
        commentRepository.save(comment)
        return comment.toView()
    }

    @Transactional
    fun deleteComment(commentId: String, userId: String, isAdmin: Boolean) {
        val comment = commentRepository.findById(commentId).orElseThrow {
            ApiException("NOT_FOUND", "comment not found", HttpStatus.NOT_FOUND)
        }
        if (!isAdmin && comment.userId != userId) {
            throw ApiException("FORBIDDEN", "not allowed", HttpStatus.FORBIDDEN)
        }
        comment.status = "deleted"
        commentRepository.save(comment)
    }

    @Transactional
    fun report(userId: String, request: ReportRequest): ReportResult {
        if (request.targetType != "post" && request.targetType != "comment") {
            throw ApiException("INVALID_TARGET", "invalid target", HttpStatus.BAD_REQUEST)
        }
        if (request.targetType == "post") {
            val post = postRepository.findById(request.targetId).orElseThrow {
                ApiException("NOT_FOUND", "post not found", HttpStatus.NOT_FOUND)
            }
            if (post.status == "deleted") {
                throw ApiException("NOT_FOUND", "post not found", HttpStatus.NOT_FOUND)
            }
        }
        if (request.targetType == "comment") {
            val comment = commentRepository.findById(request.targetId).orElseThrow {
                ApiException("NOT_FOUND", "comment not found", HttpStatus.NOT_FOUND)
            }
            if (comment.status == "deleted") {
                throw ApiException("NOT_FOUND", "comment not found", HttpStatus.NOT_FOUND)
            }
        }
        val entity = ReportEntity(
            id = IdGenerator.newId("rpt"),
            targetType = request.targetType,
            targetId = request.targetId,
            reason = request.reason,
            status = "open",
            processedBy = null
        )
        reportRepository.save(entity)
        return ReportResult(reportId = entity.id, status = entity.status)
    }

    @Transactional
    fun reviewMaterialsPost(postId: String, approved: Boolean, reviewerId: String): PostDetail {
        val post = postRepository.findById(postId).orElseThrow {
            ApiException("NOT_FOUND", "post not found", HttpStatus.NOT_FOUND)
        }
        val board = getBoard(post.boardId)
        if (board.boardType != "materials") {
            throw ApiException("INVALID_REQUEST", "not a materials post", HttpStatus.BAD_REQUEST)
        }
        post.status = if (approved) "active" else "rejected"
        postRepository.save(post)
        val review = postReviewRepository.findByPostId(post.id)
        val now = LocalDateTime.now()
        if (review == null) {
            postReviewRepository.save(
                PostReviewEntity(
                    id = IdGenerator.newId("rev"),
                    postId = post.id,
                    approved = approved,
                    reviewedBy = reviewerId,
                    reviewedAt = now,
                    comment = null
                )
            )
        } else {
            review.approved = approved
            review.reviewedBy = reviewerId
            review.reviewedAt = now
            postReviewRepository.save(review)
        }
        val attachments = postAttachmentRepository.findByPostId(post.id).map { it.toView() }
        return post.toDetail(attachments)
    }

    private fun attachFiles(postId: String, userId: String, attachmentIds: List<String>, isAdmin: Boolean): List<PostAttachmentView> {
        if (attachmentIds.isEmpty()) {
            return emptyList()
        }
        val files = fileRepository.findAllById(attachmentIds).associateBy { it.id }
        if (files.size != attachmentIds.size) {
            throw ApiException("INVALID_ATTACHMENT", "invalid attachment", HttpStatus.BAD_REQUEST)
        }
        val attachments = attachmentIds.map { fileId ->
            val file = files[fileId] ?: throw ApiException("INVALID_ATTACHMENT", "invalid attachment", HttpStatus.BAD_REQUEST)
            if (!isAdmin && file.ownerId != userId) {
                throw ApiException("FORBIDDEN", "not allowed", HttpStatus.FORBIDDEN)
            }
            val entity = PostAttachmentEntity(
                id = IdGenerator.newId("att"),
                postId = postId,
                fileId = file.id,
                name = file.id,
                mime = file.mime,
                size = file.size
            )
            postAttachmentRepository.save(entity)
            entity.toView()
        }
        return attachments
    }

    private fun getBoard(boardId: String): BoardEntity {
        return boardRepository.findById(boardId).orElseThrow {
            ApiException("NOT_FOUND", "board not found", HttpStatus.NOT_FOUND)
        }
    }

    private fun requireBoardEnabled(board: BoardEntity, userId: String?) {
        val flagKey = flagKeyForBoard(board.boardType) ?: return
        featureFlagService.requireEnabled(flagKey, userId)
    }

    private fun flagKeyForBoard(boardType: String): String? {
        return when (boardType) {
            "learning_request" -> "feature.community.learning_request"
            "community" -> "feature.community.community_board"
            "qna" -> "feature.community.qna"
            "materials" -> "feature.community.materials"
            else -> null
        }
    }

    private fun BoardEntity.toView(): BoardView {
        return BoardView(
            boardId = id,
            boardType = boardType,
            orgScope = orgScope,
            status = status
        )
    }

    private fun PostEntity.toSummary(): PostSummary {
        return PostSummary(
            postId = id,
            boardId = boardId,
            title = title,
            status = status,
            createdAt = createdAt,
            authorId = userId
        )
    }

    private fun PostEntity.toDetail(attachments: List<PostAttachmentView>): PostDetail {
        return PostDetail(
            postId = id,
            boardId = boardId,
            title = title,
            content = content,
            status = status,
            createdAt = createdAt,
            updatedAt = updatedAt,
            authorId = userId,
            attachments = attachments
        )
    }

    private fun PostAttachmentEntity.toView(): PostAttachmentView {
        return PostAttachmentView(
            fileId = fileId,
            name = name,
            mime = mime,
            size = size
        )
    }

    private fun CommentEntity.toView(): CommentView {
        return CommentView(
            commentId = id,
            postId = postId,
            authorId = userId,
            content = content,
            status = status,
            createdAt = createdAt
        )
    }
}
