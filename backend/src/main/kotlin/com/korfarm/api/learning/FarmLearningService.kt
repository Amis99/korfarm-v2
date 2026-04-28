package com.korfarm.api.learning

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.diagnostic.scoring.COMPETENCIES
import com.korfarm.api.economy.EconomyService
import com.korfarm.api.paid.ContentRepository
import com.korfarm.api.paid.ContentVersionRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@Service
class FarmLearningService(
    private val farmLearningLogRepository: FarmLearningLogRepository,
    private val quizAnswerDetailRepository: QuizAnswerDetailRepository,
    private val contentRepository: ContentRepository,
    private val contentVersionRepository: ContentVersionRepository,
    private val economyService: EconomyService,
    private val learningCompetencyService: LearningCompetencyService,
    private val objectMapper: ObjectMapper,
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

        // 문항별 정답/오답 저장
        if (!request.answers.isNullOrEmpty()) {
            quizAnswerDetailRepository.deleteByLogId(log.id)
            val details = request.answers.map { ans ->
                QuizAnswerDetailEntity(
                    id = IdGenerator.newId("qad"),
                    logId = log.id,
                    userId = userId,
                    questionId = ans.questionId,
                    questionKind = ans.questionKind,
                    correct = ans.correct,
                    answeredAt = now
                )
            }
            quizAnswerDetailRepository.saveAll(details)
        }

        // 10대 역량 종합 누적 — 콘텐츠의 questions[] 의 competency 와 매칭하여 정답률 계산.
        // 재응시(같은 user × content)는 LearningCompetencyService 가 자동 무시.
        try {
            val ratioByCompetency = computeCompetencyRatios(log.contentId, request.answers)
            if (ratioByCompetency.isNotEmpty()) {
                val source = resolveSourceFromContentType(log.contentType)
                learningCompetencyService.record(userId, log.contentId, source, ratioByCompetency)
            }
        } catch (_: Exception) { /* 누적 실패는 학습 완료 자체를 막지 않음 */ }

        return FarmCompleteResponse(success = true, earnedSeed = actualEarned, dailySeedRemaining = dailySeedRemaining)
    }

    /**
     * 콘텐츠 questions[] 의 competency 필드와 학생 응답을 매칭하여
     * 역량별 정답률(0~1) 맵을 반환. 측정되지 않은 역량은 키 자체 없음.
     */
    private fun computeCompetencyRatios(
        contentId: String,
        answers: List<AnswerDetailRequest>?,
    ): Map<String, Double> {
        if (answers.isNullOrEmpty()) return emptyMap()
        val version = contentVersionRepository.findTopByContentIdOrderByCreatedAtDesc(contentId)
            ?: return emptyMap()
        val wrapper: Map<String, Any> = try {
            objectMapper.readValue(version.contentJson, object : TypeReference<Map<String, Any>>() {})
        } catch (_: Exception) { return emptyMap() }
        @Suppress("UNCHECKED_CAST")
        val payload = (wrapper["payload"] as? Map<String, Any>) ?: wrapper
        @Suppress("UNCHECKED_CAST")
        val questions = (payload["questions"] as? List<Map<String, Any>>) ?: return emptyMap()

        // questionId → competency 매핑 (10대 역량 화이트리스트만 인정)
        val qIdToCompetency = mutableMapOf<String, String>()
        for (q in questions) {
            val qid = (q["id"] ?: q["questionId"])?.toString() ?: continue
            val comp = q["competency"]?.toString()?.trim() ?: continue
            if (comp.isEmpty() || comp !in COMPETENCIES) continue
            qIdToCompetency[qid] = comp
        }
        if (qIdToCompetency.isEmpty()) return emptyMap()

        // 역량별 정답/총 카운트
        val correctByComp = mutableMapOf<String, Int>()
        val totalByComp = mutableMapOf<String, Int>()
        for (a in answers) {
            val comp = qIdToCompetency[a.questionId] ?: continue
            totalByComp[comp] = (totalByComp[comp] ?: 0) + 1
            if (a.correct) correctByComp[comp] = (correctByComp[comp] ?: 0) + 1
        }
        if (totalByComp.isEmpty()) return emptyMap()

        return totalByComp.mapValues { (comp, total) ->
            val correct = correctByComp[comp] ?: 0
            if (total > 0) correct.toDouble() / total else 0.0
        }
    }

    @Transactional(readOnly = true)
    fun getHistory(userId: String): FarmHistoryResponse {
        val logs = farmLearningLogRepository.findTop50ByUserIdOrderByCreatedAtDesc(userId)
        val fmt = DateTimeFormatter.ISO_LOCAL_DATE_TIME
        // contentId → title 매핑
        val contentIds = logs.map { it.contentId }.distinct()
        val titleMap = if (contentIds.isNotEmpty()) {
            contentRepository.findAllById(contentIds).associate { it.id to it.title }
        } else emptyMap()
        val entries = logs.map { log ->
            FarmHistoryEntry(
                logId = log.id,
                contentId = log.contentId,
                contentType = log.contentType,
                contentTitle = titleMap[log.contentId],
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

}
