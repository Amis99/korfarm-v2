package com.korfarm.api.learning

import com.korfarm.api.common.IdGenerator
import com.korfarm.api.contracts.SubmitRequest
import com.korfarm.api.economy.EconomyService
import com.korfarm.api.economy.SeedCatalogRepository
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
    private val learningStreakRepository: LearningStreakRepository,
    private val userRepository: UserRepository,
    private val seedCatalogRepository: SeedCatalogRepository
) {
    @Transactional
    fun submit(userId: String, activityType: String, contentId: String, request: SubmitRequest): SubmitResult {
        val now = LocalDateTime.now()
        val today = LocalDate.now(ZoneId.of("Asia/Seoul"))
        val startOfDay = today.atStartOfDay()
        val endOfDay = startOfDay.plusDays(1).minusNanos(1)
        // 보상 정책 (2026-05-17): 한 콘텐츠 하루 1회만. activityType 합산이 아니라 contentId 기준.
        val alreadyGranted = learningAttemptRepository.existsByUserIdAndContentIdAndSubmittedAtBetween(
            userId,
            contentId,
            startOfDay,
            endOfDay
        )

        val correctCount = request.answers.size
        val score = correctCount
        val userLevelId = userRepository.findById(userId).orElse(null)?.levelId
        // 통합 정책 — random 씨앗 타입 제거. activityType 을 contentType 으로 사용.
        // 구식 학습 통로는 정답률 채점이 없으므로 80(1배) 처리 — 만점 보너스(×2) 부풀림 방지 (2026-05-17).
        val decision = SeedRewardPolicy.calculateGrant(
            userLevelId = userLevelId,
            contentLevelId = request.contentLevelId,
            contentType = activityType,
            accuracyPct = 80,
            source = SeedRewardPolicy.GrantSource.LEGACY_LEARNING,
        )
        val seedCount = if (alreadyGranted) 0 else decision.rawCount
        val seedType = decision.seedType
        val seedGrant = SeedGrant(seedType = seedType, count = seedCount)
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

        updateStreak(userId, today)

        return SubmitResult(
            score = score,
            correctCount = correctCount,
            seedGrant = seedGrant
        )
    }

    private fun updateStreak(userId: String, today: LocalDate) {
        val streak = learningStreakRepository.findByUserId(userId)
            ?: LearningStreakEntity(userId = userId)

        val last = streak.lastSubmissionDate
        when {
            last == today -> { /* already submitted today, no change */ }
            last == today.minusDays(1) -> {
                streak.currentStreak += 1
                streak.lastSubmissionDate = today
                if (streak.currentStreak > streak.bestStreak) {
                    streak.bestStreak = streak.currentStreak
                }
            }
            else -> {
                streak.currentStreak = 1
                streak.lastSubmissionDate = today
                if (streak.bestStreak == 0) {
                    streak.bestStreak = 1
                }
            }
        }
        learningStreakRepository.save(streak)
    }

    fun getStreak(userId: String): StreakInfo {
        val streak = learningStreakRepository.findByUserId(userId)
        return StreakInfo(
            currentStreak = streak?.currentStreak ?: 0,
            bestStreak = streak?.bestStreak ?: 0
        )
    }
}
