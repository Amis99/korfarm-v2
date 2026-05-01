package com.korfarm.api.wisdom

import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Component
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

/**
 * AI 첨삭 job 백그라운드 실행 전담 빈.
 * @Async self-invocation 함정 회피 위해 WisdomService 와 분리.
 * 트랜잭션 작업은 AiFeedbackJobTx 별도 빈으로 분리 (또 다른 self-invocation 회피).
 */
@Component
class AiFeedbackJobService(
    private val tx: AiFeedbackJobTx,
    private val aiWisdomClient: AiWisdomClient
) {
    private val log = LoggerFactory.getLogger(AiFeedbackJobService::class.java)

    @Async
    fun runJob(jobId: String) {
        try {
            val context = tx.markRunningAndLoad(jobId)
            if (context == null) {
                log.warn("AI 첨삭 job 누락 또는 글 없음: jobId={}", jobId)
                return
            }

            // Claude API 호출 (장시간) — 트랜잭션 밖
            val result = aiWisdomClient.generateFeedback(context.text, context.levelId, context.topicLabel)

            tx.markCompleted(jobId, result)
        } catch (e: Exception) {
            log.error("AI 첨삭 job 실패: jobId={}", jobId, e)
            try {
                tx.markFailed(jobId, e.message ?: "알 수 없는 오류")
            } catch (e2: Exception) {
                log.error("FAILED 상태 저장 실패: jobId={}", jobId, e2)
            }
        }
    }
}

data class AiFeedbackJobContext(
    val text: String,
    val levelId: String,
    val topicLabel: String
)

@Service
class AiFeedbackJobTx(
    private val jobRepository: AiFeedbackJobRepository,
    private val postRepository: WisdomPostRepository
) {
    @Transactional
    fun markRunningAndLoad(jobId: String): AiFeedbackJobContext? {
        val job = jobRepository.findById(jobId).orElse(null) ?: return null
        val post = postRepository.findById(job.postId).orElse(null)
        if (post == null) {
            job.status = AiFeedbackJobStatus.FAILED
            job.errorMessage = "글을 찾을 수 없습니다"
            job.completedAt = LocalDateTime.now()
            jobRepository.save(job)
            return null
        }
        val text = post.content
        if (text.isNullOrBlank()) {
            job.status = AiFeedbackJobStatus.FAILED
            job.errorMessage = "글 내용이 없습니다 (OCR 필요)"
            job.completedAt = LocalDateTime.now()
            jobRepository.save(job)
            return null
        }
        job.status = AiFeedbackJobStatus.RUNNING
        jobRepository.save(job)
        return AiFeedbackJobContext(text = text, levelId = post.levelId, topicLabel = post.topicLabel)
    }

    @Transactional
    fun markCompleted(jobId: String, result: AiFeedbackResult) {
        val job = jobRepository.findById(jobId).orElse(null) ?: return
        job.status = AiFeedbackJobStatus.COMPLETED
        job.resultComment = result.comment
        job.resultCorrection = result.correction
        job.completedAt = LocalDateTime.now()
        jobRepository.save(job)
    }

    @Transactional
    fun markFailed(jobId: String, message: String) {
        val job = jobRepository.findById(jobId).orElse(null) ?: return
        job.status = AiFeedbackJobStatus.FAILED
        job.errorMessage = message
        job.completedAt = LocalDateTime.now()
        jobRepository.save(job)
    }
}
