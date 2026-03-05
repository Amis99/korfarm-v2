package com.korfarm.api.diagnostic

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.diagnostic.scoring.*
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDateTime

@Service
class DiagnosticService(
    private val passageRepo: DiagPassageRepository,
    private val questionRepo: DiagQuestionRepository,
    private val sessionRepo: DiagSessionRepository,
    private val responseRepo: DiagResponseRepository,
    private val objectMapper: ObjectMapper
) {

    // ── tier 목록 ──

    fun getTiers(userId: String): List<TierInfo> {
        return TEST_ORDER.map { tier ->
            val label = TIER_LABELS[tier] ?: tier
            val count = questionRepo.countByTier(tier)
            val sessions = sessionRepo.findByUserIdAndTierOrderByStartedAtDesc(userId, tier)
            val completed = sessions.find { it.status == "completed" }
            TierInfo(
                tier = tier,
                label = label,
                questionCount = count,
                hasCompleted = completed != null,
                lastTci = completed?.adjustedTci?.toDouble()
            )
        }
    }

    // ── 세션 생성 ──

    @Transactional
    fun createSession(userId: String, request: CreateSessionRequest): SessionCreatedResponse {
        val tier = request.tier
        val mode = request.mode
        if (tier !in TEST_ORDER) throw ApiException("INVALID_TIER", "유효하지 않은 tier", HttpStatus.BAD_REQUEST)
        if (mode !in listOf("full", "cat")) throw ApiException("INVALID_MODE", "유효하지 않은 mode", HttpStatus.BAD_REQUEST)

        // 기존 활성 세션이 있으면 자동 폐기
        val active = sessionRepo.findByUserIdAndStatus(userId, "active")
        active.filter { it.tier == tier }.forEach { old ->
            old.status = "abandoned"
            sessionRepo.save(old)
        }

        val sessionId = IdGenerator.newId("dsess")
        val scores = ScoringEngine.initScores()
        val touchCounts = ScoringEngine.initTouchCounts()

        val session = DiagSessionEntity(
            id = sessionId,
            userId = userId,
            tier = tier,
            mode = mode,
            status = "active",
            scoresJson = objectMapper.writeValueAsString(scores),
            touchCountsJson = objectMapper.writeValueAsString(touchCounts)
        )
        sessionRepo.save(session)

        // 첫 배치 선택
        val pool = loadQuestionPool(tier)
        val firstBatch = if (mode == "cat") {
            val engine = CatEngine(pool, tier)
            val batch = engine.selectNextBatch(5)
            // 세션에 사용된 문항 기록은 응답 시 처리
            batch.map { toQuestionDto(it) }
        } else {
            // full 모드: 모든 문항 반환 (서술형 제외)
            pool.filter { it.questionType != "서술형" }.map { toQuestionDto(it) }
        }

        return SessionCreatedResponse(sessionId = sessionId, firstBatch = firstBatch)
    }

    // ── 세션 상태 조회 ──

    fun getSessionStatus(sessionId: String, userId: String): SessionStatusResponse {
        val session = getSession(sessionId, userId)
        return SessionStatusResponse(
            sessionId = session.id,
            status = session.status,
            answeredCount = session.answeredCount,
            currentBatch = null // 클라이언트에서 관리
        )
    }

    // ── 배치 답안 제출 ──

    @Transactional
    fun submitResponses(sessionId: String, userId: String, request: SubmitResponsesRequest): SubmitResponsesResponse {
        val session = getSession(sessionId, userId)
        if (session.status != "active") {
            throw ApiException("SESSION_NOT_ACTIVE", "세션이 활성 상태가 아닙니다", HttpStatus.BAD_REQUEST)
        }

        // 현재 상태 복원
        val scores: MutableMap<String, Double> = objectMapper.readValue(session.scoresJson ?: "{}")
        val touchCounts: MutableMap<String, Int> = objectMapper.readValue(session.touchCountsJson ?: "{}")
        val existingResponses = responseRepo.findBySessionIdOrderByResponseOrderAsc(sessionId)
        val usedIds = existingResponses.map { it.questionId }.toMutableSet()

        // 오류기여 맵 초기화
        val errorContrib = ScoringEngine.initErrorContrib()

        var answeredCount = session.answeredCount
        var correctCount = session.correctCount
        val batchNumber = (existingResponses.maxOfOrNull { it.batchNumber ?: 0 } ?: 0) + 1

        // 각 응답 처리
        for (resp in request.responses) {
            val question = questionRepo.findById(resp.questionId).orElse(null) ?: continue
            if (question.questionType == "서술형") continue

            val choicesData: List<Map<String, Any>> = objectMapper.readValue(question.choicesJson)
            val selectedChoice = choicesData.find { (it["choice_id"] as? String) == resp.choice }
            val isCorrect = resp.choice == question.correctChoice

            // 벡터 적용
            if (selectedChoice != null) {
                @Suppress("UNCHECKED_CAST")
                val vector = (selectedChoice["vector"] as? Map<String, Any>)
                    ?.mapValues { (it.value as Number).toDouble() } ?: emptyMap()
                val multiplier = getLevelMultiplier(session.tier, getQuestionLevel(question))

                if (isCorrect) {
                    ScoringEngine.applyVector(scores, vector, CORRECT_WEIGHT, 1.0)
                } else {
                    ScoringEngine.applyVector(scores, vector, INCORRECT_WEIGHT, multiplier)
                    val errorPath = selectedChoice["error_path"] as? String
                    ScoringEngine.accumulateError(errorContrib, vector, errorPath, INCORRECT_WEIGHT, multiplier)
                }

                for (k in vector.keys) {
                    val nk = normalizeKey(k)
                    if (nk in touchCounts) touchCounts[nk] = touchCounts[nk]!! + 1
                }
            }

            ScoringEngine.clampScores(scores)
            answeredCount++
            if (isCorrect) correctCount++
            usedIds.add(resp.questionId)

            // 응답 저장
            val responseEntity = DiagResponseEntity(
                id = IdGenerator.newId("dresp"),
                sessionId = sessionId,
                questionId = resp.questionId,
                selectedChoice = resp.choice,
                isCorrect = isCorrect,
                responseOrder = answeredCount,
                batchNumber = batchNumber
            )
            responseRepo.save(responseEntity)
        }

        // 세션 갱신
        session.scoresJson = objectMapper.writeValueAsString(scores)
        session.touchCountsJson = objectMapper.writeValueAsString(touchCounts)
        session.answeredCount = answeredCount
        session.correctCount = correctCount
        session.errorAnalysisJson = objectMapper.writeValueAsString(errorContrib)

        val rawTci = ScoringEngine.calculateTci(scores)
        val confidence = ScoringEngine.calculateConfidence(answeredCount)
        val adjTci = ScoringEngine.applyConfidenceToTci(rawTci, confidence)
        session.rawTci = BigDecimal.valueOf(rawTci).setScale(2, java.math.RoundingMode.HALF_UP)
        session.adjustedTci = BigDecimal.valueOf(adjTci).setScale(2, java.math.RoundingMode.HALF_UP)
        session.confidence = BigDecimal.valueOf(confidence).setScale(2, java.math.RoundingMode.HALF_UP)

        sessionRepo.save(session)

        // 다음 배치 / 종료 판단
        if (session.mode == "cat") {
            val pool = loadQuestionPool(session.tier)
            val engine = restoreCatEngine(pool, session.tier, scores, touchCounts, usedIds, answeredCount, correctCount, errorContrib)
            val (stop, _) = engine.shouldStop()

            val interim = InterimReport(
                answeredCount = answeredCount,
                correctCount = correctCount,
                rawTci = Math.round(rawTci * 100.0) / 100.0,
                adjustedTci = Math.round(adjTci * 100.0) / 100.0,
                confidence = Math.round(confidence * 100.0) / 100.0,
                scores = scores.mapValues { Math.round(it.value * 10.0) / 10.0 },
                weakCompetencies = scores.entries.sortedBy { it.value }.take(3).map { it.key }
            )

            if (stop) {
                return SubmitResponsesResponse(nextBatch = null, shouldStop = true, interim = interim)
            }

            val nextBatch = engine.selectNextBatch(5).map { toQuestionDto(it) }
            return SubmitResponsesResponse(nextBatch = nextBatch, shouldStop = false, interim = interim)
        } else {
            // full 모드: 이미 모든 문항을 받았으므로 종료 가능
            return SubmitResponsesResponse(nextBatch = null, shouldStop = true, interim = null)
        }
    }

    // ── 세션 완료 ──

    @Transactional
    fun completeSession(sessionId: String, userId: String): DiagnosticReport {
        val session = getSession(sessionId, userId)
        if (session.status != "active") {
            throw ApiException("SESSION_NOT_ACTIVE", "세션이 활성 상태가 아닙니다", HttpStatus.BAD_REQUEST)
        }

        val scores: MutableMap<String, Double> = objectMapper.readValue(session.scoresJson ?: "{}")
        val rawTci = ScoringEngine.calculateTci(scores)
        val confidence = ScoringEngine.calculateConfidence(session.answeredCount)
        val adjTci = ScoringEngine.applyConfidenceToTci(rawTci, confidence)
        val recommendation = ScoringEngine.calculateRecommendation(session.tier, rawTci, confidence)

        session.status = "completed"
        session.rawTci = BigDecimal.valueOf(rawTci).setScale(2, java.math.RoundingMode.HALF_UP)
        session.adjustedTci = BigDecimal.valueOf(adjTci).setScale(2, java.math.RoundingMode.HALF_UP)
        session.confidence = BigDecimal.valueOf(confidence).setScale(2, java.math.RoundingMode.HALF_UP)
        session.recommendedLevel = recommendation.label
        session.completedAt = LocalDateTime.now()
        sessionRepo.save(session)

        return buildReport(session, scores, recommendation)
    }

    // ── 리포트 조회 ──

    fun getReport(sessionId: String, userId: String): DiagnosticReport {
        val session = getSession(sessionId, userId)
        if (session.status != "completed") {
            throw ApiException("SESSION_NOT_COMPLETED", "세션이 완료되지 않았습니다", HttpStatus.BAD_REQUEST)
        }
        val scores: MutableMap<String, Double> = objectMapper.readValue(session.scoresJson ?: "{}")
        val recommendation = ScoringEngine.calculateRecommendation(
            session.tier, session.rawTci?.toDouble() ?: 50.0, session.confidence?.toDouble() ?: 0.0
        )
        return buildReport(session, scores, recommendation)
    }

    // ── 이력 조회 ──

    fun getHistory(userId: String): List<SessionHistoryItem> {
        return sessionRepo.findByUserIdOrderByStartedAtDesc(userId).map { s ->
            SessionHistoryItem(
                sessionId = s.id,
                tier = s.tier,
                tci = s.adjustedTci?.toDouble(),
                level = s.recommendedLevel,
                date = s.startedAt.toString(),
                mode = s.mode,
                status = s.status
            )
        }
    }

    // ── 관리자 API ──

    fun adminListQuestions(tier: String?, genre: String?, type: String?): List<AdminQuestionSummary> {
        val all = if (tier != null) questionRepo.findByTierOrderByIdAsc(tier)
        else questionRepo.findAll()
        return all
            .filter { q -> type == null || q.questionType == type }
            .map { q ->
                AdminQuestionSummary(
                    id = q.id, passageId = q.passageId, tier = q.tier,
                    questionType = q.questionType, stem = q.stem, correctChoice = q.correctChoice
                )
            }
    }

    fun adminListSessions(userId: String?, tier: String?): List<AdminSessionSummary> {
        val sessions = when {
            userId != null && tier != null -> sessionRepo.findByUserIdAndTierOrderByStartedAtDesc(userId, tier)
            userId != null -> sessionRepo.findByUserIdOrderByStartedAtDesc(userId)
            else -> sessionRepo.findAll().sortedByDescending { it.startedAt }
        }
        return sessions.map { toAdminSessionSummary(it) }
    }

    fun adminGetSession(sessionId: String): AdminSessionDetail {
        val session = sessionRepo.findById(sessionId).orElseThrow {
            ApiException("NOT_FOUND", "세션을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        val responses = responseRepo.findBySessionIdOrderByResponseOrderAsc(sessionId).map {
            AdminResponseItem(
                responseOrder = it.responseOrder,
                questionId = it.questionId,
                selectedChoice = it.selectedChoice,
                isCorrect = it.isCorrect,
                batchNumber = it.batchNumber
            )
        }
        val report = if (session.status == "completed") {
            val scores: MutableMap<String, Double> = objectMapper.readValue(session.scoresJson ?: "{}")
            val rec = ScoringEngine.calculateRecommendation(
                session.tier, session.rawTci?.toDouble() ?: 50.0, session.confidence?.toDouble() ?: 0.0
            )
            buildReport(session, scores, rec)
        } else null

        return AdminSessionDetail(
            session = toAdminSessionSummary(session),
            responses = responses,
            report = report
        )
    }

    fun adminGetStatistics(): DiagnosticStatistics {
        val all = sessionRepo.findAll()
        val total = all.size.toLong()
        val completed = all.count { it.status == "completed" }.toLong()
        val tierStats = TEST_ORDER.map { tier ->
            val tierSessions = all.filter { it.tier == tier }
            val tierCompleted = tierSessions.filter { it.status == "completed" }
            TierStat(
                tier = tier,
                totalSessions = tierSessions.size.toLong(),
                completedSessions = tierCompleted.size.toLong(),
                averageTci = if (tierCompleted.isNotEmpty())
                    tierCompleted.mapNotNull { it.adjustedTci?.toDouble() }.average()
                else null
            )
        }
        return DiagnosticStatistics(total, completed, tierStats)
    }

    // ── 내부 헬퍼 ──

    private fun getSession(sessionId: String, userId: String): DiagSessionEntity {
        val session = sessionRepo.findById(sessionId).orElseThrow {
            ApiException("NOT_FOUND", "세션을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        if (session.userId != userId) {
            throw ApiException("FORBIDDEN", "접근 권한이 없습니다", HttpStatus.FORBIDDEN)
        }
        return session
    }

    private fun loadQuestionPool(tier: String): List<QuestionData> {
        val questions = questionRepo.findByTierOrderByIdAsc(tier)
        val passages = passageRepo.findByTierOrderByLevelAscIdAsc(tier).associateBy { it.id }
        return questions.map { q ->
            val passage = passages[q.passageId]
            val choicesRaw: List<Map<String, Any>> = objectMapper.readValue(q.choicesJson)
            QuestionData(
                questionId = q.id,
                passageId = q.passageId,
                tier = q.tier,
                questionType = q.questionType,
                level = passage?.level,
                correctChoice = q.correctChoice,
                choices = choicesRaw.map { c ->
                    @Suppress("UNCHECKED_CAST")
                    ChoiceData(
                        choiceId = c["choice_id"] as? String ?: "",
                        text = c["text"] as? String ?: "",
                        vector = (c["vector"] as? Map<String, Any>)
                            ?.mapValues { (it.value as Number).toDouble() } ?: emptyMap(),
                        errorPath = c["error_path"] as? String
                    )
                }
            )
        }
    }

    private fun restoreCatEngine(
        pool: List<QuestionData>,
        tier: String,
        scores: MutableMap<String, Double>,
        touchCounts: MutableMap<String, Int>,
        usedIds: MutableSet<String>,
        answeredCount: Int,
        correctCount: Int,
        errorContrib: MutableMap<String, MutableMap<String, Double>>
    ): CatEngine {
        val engine = CatEngine(pool, tier)
        engine.scores.putAll(scores)
        engine.touchCounts.putAll(touchCounts)
        engine.used.addAll(usedIds)
        engine.answeredCount = answeredCount
        engine.correctCount = correctCount
        engine.errorContrib.putAll(errorContrib)
        return engine
    }

    private fun getQuestionLevel(q: DiagQuestionEntity): Int? {
        val passage = passageRepo.findById(q.passageId).orElse(null)
        return passage?.level
    }

    private fun toQuestionDto(q: QuestionData): QuestionDto {
        val passage = passageRepo.findById(q.passageId).orElse(null)
        return QuestionDto(
            questionId = q.questionId,
            passageId = q.passageId,
            passageText = passage?.textMd,
            tier = q.tier,
            questionType = q.questionType,
            stem = questionRepo.findById(q.questionId).orElse(null)?.stem ?: "",
            boxContent = questionRepo.findById(q.questionId).orElse(null)?.boxContent,
            choices = q.choices.map { ChoiceDto(choiceId = it.choiceId, text = it.text) },
            orderInPassage = questionRepo.findById(q.questionId).orElse(null)?.orderInPassage ?: 0
        )
    }

    private fun buildReport(session: DiagSessionEntity, scores: Map<String, Double>, recommendation: RecommendedLevel): DiagnosticReport {
        val sorted = scores.entries.sortedBy { it.value }
        val weak = sorted.take(3).map { it.key }
        val strong = sorted.takeLast(3).reversed().map { it.key }

        val errorContrib: Map<String, Map<String, Double>> = try {
            if (!session.errorAnalysisJson.isNullOrBlank())
                objectMapper.readValue(session.errorAnalysisJson!!)
            else emptyMap()
        } catch (_: Exception) { emptyMap() }

        // 하위 3개 취약 역량 (기존 호환)
        val bottleneck = weak.map { comp ->
            val paths = errorContrib[comp] ?: emptyMap()
            val topPaths = paths.entries.sortedByDescending { it.value }.take(3).map {
                ErrorPathEntry(it.key, Math.round(it.value * 100.0) / 100.0)
            }
            BottleneckItem(
                competency = comp,
                score = Math.round((scores[comp] ?: 50.0) * 10.0) / 10.0,
                topErrorPaths = topPaths
            )
        }

        // ── v2 확장 데이터 빌드 ──
        val accuracyRate = if (session.answeredCount > 0)
            Math.round(session.correctCount.toDouble() / session.answeredCount * 1000.0) / 10.0
        else 0.0

        // touch_counts 파싱
        val touchCounts: Map<String, Int> = try {
            if (!session.touchCountsJson.isNullOrBlank())
                objectMapper.readValue(session.touchCountsJson!!)
            else emptyMap()
        } catch (_: Exception) { emptyMap() }

        // 전체 응답 조회
        val allResponses = responseRepo.findBySessionIdOrderByResponseOrderAsc(session.id)

        // 사용된 문항 + 지문 일괄 조회
        val questionIds = allResponses.map { it.questionId }.toSet()
        val questionsMap = questionRepo.findAllById(questionIds).associateBy { it.id }
        val passageIds = questionsMap.values.map { it.passageId }.toSet()
        val passagesMap = passageRepo.findAllById(passageIds).associateBy { it.id }

        // 문항별 choices 파싱 캐시
        val choicesCache = mutableMapOf<String, List<Map<String, Any>>>()
        fun getChoices(questionId: String): List<Map<String, Any>> {
            return choicesCache.getOrPut(questionId) {
                val q = questionsMap[questionId] ?: return@getOrPut emptyList()
                try { objectMapper.readValue(q.choicesJson) } catch (_: Exception) { emptyList() }
            }
        }

        // ── 전체 10개 역량 오류경로 분석 ──
        val fullErrorAnalysis = scores.entries.sortedBy { it.value }.map { (comp, s) ->
            val paths = errorContrib[comp] ?: emptyMap()
            val topPaths = paths.entries.sortedByDescending { it.value }.take(3).map {
                ErrorPathEntry(it.key, Math.round(it.value * 100.0) / 100.0)
            }
            BottleneckItem(comp, Math.round(s * 10.0) / 10.0, topPaths)
        }

        // ── 역량별 관련 문항 정답률 계산 ──
        val competencyAccuracy = mutableMapOf<String, Pair<Int, Int>>() // total, correct
        for (resp in allResponses) {
            val choices = getChoices(resp.questionId)
            val selected = choices.find { (it["choice_id"] as? String) == resp.selectedChoice }
            @Suppress("UNCHECKED_CAST")
            val vector = (selected?.get("vector") as? Map<String, Any>)
                ?.mapValues { (it.value as Number).toDouble() } ?: emptyMap()
            for (k in vector.keys) {
                val nk = normalizeKey(k)
                val (tot, cor) = competencyAccuracy.getOrDefault(nk, 0 to 0)
                competencyAccuracy[nk] = (tot + 1) to (cor + if (resp.isCorrect) 1 else 0)
            }
        }

        // ── CompetencyDetail 빌드 ──
        val rankedScores = scores.entries.sortedByDescending { it.value }
        val competencyDetails = rankedScores.mapIndexed { idx, (name, score) ->
            val tc = touchCounts[name] ?: 0
            val (tot, cor) = competencyAccuracy.getOrDefault(name, 0 to 0)
            val relAcc = if (tot > 0) Math.round(cor.toDouble() / tot * 1000.0) / 10.0 else 0.0
            val paths = errorContrib[name] ?: emptyMap()
            val topPaths = paths.entries.sortedByDescending { it.value }.take(3).map {
                ErrorPathEntry(it.key, Math.round(it.value * 100.0) / 100.0)
            }
            val grade = when { score >= 65 -> "상"; score >= 40 -> "중"; else -> "하" }
            CompetencyDetail(
                name = name,
                score = Math.round(score * 10.0) / 10.0,
                grade = grade,
                rank = idx + 1,
                description = COMPETENCY_DESCRIPTIONS[name] ?: "",
                narrative = generateNarrative(name, score, tc),
                touchCount = tc,
                relatedAccuracy = relAcc,
                topErrorPaths = topPaths,
            )
        }

        // ── 내러티브 맵 ──
        val narratives = scores.mapValues { (name, score) ->
            generateNarrative(name, score, touchCounts[name] ?: 0)
        }

        // ── 문항 유형별 분석 ──
        val typeGroups = allResponses.groupBy { questionsMap[it.questionId]?.questionType ?: "기타" }
        val questionTypeAnalysis = typeGroups.map { (type, resps) ->
            val cor = resps.count { it.isCorrect }
            QuestionTypeStats(type, resps.size, cor, Math.round(cor.toDouble() / resps.size * 1000.0) / 10.0)
        }.sortedByDescending { it.accuracyRate }

        // ── 장르별 분석 ──
        val genreGroups = allResponses.groupBy {
            val q = questionsMap[it.questionId]
            val p = q?.let { qe -> passagesMap[qe.passageId] }
            p?.genre ?: "기타"
        }
        val genreAnalysis = genreGroups.map { (genre, resps) ->
            val cor = resps.count { it.isCorrect }
            GenreStats(genre, resps.size, cor, Math.round(cor.toDouble() / resps.size * 1000.0) / 10.0)
        }.sortedBy { it.genre }

        // ── 지문별 분석 ──
        val passageGroups = allResponses.groupBy { questionsMap[it.questionId]?.passageId ?: "" }
        val passageAnalysis = passageGroups.mapNotNull { (pid, resps) ->
            val passage = passagesMap[pid] ?: return@mapNotNull null
            val cor = resps.count { it.isCorrect }
            val preview = if (passage.textMd.length > 100) passage.textMd.substring(0, 100) + "…" else passage.textMd
            PassageStats(
                passageId = pid, genre = passage.genre, level = passage.level,
                preview = preview, totalQuestions = resps.size, correctCount = cor,
                accuracyRate = Math.round(cor.toDouble() / resps.size * 1000.0) / 10.0
            )
        }.sortedBy { it.accuracyRate }

        // ── 개별 문항 리뷰 ──
        val questionReviews = allResponses.mapNotNull { resp ->
            val q = questionsMap[resp.questionId] ?: return@mapNotNull null
            val choices = getChoices(resp.questionId)
            val selected = choices.find { (it["choice_id"] as? String) == resp.selectedChoice }
            @Suppress("UNCHECKED_CAST")
            val selectedVector = (selected?.get("vector") as? Map<String, Any>)
                ?.mapValues { (it.value as Number).toDouble() } ?: emptyMap()
            val errorPath = selected?.get("error_path") as? String

            val reviewChoices = choices.map { c ->
                val cid = c["choice_id"] as? String ?: ""
                ReviewChoiceItem(
                    choiceId = cid,
                    text = c["text"] as? String ?: "",
                    isCorrect = cid == q.correctChoice,
                    isSelected = cid == resp.selectedChoice,
                )
            }
            QuestionReviewItem(
                questionId = q.id,
                stem = q.stem,
                questionType = q.questionType,
                choices = reviewChoices,
                correctChoice = q.correctChoice,
                selectedChoice = resp.selectedChoice,
                isCorrect = resp.isCorrect,
                affectedCompetencies = selectedVector.keys.map { normalizeKey(it) },
                errorPath = if (!resp.isCorrect) errorPath else null,
            )
        }

        // ── 동일 tier 통계 + 백분위 ──
        var tierStatistics: TierStatistics?
        var percentileInfo: PercentileInfo?
        try {
            val allSessions = sessionRepo.findByTierAndStatus(session.tier, "completed")
            if (allSessions.size >= 2) {
                val tciValues = allSessions.mapNotNull { it.adjustedTci?.toDouble() }
                val accValues = allSessions.map {
                    if (it.answeredCount > 0) it.correctCount.toDouble() / it.answeredCount * 100.0 else 0.0
                }

                // 역량별 통계
                val allScoresData = allSessions.mapNotNull { s ->
                    try {
                        if (!s.scoresJson.isNullOrBlank()) objectMapper.readValue<Map<String, Double>>(s.scoresJson!!)
                        else null
                    } catch (_: Exception) { null }
                }
                val competencyStats = mutableMapOf<String, ScoreStats>()
                for (comp in COMPETENCIES) {
                    val vals = allScoresData.mapNotNull { it[comp] }
                    if (vals.isNotEmpty()) {
                        competencyStats[comp] = ScoreStats(
                            average = Math.round(vals.average() * 10.0) / 10.0,
                            max = Math.round(vals.max() * 10.0) / 10.0,
                            min = Math.round(vals.min() * 10.0) / 10.0,
                        )
                    }
                }

                tierStatistics = TierStatistics(
                    totalSessions = allSessions.size,
                    tciStats = ScoreStats(
                        average = Math.round(tciValues.average() * 10.0) / 10.0,
                        max = Math.round(tciValues.max() * 10.0) / 10.0,
                        min = Math.round(tciValues.min() * 10.0) / 10.0,
                    ),
                    accuracyStats = ScoreStats(
                        average = Math.round(accValues.average() * 10.0) / 10.0,
                        max = Math.round(accValues.max() * 10.0) / 10.0,
                        min = Math.round(accValues.min() * 10.0) / 10.0,
                    ),
                    competencyStats = competencyStats,
                )

                // 백분위 계산
                val currentTci = session.adjustedTci?.toDouble() ?: 50.0
                val currentAcc = accuracyRate
                val tciPercentile = Math.round(tciValues.count { it < currentTci }.toDouble() / tciValues.size * 1000.0) / 10.0
                val accPercentile = Math.round(accValues.count { it < currentAcc }.toDouble() / accValues.size * 1000.0) / 10.0

                val competencyPercentiles = mutableMapOf<String, Double>()
                for (comp in COMPETENCIES) {
                    val vals = allScoresData.mapNotNull { it[comp] }
                    val myScore = scores[comp] ?: 50.0
                    if (vals.isNotEmpty()) {
                        competencyPercentiles[comp] = Math.round(vals.count { it < myScore }.toDouble() / vals.size * 1000.0) / 10.0
                    }
                }

                percentileInfo = PercentileInfo(tciPercentile, accPercentile, competencyPercentiles)
            } else {
                tierStatistics = null
                percentileInfo = null
            }
        } catch (_: Exception) {
            tierStatistics = null
            percentileInfo = null
        }

        // CompetencyDetail에 백분위 추가
        val detailsWithPercentile = if (percentileInfo != null) {
            competencyDetails.map { d ->
                d.copy(percentile = percentileInfo.competencyPercentiles[d.name])
            }
        } else competencyDetails

        return DiagnosticReport(
            sessionId = session.id,
            tier = session.tier,
            tierLabel = TIER_LABELS[session.tier] ?: session.tier,
            mode = session.mode,
            answeredCount = session.answeredCount,
            correctCount = session.correctCount,
            rawTci = session.rawTci?.toDouble() ?: 50.0,
            adjustedTci = session.adjustedTci?.toDouble() ?: 50.0,
            confidence = session.confidence?.toDouble() ?: 0.0,
            recommendedLevel = recommendation,
            competencyScores = scores.mapValues { Math.round(it.value * 10.0) / 10.0 },
            weakCompetencies = weak,
            strongCompetencies = strong,
            bottleneckAnalysis = bottleneck,
            // v2 확장
            accuracyRate = accuracyRate,
            completedAt = session.completedAt?.toString(),
            competencyDetails = detailsWithPercentile,
            questionTypeAnalysis = questionTypeAnalysis,
            genreAnalysis = genreAnalysis,
            passageAnalysis = passageAnalysis,
            fullErrorAnalysis = fullErrorAnalysis,
            questionReviews = questionReviews,
            touchCounts = touchCounts,
            competencyNarratives = narratives,
            statistics = tierStatistics,
            percentiles = percentileInfo,
        )
    }

    private fun toAdminSessionSummary(s: DiagSessionEntity) = AdminSessionSummary(
        sessionId = s.id,
        userId = s.userId,
        tier = s.tier,
        mode = s.mode,
        status = s.status,
        answeredCount = s.answeredCount,
        adjustedTci = s.adjustedTci?.toDouble(),
        startedAt = s.startedAt.toString()
    )
}
