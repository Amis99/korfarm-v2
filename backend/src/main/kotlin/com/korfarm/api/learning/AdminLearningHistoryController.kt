package com.korfarm.api.learning

import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

/**
 * 어드민 학습 결과 모달용 — 학생 1명의 특정 콘텐츠 학습 히스토리 요약.
 * 모달이 cellRefId(=contentId) + cell.userId 로 호출.
 */
@RestController
class AdminLearningHistoryController(
    private val farmLearningLogRepository: FarmLearningLogRepository
) {
    @GetMapping("/v1/admin/students/{userId}/content/{contentId}/history")
    fun getHistory(
        @PathVariable userId: String,
        @PathVariable contentId: String
    ): ApiResponse<LearningHistorySummary> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val logs = farmLearningLogRepository.findByUserIdAndContentIdOrderByCreatedAtDesc(userId, contentId)
        val attempts = logs.map { log ->
            LearningAttempt(
                attemptId = log.id,
                status = log.status,
                score = log.score,
                accuracy = log.accuracy,
                earnedSeed = log.earnedSeed,
                startedAt = log.startedAt.toString(),
                completedAt = log.completedAt?.toString()
            )
        }
        val totalAttempts = attempts.size
        val completedAttempts = attempts.count { it.status == "COMPLETED" }
        val bestScore = attempts.mapNotNull { it.score }.maxOrNull()
        val bestAccuracy = attempts.mapNotNull { it.accuracy }.maxOrNull()
        val totalSeed = attempts.sumOf { it.earnedSeed }
        val firstAt = attempts.lastOrNull()?.startedAt
        val lastAt = attempts.firstOrNull()?.startedAt

        return ApiResponse(
            success = true,
            data = LearningHistorySummary(
                userId = userId,
                contentId = contentId,
                totalAttempts = totalAttempts,
                completedAttempts = completedAttempts,
                bestScore = bestScore,
                bestAccuracy = bestAccuracy,
                totalSeed = totalSeed,
                firstStartedAt = firstAt,
                lastStartedAt = lastAt,
                attempts = attempts
            )
        )
    }
}

data class LearningHistorySummary(
    val userId: String,
    val contentId: String,
    val totalAttempts: Int,
    val completedAttempts: Int,
    val bestScore: Int?,
    val bestAccuracy: Int?,
    val totalSeed: Int,
    val firstStartedAt: String?,
    val lastStartedAt: String?,
    val attempts: List<LearningAttempt>
)

data class LearningAttempt(
    val attemptId: String,
    val status: String,
    val score: Int?,
    val accuracy: Int?,
    val earnedSeed: Int,
    val startedAt: String,
    val completedAt: String?
)
