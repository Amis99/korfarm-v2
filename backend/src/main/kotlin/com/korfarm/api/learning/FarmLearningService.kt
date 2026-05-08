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

        // 10대 역량 종합 누적 (벡터 기반) — 콘텐츠의 questions[] 의 competencyVector + choices[].wrongVector 추출
        // 재응시(같은 user × content)는 LearningCompetencyService 가 자동 무시.
        try {
            val results = computeQuestionResults(log.contentId, log.contentType, request.answers)
            if (results.isNotEmpty()) {
                val source = resolveSourceFromContentType(log.contentType)
                learningCompetencyService.recordVector(userId, log.contentId, source, results)
            }
        } catch (_: Exception) { /* 누적 실패는 학습 완료 자체를 막지 않음 */ }

        return FarmCompleteResponse(success = true, earnedSeed = actualEarned, dailySeedRemaining = dailySeedRemaining)
    }

    /**
     * 콘텐츠 questions[] 의 competencyVector + choices[].wrongVector 와 학생 응답 매칭하여
     * 문항별 QuestionResult 리스트 반환 (벡터 기반).
     *
     * 호환 (우선순위):
     *  1. q.competencyVector — 가장 정확
     *  2. q.competency (단일 필드) — {competency: 1.0}
     *  3. contentType → 단일 default competency (CompetencyMapping)
     *  → 셋 다 없는 문항도 누적되도록 contentType 기반 fallback 보장
     */
    private fun computeQuestionResults(
        contentId: String,
        contentType: String,
        answers: List<AnswerDetailRequest>?,
    ): List<com.korfarm.api.learning.QuestionResult> {
        if (answers.isNullOrEmpty()) return emptyList()
        val version = contentVersionRepository.findTopByContentIdOrderByCreatedAtDesc(contentId)
        // contentType 기반 default vector — 콘텐츠 자체가 DB에 없거나 questions 가 비어도 사용 가능
        val typeDefault: Map<String, Double> =
            com.korfarm.api.report.CompetencyMapping.competencyForContentType(contentType)
                ?.takeIf { it in COMPETENCIES }
                ?.let { mapOf(it to 1.0) }
                ?: emptyMap()

        val wrapper: Map<String, Any>? = version?.let {
            try {
                objectMapper.readValue(it.contentJson, object : TypeReference<Map<String, Any>>() {})
            } catch (_: Exception) { null }
        }
        @Suppress("UNCHECKED_CAST")
        val payload = (wrapper?.get("payload") as? Map<String, Any>) ?: wrapper
        @Suppress("UNCHECKED_CAST")
        val questions = (payload?.get("questions") as? List<Map<String, Any>>).orEmpty()

        // questionId → (correctVector, choiceId→wrongVector) 매핑
        val qInfo = mutableMapOf<String, Pair<Map<String, Double>, Map<String, Map<String, Double>>>>()
        for (q in questions) {
            val qid = (q["id"] ?: q["questionId"])?.toString() ?: continue
            // correctVector
            @Suppress("UNCHECKED_CAST")
            val cv = (q["competencyVector"] as? Map<String, Any>)?.mapNotNull { (k, v) ->
                val w = (v as? Number)?.toDouble() ?: return@mapNotNull null
                if (k !in COMPETENCIES) null else (k to w)
            }?.toMap() ?: emptyMap()
            // fallback 1: 단일 competency 필드
            val singleCompetency = q["competency"]?.toString()?.trim()
            val singleVec: Map<String, Double> =
                if (singleCompetency != null && singleCompetency in COMPETENCIES) mapOf(singleCompetency to 1.0) else emptyMap()
            // fallback 2: contentType default
            val correctVector: Map<String, Double> = when {
                cv.isNotEmpty() -> cv
                singleVec.isNotEmpty() -> singleVec
                typeDefault.isNotEmpty() -> typeDefault
                else -> emptyMap()
            }
            if (correctVector.isEmpty()) continue

            // choices[].wrongVector
            @Suppress("UNCHECKED_CAST")
            val choices = (q["choices"] as? List<Map<String, Any>>) ?: emptyList()
            val wrongByChoice = mutableMapOf<String, Map<String, Double>>()
            for (ch in choices) {
                val cid = (ch["id"] ?: ch["choiceId"])?.toString() ?: continue
                @Suppress("UNCHECKED_CAST")
                val wv = (ch["wrongVector"] as? Map<String, Any>)?.mapNotNull { (k, v) ->
                    val w = (v as? Number)?.toDouble() ?: return@mapNotNull null
                    if (k !in COMPETENCIES) null else (k to w)
                }?.toMap() ?: emptyMap()
                if (wv.isNotEmpty()) wrongByChoice[cid] = wv
            }
            qInfo[qid] = correctVector to wrongByChoice
        }

        val results = mutableListOf<com.korfarm.api.learning.QuestionResult>()
        for (a in answers) {
            // questionId 매칭이 없거나 콘텐츠 자체에 questions 가 비어 있으면
            // contentType default vector 로라도 누적 (역량 0% 방지).
            val pair = qInfo[a.questionId]
            val correctVec: Map<String, Double> = pair?.first
                ?: if (typeDefault.isNotEmpty()) typeDefault else continue
            val wrongMap: Map<String, Map<String, Double>> = pair?.second ?: emptyMap()
            val chosenWrong = if (!a.correct && a.chosenChoiceId != null) wrongMap[a.chosenChoiceId] else null
            results.add(com.korfarm.api.learning.QuestionResult(
                correctVector = correctVec,
                chosenWrongVector = chosenWrong,
                isCorrect = a.correct,
            ))
        }
        return results
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
