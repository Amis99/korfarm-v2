package com.korfarm.api.test

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.org.OrgMembershipRepository
import com.korfarm.api.org.OrgRepository
import com.korfarm.api.user.UserRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

@Service
class TestService(
    private val testPaperRepo: TestPaperRepo,
    private val questionRepo: TestQuestionRepo,
    private val submissionRepo: TestSubmissionRepo,
    private val userRepository: UserRepository,
    private val orgRepository: OrgRepository,
    private val orgMembershipRepository: OrgMembershipRepository,
    private val objectMapper: ObjectMapper
) {

    // ─── Student: list tests ───
    @Transactional(readOnly = true)
    fun listTests(userId: String, levelId: String?, source: String?): List<TestPaperSummary> {
        // 사용자의 소속 기관 ID 조회
        val userOrgIds = orgMembershipRepository.findByUserIdAndStatus(userId, "active").map { it.orgId }

        var papers = testPaperRepo.findByStatus("open")
            .filter { it.series != "chapter" && it.series != "diagnostic" }  // 프로 모드 챕터 테스트 + 진단 테스트 제외

        // source 필터: "hq" = 본사(orgId가 null), "org" = 소속 기관
        if (source == "hq") {
            papers = papers.filter { it.orgId == null }
        } else if (source == "org") {
            papers = papers.filter { it.orgId != null && userOrgIds.contains(it.orgId) }
        } else {
            // 전체: 본사 + 소속 기관 시험만 (다른 기관 시험은 제외)
            papers = papers.filter { it.orgId == null || userOrgIds.contains(it.orgId) }
        }

        // levelId 필터
        if (levelId != null) {
            papers = papers.filter { it.levelId == levelId }
        }

        // 기관명 매핑
        val orgIds = papers.mapNotNull { it.orgId }.distinct()
        val orgMap = if (orgIds.isNotEmpty()) orgRepository.findAllById(orgIds).associateBy { it.id } else emptyMap()

        val submissions = submissionRepo.findByUserId(userId).associateBy { it.testId }
        return papers.sortedByDescending { it.createdAt }.map { p ->
            val sub = submissions[p.id]
            TestPaperSummary(
                testId = p.id,
                title = p.title,
                description = p.description,
                levelId = p.levelId,
                totalQuestions = p.totalQuestions,
                totalPoints = p.totalPoints,
                timeLimitMinutes = p.timeLimitMinutes,
                examDate = p.examDate?.toString(),
                series = p.series,
                orgId = p.orgId,
                orgName = p.orgId?.let { orgMap[it]?.name },
                hasSubmitted = sub != null,
                score = sub?.score,
                createdAt = p.createdAt
            )
        }
    }

    // ─── Student: 진단 테스트 목록 ───
    @Transactional(readOnly = true)
    fun listDiagnosticTests(userId: String): List<TestPaperSummary> {
        val papers = testPaperRepo.findByStatus("open")
            .filter { it.series == "diagnostic" }

        val submissions = submissionRepo.findByUserId(userId).associateBy { it.testId }
        return papers.sortedByDescending { it.createdAt }.map { p ->
            val sub = submissions[p.id]
            TestPaperSummary(
                testId = p.id,
                title = p.title,
                description = p.description,
                levelId = p.levelId,
                totalQuestions = p.totalQuestions,
                totalPoints = p.totalPoints,
                timeLimitMinutes = p.timeLimitMinutes,
                examDate = p.examDate?.toString(),
                series = p.series,
                orgId = p.orgId,
                orgName = null,
                hasSubmitted = sub != null,
                score = sub?.score,
                createdAt = p.createdAt
            )
        }
    }

    // ─── Student: test detail ───
    @Transactional(readOnly = true)
    fun getTestDetail(testId: String, userId: String): TestPaperDetail {
        val p = findPaper(testId)
        val hasQuestions = questionRepo.findByTestIdOrderByNumberAsc(testId).isNotEmpty()
        val hasSub = submissionRepo.findByTestIdAndUserId(testId, userId) != null
        return TestPaperDetail(
            testId = p.id,
            title = p.title,
            description = p.description,
            pdfFileId = p.pdfFileId,
            levelId = p.levelId,
            totalQuestions = p.totalQuestions,
            totalPoints = p.totalPoints,
            timeLimitMinutes = p.timeLimitMinutes,
            examDate = p.examDate?.toString(),
            series = p.series,
            hasQuestions = hasQuestions,
            hasSubmitted = hasSub,
            createdAt = p.createdAt
        )
    }

    // ─── Student: question stubs (no correct answer) ───
    @Transactional(readOnly = true)
    fun getQuestionStubs(testId: String): List<TestQuestionStub> {
        return questionRepo.findByTestIdOrderByNumberAsc(testId).map { q ->
            TestQuestionStub(
                number = q.number,
                type = q.type,
                domain = q.domain,
                points = q.points
            )
        }
    }

    // ─── Student: submit OMR + auto-grade ───
    @Transactional
    fun submitOmr(testId: String, userId: String, submittedBy: String, answers: Map<String, String>): TestSubmissionEntity {
        val existing = submissionRepo.findByTestIdAndUserId(testId, userId)
        if (existing != null) {
            throw ApiException("ALREADY_SUBMITTED", "이미 제출한 시험입니다.", HttpStatus.CONFLICT)
        }
        val questions = questionRepo.findByTestIdOrderByNumberAsc(testId)
        if (questions.isEmpty()) {
            throw ApiException("NO_QUESTIONS", "문항이 등록되지 않은 시험입니다.", HttpStatus.BAD_REQUEST)
        }

        var score = 0
        var correctCount = 0
        val details = mutableListOf<Map<String, Any?>>()

        for (q in questions) {
            val myAnswer = answers[q.number.toString()] ?: ""
            val isCorrect = if (q.type == "객관식") {
                myAnswer.isNotBlank() && myAnswer == q.correctAnswer
            } else {
                false // 서술형은 별도 채점
            }
            val earned = if (isCorrect) q.points else 0
            if (isCorrect) {
                score += earned
                correctCount++
            }
            details.add(
                mapOf(
                    "q" to q.number,
                    "type" to q.type,
                    "domain" to q.domain,
                    "my" to myAnswer,
                    "ans" to (q.correctAnswer ?: ""),
                    "correct" to isCorrect,
                    "points" to q.points,
                    "earned" to earned
                )
            )
        }

        val entity = TestSubmissionEntity(
            id = IdGenerator.newId("tsub"),
            testId = testId,
            userId = userId,
            submittedBy = submittedBy,
            answersJson = objectMapper.writeValueAsString(answers),
            score = score,
            correctCount = correctCount,
            statsJson = objectMapper.writeValueAsString(details),
            status = "graded"
        )
        return submissionRepo.save(entity)
    }

    // ─── Student: report (성적표) ───
    @Transactional(readOnly = true)
    fun getReport(testId: String, userId: String): TestReportResponse {
        val paper = findPaper(testId)
        val sub = submissionRepo.findByTestIdAndUserId(testId, userId)
            ?: throw ApiException("NOT_SUBMITTED", "아직 제출하지 않았습니다.", HttpStatus.NOT_FOUND)
        val questions = questionRepo.findByTestIdOrderByNumberAsc(testId)
        val answers = parseAnswers(sub.answersJson)

        val domainMap = mutableMapOf<String, MutableList<Pair<Int, Int>>>() // domain -> list of (earned, max)
        val details = questions.map { q ->
            val myAnswer = answers[q.number.toString()] ?: ""
            val isCorrect = if (q.type == "객관식") myAnswer == q.correctAnswer else false
            val earned = if (isCorrect) q.points else 0
            val domain = q.domain ?: "기타"
            domainMap.getOrPut(domain) { mutableListOf() }.add(earned to q.points)
            val explanations = parseExplanations(q.choiceExplanationsJson)
            QuestionResult(
                questionNumber = q.number,
                type = q.type,
                domain = q.domain,
                passage = q.passage,
                myAnswer = myAnswer,
                correctAnswer = q.correctAnswer ?: "",
                isCorrect = isCorrect,
                points = q.points,
                earnedPoints = earned,
                choiceExplanation = if (!isCorrect && myAnswer.isNotBlank()) explanations?.get(myAnswer) else null,
                intent = q.intent
            )
        }

        val domainScores = domainMap.mapValues { (_, pairs) ->
            DomainScore(
                score = pairs.sumOf { it.first },
                maxScore = pairs.sumOf { it.second },
                correct = pairs.count { it.first > 0 },
                total = pairs.size
            )
        }

        val totalQ = questions.size
        val accuracy = if (totalQ > 0) (sub.correctCount.toDouble() / totalQ) * 100.0 else 0.0

        return TestReportResponse(
            testId = paper.id,
            testTitle = paper.title,
            totalQuestions = paper.totalQuestions,
            totalPoints = paper.totalPoints,
            score = sub.score,
            correctCount = sub.correctCount,
            accuracy = Math.round(accuracy * 10.0) / 10.0,
            submittedAt = sub.createdAt,
            details = details,
            domainScores = domainScores
        )
    }

    // ─── Student: wrong note (오답 노트) ───
    @Transactional(readOnly = true)
    fun getWrongNote(testId: String, userId: String): WrongNoteResponse {
        val paper = findPaper(testId)
        val sub = submissionRepo.findByTestIdAndUserId(testId, userId)
            ?: throw ApiException("NOT_SUBMITTED", "아직 제출하지 않았습니다.", HttpStatus.NOT_FOUND)
        val questions = questionRepo.findByTestIdOrderByNumberAsc(testId)
        val answers = parseAnswers(sub.answersJson)

        val wrongItems = questions.mapNotNull { q ->
            val myAnswer = answers[q.number.toString()] ?: ""
            val isCorrect = if (q.type == "객관식") myAnswer == q.correctAnswer else false
            if (isCorrect) return@mapNotNull null
            val explanations = parseExplanations(q.choiceExplanationsJson)
            val feedback = buildFeedback(q, myAnswer, explanations)
            WrongNoteItem(
                questionNumber = q.number,
                type = q.type,
                domain = q.domain,
                passage = q.passage,
                myAnswer = myAnswer,
                correctAnswer = q.correctAnswer ?: "",
                points = q.points,
                intent = q.intent,
                feedback = feedback
            )
        }

        return WrongNoteResponse(
            testId = paper.id,
            testTitle = paper.title,
            wrongItems = wrongItems
        )
    }

    // ─── Student: test history ───
    @Transactional(readOnly = true)
    fun getHistory(userId: String): List<TestHistoryItem> {
        val subs = submissionRepo.findByUserId(userId)
        if (subs.isEmpty()) return emptyList()
        val paperMap = testPaperRepo.findAllById(subs.map { it.testId }).associateBy { it.id }
        return subs.sortedByDescending { it.createdAt }.mapNotNull { s ->
            val p = paperMap[s.testId] ?: return@mapNotNull null
            val accuracy = if (p.totalQuestions > 0) (s.correctCount.toDouble() / p.totalQuestions) * 100.0 else 0.0
            TestHistoryItem(
                testId = p.id,
                testTitle = p.title,
                examDate = p.examDate?.toString(),
                score = s.score,
                totalPoints = p.totalPoints,
                correctCount = s.correctCount,
                totalQuestions = p.totalQuestions,
                accuracy = Math.round(accuracy * 10.0) / 10.0,
                submittedAt = s.createdAt
            )
        }
    }

    // ─── Admin: create test ───
    @Transactional
    fun createTest(req: CreateTestRequest): TestPaperEntity {
        val entity = TestPaperEntity(
            id = IdGenerator.newId("test"),
            title = req.title,
            description = req.description,
            levelId = req.levelId,
            totalQuestions = req.totalQuestions,
            totalPoints = req.totalPoints,
            timeLimitMinutes = req.timeLimitMinutes,
            examDate = req.examDate?.let { LocalDate.parse(it) },
            series = req.series,
            status = "open"
        )
        return testPaperRepo.save(entity)
    }

    // ─── Admin: update test ───
    @Transactional
    fun updateTest(testId: String, req: UpdateTestRequest): TestPaperEntity {
        val entity = findPaper(testId)
        req.title?.let { entity.title = it }
        req.description?.let { entity.description = it }
        req.levelId?.let { entity.levelId = it }
        req.totalQuestions?.let { entity.totalQuestions = it }
        req.totalPoints?.let { entity.totalPoints = it }
        req.timeLimitMinutes?.let { entity.timeLimitMinutes = it }
        req.examDate?.let { entity.examDate = LocalDate.parse(it) }
        req.series?.let { entity.series = it }
        req.status?.let { entity.status = it }
        return testPaperRepo.save(entity)
    }

    // ─── Admin: delete test ───
    @Transactional
    fun deleteTest(testId: String) {
        val paper = findPaper(testId)
        questionRepo.deleteByTestId(testId)
        submissionRepo.findByTestId(testId).forEach { submissionRepo.delete(it) }
        testPaperRepo.delete(paper)
    }

    // ─── Admin: set PDF file id ───
    @Transactional
    fun setPdfFileId(testId: String, fileId: String): TestPaperEntity {
        val paper = findPaper(testId)
        paper.pdfFileId = fileId
        return testPaperRepo.save(paper)
    }

    // ─── Admin: get questions ───
    @Transactional(readOnly = true)
    fun getQuestions(testId: String): List<TestQuestionView> {
        return questionRepo.findByTestIdOrderByNumberAsc(testId).map { q ->
            TestQuestionView(
                questionId = q.id,
                number = q.number,
                type = q.type,
                domain = q.domain,
                subDomain = q.subDomain,
                passage = q.passage,
                points = q.points,
                correctAnswer = q.correctAnswer,
                choiceExplanations = parseExplanations(q.choiceExplanationsJson),
                intent = q.intent
            )
        }
    }

    // ─── Admin: set questions (bulk) ───
    @Transactional
    fun setQuestions(testId: String, inputs: List<QuestionInput>) {
        findPaper(testId)
        questionRepo.deleteByTestId(testId)
        val entities = inputs.map { inp ->
            TestQuestionEntity(
                id = IdGenerator.newId("tq"),
                testId = testId,
                number = inp.number,
                type = inp.type,
                domain = inp.domain,
                subDomain = inp.subDomain,
                passage = inp.passage,
                points = inp.points,
                correctAnswer = inp.correctAnswer,
                choiceExplanationsJson = inp.choiceExplanations?.let { objectMapper.writeValueAsString(it) },
                intent = inp.intent
            )
        }
        questionRepo.saveAll(entities)

        // update paper totals
        val paper = findPaper(testId)
        paper.totalQuestions = entities.size
        paper.totalPoints = entities.sumOf { it.points }
        testPaperRepo.save(paper)
    }

    // ─── Admin: get single test ───
    @Transactional(readOnly = true)
    fun getTestPaper(testId: String): TestPaperEntity {
        return findPaper(testId)
    }

    // ─── Admin: list all tests ───
    @Transactional(readOnly = true)
    fun listAllTests(): List<TestPaperSummary> {
        val papers = testPaperRepo.findAll().sortedByDescending { it.createdAt }
        val orgIds = papers.mapNotNull { it.orgId }.distinct()
        val orgMap = if (orgIds.isNotEmpty()) orgRepository.findAllById(orgIds).associateBy { it.id } else emptyMap()
        return papers.map { p ->
            val subCount = submissionRepo.findByTestId(p.id).size
            TestPaperSummary(
                testId = p.id,
                title = p.title,
                description = p.description,
                levelId = p.levelId,
                totalQuestions = p.totalQuestions,
                totalPoints = p.totalPoints,
                timeLimitMinutes = p.timeLimitMinutes,
                examDate = p.examDate?.toString(),
                series = p.series,
                orgId = p.orgId,
                orgName = p.orgId?.let { orgMap[it]?.name },
                hasSubmitted = false,
                score = subCount, // reuse score field for submission count in admin context
                createdAt = p.createdAt
            )
        }
    }

    // ─── Admin: submission list ───
    @Transactional(readOnly = true)
    fun getSubmissions(testId: String): List<SubmissionSummary> {
        val paper = findPaper(testId)
        val subs = submissionRepo.findByTestId(testId)
        val userMap = userRepository.findAllById(subs.map { it.userId }).associateBy { it.id }
        return subs.sortedByDescending { it.createdAt }.map { s ->
            val totalQ = paper.totalQuestions
            val accuracy = if (totalQ > 0) (s.correctCount.toDouble() / totalQ) * 100.0 else 0.0
            SubmissionSummary(
                userId = s.userId,
                userName = userMap[s.userId]?.name,
                score = s.score,
                correctCount = s.correctCount,
                accuracy = Math.round(accuracy * 10.0) / 10.0,
                submittedBy = s.submittedBy,
                submittedAt = s.createdAt
            )
        }
    }

    // ─── Admin: student list for answer entry ───
    @Transactional(readOnly = true)
    fun getStudentsForTest(testId: String): List<StudentForTest> {
        findPaper(testId)
        val allUsers = userRepository.findAll().filter { it.status == "active" }
        val subs = submissionRepo.findByTestId(testId).associateBy { it.userId }
        return allUsers.map { u ->
            val sub = subs[u.id]
            StudentForTest(
                userId = u.id,
                name = u.name ?: u.email,
                hasSubmitted = sub != null,
                score = sub?.score
            )
        }
    }

    // ─── Helpers ───
    private fun findPaper(testId: String): TestPaperEntity {
        return testPaperRepo.findById(testId).orElseThrow {
            ApiException("NOT_FOUND", "시험을 찾을 수 없습니다.", HttpStatus.NOT_FOUND)
        }
    }

    private fun parseAnswers(json: String?): Map<String, String> {
        if (json.isNullOrBlank()) return emptyMap()
        return objectMapper.readValue(json, object : TypeReference<Map<String, String>>() {})
    }

    private fun parseExplanations(json: String?): Map<String, String>? {
        if (json.isNullOrBlank()) return null
        return objectMapper.readValue(json, object : TypeReference<Map<String, String>>() {})
    }

    private fun buildFeedback(q: TestQuestionEntity, myAnswer: String, explanations: Map<String, String>?): String {
        val sb = StringBuilder()
        if (q.type == "객관식") {
            sb.append("정답: ${q.correctAnswer ?: "-"}")
            if (myAnswer.isNotBlank()) {
                val myExpl = explanations?.get(myAnswer)
                if (myExpl != null) sb.append("\n내가 고른 ${myAnswer}번: $myExpl")
            }
            val correctExpl = explanations?.get(q.correctAnswer ?: "")
            if (correctExpl != null) sb.append("\n정답 해설: $correctExpl")
        } else {
            sb.append("모범답안: ${q.correctAnswer ?: "-"}")
            val modelAnswer = explanations?.get("1")
            if (modelAnswer != null) sb.append("\n$modelAnswer")
        }
        return sb.toString()
    }
}
