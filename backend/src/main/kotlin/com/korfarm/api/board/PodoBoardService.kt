package com.korfarm.api.board

import com.korfarm.api.chat.PodoHarness
import com.korfarm.api.chat.AiChatService
import com.korfarm.api.common.IdGenerator
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * 학습 질문 게시판(qna)에 글이 올라오면 포도 AI가 자동 댓글을 답니다.
 * PodoHarness를 재활용하여 도구 기반 다단계 파이프라인으로 응답 생성.
 */
@Service
class PodoBoardService(
    private val postRepository: PostRepository,
    private val commentRepository: CommentRepository,
    private val podoHarness: PodoHarness
) {
    private val log = LoggerFactory.getLogger(PodoBoardService::class.java)

    @Async
    @Transactional
    fun tryAutoComment(postId: String, boardId: String) {
        // qna 게시판만 대상
        if (boardId != "qna") return

        try {
            val post = postRepository.findById(postId).orElse(null) ?: return
            if (post.status != "active") return

            // 이미 포도 댓글이 있으면 중복 방지
            val existing = commentRepository.findByPostIdAndUserId(postId, AiChatService.PODO_USER_ID)
            if (existing != null) return

            val response = podoHarness.generateForBoard(post.title, post.content)
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
