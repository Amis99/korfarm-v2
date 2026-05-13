package com.korfarm.api.diagnostic

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.diagnostic.scoring.*
import com.korfarm.api.security.SecurityUtils
import com.korfarm.api.user.UserRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDateTime
import java.time.temporal.ChronoUnit

@Service
class DiagnosticService(
    private val passageRepo: DiagPassageRepository,
    private val questionRepo: DiagQuestionRepository,
    private val sessionRepo: DiagSessionRepository,
    private val responseRepo: DiagResponseRepository,
    private val userRepo: UserRepository,
    private val objectMapper: ObjectMapper
) {

    // ── tier 목록 ──

    fun getTiers(userId: String): List<TierInfo> {
        return TEST_ORDER.map { tier ->
            val label = TIER_LABELS[tier] ?: tier
            val count = questionRepo.countByTier(tier)
            val objCount = questionRepo.countByTierAndQuestionTypeNot(tier, "서술형")
            val sessions = sessionRepo.findByUserIdAndTierOrderByStartedAtDesc(userId, tier)
            val completed = sessions.find { it.status == "completed" }
            TierInfo(
                tier = tier,
                label = label,
                questionCount = count,
                hasCompleted = completed != null,
                lastTci = completed?.adjustedTci?.toDouble(),
                lastSessionId = completed?.id,
                objectiveCount = objCount
            )
        }
    }

    // ── 세션 생성 ──

    @Transactional
    fun createSession(userId: String, request: CreateSessionRequest): SessionCreatedResponse {
        val tier = request.tier
        val mode = (request.mode ?: "online").lowercase()
        if (tier !in TEST_ORDER) throw ApiException("INVALID_TIER", "유효하지 않은 tier", HttpStatus.BAD_REQUEST)
        if (mode !in listOf("online", "offline")) {
            throw ApiException("INVALID_MODE", "유효하지 않은 mode", HttpStatus.BAD_REQUEST)
        }

        val isAdmin = SecurityUtils.hasAnyRole("HQ_ADMIN", "ORG_ADMIN")

        // 이미 완료한 tier는 재응시 차단 (관리자 우회)
        if (!isAdmin) {
            val completedExists = sessionRepo.findByUserIdAndTierOrderByStartedAtDesc(userId, tier)
                .any { it.status == "completed" }
            if (completedExists) {
                throw ApiException("ALREADY_COMPLETED", "이미 완료한 진단입니다. 결과를 확인하세요.", HttpStatus.CONFLICT)
            }
        } else {
            // 관리자: 이전 완료 세션을 모두 abandoned로 마킹해 새 세션을 깨끗이 시작
            sessionRepo.findByUserIdAndTierOrderByStartedAtDesc(userId, tier)
                .filter { it.status == "completed" }
                .forEach {
                    it.status = "abandoned"
                    sessionRepo.save(it)
                }
        }

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

        // 단일 모드: 객관식 48문항 모두 일괄 반환 (서술형 제외)
        // 정렬: 지문 level → 지문 id → order_in_passage 순
        val pool = loadQuestionPool(tier).filter { it.questionType != "서술형" }
        val firstBatch = pool.map { toQuestionDto(it) }

        return SessionCreatedResponse(sessionId = sessionId, firstBatch = firstBatch)
    }

    // ── 세션 상태 조회 ──

    fun getSessionStatus(sessionId: String, userId: String): SessionStatusResponse {
        val session = getSession(sessionId, userId)
        return SessionStatusResponse(
            sessionId = session.id,
            status = session.status,
            answeredCount = session.answeredCount,
            currentBatch = null, // 클라이언트에서 관리
            mode = session.mode
        )
    }

    // ── 배치 답안 제출 ──

    @Transactional
    fun submitResponses(sessionId: String, userId: String, request: SubmitResponsesRequest): SubmitResponsesResponse {
        val session = getSession(sessionId, userId)
        if (session.status != "active") {
            throw ApiException("SESSION_NOT_ACTIVE", "세션이 활성 상태가 아닙니다", HttpStatus.BAD_REQUEST)
        }

        // ── v2 채점 알고리즘 ──
        //   scores: 정답 시 정답 vector 양수 누적 (earned)
        //   maxScores: 모든 응시 문항의 정답 vector 양수 누적 (측정 가능 최대)
        //   최종 점수 = scores / maxScores × 100 (ratioScores)

        // 현재 상태 복원 (v1 데이터와 호환되지 않으므로 신규 세션은 0 시작)
        val scores: MutableMap<String, Double> = if (session.scoresJson.isNullOrBlank())
            ScoringEngine.initScores()
        else objectMapper.readValue(session.scoresJson!!)
        val maxScores: MutableMap<String, Double> = if (session.maxScoresJson.isNullOrBlank())
            ScoringEngine.initMaxScores()
        else objectMapper.readValue(session.maxScoresJson!!)
        val touchCounts: MutableMap<String, Int> = objectMapper.readValue(session.touchCountsJson ?: "{}")
        val existingResponses = responseRepo.findBySessionIdOrderByResponseOrderAsc(sessionId)

        // 오류기여 맵 초기화 — error_path 분류용 (점수에 영향 없음)
        val errorContrib = ScoringEngine.initErrorContrib()

        var answeredCount = session.answeredCount
        var correctCount = session.correctCount
        val batchNumber = (existingResponses.maxOfOrNull { it.batchNumber ?: 0 } ?: 0) + 1

        // 각 응답 처리
        for (resp in request.responses) {
            val question = questionRepo.findById(resp.questionId).orElse(null) ?: continue
            if (question.questionType == "서술형") continue

            val choicesData: List<Map<String, Any>> = objectMapper.readValue(question.choicesJson)
            val correctChoiceData = choicesData.find { (it["choice_id"] as? String) == question.correctChoice }
            val selectedChoice = choicesData.find { (it["choice_id"] as? String) == resp.choice }
            val isCorrect = resp.choice == question.correctChoice

            // 정답 vector — 그 문항의 max/earned 누적에 사용
            @Suppress("UNCHECKED_CAST")
            val correctVector = (correctChoiceData?.get("vector") as? Map<String, Any>)
                ?.mapValues { (it.value as Number).toDouble() } ?: emptyMap()

            // 모든 응답: max 누적 (측정 가능 가중치)
            ScoringEngine.accumulateMaxScores(maxScores, correctVector)

            // 정답: scores 누적 (실 획득 가중치)
            if (isCorrect) {
                ScoringEngine.applyCorrectVector(scores, correctVector)
            } else {
                // 오답: error_path 기록만 (점수 영향 없음)
                @Suppress("UNCHECKED_CAST")
                val selectedVector = (selectedChoice?.get("vector") as? Map<String, Any>)
                    ?.mapValues { (it.value as Number).toDouble() } ?: emptyMap()
                val errorPath = selectedChoice?.get("error_path") as? String
                ScoringEngine.accumulateError(errorContrib, selectedVector, errorPath, 1.0, 1.0)
            }

            // touch_count: 정답 vector 의 양수 역량마다 ++
            for ((k, v) in correctVector) {
                if (v <= 0) continue
                val nk = normalizeKey(k)
                if (nk in touchCounts) touchCounts[nk] = touchCounts[nk]!! + 1
            }

            answeredCount++
            if (isCorrect) correctCount++

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
        session.maxScoresJson = objectMapper.writeValueAsString(maxScores)
        session.touchCountsJson = objectMapper.writeValueAsString(touchCounts)
        session.answeredCount = answeredCount
        session.correctCount = correctCount
        session.errorAnalysisJson = objectMapper.writeValueAsString(errorContrib)
        // 마지막 마킹 시각 갱신 (풀이속도 계산용)
        session.lastResponseAt = LocalDateTime.now()

        // 정답률 기반 TCI (correct / 48 × 100)
        val rawTci = if (answeredCount > 0) correctCount.toDouble() / 48.0 * 100.0 else 0.0
        session.rawTci = BigDecimal.valueOf(rawTci).setScale(2, java.math.RoundingMode.HALF_UP)
        session.adjustedTci = BigDecimal.valueOf(rawTci).setScale(2, java.math.RoundingMode.HALF_UP)
        session.confidence = BigDecimal.valueOf(1.0).setScale(2, java.math.RoundingMode.HALF_UP)

        sessionRepo.save(session)

        // 단일 모드: 다음 배치 없음, 즉시 종료 가능
        return SubmitResponsesResponse(nextBatch = null, shouldStop = true, interim = null)
    }

    // ── 세션 완료 ──

    @Transactional
    fun completeSession(sessionId: String, userId: String): DiagnosticReport {
        val session = getSession(sessionId, userId)
        if (session.status != "active") {
            throw ApiException("SESSION_NOT_ACTIVE", "세션이 활성 상태가 아닙니다", HttpStatus.BAD_REQUEST)
        }

        // v2: scores (earned) 와 maxScores 로드
        val scores: MutableMap<String, Double> = if (session.scoresJson.isNullOrBlank())
            ScoringEngine.initScores()
        else objectMapper.readValue(session.scoresJson!!)
        // 정답률 기반 TCI: 미응답을 오답으로 간주 (correct / 48 × 100)
        val rawTci = if (session.answeredCount > 0)
            session.correctCount.toDouble() / 48.0 * 100.0
        else 0.0
        val adjTci = rawTci  // 신뢰도 보정 없이 그대로
        val confidence = 1.0  // 더 이상 사용하지 않음 (호환용)
        val recommendation = ScoringEngine.calculateRecommendation(session.tier, rawTci, confidence)

        session.status = "completed"
        session.rawTci = BigDecimal.valueOf(rawTci).setScale(2, java.math.RoundingMode.HALF_UP)
        session.adjustedTci = BigDecimal.valueOf(adjTci).setScale(2, java.math.RoundingMode.HALF_UP)
        session.confidence = BigDecimal.valueOf(confidence).setScale(2, java.math.RoundingMode.HALF_UP)
        session.recommendedLevel = recommendation.label
        val now = LocalDateTime.now()
        session.completedAt = now

        // ── 풀이 시간 계산 (offline OMR 세션은 lastResponseAt 미설정 → 0초 처리) ──
        val endTs = session.lastResponseAt ?: now
        val timeSpent = ChronoUnit.SECONDS.between(session.startedAt, endTs).toInt().coerceAtLeast(0)
        val wrong = (session.answeredCount - session.correctCount).coerceAtLeast(0)
        // 풀이속도 = 마지막마킹시간 + (오답수 × 3분)
        val effectiveSpeed = timeSpent + wrong * 180
        session.timeSpentSec = timeSpent
        session.effectiveSpeedSec = effectiveSpeed

        sessionRepo.save(session)

        // v2: scores (earned) / maxScores → ratio (0~100) 변환 후 buildReport 에 전달
        val maxScores: Map<String, Double> = if (session.maxScoresJson.isNullOrBlank())
            emptyMap()
        else objectMapper.readValue(session.maxScoresJson!!)
        val ratioScores = ScoringEngine.ratioScores(scores, maxScores).toMutableMap()
        return buildReport(session, ratioScores, recommendation)
    }

    // ── 인쇄 OMR 답안 일괄 제출 → 진단 세션 생성 + 채점 + 리포트 ──

    @Transactional
    fun submitFromOmr(userId: String, request: FromOmrRequest): FromOmrResponse {
        val tier = request.tier
        if (tier !in TEST_ORDER) throw ApiException("INVALID_TIER", "유효하지 않은 tier", HttpStatus.BAD_REQUEST)

        val isAdmin = SecurityUtils.hasAnyRole("HQ_ADMIN", "ORG_ADMIN")

        // 이미 완료한 tier 차단 (관리자 우회)
        if (!isAdmin) {
            val completedExists = sessionRepo.findByUserIdAndTierOrderByStartedAtDesc(userId, tier)
                .any { it.status == "completed" }
            if (completedExists) {
                throw ApiException("ALREADY_COMPLETED", "이미 완료한 진단입니다. 결과를 확인하세요.", HttpStatus.CONFLICT)
            }
        } else {
            sessionRepo.findByUserIdAndTierOrderByStartedAtDesc(userId, tier)
                .filter { it.status == "completed" }
                .forEach {
                    it.status = "abandoned"
                    sessionRepo.save(it)
                }
        }

        // 활성 세션 폐기
        sessionRepo.findByUserIdAndStatus(userId, "active")
            .filter { it.tier == tier }
            .forEach {
                it.status = "abandoned"
                sessionRepo.save(it)
            }

        // 풀 로드 (정렬: 지문 level → 지문 id → order_in_passage)
        // 이 정렬은 V0048 마이그레이션에서 test_questions.number를 매기는 순서와 동일.
        val pool = loadQuestionPool(tier).filter { it.questionType != "서술형" }
        if (pool.size != 48) {
            throw ApiException("INVALID_POOL", "진단 문항 수가 48이 아닙니다 (${pool.size})", HttpStatus.INTERNAL_SERVER_ERROR)
        }

        val sessionId = IdGenerator.newId("dsess")
        // v2: scores (earned), maxScores 둘 다 0 시작
        val scores = ScoringEngine.initScores()
        val maxScores = ScoringEngine.initMaxScores()
        val touchCounts = ScoringEngine.initTouchCounts()
        val errorContrib = ScoringEngine.initErrorContrib()

        val session = DiagSessionEntity(
            id = sessionId,
            userId = userId,
            tier = tier,
            mode = "offline",
            status = "active",
            scoresJson = objectMapper.writeValueAsString(scores),
            maxScoresJson = objectMapper.writeValueAsString(maxScores),
            touchCountsJson = objectMapper.writeValueAsString(touchCounts)
        )
        sessionRepo.save(session)

        var answeredCount = 0
        var correctCount = 0

        // OMR answers는 1부터 시작하는 문항번호 → 선택지(A~E)
        pool.forEachIndexed { idx, qd ->
            val number = idx + 1
            val rawAnswer = request.answers[number.toString()]?.trim()?.uppercase()
            val choice = if (rawAnswer.isNullOrBlank()) null else rawAnswer

            val question = questionRepo.findById(qd.questionId).orElse(null) ?: return@forEachIndexed
            val choicesData: List<Map<String, Any>> = objectMapper.readValue(question.choicesJson)
            val correctChoiceData = choicesData.find { (it["choice_id"] as? String) == question.correctChoice }
            val selectedChoice = choice?.let { c -> choicesData.find { (it["choice_id"] as? String) == c } }
            val isCorrect = choice != null && choice == question.correctChoice

            // 정답 vector — 그 문항이 측정하는 가중치
            @Suppress("UNCHECKED_CAST")
            val correctVector = (correctChoiceData?.get("vector") as? Map<String, Any>)
                ?.mapValues { (it.value as Number).toDouble() } ?: emptyMap()

            // 모든 응답: max 누적
            ScoringEngine.accumulateMaxScores(maxScores, correctVector)

            // 정답: scores 누적
            if (isCorrect) {
                ScoringEngine.applyCorrectVector(scores, correctVector)
            } else if (selectedChoice != null) {
                @Suppress("UNCHECKED_CAST")
                val selectedVector = (selectedChoice["vector"] as? Map<String, Any>)
                    ?.mapValues { (it.value as Number).toDouble() } ?: emptyMap()
                val errorPath = selectedChoice["error_path"] as? String
                ScoringEngine.accumulateError(errorContrib, selectedVector, errorPath, 1.0, 1.0)
            }

            // touch_count 누적 (정답 vector 양수 역량마다)
            for ((k, v) in correctVector) {
                if (v <= 0) continue
                val nk = normalizeKey(k)
                if (nk in touchCounts) touchCounts[nk] = touchCounts[nk]!! + 1
            }

            answeredCount++
            if (isCorrect) correctCount++

            responseRepo.save(
                DiagResponseEntity(
                    id = IdGenerator.newId("dresp"),
                    sessionId = sessionId,
                    questionId = qd.questionId,
                    selectedChoice = choice,
                    isCorrect = isCorrect,
                    responseOrder = answeredCount,
                    batchNumber = 1
                )
            )
        }

        // 세션 종료 — 정답률 기반 TCI (correct / 48 × 100)
        val rawTci = if (answeredCount > 0) correctCount.toDouble() / 48.0 * 100.0 else 0.0
        val adjTci = rawTci
        val confidence = 1.0
        val recommendation = ScoringEngine.calculateRecommendation(tier, rawTci, confidence)

        session.scoresJson = objectMapper.writeValueAsString(scores)
        session.maxScoresJson = objectMapper.writeValueAsString(maxScores)
        session.touchCountsJson = objectMapper.writeValueAsString(touchCounts)
        session.errorAnalysisJson = objectMapper.writeValueAsString(errorContrib)
        session.answeredCount = answeredCount
        session.correctCount = correctCount
        session.rawTci = BigDecimal.valueOf(rawTci).setScale(2, java.math.RoundingMode.HALF_UP)
        session.adjustedTci = BigDecimal.valueOf(adjTci).setScale(2, java.math.RoundingMode.HALF_UP)
        session.confidence = BigDecimal.valueOf(confidence).setScale(2, java.math.RoundingMode.HALF_UP)
        session.recommendedLevel = recommendation.label
        session.status = "completed"
        val now = LocalDateTime.now()
        session.completedAt = now
        // OMR 채점은 풀이 시간 측정 불가 → null 유지
        session.lastResponseAt = null
        session.timeSpentSec = null
        session.effectiveSpeedSec = null
        sessionRepo.save(session)

        // v2: scores (earned) / maxScores → ratio (0~100) 변환
        val ratioScores = ScoringEngine.ratioScores(scores, maxScores).toMutableMap()
        val report = buildReport(session, ratioScores, recommendation)
        return FromOmrResponse(sessionId = sessionId, report = report)
    }

    // ── 어드민 일괄 OMR 입력 (응시 일자 지정 지원) ──
    // submitFromOmr 래핑 + 학생 직접 응시처럼 처리되어 통합 분석표·진단 성적표에 자동 반영.
    // 어드민이 응시 일자(attemptedAt) 를 지정하면 session 의 startedAt·completedAt 을 그 시각으로 설정해
    // "그날 응시한 것"으로 기록한다.
    @Transactional
    fun adminBatchSubmitDiagnostic(
        userId: String,
        tier: String,
        answers: Map<String, String?>,
        attemptedAt: LocalDateTime? = null,
    ): FromOmrResponse {
        val resp = submitFromOmr(userId, FromOmrRequest(tier = tier, answers = answers))
        if (attemptedAt != null) {
            val session = sessionRepo.findById(resp.sessionId).orElse(null)
            if (session != null) {
                session.startedAt = attemptedAt
                session.completedAt = attemptedAt
                sessionRepo.save(session)
            }
        }
        return resp
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
        // v2 세션은 scores 가 earned (절대값) 이므로 maxScores 로 나눠 ratio 산출.
        // v1 세션 (maxScoresJson 없음) 은 scores 자체가 0~100 점수이므로 그대로 사용 (호환).
        val displayScores = if (!session.maxScoresJson.isNullOrBlank()) {
            val maxScores: Map<String, Double> = objectMapper.readValue(session.maxScoresJson!!)
            ScoringEngine.ratioScores(scores, maxScores).toMutableMap()
        } else scores
        return buildReport(session, displayScores, recommendation)
    }

    // ── 학부모용 리포트 조회 (studentUserId로 검증) ──

    fun getReportForStudent(sessionId: String, studentUserId: String): DiagnosticReport {
        val session = sessionRepo.findById(sessionId).orElseThrow {
            ApiException("NOT_FOUND", "세션을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        if (session.userId != studentUserId) {
            throw ApiException("FORBIDDEN", "접근 권한이 없습니다", HttpStatus.FORBIDDEN)
        }
        if (session.status != "completed") {
            throw ApiException("SESSION_NOT_COMPLETED", "세션이 완료되지 않았습니다", HttpStatus.BAD_REQUEST)
        }
        val scores: MutableMap<String, Double> = objectMapper.readValue(session.scoresJson ?: "{}")
        val recommendation = ScoringEngine.calculateRecommendation(
            session.tier, session.rawTci?.toDouble() ?: 50.0, session.confidence?.toDouble() ?: 0.0
        )
        val displayScores = if (!session.maxScoresJson.isNullOrBlank()) {
            val maxScores: Map<String, Double> = objectMapper.readValue(session.maxScoresJson!!)
            ScoringEngine.ratioScores(scores, maxScores).toMutableMap()
        } else scores
        return buildReport(session, displayScores, recommendation)
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
        // 정렬: 지문 level → 지문 id → order_in_passage
        // V0048 마이그레이션의 test_questions.number 부여 순서와 동일해야 함
        return questions
            .sortedWith(
                compareBy(
                    { passages[it.passageId]?.level ?: Int.MAX_VALUE },
                    { it.passageId },
                    { it.orderInPassage }
                )
            )
            .map { q ->
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
        val errorContrib: Map<String, Map<String, Double>> = try {
            if (!session.errorAnalysisJson.isNullOrBlank())
                objectMapper.readValue(session.errorAnalysisJson!!)
            else emptyMap()
        } catch (_: Exception) { emptyMap() }

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

        // ── 역량별 관련 문항 정답률 계산 (먼저 수행) ──
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

        // 측정된 역량의 정답률 맵
        val measuredScoreMap: Map<String, Double> = COMPETENCIES
            .mapNotNull { name ->
                val (tot, cor) = competencyAccuracy[name] ?: return@mapNotNull null
                if (tot > 0) name to (cor.toDouble() / tot * 100.0) else null
            }
            .toMap()

        val sortedMeasured = measuredScoreMap.entries.sortedBy { it.value }
        val weak = sortedMeasured.take(3).map { it.key }
        val strong = sortedMeasured.takeLast(3).reversed().map { it.key }

        // 하위 3개 취약 역량 (정답률 기준)
        val bottleneck = weak.map { comp ->
            val paths = errorContrib[comp] ?: emptyMap()
            val topPaths = paths.entries.sortedByDescending { it.value }.take(3).map {
                ErrorPathEntry(it.key, Math.round(it.value * 100.0) / 100.0)
            }
            BottleneckItem(
                competency = comp,
                score = Math.round((measuredScoreMap[comp] ?: 0.0) * 10.0) / 10.0,
                topErrorPaths = topPaths
            )
        }

        // ── 전체 측정 역량 오류경로 분석 (정답률 기준) ──
        val fullErrorAnalysis = sortedMeasured.map { (comp, s) ->
            val paths = errorContrib[comp] ?: emptyMap()
            val topPaths = paths.entries.sortedByDescending { it.value }.take(3).map {
                ErrorPathEntry(it.key, Math.round(it.value * 100.0) / 100.0)
            }
            BottleneckItem(comp, Math.round(s * 10.0) / 10.0, topPaths)
        }

        // ── CompetencyDetail 빌드 (정답률 기반, 미측정 역량 처리) ──
        // 측정된 역량만 점수 부여, 측정된 역량들 사이에서 순위 매김
        val measuredCompetencies = COMPETENCIES
            .mapNotNull { name ->
                val (tot, cor) = competencyAccuracy.getOrDefault(name, 0 to 0)
                if (tot > 0) name to (cor.toDouble() / tot * 100.0) else null
            }
            .sortedByDescending { it.second }
        val rankMap = measuredCompetencies.withIndex().associate { (i, e) -> e.first to (i + 1) }

        val competencyDetails = COMPETENCIES.map { name ->
            val tc = touchCounts[name] ?: 0
            val (tot, cor) = competencyAccuracy.getOrDefault(name, 0 to 0)
            val measured = tot > 0
            val accScore = if (measured) Math.round(cor.toDouble() / tot * 1000.0) / 10.0 else null
            val paths = errorContrib[name] ?: emptyMap()
            val topPaths = paths.entries.sortedByDescending { it.value }.take(3).map {
                ErrorPathEntry(it.key, Math.round(it.value * 100.0) / 100.0)
            }
            val grade = when {
                !measured -> "미측정"
                accScore!! >= 70 -> "상"
                accScore >= 40 -> "중"
                else -> "하"
            }
            val narr = if (measured) {
                generateNarrative(name, accScore!!, tc)
            } else {
                "'$name' 역량은 이번 응시에서 측정되지 않았습니다. (측정 횟수 0회)"
            }
            CompetencyDetail(
                name = name,
                score = accScore,
                measured = measured,
                grade = grade,
                rank = rankMap[name] ?: 0,
                description = COMPETENCY_DESCRIPTIONS[name] ?: "",
                narrative = narr,
                touchCount = tc,
                relatedAccuracy = accScore ?: 0.0,
                topErrorPaths = topPaths,
            )
        }.sortedWith(compareByDescending<CompetencyDetail> { it.measured }.thenBy { it.rank })

        // ── 내러티브 맵 ──
        val narratives = competencyDetails.associate { it.name to it.narrative }

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

        // ── 풀이 속도 (보정시간/푼문항, 분/문항) ──
        val speedMinPerQ: Double? = if ((session.effectiveSpeedSec ?: 0) > 0 && session.answeredCount > 0) {
            Math.round(session.effectiveSpeedSec!!.toDouble() / 60.0 / session.answeredCount * 100.0) / 100.0
        } else null

        // ── 동일 tier 통계 + 백분위 ──
        var tierStatistics: TierStatistics?
        var percentileInfo: PercentileInfo?
        var speedPercentile: Double? = null
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

                // 백분위 계산 ("상위 X%" 직접 계산: 1등→~0%, 꼴등→~100%)
                val currentTci = session.adjustedTci?.toDouble() ?: 50.0
                val currentAcc = accuracyRate
                val tciRank = tciValues.size - tciValues.count { it < currentTci }
                val tciPercentile = Math.round(tciRank.toDouble() / tciValues.size * 1000.0) / 10.0
                val accRank = accValues.size - accValues.count { it < currentAcc }
                val accPercentile = Math.round(accRank.toDouble() / accValues.size * 1000.0) / 10.0

                val competencyPercentiles = mutableMapOf<String, Double>()
                for (comp in COMPETENCIES) {
                    val vals = allScoresData.mapNotNull { it[comp] }
                    val myScore = scores[comp] ?: 50.0
                    if (vals.isNotEmpty()) {
                        val rank = vals.size - vals.count { it < myScore }
                        competencyPercentiles[comp] = Math.round(rank.toDouble() / vals.size * 1000.0) / 10.0
                    }
                }

                percentileInfo = PercentileInfo(tciPercentile, accPercentile, competencyPercentiles)

                // 풀이 속도 백분위: 빠를수록 좋음 (낮은 분/문항 = 0%, 느릴수록 100%)
                if (speedMinPerQ != null) {
                    val speedValues = allSessions.mapNotNull { s ->
                        if ((s.effectiveSpeedSec ?: 0) > 0 && s.answeredCount > 0)
                            s.effectiveSpeedSec!!.toDouble() / 60.0 / s.answeredCount
                        else null
                    }
                    if (speedValues.size >= 2) {
                        // 속도가 더 빠른(작은) 사람의 수
                        val fasterCount = speedValues.count { it < speedMinPerQ }
                        speedPercentile = Math.round(fasterCount.toDouble() / speedValues.size * 1000.0) / 10.0
                    }
                }
            } else {
                tierStatistics = null
                percentileInfo = null
            }
        } catch (_: Exception) {
            tierStatistics = null
            percentileInfo = null
        }

        // ── 학년 대비 tier 맥락 문구 ──
        val gradeContext: String? = try {
            val user = userRepo.findById(session.userId).orElse(null)
            val gradeLabel = user?.gradeLabel
            if (gradeLabel != null) {
                val tierLabel = TIER_LABELS[session.tier] ?: session.tier
                val tierGrades = TIER_GRADE_RANGES[session.tier]
                if (tierGrades != null) {
                    val tierIdx = TEST_ORDER.indexOf(session.tier)
                    // 학년에 해당하는 tier 인덱스 찾기
                    val gradeIdx = TIER_GRADE_RANGES.entries.indexOfFirst { gradeLabel in it.value }
                    when {
                        gradeLabel in tierGrades -> "현재 학년(${gradeLabel})에 적합한 $tierLabel 단계를 응시했습니다"
                        gradeIdx >= 0 && gradeIdx > tierIdx -> "현재 학년(${gradeLabel}) 기준, ${tierLabel}은 이전 학년용 단계입니다. 참고 자료로 활용하세요"
                        gradeIdx >= 0 && gradeIdx < tierIdx -> "현재 학년(${gradeLabel})보다 높은 $tierLabel 단계에 도전했습니다"
                        else -> null
                    }
                } else null
            } else null
        } catch (_: Exception) { null }

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
            // 측정된 역량의 정답률만 (미측정 역량은 맵에서 제외)
            competencyScores = measuredScoreMap.mapValues { Math.round(it.value * 10.0) / 10.0 },
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
            gradeContext = gradeContext,
            timeSpentSec = session.timeSpentSec,
            effectiveSpeedSec = session.effectiveSpeedSec,
            speedMinPerQuestion = speedMinPerQ,
            speedPercentile = speedPercentile,
            totalQuestions = 48,
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
