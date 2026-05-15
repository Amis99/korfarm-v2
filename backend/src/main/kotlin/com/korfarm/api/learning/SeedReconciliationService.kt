package com.korfarm.api.learning

import com.korfarm.api.economy.EconomyService
import com.korfarm.api.paid.ContentRepository
import com.korfarm.api.user.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalDateTime

/**
 * 씨앗 백테필 — 기존 학습 로그를 통합 정책으로 재계산해 부족분만 추가 지급.
 *
 * 정책:
 *  - 새 정책 계산값 > 기존 log.earnedSeed → 차이만큼 가산
 *  - 새 < 기존 → 변경 없음 (롤백 안 함)
 *  - DAILY_QUIZ/DAILY_READING 하루 cap 10 은 그대로 — 같은 날 안에서 본 정책 적용
 *  - 한 log 당 한 번만 정산 (idempotent — 이미 정산된 로그는 차이 0)
 */
@Service
class SeedReconciliationService(
    private val farmLearningLogRepository: FarmLearningLogRepository,
    private val economyService: EconomyService,
    private val contentRepository: ContentRepository,
    private val userRepository: UserRepository,
) {
    private val logger = LoggerFactory.getLogger(SeedReconciliationService::class.java)

    data class ReconciliationStats(
        var logCount: Int = 0,
        var topUpCount: Int = 0,
        var topUpSeeds: Int = 0,
        var alreadyOkCount: Int = 0,
    )

    data class ReconciliationExample(
        val logId: String,
        val userId: String,
        val contentType: String,
        val contentId: String,
        val accuracy: Int?,
        val oldEarned: Int,
        val newCalculated: Int,
        val newCapped: Int,
        val topUp: Int,
        val seedType: String,
    )

    data class ReconciliationReport(
        val days: Int,
        val apply: Boolean,
        val since: String,
        val totalLogsInspected: Int,
        val logsNeedingTopUp: Int,
        val totalTopUpSeeds: Int,
        val byContentType: Map<String, ReconciliationStats>,
        val byUserId: Map<String, ReconciliationStats>,   // 상위 50명
        val examples: List<ReconciliationExample>,        // 처음 30개
    )

    @Transactional
    fun reconcile(days: Int, apply: Boolean): ReconciliationReport {
        val since = LocalDateTime.now().minusDays(days.toLong())
        val logs = farmLearningLogRepository.findByStatusAndCompletedAtAfter("COMPLETED", since)

        val byContentType = mutableMapOf<String, ReconciliationStats>()
        val byUserId = mutableMapOf<String, ReconciliationStats>()
        val examples = mutableListOf<ReconciliationExample>()
        var totalTopUp = 0
        var needTopUpCount = 0

        // 같은 날·같은 user·같은 contentType cap 추적 — 백테필 일관성
        // (logs 를 정산 순서대로 누적하면서 자체 cap 계산)
        val dayCapAcc = mutableMapOf<Triple<String, String, LocalDate>, Int>()

        // 같은 user × contentType × day 의 로그를 시간순 정렬 후 누적 cap 계산하기 위해
        // 시간순 정렬 (오래된 것부터)
        val sortedLogs = logs.sortedBy { it.completedAt ?: it.createdAt }
        for (current in sortedLogs) {
            val ct = current.contentType
            val userId = current.userId
            val whenAt = current.completedAt ?: current.createdAt
            val day = whenAt.toLocalDate()
            val capKey = Triple(userId, ct, day)

            val ctStats = byContentType.getOrPut(ct) { ReconciliationStats() }
            val userStats = byUserId.getOrPut(userId) { ReconciliationStats() }
            ctStats.logCount += 1
            userStats.logCount += 1

            // 1) 새 정책 raw 계산
            val contentLevelId = try {
                contentRepository.findById(current.contentId).orElse(null)?.levelId
            } catch (_: Exception) { null }
            val decision = SeedRewardPolicy.calculateGrant(
                userLevelId = contentLevelId,
                contentLevelId = contentLevelId,
                contentType = ct,
                accuracyPct = current.accuracy,
                source = sourceForContentType(ct),
            )

            // 2) 같은 날 cap 적용 — 본 reconciliation 누적분 사용 (이미 시간순 처리 중)
            val alreadyTodayEarned = dayCapAcc[capKey] ?: 0
            val newCapped = SeedRewardPolicy.applyDailyCap(decision.rawCount, decision.dailyCapPerContentType, alreadyTodayEarned)
            dayCapAcc[capKey] = alreadyTodayEarned + newCapped

            val oldEarned = current.earnedSeed
            val topUp = (newCapped - oldEarned).coerceAtLeast(0)

            if (examples.size < 30) {
                examples.add(ReconciliationExample(
                    logId = current.id, userId = userId, contentType = ct,
                    contentId = current.contentId, accuracy = current.accuracy,
                    oldEarned = oldEarned, newCalculated = decision.rawCount,
                    newCapped = newCapped, topUp = topUp, seedType = decision.seedType,
                ))
            }

            if (topUp > 0) {
                needTopUpCount += 1
                totalTopUp += topUp
                ctStats.topUpCount += 1
                ctStats.topUpSeeds += topUp
                userStats.topUpCount += 1
                userStats.topUpSeeds += topUp

                if (apply) {
                    economyService.addSeeds(
                        userId, decision.seedType, topUp,
                        "seed_reconciliation_${days}d",
                        "farm_learning_log",
                        current.id,
                    )
                    current.earnedSeed = newCapped
                    current.earnedSeedType = decision.seedType
                    farmLearningLogRepository.save(current)
                }
            } else {
                ctStats.alreadyOkCount += 1
                userStats.alreadyOkCount += 1
            }
        }

        // user stats 는 topUp 큰 순으로 상위 50명만
        val topUsers = byUserId.entries.sortedByDescending { it.value.topUpSeeds }.take(50)
            .associate { it.key to it.value }

        return ReconciliationReport(
            days = days,
            apply = apply,
            since = since.toString(),
            totalLogsInspected = logs.size,
            logsNeedingTopUp = needTopUpCount,
            totalTopUpSeeds = totalTopUp,
            byContentType = byContentType,
            byUserId = topUsers,
            examples = examples,
        )
    }

    private fun sourceForContentType(contentType: String?): SeedRewardPolicy.GrantSource {
        if (contentType.isNullOrBlank()) return SeedRewardPolicy.GrantSource.FARM_LEARNING
        return when {
            contentType == "STUDY_CONTENT" -> SeedRewardPolicy.GrantSource.STUDY_CONTENT
            contentType.startsWith("PRO_") -> SeedRewardPolicy.GrantSource.PRO_MODE
            else -> SeedRewardPolicy.GrantSource.FARM_LEARNING
        }
    }
}
