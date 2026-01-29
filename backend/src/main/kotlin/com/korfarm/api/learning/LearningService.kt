package com.korfarm.api.learning

import com.korfarm.api.common.IdGenerator
import com.korfarm.api.contracts.SubmitRequest
import com.korfarm.api.economy.EconomyService
import com.korfarm.api.user.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneId

@Service
class LearningService(
    private val economyService: EconomyService,
    private val learningAttemptRepository: LearningAttemptRepository,
    private val userRepository: UserRepository
) {
    fun getDailyQuiz(): DailyQuizContent {
        return DailyQuizContent(
            contentId = "dq_today",
            title = "Daily Quiz",
            questions = listOf(
                Question("q_1", "Sample question?", "mcq", listOf("A", "B", "C", "D"))
            )
        )
    }

    fun getDailyReading(): DailyReadingContent {
        return DailyReadingContent(
            contentId = "dr_today",
            title = "Daily Reading",
            passage = "Sample passage text.",
            questions = listOf(
                Question("q_1", "Sample question?", "short")
            )
        )
    }

    @Transactional
    fun submit(userId: String, activityType: String, contentId: String, request: SubmitRequest): SubmitResult {
        val now = LocalDateTime.now()
        val today = LocalDate.now(ZoneId.of("Asia/Seoul"))
        val startOfDay = today.atStartOfDay()
        val endOfDay = startOfDay.plusDays(1).minusNanos(1)
        val alreadyGranted = learningAttemptRepository.existsByUserIdAndActivityTypeAndSubmittedAtBetween(
            userId,
            activityType,
            startOfDay,
            endOfDay
        )

        val correctCount = request.answers.size
        val score = correctCount
        val userLevelId = userRepository.findById(userId).orElse(null)?.levelId
        val seedCount = if (alreadyGranted) {
            0
        } else {
            SeedRewardPolicy.seedCountFor(userLevelId, request.contentLevelId)
        }
        val seedGrant = SeedGrant(seedType = "seed_wheat", count = seedCount)
        if (seedCount > 0) {
            economyService.addSeeds(userId, seedGrant.seedType, seedGrant.count, "daily_submit", "learning", null)
        }

        val attempt = LearningAttemptEntity(
            id = IdGenerator.newId("la"),
            userId = userId,
            contentId = contentId,
            activityType = activityType,
            status = "submitted",
            score = score,
            startedAt = now,
            submittedAt = now
        )
        learningAttemptRepository.save(attempt)

        return SubmitResult(
            score = score,
            correctCount = correctCount,
            seedGrant = seedGrant
        )
    }
}
