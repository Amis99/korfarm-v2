package com.korfarm.api.test

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.org.OrgMembershipRepository
import com.korfarm.api.org.OrgRepository
import com.korfarm.api.security.SecurityUtils
import com.korfarm.api.economy.EconomyService
import com.korfarm.api.economy.SeedCatalogRepository
import com.korfarm.api.learning.LearningCompetencyService
import com.korfarm.api.learning.SeedRewardPolicy
import com.korfarm.api.learning.mapDomainToCompetency
import com.korfarm.api.user.UserRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalDateTime

@Service
class TestService(
    private val testPaperRepo: TestPaperRepo,
    private val questionRepo: TestQuestionRepo,
    private val submissionRepo: TestSubmissionRepo,
    private val userRepository: UserRepository,
    private val orgRepository: OrgRepository,
    private val orgMembershipRepository: OrgMembershipRepository,
    private val objectMapper: ObjectMapper,
    private val economyService: EconomyService,
    private val seedCatalogRepository: SeedCatalogRepository,
    private val learningCompetencyService: LearningCompetencyService,
) {

    // ─── Student: list tests ───
    @Transactional(readOnly = true)
    fun listTests(userId: String, levelId: String?, source: String?): List<TestPaperSummary> {
        // 본사/기관 관리자는 무한 응시 가능 — hasSubmitted를 항상 false로 반환
        val isAdmin = SecurityUtils.hasAnyRole("HQ_ADMIN", "ORG_ADMIN")
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
                hasSubmitted = if (isAdmin) false else sub != null,
                score = sub?.score,
                createdAt = p.createdAt
            )
        }
    }

    // ─── Student: 진단 테스트 목록 ───
    @Transactional(readOnly = true)
    fun listDiagnosticTests(userId: String): List<TestPaperSummary> {
        val isAdmin = SecurityUtils.hasAnyRole("HQ_ADMIN", "ORG_ADMIN")
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
                hasSubmitted = if (isAdmin) false else sub != null,
                score = sub?.score,
                createdAt = p.createdAt
            )
        }
    }

    // ─── Student: test detail ───
    @Transactional(readOnly = true)
    fun getTestDetail(testId: String, userId: String): TestPaperDetail {
        val isAdmin = SecurityUtils.hasAnyRole("HQ_ADMIN", "ORG_ADMIN")
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
            hasSubmitted = if (isAdmin) false else hasSub,
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
                points = q.points,
                passage = q.passage,
                content = q.stem ?: q.passage,
                choices = parseChoices(q.choicesJson)?.map { it.text }
            )
        }
    }

    // ─── Student: submit OMR + auto-grade ───
    @Transactional
    fun submitOmr(testId: String, userId: String, submittedBy: String, answers: Map<String, String>): TestSubmissionEntity {
        val isAdmin = SecurityUtils.hasAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val existing = submissionRepo.findByTestIdAndUserId(testId, userId)
        if (existing != null) {
            // 본사/기관 관리자는 무한 응시 가능 — 기존 제출 삭제 후 새로 채점
            if (!isAdmin) {
                throw ApiException("ALREADY_SUBMITTED", "이미 제출한 시험입니다.", HttpStatus.CONFLICT)
            }
            submissionRepo.delete(existing)
            submissionRepo.flush()
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
            val isCorrect: Boolean
            val earned: Int

            if (q.type == "객관식") {
                isCorrect = myAnswer.isNotBlank() && myAnswer == q.correctAnswer
                earned = if (isCorrect) q.points else 0
            } else {
                // 서술형: 키워드 매칭으로 임시 채점
                val keywords = parseEssayKeywords(q.essayKeywordsJson)
                if (keywords != null && keywords.isNotEmpty() && myAnswer.isNotBlank()) {
                    val keywordResult = gradeByKeywords(myAnswer, keywords, q.points)
                    earned = keywordResult.score
                    isCorrect = earned >= q.points * 0.7
                } else {
                    isCorrect = false
                    earned = 0
                }
            }

            if (isCorrect) correctCount++
            score += earned

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
        val saved = submissionRepo.save(entity)

        // 씨앗 보상 지급 (점수 비율 기반)
        val totalPoints = questions.sumOf { it.points }
        val percentage = if (totalPoints > 0) (score * 100 / totalPoints) else 0
        val seedReward = when {
            percentage >= 90 -> 5
            percentage >= 70 -> 3
            percentage >= 50 -> 1
            else -> 0
        }
        if (seedReward > 0) {
            val catalog = seedCatalogRepository.findAll()
            val seedType = SeedRewardPolicy.randomSeedType(catalog)
            economyService.addSeeds(userId, seedType, seedReward, "테스트 완료", "test", testId)
        }

        // 학습 종합 누적 — domain → 10대 역량 매핑 후 정답률로 record (weight=10)
        // contentId = "test_paper_{testId}" — 한 시험지 첫 응시만 누적 (재응시 자동 무시)
        try {
            data class DStats(var correct: Int = 0, var total: Int = 0)
            val byDomain = mutableMapOf<String, DStats>()
            for (q in questions) {
                val dom = q.domain
                if (dom.isNullOrBlank() || dom == "종합") continue
                val s = byDomain.getOrPut(dom) { DStats() }
                s.total += 1
                val myAnswer = answers[q.number.toString()] ?: ""
                if (q.type == "객관식") {
                    if (myAnswer.isNotBlank() && myAnswer == q.correctAnswer) s.correct += 1
                } else {
                    val keywords = parseEssayKeywords(q.essayKeywordsJson)
                    if (keywords != null && keywords.isNotEmpty() && myAnswer.isNotBlank()) {
                        val kr = gradeByKeywords(myAnswer, keywords, q.points)
                        if (kr.score >= q.points * 0.7) s.correct += 1
                    }
                }
            }
            val ratioByCompetency = mutableMapOf<String, Double>()
            for ((dom, s) in byDomain) {
                val competency = mapDomainToCompetency(dom) ?: continue
                if (s.total <= 0) continue
                val ratio = s.correct.toDouble() / s.total
                val prev = ratioByCompetency[competency]
                if (prev == null || ratio > prev) ratioByCompetency[competency] = ratio
            }
            if (ratioByCompetency.isNotEmpty()) {
                learningCompetencyService.record(
                    userId = userId,
                    contentId = "test_paper_${testId}",
                    source = "test_paper",
                    ratioByCompetency = ratioByCompetency,
                )
            }
        } catch (_: Exception) { /* 누적 실패는 채점 자체를 막지 않음 */ }

        return saved
    }

    // ─── Student: report (성적표) ───
    @Transactional(readOnly = true)
    fun getReport(testId: String, userId: String): TestReportResponse {
        val paper = findPaper(testId)
        val sub = submissionRepo.findByTestIdAndUserId(testId, userId)
            ?: throw ApiException("NOT_SUBMITTED", "아직 제출하지 않았습니다.", HttpStatus.NOT_FOUND)
        val questions = questionRepo.findByTestIdOrderByNumberAsc(testId)
        val answers = parseAnswers(sub.answersJson)

        // 제출 시 저장된 채점 결과 파싱 (서술형 점수 포함)
        val gradedStats = parseGradedStats(sub.statsJson)

        val domainMap = mutableMapOf<String, MutableList<Pair<Int, Int>>>() // domain -> list of (earned, max)
        val details = questions.map { q ->
            val myAnswer = answers[q.number.toString()] ?: ""
            val gradedStat = gradedStats[q.number]
            val isCorrect: Boolean
            val earned: Int
            if (q.type == "객관식") {
                isCorrect = myAnswer.isNotBlank() && myAnswer == q.correctAnswer
                earned = if (isCorrect) q.points else 0
            } else {
                // 서술형: 제출 시 저장된 채점 결과 사용, 없으면 키워드 재채점
                if (gradedStat != null) {
                    earned = gradedStat.earned
                    isCorrect = gradedStat.correct
                } else {
                    val keywords = parseEssayKeywords(q.essayKeywordsJson)
                    if (keywords != null && keywords.isNotEmpty() && myAnswer.isNotBlank()) {
                        val keywordResult = gradeByKeywords(myAnswer, keywords, q.points)
                        earned = keywordResult.score
                        isCorrect = earned >= q.points * 0.7
                    } else {
                        isCorrect = false
                        earned = 0
                    }
                }
            }
            val domain = q.domain ?: "기타"
            domainMap.getOrPut(domain) { mutableListOf() }.add(earned to q.points)
            val explanations = parseExplanations(q.choiceExplanationsJson)
            QuestionResult(
                questionNumber = q.number,
                type = q.type,
                domain = q.domain,
                passage = q.passage,
                myAnswer = myAnswer,
                correctAnswer = q.correctAnswer ?: q.modelAnswer ?: "",
                isCorrect = isCorrect,
                points = q.points,
                earnedPoints = earned,
                choiceExplanation = if (!isCorrect && myAnswer.isNotBlank() && q.type == "객관식") explanations?.get(myAnswer) else null,
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

        val gradedStats = parseGradedStats(sub.statsJson)
        val wrongItems = questions.mapNotNull { q ->
            val myAnswer = answers[q.number.toString()] ?: ""
            val gradedStat = gradedStats[q.number]
            val isCorrect = if (q.type == "객관식") {
                myAnswer.isNotBlank() && myAnswer == q.correctAnswer
            } else {
                gradedStat?.correct ?: false
            }
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
        // 각 시험의 전체 제출 통계 조회
        val allSubsByTest = submissionRepo.findByTestIdIn(subs.map { it.testId }).groupBy { it.testId }
        return subs.sortedByDescending { it.createdAt }.mapNotNull { s ->
            val p = paperMap[s.testId] ?: return@mapNotNull null
            val accuracy = if (p.totalQuestions > 0) (s.correctCount.toDouble() / p.totalQuestions) * 100.0 else 0.0
            val testScores = allSubsByTest[s.testId]?.map { it.score } ?: emptyList()
            TestHistoryItem(
                testId = p.id,
                testTitle = p.title,
                examDate = p.examDate?.toString(),
                score = s.score,
                totalPoints = p.totalPoints,
                correctCount = s.correctCount,
                totalQuestions = p.totalQuestions,
                accuracy = Math.round(accuracy * 10.0) / 10.0,
                submittedAt = s.createdAt,
                avgScore = if (testScores.isNotEmpty()) Math.round(testScores.average() * 10.0) / 10.0 else null,
                maxScore = testScores.maxOrNull(),
                minScore = testScores.minOrNull(),
            )
        }
    }

    // ─── Admin: create test ───
    @Transactional
    fun createTest(req: CreateTestRequest, callerUserId: String): TestPaperEntity {
        // ORG_ADMIN이면 자동으로 소속 기관 ID 설정
        val orgId = if (SecurityUtils.hasAnyRole("HQ_ADMIN")) {
            req.orgId // HQ_ADMIN은 지정값 사용 (null이면 본사 시험)
        } else {
            // ORG_ADMIN: 자기 소속 기관 ID 자동 설정
            orgMembershipRepository.findByUserIdAndStatus(callerUserId, "active")
                .firstOrNull()?.orgId
                ?: throw ApiException("NO_ORG", "소속 기관이 없습니다.", HttpStatus.BAD_REQUEST)
        }
        val entity = TestPaperEntity(
            id = IdGenerator.newId("test"),
            orgId = orgId,
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
                stem = q.stem,
                points = q.points,
                correctAnswer = q.correctAnswer,
                choices = parseChoices(q.choicesJson),
                choiceExplanations = parseExplanations(q.choiceExplanationsJson),
                intent = q.intent,
                essayKeywords = parseEssayKeywords(q.essayKeywordsJson),
                essayRubric = q.essayRubricJson,
                modelAnswer = q.modelAnswer
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
                stem = inp.stem,
                points = inp.points,
                correctAnswer = inp.correctAnswer,
                choicesJson = inp.choices?.let { objectMapper.writeValueAsString(it) },
                choiceExplanationsJson = inp.choiceExplanations?.let { objectMapper.writeValueAsString(it) },
                intent = inp.intent,
                essayKeywordsJson = inp.essayKeywords?.let { objectMapper.writeValueAsString(it) },
                essayRubricJson = inp.essayRubric,
                modelAnswer = inp.modelAnswer
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
    fun listAllTests(callerUserId: String): List<TestPaperSummary> {
        var papers = testPaperRepo.findAll().sortedByDescending { it.createdAt }

        // ORG_ADMIN이면 본사(orgId=null) + 자기 기관 시험만 필터링
        if (!SecurityUtils.hasAnyRole("HQ_ADMIN")) {
            val callerOrgIds = orgMembershipRepository.findByUserIdAndStatus(callerUserId, "active").map { it.orgId }
            papers = papers.filter { it.orgId == null || callerOrgIds.contains(it.orgId) }
        }

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
                score = null,
                submissionCount = subCount,
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
    fun getStudentsForTest(testId: String, callerUserId: String): List<StudentForTest> {
        val paper = findPaper(testId)

        // STUDENT 역할 멤버십만 필터링
        val studentMemberships = if (paper.orgId != null) {
            // 기관 시험: 해당 기관의 학생만
            orgMembershipRepository.findByOrgIdAndStatus(paper.orgId!!, "active")
                .filter { it.role == "STUDENT" }
        } else if (SecurityUtils.hasAnyRole("HQ_ADMIN")) {
            // 본사 시험 + HQ_ADMIN: 전체 학생
            orgMembershipRepository.findByStatus("active")
                .filter { it.role == "STUDENT" }
        } else {
            // 본사 시험 + ORG_ADMIN: 자기 기관 학생만
            val callerOrgIds = orgMembershipRepository.findByUserIdAndStatus(callerUserId, "active").map { it.orgId }
            callerOrgIds.flatMap { orgId ->
                orgMembershipRepository.findByOrgIdAndStatus(orgId, "active")
                    .filter { it.role == "STUDENT" }
            }
        }

        val studentUserIds = studentMemberships.map { it.userId }.distinct()
        val users = userRepository.findAllById(studentUserIds).filter { it.status == "active" }.associateBy { it.id }
        val subs = submissionRepo.findByTestId(testId).associateBy { it.userId }
        return studentUserIds.mapNotNull { uid ->
            val u = users[uid] ?: return@mapNotNull null
            val sub = subs[uid]
            StudentForTest(
                userId = u.id,
                name = u.name ?: u.email,
                hasSubmitted = sub != null,
                score = sub?.score
            )
        }
    }

    // ─── Access control ───

    /**
     * 관리자(ORG_ADMIN)가 시험에 접근할 수 있는지 검증.
     * HQ_ADMIN은 모든 시험 접근 가능. ORG_ADMIN은 본사 시험 + 자기 기관 시험만 가능.
     */
    fun verifyAdminTestAccess(testId: String, callerUserId: String) {
        if (SecurityUtils.hasAnyRole("HQ_ADMIN")) return
        val paper = findPaper(testId)
        if (paper.orgId == null) return // 본사 시험은 모든 관리자 접근 가능
        val callerOrgIds = orgMembershipRepository.findByUserIdAndStatus(callerUserId, "active").map { it.orgId }
        if (!callerOrgIds.contains(paper.orgId)) {
            throw ApiException("FORBIDDEN", "다른 기관의 시험에 접근할 수 없습니다.", HttpStatus.FORBIDDEN)
        }
    }

    /**
     * 학생이 시험에 접근할 수 있는지 검증.
     * 본사 시험(orgId=null)은 모든 학생 접근 가능. 기관 시험은 해당 기관 소속만 가능.
     */
    fun verifyStudentTestAccess(testId: String, userId: String) {
        val paper = findPaper(testId)
        if (paper.orgId == null) return // 본사 시험은 모든 학생 접근 가능
        if (paper.series == "diagnostic") return // 진단 시험지는 모든 학생 접근 가능
        val userOrgIds = orgMembershipRepository.findByUserIdAndStatus(userId, "active").map { it.orgId }
        if (!userOrgIds.contains(paper.orgId)) {
            throw ApiException("FORBIDDEN", "해당 시험에 접근 권한이 없습니다.", HttpStatus.FORBIDDEN)
        }
    }

    // ─── Helpers ───
    private fun findPaper(testId: String): TestPaperEntity {
        return testPaperRepo.findById(testId).orElseThrow {
            ApiException("NOT_FOUND", "시험을 찾을 수 없습니다.", HttpStatus.NOT_FOUND)
        }
    }

    data class GradedStat(val earned: Int, val correct: Boolean)

    private fun parseGradedStats(json: String?): Map<Int, GradedStat> {
        if (json.isNullOrBlank()) return emptyMap()
        return try {
            val list: List<Map<String, Any>> = objectMapper.readValue(json, object : TypeReference<List<Map<String, Any>>>() {})
            list.associate { item ->
                val qNum = (item["q"] as? Number)?.toInt() ?: 0
                val earned = (item["earned"] as? Number)?.toInt() ?: 0
                val correct = item["correct"] as? Boolean ?: false
                qNum to GradedStat(earned, correct)
            }
        } catch (e: Exception) {
            emptyMap()
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

    private fun parseChoices(json: String?): List<ChoiceItem>? {
        if (json.isNullOrBlank()) return null
        return objectMapper.readValue(json, object : TypeReference<List<ChoiceItem>>() {})
    }

    data class KeywordGradeResult(
        val score: Int,
        val matched: List<String>,
        val missed: List<String>
    )

    fun gradeByKeywords(answer: String, keywords: List<EssayKeyword>, maxPoints: Int): KeywordGradeResult {
        val totalWeight = keywords.sumOf { it.weight }
        if (totalWeight == 0) return KeywordGradeResult(0, emptyList(), keywords.map { it.keyword })
        val matched = mutableListOf<String>()
        val missed = mutableListOf<String>()
        var matchedWeight = 0
        for (kw in keywords) {
            if (answer.contains(kw.keyword, ignoreCase = true)) {
                matched.add(kw.keyword)
                matchedWeight += kw.weight
            } else {
                missed.add(kw.keyword)
            }
        }
        val score = (matchedWeight.toDouble() / totalWeight * maxPoints).toInt()
        return KeywordGradeResult(score, matched, missed)
    }

    fun parseEssayKeywords(json: String?): List<EssayKeyword>? {
        if (json.isNullOrBlank()) return null
        return try {
            objectMapper.readValue(json, object : TypeReference<List<EssayKeyword>>() {})
        } catch (e: Exception) {
            null
        }
    }

    fun getQuestion(testId: String, questionNumber: Int): TestQuestionEntity? {
        return questionRepo.findByTestIdOrderByNumberAsc(testId).find { it.number == questionNumber }
    }

    fun getSubmission(submissionId: String): TestSubmissionEntity? {
        return submissionRepo.findById(submissionId).orElse(null)
    }

    fun updateSubmissionScore(submissionId: String, additionalScore: Int) {
        val sub = submissionRepo.findById(submissionId).orElse(null) ?: return
        sub.score = sub.score + additionalScore
        submissionRepo.save(sub)
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
