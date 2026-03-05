package com.korfarm.api.learning

import com.korfarm.api.common.IdGenerator
import com.korfarm.api.economy.EconomyService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@Service
class FarmLearningService(
    private val farmLearningLogRepository: FarmLearningLogRepository,
    private val contentPageProgressRepository: ContentPageProgressRepository,
    private val economyService: EconomyService
) {
    companion object {
        val DAILY_SEED_LIMIT_TYPES = setOf("DAILY_QUIZ", "DAILY_READING")
        const val DAILY_SEED_MAX = 10
    }

    @Transactional
    fun start(userId: String, request: FarmStartRequest): FarmStartResponse {
        val now = LocalDateTime.now()
        val log = FarmLearningLogEntity(
            id = IdGenerator.newId("fl"),
            userId = userId,
            contentId = request.contentId,
            contentType = request.contentType,
            status = "STARTED",
            startedAt = now
        )
        farmLearningLogRepository.save(log)
        return FarmStartResponse(logId = log.id)
    }

    @Transactional
    fun complete(userId: String, request: FarmCompleteRequest): FarmCompleteResponse {
        val log = farmLearningLogRepository.findById(request.logId).orElse(null)
            ?: return FarmCompleteResponse(success = false, earnedSeed = 0)

        if (log.userId != userId) {
            return FarmCompleteResponse(success = false, earnedSeed = 0)
        }

        // 서버 측에서 contentType 기반으로 씨앗 종류 결정 (프론트 값 무시)
        val resolvedSeedType = SeedRewardPolicy.seedTypeForContentType(log.contentType)
            ?: request.seedType
            ?: "seed_wheat"

        // 일일 퀴즈/독해: 하루 씨앗 10개 제한
        var actualEarned = request.earnedSeed
        var dailySeedRemaining: Int? = null
        if (log.contentType in DAILY_SEED_LIMIT_TYPES && actualEarned > 0) {
            val todayStart = LocalDate.now().atStartOfDay()
            val todayEarned = farmLearningLogRepository
                .sumEarnedSeedByUserAndContentTypeSince(userId, log.contentType, todayStart)
            val remaining = (DAILY_SEED_MAX - todayEarned).coerceAtLeast(0)
            actualEarned = actualEarned.coerceAtMost(remaining)
            dailySeedRemaining = (remaining - actualEarned).coerceAtLeast(0)
        }

        val now = LocalDateTime.now()
        log.status = "COMPLETED"
        log.score = request.score
        log.accuracy = request.accuracy
        log.earnedSeed = actualEarned
        log.earnedSeedType = resolvedSeedType
        log.completedAt = now
        farmLearningLogRepository.save(log)

        if (actualEarned > 0) {
            economyService.addSeeds(
                userId,
                resolvedSeedType,
                actualEarned,
                "farm_learning",
                "farm_learning_log",
                log.id
            )
        }

        return FarmCompleteResponse(success = true, earnedSeed = actualEarned, dailySeedRemaining = dailySeedRemaining)
    }

    @Transactional(readOnly = true)
    fun getHistory(userId: String): FarmHistoryResponse {
        val logs = farmLearningLogRepository.findTop50ByUserIdOrderByCreatedAtDesc(userId)
        val fmt = DateTimeFormatter.ISO_LOCAL_DATE_TIME
        val entries = logs.map { log ->
            FarmHistoryEntry(
                logId = log.id,
                contentId = log.contentId,
                contentType = log.contentType,
                status = log.status,
                score = log.score,
                accuracy = log.accuracy,
                earnedSeed = log.earnedSeed,
                earnedSeedType = log.earnedSeedType,
                startedAt = log.startedAt.format(fmt),
                completedAt = log.completedAt?.format(fmt)
            )
        }
        return FarmHistoryResponse(logs = entries)
    }

    fun getDailySeedStatus(userId: String, contentType: String): DailySeedStatusResponse {
        val todayStart = LocalDate.now().atStartOfDay()
        val todayEarned = farmLearningLogRepository
            .sumEarnedSeedByUserAndContentTypeSince(userId, contentType, todayStart)
        val remaining = (DAILY_SEED_MAX - todayEarned).coerceAtLeast(0)
        return DailySeedStatusResponse(
            todayEarned = todayEarned,
            dailyLimit = DAILY_SEED_MAX,
            remaining = remaining
        )
    }

    @Transactional(readOnly = true)
    fun getProgress(userId: String?, contentIds: List<String>): FarmProgressResponse {
        if (contentIds.isEmpty()) {
            return FarmProgressResponse(stats = emptyMap(), myStatus = emptyMap())
        }

        val startCounts = farmLearningLogRepository.countByContentIds(contentIds)
        val completeCounts = farmLearningLogRepository.countCompletedByContentIds(contentIds)

        val startMap = startCounts.associate { it.contentId to it.cnt }
        val completeMap = completeCounts.associate { it.contentId to it.cnt }

        val stats = contentIds.associateWith { id ->
            ContentStats(
                startCount = startMap[id] ?: 0,
                completeCount = completeMap[id] ?: 0
            )
        }

        val myStatus = if (userId != null) {
            val logs = farmLearningLogRepository.findByUserIdAndContentIdIn(userId, contentIds)
            val grouped = logs.groupBy { it.contentId }
            contentIds.associateWith { id ->
                val userLogs = grouped[id]
                when {
                    userLogs == null || userLogs.isEmpty() -> PersonalStatus("NONE")
                    userLogs.any { it.status == "COMPLETED" } -> PersonalStatus("COMPLETED")
                    else -> PersonalStatus("STARTED")
                }
            }
        } else {
            contentIds.associateWith { PersonalStatus("NONE") }
        }

        return FarmProgressResponse(stats = stats, myStatus = myStatus)
    }

    @Transactional
    fun pageComplete(userId: String, request: PageCompleteRequest): PageCompleteResponse {
        // 서버 측에서 contentType 기반으로 씨앗 종류 결정
        val parentLog = farmLearningLogRepository.findById(request.logId).orElse(null)
        val resolvedSeedType = parentLog?.contentType?.let { SeedRewardPolicy.seedTypeForContentType(it) }
            ?: request.seedType
            ?: "seed_wheat"

        val entity = ContentPageProgressEntity(
            id = IdGenerator.newId("cpp"),
            userId = userId,
            contentId = request.contentId,
            logId = request.logId,
            pageNo = request.pageNo,
            score = request.score,
            accuracy = request.accuracy,
            earnedSeed = request.earnedSeed,
            earnedSeedType = resolvedSeedType,
            completedAt = LocalDateTime.now()
        )
        contentPageProgressRepository.save(entity)

        if (request.earnedSeed > 0) {
            economyService.addSeeds(
                userId,
                resolvedSeedType,
                request.earnedSeed,
                "farm_page_learning",
                "content_page_progress",
                entity.id
            )
        }

        val allPages = contentPageProgressRepository.findByUserIdAndContentIdOrderByPageNoAsc(userId, request.contentId)
        val totalEarned = allPages.sumOf { it.earnedSeed }
        return PageCompleteResponse(success = true, totalEarnedSeed = totalEarned)
    }

    @Transactional(readOnly = true)
    fun pageProgress(userId: String, request: PageProgressRequest): PageProgressResponse {
        val pages = contentPageProgressRepository.findByUserIdAndContentIdOrderByPageNoAsc(userId, request.contentId)
        val lastPage = pages.maxByOrNull { it.pageNo }?.pageNo ?: 0
        val results = pages.map { PageResultDto(pageNo = it.pageNo, score = it.score, accuracy = it.accuracy, earnedSeed = it.earnedSeed) }
        return PageProgressResponse(lastCompletedPage = lastPage, pageResults = results)
    }
}
