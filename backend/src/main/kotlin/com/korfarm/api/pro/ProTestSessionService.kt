package com.korfarm.api.pro

import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.test.TestPaperRepo
import com.korfarm.api.test.TestQuestionRepo
import com.korfarm.api.test.TestService
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Duration
import java.time.LocalDateTime

@Service
class ProTestSessionService(
    private val testSessionRepo: ProTestSessionRepo,
    private val chapterTestRepo: ProChapterTestRepo,
    private val progressRepo: ProProgressRepo,
    private val testPaperRepo: TestPaperRepo,
    private val questionRepo: TestQuestionRepo,
    private val testService: TestService,
    private val proModeService: ProModeService,
    private val essayGradingService: EssayGradingService,
    private val objectMapper: ObjectMapper
) {
    companion object {
        const val PASS_SCORE = 70
        const val TIME_LIMIT_MINUTES = 60L
    }

    @Transactional
    fun printTest(userId: String, chapterId: String): ProTestPrintResponse {
        val result = startTest(userId, chapterId, "print")
        return ProTestPrintResponse(
            sessionId = result.sessionId,
            testId = result.testId,
            pdfFileId = result.pdfFileId,
            omrDeadline = result.omrDeadline,
            remainingMinutes = result.remainingMinutes,
            totalQuestions = result.totalQuestions,
            totalPoints = result.totalPoints
        )
    }

    @Transactional
    fun startTest(userId: String, chapterId: String, mode: String): ProTestStartResponse {
        // 1. 기본 학습 완료 확인
        if (!proModeService.checkAllBaseCompleted(userId, chapterId)) {
            throw ApiException("LOCKED", "기본 학습 4개를 모두 완료해야 테스트를 볼 수 있습니다.", HttpStatus.FORBIDDEN)
        }

        // 2. 이미 통과한 챕터 확인
        val passedSessions = testSessionRepo.findByUserIdAndChapterIdAndStatusIn(userId, chapterId, listOf("passed"))
        if (passedSessions.isNotEmpty()) {
            throw ApiException("ALREADY_PASSED", "이미 통과한 챕터입니다.", HttpStatus.CONFLICT)
        }

        // 3. 활성 세션 확인 → 만료 처리 또는 기존 세션 반환
        val activeStatuses = listOf("printed", "online_solving")
        val activeSessions = testSessionRepo.findByUserIdAndChapterIdAndStatusIn(userId, chapterId, activeStatuses)
        for (session in activeSessions) {
            if (session.omrDeadline != null && session.omrDeadline!!.isBefore(LocalDateTime.now())) {
                session.status = "expired"
                testSessionRepo.save(session)
            } else {
                // 아직 유효한 세션이 있으면 그대로 반환
                val paper = testPaperRepo.findById(session.testId).orElse(null)
                val remaining = Duration.between(LocalDateTime.now(), session.omrDeadline).toMinutes()
                return ProTestStartResponse(
                    sessionId = session.id,
                    testId = session.testId,
                    mode = session.mode,
                    pdfFileId = paper?.pdfFileId,
                    omrDeadline = session.omrDeadline!!,
                    remainingMinutes = remaining.coerceAtLeast(0),
                    totalQuestions = paper?.totalQuestions ?: 0,
                    totalPoints = paper?.totalPoints ?: 0
                )
            }
        }

        // 4. 미응시 버전 자동 배정
        val allTests = chapterTestRepo.findByChapterIdAndStatusOrderByVersionAsc(chapterId, "active")
        if (allTests.isEmpty()) {
            throw ApiException("NO_TEST", "등록된 테스트가 없습니다.", HttpStatus.NOT_FOUND)
        }

        val usedTestIds = testSessionRepo.findByUserIdAndChapterId(userId, chapterId)
            .map { it.chapterTestId }.toSet()

        val nextTest = allTests.firstOrNull { !usedTestIds.contains(it.id) }
            ?: run {
                // 모든 버전 소진 → 가장 오래 전 응시한 failed/expired 버전 재배정
                val pastSessions = testSessionRepo.findByUserIdAndChapterId(userId, chapterId)
                    .filter { it.status in listOf("failed", "expired") }
                    .sortedBy { it.createdAt }
                val oldestChapterTestId = pastSessions.firstOrNull()?.chapterTestId
                allTests.firstOrNull { it.id == oldestChapterTestId }
                    ?: allTests.first()
            }

        val paper = testPaperRepo.findById(nextTest.testPaperId).orElseThrow {
            ApiException("NOT_FOUND", "시험지를 찾을 수 없습니다.", HttpStatus.NOT_FOUND)
        }

        // 5. 세션 생성
        val now = LocalDateTime.now()
        val deadline = now.plusMinutes(TIME_LIMIT_MINUTES)
        val sessionStatus = if (mode == "online") "online_solving" else "printed"
        val session = ProTestSessionEntity(
            id = IdGenerator.newId("pts"),
            userId = userId,
            testId = nextTest.testPaperId,
            chapterId = chapterId,
            chapterTestId = nextTest.id,
            mode = mode,
            printedAt = if (mode == "print") now else null,
            omrDeadline = deadline,
            status = sessionStatus
        )
        testSessionRepo.save(session)

        return ProTestStartResponse(
            sessionId = session.id,
            testId = session.testId,
            mode = mode,
            pdfFileId = if (mode == "print") paper.pdfFileId else null,
            omrDeadline = deadline,
            remainingMinutes = TIME_LIMIT_MINUTES,
            totalQuestions = paper.totalQuestions,
            totalPoints = paper.totalPoints
        )
    }

    @Transactional
    fun submitOmr(userId: String, request: ProTestSubmitRequest): ProTestSubmitResponse {
        val session = testSessionRepo.findById(request.sessionId).orElseThrow {
            ApiException("NOT_FOUND", "세션을 찾을 수 없습니다.", HttpStatus.NOT_FOUND)
        }

        // 세션 소유자 확인
        if (session.userId != userId) {
            throw ApiException("FORBIDDEN", "권한이 없습니다.", HttpStatus.FORBIDDEN)
        }

        // 세션 상태 확인 (인쇄 모드: printed, 온라인 모드: online_solving)
        if (session.status != "printed" && session.status != "online_solving") {
            throw ApiException("INVALID_STATUS", "이미 제출했거나 만료된 세션입니다.", HttpStatus.BAD_REQUEST)
        }

        // 시간 확인
        if (session.omrDeadline != null && session.omrDeadline!!.isBefore(LocalDateTime.now())) {
            session.status = "expired"
            testSessionRepo.save(session)
            throw ApiException("EXPIRED", "제출 시간이 초과되었습니다.", HttpStatus.BAD_REQUEST)
        }

        // TestService로 채점
        val submission = testService.submitOmr(session.testId, userId, userId, request.answers)

        // 서술형 채점 레코드 생성
        essayGradingService.createGradingsForSubmission(submission.id, session.testId, userId, request.answers)

        val paper = testPaperRepo.findById(session.testId).orElse(null)
        val totalPoints = paper?.totalPoints ?: 100

        // 100점 만점 기준으로 환산
        val scorePercent = if (totalPoints > 0) (submission.score * 100) / totalPoints else 0
        val passed = scorePercent >= PASS_SCORE

        // 역량별 점수 계산
        val competencyScores = calculateCompetencyScores(session.testId, request.answers)

        // 세션 업데이트
        session.score = submission.score
        session.submissionId = submission.id
        session.status = if (passed) "passed" else "failed"
        if (competencyScores.isNotEmpty()) {
            session.competencyScores = objectMapper.writeValueAsString(competencyScores)
        }
        testSessionRepo.save(session)

        // 통과 시 프로그레스 완료 기록
        if (passed) {
            run {
                val testItems = proModeService.listChapterItems(userId, session.chapterId)
                    .filter { it.type == "test" }
                testItems.forEach { testItem ->
                    val existing = progressRepo.findByUserIdAndItemId(userId, testItem.itemId)
                    if (existing == null || !existing.completed) {
                        val progress = existing ?: ProProgressEntity(
                            id = IdGenerator.newId("pp"),
                            userId = userId,
                            chapterId = session.chapterId,
                            itemId = testItem.itemId
                        )
                        progress.completed = true
                        progress.completedAt = LocalDateTime.now()
                        progress.score = submission.score
                        progressRepo.save(progress)
                    }
                }
            }
        }

        // nextAction 결정
        val nextAction = if (passed) {
            "next_chapter"
        } else {
            val allTests = chapterTestRepo.findByChapterIdAndStatusOrderByVersionAsc(session.chapterId, "active")
            val usedTestIds = testSessionRepo.findByUserIdAndChapterId(userId, session.chapterId)
                .map { it.chapterTestId }.toSet()
            val remaining = allTests.count { !usedTestIds.contains(it.id) }
            if (remaining > 0) "retry_available" else "retry_recycled"
        }

        return ProTestSubmitResponse(
            score = submission.score,
            totalPoints = totalPoints,
            passed = passed,
            nextAction = nextAction,
            competencyScores = competencyScores.ifEmpty { null }
        )
    }

    /**
     * 역량별 점수 계산: 각 문제의 domain 기준으로 그룹핑하여 정답률 산출
     */
    private fun calculateCompetencyScores(
        testId: String,
        answers: Map<String, String>
    ): Map<String, CompetencyScore> {
        val questions = questionRepo.findByTestIdOrderByNumberAsc(testId)
        if (questions.isEmpty()) return emptyMap()

        // domain이 "종합"이거나 null인 문제만 있으면 역량 분석 불가
        val domainQuestions = questions.filter {
            !it.domain.isNullOrBlank() && it.domain != "종합"
        }
        if (domainQuestions.isEmpty()) return emptyMap()

        // domain별 그룹핑
        data class DomainStats(var correct: Int = 0, var total: Int = 0)
        val stats = mutableMapOf<String, DomainStats>()

        for (q in domainQuestions) {
            val domain = q.domain!!
            val s = stats.getOrPut(domain) { DomainStats() }
            s.total++

            val myAnswer = answers[q.number.toString()] ?: ""
            if (q.type == "객관식") {
                if (myAnswer.isNotBlank() && myAnswer == q.correctAnswer) {
                    s.correct++
                }
            } else {
                // 서술형은 키워드 기반 간이 채점 (70% 이상이면 정답)
                // 정확한 채점은 submission의 stats에서 확인 가능
                if (myAnswer.isNotBlank() && q.correctAnswer != null && myAnswer == q.correctAnswer) {
                    s.correct++
                }
            }
        }

        return stats.mapValues { (_, v) ->
            CompetencyScore(
                correct = v.correct,
                total = v.total,
                accuracy = if (v.total > 0) Math.round(v.correct.toDouble() / v.total * 100 * 100.0) / 100.0 else 0.0
            )
        }
    }

    @Transactional(readOnly = true)
    fun getTestStatus(userId: String, chapterId: String): ProTestStatusResponse {
        val sessions = testSessionRepo.findByUserIdAndChapterId(userId, chapterId)

        // 만료된 세션 처리 (읽기 시에도 상태 반영)
        val now = LocalDateTime.now()
        var activeSession: ProTestSessionView? = null
        val history = mutableListOf<ProTestSessionView>()

        for (session in sessions) {
            // 버전 번호 조회
            val chapterTest = chapterTestRepo.findById(session.chapterTestId).orElse(null)
            val version = chapterTest?.version ?: 0

            val activeStatuses = setOf("printed", "online_solving")
            val effectiveStatus = if (activeStatuses.contains(session.status) && session.omrDeadline?.isBefore(now) == true) "expired" else session.status

            val paper = testPaperRepo.findById(session.testId).orElse(null)
            val parsedCompetency = parseCompetencyScores(session.competencyScores)
            val view = ProTestSessionView(
                sessionId = session.id,
                version = version,
                status = effectiveStatus,
                mode = session.mode,
                score = session.score,
                totalPoints = paper?.totalPoints,
                printedAt = session.printedAt,
                omrDeadline = session.omrDeadline,
                createdAt = session.createdAt,
                competencyScores = parsedCompetency
            )

            if (activeStatuses.contains(session.status) && session.omrDeadline?.isAfter(now) == true) {
                activeSession = view
            } else {
                history.add(view)
            }
        }

        val allTests = chapterTestRepo.findByChapterIdAndStatusOrderByVersionAsc(chapterId, "active")
        val usedTestIds = sessions.map { it.chapterTestId }.toSet()
        val remainingVersions = allTests.count { !usedTestIds.contains(it.id) }
        val isTestPassed = sessions.any { it.status == "passed" }

        return ProTestStatusResponse(
            activeSession = activeSession,
            history = history.sortedByDescending { it.createdAt },
            remainingVersions = remainingVersions,
            isTestPassed = isTestPassed
        )
    }

    // ─── 관리자 API ───

    @Transactional
    fun registerChapterTest(chapterId: String, request: RegisterProChapterTestRequest): ProChapterTestEntity {
        val existing = chapterTestRepo.findByChapterIdAndVersion(chapterId, request.version)
        if (existing != null) {
            throw ApiException("DUPLICATE", "해당 버전이 이미 등록되어 있습니다.", HttpStatus.CONFLICT)
        }

        testPaperRepo.findById(request.testPaperId).orElseThrow {
            ApiException("NOT_FOUND", "시험지를 찾을 수 없습니다.", HttpStatus.NOT_FOUND)
        }

        val chapterTest = ProChapterTestEntity(
            id = IdGenerator.newId("pct"),
            chapterId = chapterId,
            version = request.version,
            testPaperId = request.testPaperId
        )
        return chapterTestRepo.save(chapterTest)
    }

    /** JSON 문자열에서 역량별 점수 파싱 */
    private fun parseCompetencyScores(json: String?): Map<String, CompetencyScore>? {
        if (json.isNullOrBlank()) return null
        return try {
            objectMapper.readValue(
                json,
                object : com.fasterxml.jackson.core.type.TypeReference<Map<String, CompetencyScore>>() {}
            )
        } catch (_: Exception) {
            null
        }
    }
}
