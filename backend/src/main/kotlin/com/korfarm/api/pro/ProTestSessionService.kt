package com.korfarm.api.pro

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.test.TestPaperRepo
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
    private val testService: TestService,
    private val proModeService: ProModeService
) {
    companion object {
        const val PASS_SCORE = 70
        const val TIME_LIMIT_MINUTES = 60L
    }

    @Transactional
    fun printTest(userId: String, chapterId: String): ProTestPrintResponse {
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
        val activeSessions = testSessionRepo.findByUserIdAndChapterIdAndStatusIn(userId, chapterId, listOf("printed"))
        for (session in activeSessions) {
            if (session.omrDeadline != null && session.omrDeadline!!.isBefore(LocalDateTime.now())) {
                session.status = "expired"
                testSessionRepo.save(session)
            } else {
                // 아직 유효한 세션이 있으면 그대로 반환
                val paper = testPaperRepo.findById(session.testId).orElse(null)
                val remaining = Duration.between(LocalDateTime.now(), session.omrDeadline).toMinutes()
                return ProTestPrintResponse(
                    sessionId = session.id,
                    testId = session.testId,
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
            ?: throw ApiException("NO_MORE_VERSIONS", "모든 테스트 버전을 이미 응시했습니다.", HttpStatus.CONFLICT)

        val paper = testPaperRepo.findById(nextTest.testPaperId).orElseThrow {
            ApiException("NOT_FOUND", "시험지를 찾을 수 없습니다.", HttpStatus.NOT_FOUND)
        }

        // 5. 세션 생성
        val now = LocalDateTime.now()
        val deadline = now.plusMinutes(TIME_LIMIT_MINUTES)
        val session = ProTestSessionEntity(
            id = IdGenerator.newId("pts"),
            userId = userId,
            testId = nextTest.testPaperId,
            chapterId = chapterId,
            chapterTestId = nextTest.id,
            printedAt = now,
            omrDeadline = deadline,
            status = "printed"
        )
        testSessionRepo.save(session)

        return ProTestPrintResponse(
            sessionId = session.id,
            testId = session.testId,
            pdfFileId = paper.pdfFileId,
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

        // 세션 상태 확인
        if (session.status != "printed") {
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
        val paper = testPaperRepo.findById(session.testId).orElse(null)
        val totalPoints = paper?.totalPoints ?: 100

        // 100점 만점 기준으로 환산
        val scorePercent = if (totalPoints > 0) (submission.score * 100) / totalPoints else 0
        val passed = scorePercent >= PASS_SCORE

        // 세션 업데이트
        session.score = submission.score
        session.submissionId = submission.id
        session.status = if (passed) "passed" else "failed"
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
            if (remaining > 0) "retry_available" else "no_more_versions"
        }

        return ProTestSubmitResponse(
            score = submission.score,
            totalPoints = totalPoints,
            passed = passed,
            nextAction = nextAction
        )
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

            val view = ProTestSessionView(
                sessionId = session.id,
                version = version,
                status = if (session.status == "printed" && session.omrDeadline?.isBefore(now) == true) "expired" else session.status,
                score = session.score,
                printedAt = session.printedAt,
                omrDeadline = session.omrDeadline,
                createdAt = session.createdAt
            )

            if (session.status == "printed" && session.omrDeadline?.isAfter(now) == true) {
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
}
