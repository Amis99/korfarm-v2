package com.korfarm.api.board

import com.korfarm.api.chat.PodoHarness
import com.korfarm.api.chat.AiChatService
import com.korfarm.api.chat.VisionImagePreparer
import com.korfarm.api.common.IdGenerator
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class PodoBoardService(
    private val postRepository: PostRepository,
    private val postAttachmentRepository: PostAttachmentRepository,
    private val commentRepository: CommentRepository,
    private val podoHarness: PodoHarness,
    private val visionImagePreparer: VisionImagePreparer,
) {
    private val log = LoggerFactory.getLogger(PodoBoardService::class.java)
    private val imageTypes = setOf("image/jpeg", "image/png", "image/gif", "image/webp")

    @Async
    @Transactional
    fun tryAutoComment(postId: String, boardId: String) {
        if (boardId != "qna") return

        try {
            val post = postRepository.findById(postId).orElse(null) ?: return
            if (post.status != "active") return

            val existing = commentRepository.findByPostIdAndUserId(postId, AiChatService.PODO_USER_ID)
            if (existing != null) return

            // 첨부 이미지 수집 (S3 → EC2 fallback)
            val attachments = postAttachmentRepository.findByPostId(postId)
            val imageDataList = attachments
                .filter { it.mime in imageTypes }
                .mapNotNull { att ->
                    runCatching {
                        val prepared = visionImagePreparer.prepareFromFileId(att.fileId, post.userId)
                        prepared.bytes to prepared.mime
                    }.onFailure { e ->
                        log.warn("게시글 이미지 vision 준비 실패: fileId={}, postId={}", att.fileId, postId, e)
                    }.getOrNull()
                }

            val response = if (imageDataList.isNotEmpty()) {
                podoHarness.generateForBoardWithImages(post.title, post.content, imageDataList, post.userId)
            } else {
                podoHarness.generateForBoard(post.title, post.content, post.userId)
            }
            if (response.isBlank()) return

            val comment = CommentEntity(
                id = IdGenerator.newId("cmt"),
                postId = postId,
                userId = AiChatService.PODO_USER_ID,
                content = response,
                status = "active"
            )
            commentRepository.save(comment)
            log.info("포도 자동 댓글 작성: postId={}", postId)
        } catch (e: Exception) {
            log.error("포도 게시판 댓글 실패: postId={}", postId, e)
        }
    }
}
