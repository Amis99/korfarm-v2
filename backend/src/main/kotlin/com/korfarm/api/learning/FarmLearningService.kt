package com.korfarm.api.learning

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.diagnostic.scoring.COMPETENCIES
import com.korfarm.api.economy.EconomyService
import com.korfarm.api.paid.ContentRepository
import com.korfarm.api.paid.ContentVersionRepository
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Lazy
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
    // N-11 (2026-05-21) — 학습 완료 즉시 study_plan_cells 동기화. 순환 의존 방어로 @Lazy.
    @Lazy private val studyPlanService: com.korfarm.api.studyplan.StudyPlanService,
) {
    private val logger = LoggerFactory.getLogger(FarmLearningService::class.java)

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

        // 통합 정책 — 프론트 earnedSeed 무시. 서버가 결정.
        val userLevelId = try { contentRepository.findById(log.contentId).orElse(null)?.levelId } catch (_: Exception) { null }
        val contentLevelId = userLevelId  // 일관 매핑 — 같은 학년대 학습
        val decision = SeedRewardPolicy.calculateGrant(
            userLevelId = userLevelId,
            contentLevelId = contentLevelId,
            contentType = log.contentType,
            accuracyPct = request.accuracy,
            source = SeedRewardPolicy.GrantSource.FARM_LEARNING,
        )
        // 보상 정책 변경 (2026-05-17): 한 콘텐츠 하루 1회만 씨앗 지급.
        // 무작정 같은 콘텐츠 반복으로 보상 노리는 행위 차단. contentType 일일 합산 cap 대신
        // (userId, contentId) 기준으로 오늘 이미 보상받았는지 확인.
        val todayStart = LocalDate.now().atStartOfDay()
        val alreadyRewardedForThisContent = farmLearningLogRepository
            .sumEarnedSeedByUserAndContentIdSince(userId, log.contentId, todayStart) > 0
        val actualEarned = if (alreadyRewardedForThisContent) 0 else decision.rawCount
        val dailySeedRemaining = if (alreadyRewardedForThisContent) 0 else actualEarned
        val resolvedSeedType = decision.seedType

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

        // N-11 (2026-05-21) — 학습 계획표 korfarm 셀/assignment 즉시 sync.
        // 학습 계획표 외부 경로로 학습해도 캘린더·진행률·통합 분석표에서 즉시 정확한 값 표시.
        try {
            studyPlanService.syncKorfarmCellsForUser(userId, log.contentId)
        } catch (e: Exception) {
            logger.warn("study_plan korfarm cell sync 실패: userId={} contentId={} error={}", userId, log.contentId, e.message)
        }

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
    internal fun computeQuestionResults(
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

    /**
     * 학생 한 명의 10대 역량 누적을 처음부터 다시 계산.
     *
     * 시나리오: competencyVector fallback 정책이 바뀌었거나, 과거 활동 시점에
     * 누적 hook 이 silent fail 한 학생을 복구할 때 admin 이 호출.
     *
     * 1) user_competency_summary + learning_competency_log 의 해당 학생 row 일괄 삭제
     * 2) farm_learning_logs (COMPLETED) 시간순 순회 → quiz_answer_details 가져와
     *    computeQuestionResults + recordVector(completedAt 보존) 재기록
     *
     * 시간 가중(decay)·소스 가중(weight)·슬라이딩 윈도우는 recordVector 가 자동 처리.
     */
    @Transactional
    fun rebuildUserCompetency(userId: String): com.korfarm.api.learning.RebuildCompetencyResult {
        // 1. 기존 누적 삭제 (log + summary cache)
        learningCompetencyService.clearUserAccumulation(userId)

        // 2. 활동 순회 (오래된 것부터 — decay 가 자동으로 가중)
        val veryEarly = java.time.LocalDateTime.of(2000, 1, 1, 0, 0)
        val veryLate = java.time.LocalDateTime.now().plusDays(1)
        val logs = farmLearningLogRepository
            .findByUserIdAndStatusAndCompletedAtBetween(userId, "COMPLETED", veryEarly, veryLate)
            .sortedBy { it.completedAt ?: it.createdAt }

        var processed = 0
        var recorded = 0
        var skipped = 0
        for (log in logs) {
            processed++
            val details = quizAnswerDetailRepository.findByLogId(log.id)
            val answers = details.map { d ->
                AnswerDetailRequest(
                    questionId = d.questionId,
                    questionKind = d.questionKind,
                    correct = d.correct,
                    chosenChoiceId = null  // quiz_answer_details 에 저장 X — wrongVector 매칭만 안 됨, 누적은 가능
                )
            }
            val results = try {
                computeQuestionResults(log.contentId, log.contentType, answers)
            } catch (_: Exception) { emptyList() }
            if (results.isEmpty()) { skipped++; continue }

            val source = resolveSourceFromContentType(log.contentType)
            val ok = learningCompetencyService.recordVector(
                userId = userId,
                contentId = log.contentId,
                source = source,
                results = results,
                completedAt = log.completedAt ?: log.createdAt,
            )
            if (ok) recorded++ else skipped++
        }
        return com.korfarm.api.learning.RebuildCompetencyResult(
            totalLogs = logs.size,
            processed = processed,
            recorded = recorded,
            skipped = skipped,
        )
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
