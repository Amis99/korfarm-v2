package com.korfarm.api.learning

import com.korfarm.api.common.IdGenerator
import com.korfarm.api.economy.EconomyService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@Service
class FarmLearningService(
    private val farmLearningLogRepository: FarmLearningLogRepository,
    private val contentPageProgressRepository: ContentPageProgressRepository,
    private val economyService: EconomyService
) {
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

        val now = LocalDateTime.now()
        log.status = "COMPLETED"
        log.score = request.score
        log.accuracy = request.accuracy
        log.earnedSeed = request.earnedSeed
        log.earnedSeedType = request.seedType
        log.completedAt = now
        farmLearningLogRepository.save(log)

        if (request.earnedSeed > 0 && !request.seedType.isNullOrBlank()) {
            economyService.addSeeds(
                userId,
                request.seedType,
                request.earnedSeed,
                "farm_learning",
                "farm_learning_log",
                log.id
            )
        }

        return FarmCompleteResponse(success = true, earnedSeed = request.earnedSeed)
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
        val entity = ContentPageProgressEntity(
            id = IdGenerator.newId("cpp"),
            userId = userId,
            contentId = request.contentId,
            logId = request.logId,
            pageNo = request.pageNo,
            score = request.score,
            accuracy = request.accuracy,
            earnedSeed = request.earnedSeed,
            earnedSeedType = request.seedType,
            completedAt = LocalDateTime.now()
        )
        contentPageProgressRepository.save(entity)

        if (request.earnedSeed > 0 && !request.seedType.isNullOrBlank()) {
            economyService.addSeeds(
                userId,
                request.seedType,
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
