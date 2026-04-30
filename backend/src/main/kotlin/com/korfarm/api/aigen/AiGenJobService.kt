package com.korfarm.api.aigen

import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.IdGenerator
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.util.concurrent.Executors

/**
 * AI 출제 비동기 잡 처리.
 * - submit() : 잡 생성 + 백그라운드 실행 트리거 후 즉시 jobId 반환
 * - get()    : 잡 상태/결과 조회 (클라이언트 폴링)
 *
 * 단순 ExecutorService 사용 (@Async 의존 없음, self-invocation 문제 없음).
 */
@Service
class AiGenJobService(
    private val jobRepo: AiGenJobRepository,
    private val service: AiTestGenService,
    private val objectMapper: ObjectMapper,
) {
    private val log = LoggerFactory.getLogger(AiGenJobService::class.java)
    // 동시 처리 한도 4 (Claude API rate limit 고려). 큰 작업은 큐잉.
    private val executor = Executors.newFixedThreadPool(4)

    // 트랜잭션 어노테이션 의도적으로 안 씀. JpaRepository.save 가 자체 트랜잭션 생성하고 즉시 commit.
    // background thread 가 commit 후의 데이터를 안전하게 읽을 수 있게 보장.
    fun submitPassage(req: PassageGenRequest, userId: String): AiGenJobEntity {
        val job = AiGenJobEntity(
            id = IdGenerator.newId("aijob"),
            userId = userId,
            testId = req.testId,
            kind = "passage",
            status = "queued",
            requestJson = objectMapper.writeValueAsString(req),
        )
        val saved = jobRepo.save(job)
        executor.submit { runPassage(saved.id) }
        return saved
    }

    fun submitQuestion(req: QuestionGenRequest, userId: String): AiGenJobEntity {
        val job = AiGenJobEntity(
            id = IdGenerator.newId("aijob"),
            userId = userId,
            testId = req.testId,
            kind = "question",
            status = "queued",
            requestJson = objectMapper.writeValueAsString(req),
        )
        val saved = jobRepo.save(job)
        executor.submit { runQuestion(saved.id) }
        return saved
    }

    @Transactional(readOnly = true)
    fun get(jobId: String, userId: String): AiGenJobEntity? {
        val job = jobRepo.findById(jobId).orElse(null) ?: return null
        if (job.userId != userId) return null
        return job
    }

    // ─── 백그라운드 실행 (별 thread, 트랜잭션은 각 단계마다 REQUIRES_NEW) ───
    private fun runPassage(jobId: String) {
        try {
            markRunning(jobId)
            val job = jobRepo.findById(jobId).orElse(null) ?: return
            val req = objectMapper.readValue(job.requestJson, PassageGenRequest::class.java)
            val result = service.generatePassage(req, job.userId)
            markCompleted(jobId, objectMapper.writeValueAsString(result))
        } catch (e: Exception) {
            log.error("AI passage job 실패 jobId=$jobId", e)
            markFailed(jobId, e.message ?: e.javaClass.simpleName)
        }
    }

    private fun runQuestion(jobId: String) {
        try {
            markRunning(jobId)
            val job = jobRepo.findById(jobId).orElse(null) ?: return
            val req = objectMapper.readValue(job.requestJson, QuestionGenRequest::class.java)
            val result = service.generateQuestion(req, job.userId)
            markCompleted(jobId, objectMapper.writeValueAsString(result))
        } catch (e: Exception) {
            log.error("AI question job 실패 jobId=$jobId", e)
            markFailed(jobId, e.message ?: e.javaClass.simpleName)
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun markRunning(jobId: String) {
        val job = jobRepo.findById(jobId).orElse(null) ?: return
        job.status = "running"
        job.startedAt = LocalDateTime.now()
        jobRepo.save(job)
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun markCompleted(jobId: String, resultJson: String) {
        val job = jobRepo.findById(jobId).orElse(null) ?: return
        job.status = "completed"
        job.resultJson = resultJson
        job.completedAt = LocalDateTime.now()
        jobRepo.save(job)
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun markFailed(jobId: String, message: String) {
        val job = jobRepo.findById(jobId).orElse(null) ?: return
        job.status = "failed"
        job.errorMessage = message
        job.completedAt = LocalDateTime.now()
        jobRepo.save(job)
    }
}
