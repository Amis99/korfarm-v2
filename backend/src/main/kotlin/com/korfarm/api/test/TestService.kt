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
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Lazy
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
    private val testStatisticsService: TestStatisticsService,
    private val diagSessionRepo: com.korfarm.api.diagnostic.DiagSessionRepository,
    private val proTestSessionRepo: com.korfarm.api.pro.ProTestSessionRepo,
    private val diagPassageRepo: com.korfarm.api.diagnostic.DiagPassageRepository,
    private val diagQuestionRepo: com.korfarm.api.diagnostic.DiagQuestionRepository,
    private val diagResponseRepo: com.korfarm.api.diagnostic.DiagResponseRepository,
    private val classRepository: com.korfarm.api.org.ClassRepository,
    private val classMembershipRepository: com.korfarm.api.org.ClassMembershipRepository,
    // N-4 (2026-05-21) — 시험 응시 직후 study_plan_cells 자동 동기화. 순환 의존 방어로 @Lazy.
    @Lazy private val studyPlanService: com.korfarm.api.studyplan.StudyPlanService,
) {
    private val logger = LoggerFactory.getLogger(TestService::class.java)

    // 시험지 ID/series 로 종류 분류 — diagnostic / chapter / misc
    private fun resolveKind(paper: TestPaperEntity): String = when {
        paper.id.startsWith("diag_paper_") -> "diagnostic"
        paper.series == "chapter" -> "chapter"
        else -> "misc"
    }

    /**
     * 12레벨 또는 4그룹 levelId 를 4그룹으로 정규화. (saussure1/2/3 → saussure 등)
     * 기타·진단 테스트는 그룹 단위로 매칭(소쉬르 시험 = 소쉬르1~3 학생 모두 응시).
     * 프로 챕터 테스트는 12레벨 exact match 정책이라 이 헬퍼를 쓰지 않음.
     */
    private fun levelGroup(levelId: String?): String? = when {
        levelId == null -> null
        levelId.startsWith("saussure", ignoreCase = true) -> "saussure"
        levelId.startsWith("frege", ignoreCase = true) -> "frege"
        levelId.startsWith("russell", ignoreCase = true) -> "russell"
        levelId.startsWith("wittgenstein", ignoreCase = true) -> "wittgenstein"
        else -> levelId
    }

    // ─── Student: list tests ───
    @Transactional(readOnly = true)
    fun listTests(userId: String, levelId: String?, source: String?): List<TestPaperSummary> {
        // 본사/기관 관리자는 무한 응시 가능 — hasSubmitted를 항상 false로 반환
        val isAdmin = SecurityUtils.hasAnyRole("HQ_ADMIN", "ORG_ADMIN")
        // 사용자의 소속 기관 ID 조회
        val userOrgIds = orgMembershipRepository.findByUserIdAndStatus(userId, "active").map { it.orgId }

        // N-14 (2026-05-21) — resolveKind 기준 misc 만 노출.
        // 기존: series=="diagnostic" 필터로 series 값이 "diagnostic" 인 misc 시험까지 제외돼 학생 보관함이 빈 배열.
        // 정정: id prefix "diag_paper_" 가 진짜 진단, series=="chapter" 가 진짜 챕터. 그 외는 misc.
        var papers = testPaperRepo.findByStatus("open")
            .filter { resolveKind(it) == "misc" }

        // source 필터: "hq" = 본사(orgId가 null), "org" = 소속 기관
        if (source == "hq") {
            papers = papers.filter { it.orgId == null }
        } else if (source == "org") {
            papers = papers.filter { it.orgId != null && userOrgIds.contains(it.orgId) }
        } else {
            // 전체: 본사 + 소속 기관 시험만 (다른 기관 시험은 제외)
            papers = papers.filter { it.orgId == null || userOrgIds.contains(it.orgId) }
        }

        // levelId 필터 — 기타 테스트는 그룹 매칭 (학생 saussure1 → saussure 그룹 시험 응시 가능)
        if (levelId != null) {
            val targetGroup = levelGroup(levelId)
            papers = papers.filter { levelGroup(it.levelId) == targetGroup }
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
        // N-14 (2026-05-21) — resolveKind 기준 diagnostic 만 (id prefix diag_paper_).
        // 기존 series 칼럼 기반은 series="diagnostic" 인 misc 시험까지 잡아 일관성 깨짐.
        val papers = testPaperRepo.findByStatus("open")
            .filter { resolveKind(it) == "diagnostic" }

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
        val hasSub = submissionRepo.findFirstByTestIdAndUserIdOrderByAttemptNoDesc(testId, userId) != null
        return TestPaperDetail(
            testId = p.id,
            title = p.title,
            description = p.description,
            pdfFileId = p.pdfFileId,
            answerPdfFileId = p.answerPdfFileId,
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
    // 다중 응시 정책 (V0137):
    //   - 학생 직접 응시: 1회만 (ALREADY_SUBMITTED 차단)
    //   - 어드민 대리(submittedBy=adminId): 중복 응시 허용. 기존 row 보존 + attempt_no+1 새 row INSERT.
    //   - attemptedAt: 어드민이 응시 일자 지정 가능 (null 이면 createdAt 사용)
    @Transactional
    fun submitOmr(
        testId: String,
        userId: String,
        submittedBy: String,
        answers: Map<String, String>,
        attemptedAt: LocalDateTime? = null,
    ): TestSubmissionEntity {
        if (testId.startsWith("diag_paper_")) {
            throw ApiException(
                "UNSUPPORTED",
                "진단 시험은 학생 직접 응시 흐름만 지원합니다. 진단 테스트 메뉴에서 응시해 주세요.",
                HttpStatus.BAD_REQUEST
            )
        }
        val isAdmin = SecurityUtils.hasAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val existing = submissionRepo.findFirstByTestIdAndUserIdOrderByAttemptNoDesc(testId, userId)
        if (existing != null && !isAdmin) {
            throw ApiException("ALREADY_SUBMITTED", "이미 제출한 시험입니다.", HttpStatus.CONFLICT)
        }
        // 다중 응시 — 새 attempt_no 부여 (기존 row 삭제 안 함, 모든 이력 보존)
        val nextAttemptNo = submissionRepo.maxAttemptNo(testId, userId) + 1
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
            status = "graded",
            attemptNo = nextAttemptNo,
            attemptedAt = attemptedAt,
        )
        val saved = submissionRepo.save(entity)

        // 씨앗 보상 — 학생 직접 응시 첫 회(attempt_no=1) 만 지급. 통합 정책 사용.
        // 어드민 OMR 입력(submittedBy != userId) · 재응시(attempt_no>1) 는 인플레 방지로 지급 X.
        val isFirstStudentAttempt = submittedBy == userId && nextAttemptNo == 1
        if (isFirstStudentAttempt) {
            val totalPoints = questions.sumOf { it.points }
            val percentage = if (totalPoints > 0) (score * 100 / totalPoints) else 0
            val paperLevelId = testPaperRepo.findById(testId).orElse(null)?.levelId
            val decision = SeedRewardPolicy.calculateGrant(
                userLevelId = paperLevelId,
                contentLevelId = paperLevelId,
                contentType = "TEST",       // 매핑 없음 → seed_wheat fallback
                accuracyPct = percentage,
                source = SeedRewardPolicy.GrantSource.TEST,
            )
            if (decision.rawCount > 0) {
                economyService.addSeeds(userId, decision.seedType, decision.rawCount, "테스트 완료", "test", testId)
            }
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

        // 응시 즉시 통계 캐시 갱신 (실패 시 무시 — 채점 자체는 성공)
        try {
            testStatisticsService.recomputeAndCache(testId)
        } catch (_: Exception) { /* 통계 갱신 실패해도 채점은 성공 */ }

        // N-4 (2026-05-21) — 학습 계획표 test 셀 자동 동기화 (pending|retry → scored)
        // 응시한 학생 본인의 모든 plan 에서 cell.cellRefId 또는 asset.refId = testId 인 셀 갱신.
        try {
            studyPlanService.syncTestCellsForUser(userId, testId)
        } catch (e: Exception) {
            logger.warn("study_plan test cell sync 실패: testId={} userId={} error={}", testId, userId, e.message)
        }

        return saved
    }

    // ─── Admin: 시험지 비주얼 에디터 payload ───
    // payload_json 이 비어있으면 종류별 원본 테이블에서 일일퀴즈 비주얼 에디터 스키마로 자동 변환해 반환
    @Transactional(readOnly = true)
    fun getPayload(testId: String): String? {
        val paper = findPaper(testId)
        if (!paper.payloadJson.isNullOrBlank()) return paper.payloadJson

        // 진단 시험: diag_questions / diag_passages 에서 변환
        if (testId.startsWith("diag_paper_")) {
            return buildDiagnosticPayload(testId.removePrefix("diag_paper_"))
        }

        val questions = questionRepo.findByTestIdOrderByNumberAsc(testId)
        if (questions.isEmpty()) return null

        // 지문 그룹화 — 동일 텍스트의 지문들은 한 번만 등록하고 question.passageId 로 참조
        // 빈 지문은 passages 에 추가 안 함 (지문 없는 문제)
        val passagesList = mutableListOf<Map<String, Any?>>()
        val passageTextToId = mutableMapOf<String, String>()
        for (q in questions) {
            val text = q.passage?.trim().orEmpty()
            if (text.isBlank()) continue
            if (!passageTextToId.containsKey(text)) {
                val pid = "p${passagesList.size + 1}"
                passageTextToId[text] = pid
                passagesList.add(mapOf(
                    "id" to pid,
                    "text" to text,
                    "domain" to q.domain,
                    "subDomain" to q.subDomain
                ))
            }
        }

        val converted = questions.map { q ->
            val rawChoices = parseChoices(q.choicesJson) ?: emptyList()
            val choices = rawChoices.mapIndexed { i, c ->
                mapOf("id" to (c.id.ifBlank { "c${i + 1}" }), "text" to c.text)
            }
            val mappedType = when (q.type) {
                "객관식" -> "MULTI_CHOICE"
                "서술형" -> "ESSAY"
                else -> "MULTI_CHOICE"
            }
            val explanations = parseExplanations(q.choiceExplanationsJson) ?: emptyMap()
            val essayKw = parseEssayKeywords(q.essayKeywordsJson) ?: emptyList()
            val text = q.passage?.trim().orEmpty()
            mapOf(
                "id" to q.id,
                "number" to q.number,
                "type" to mappedType,
                "stem" to (q.stem ?: ""),
                "passageId" to passageTextToId[text],
                "choices" to choices,
                "answerId" to (q.correctAnswer ?: ""),
                "choiceExplanations" to explanations,
                "explanation" to (q.intent ?: ""),
                "modelAnswer" to (q.modelAnswer ?: ""),
                "essayKeywords" to essayKw,
                "essayRubric" to (q.essayRubricJson ?: ""),
                "domain" to q.domain,
                "subDomain" to q.subDomain,
                "points" to q.points,
                // 시험은 시간 가감 없음 (씨앗 보상은 응시 시 점수 비율 기반 자동 지급)
                "questionType" to null,
                "wrongPattern" to null,
                "boxContent" to null,
                "conditionContent" to null
            )
        }
        return objectMapper.writeValueAsString(mapOf(
            "passages" to passagesList,
            "questions" to converted
        ))
    }

    @Transactional
    fun savePayload(testId: String, payloadJson: String) {
        val paper = findPaper(testId)
        val normalizedPayloadJson = if (testId.startsWith("diag_paper_")) {
            normalizeDiagnosticPayloadJson(payloadJson)
        } else {
            payloadJson
        }
        paper.payloadJson = normalizedPayloadJson
        testPaperRepo.save(paper)
        // 진단 시험은 diag_questions / diag_passages 에 양방향 동기화 (편집 즉시 진단 시스템에 반영)
        if (testId.startsWith("diag_paper_")) {
            try {
                applyPayloadToDiagnostic(testId.removePrefix("diag_paper_"), normalizedPayloadJson)
            } catch (e: Exception) {
                // 진단 동기화 실패해도 payload_json은 저장된 상태로 둠
                org.slf4j.LoggerFactory.getLogger(TestService::class.java)
                    .warn("진단 동기화 실패 (paperId=$testId): ${e.message}", e)
            }
        }
    }

    private fun normalizeDiagnosticPayloadJson(payloadJson: String): String {
        val payload: MutableMap<String, Any?> = objectMapper.readValue(
            payloadJson, object : TypeReference<MutableMap<String, Any?>>() {}
        )
        val questions = (payload["questions"] as? List<*>)?.filterIsInstance<Map<String, Any?>>() ?: emptyList()
        val passages = (payload["passages"] as? List<*>)?.filterIsInstance<Map<String, Any?>>() ?: emptyList()

        val byPassage = linkedMapOf<String, MutableList<Pair<Int, Map<String, Any?>>>>()
        questions.forEachIndexed { idx, q ->
            val key = (q["passageId"] as? String)?.takeIf { it.isNotBlank() } ?: "_none"
            byPassage.getOrPut(key) { mutableListOf() }.add(idx to q)
        }
        byPassage.values.forEach { items ->
            items.sortBy { (idx, q) -> (q["number"] as? Number)?.toInt() ?: idx + 1 }
        }

        val passageIds = passages.mapNotNull { it["id"] as? String }
        val order = mutableListOf<String>()
        order.addAll(passageIds)
        byPassage.keys
            .filter { it != "_none" && it !in passageIds }
            .forEach { order.add(it) }
        order.add("_none")

        val normalizedByIndex = mutableMapOf<Int, Map<String, Any?>>()
        var number = 1
        for (key in order) {
            for ((idx, q) in byPassage[key].orEmpty()) {
                val cleaned = q.toMutableMap()
                cleaned.remove("points")
                cleaned["number"] = number++
                normalizedByIndex[idx] = cleaned
            }
        }

        payload["kind"] = payload["kind"] ?: "diagnostic"
        payload["questions"] = questions.mapIndexed { idx, q ->
            normalizedByIndex[idx] ?: q.toMutableMap().also {
                it.remove("points")
                it["number"] = number++
            }
        }
        return objectMapper.writeValueAsString(payload)
    }

    /**
     * 진단 시험을 비주얼 에디터 스키마({questions:[...], passages:[...]})로 변환.
     * 한 지문의 문항들을 묶어 question.passage 에 본문을 그대로 박아 넣음 (일일퀴즈와 동일 구조).
     */
    private fun buildDiagnosticPayload(tier: String): String? {
        val passages = diagPassageRepo.findByTierOrderByLevelAscIdAsc(tier)
        val questions = diagQuestionRepo.findByTierOrderByIdAsc(tier)
        if (passages.isEmpty() && questions.isEmpty()) return null

        val passageMap = passages.associateBy { it.id }
        val passagesPayload = passages.map { p ->
            mapOf(
                "id" to p.id,
                "tier" to p.tier,
                "level" to p.level,
                "genre" to p.genre,
                "text" to p.textMd
            )
        }
        val questionsByPassage = questions.groupBy { it.passageId }
        val orderedQuestions = mutableListOf<com.korfarm.api.diagnostic.DiagQuestionEntity>()
        val seenQuestionIds = mutableSetOf<String>()
        for (p in passages) {
            (questionsByPassage[p.id] ?: emptyList())
                .sortedWith(compareBy<com.korfarm.api.diagnostic.DiagQuestionEntity> { it.orderInPassage }.thenBy { it.id })
                .forEach { q ->
                    orderedQuestions.add(q)
                    seenQuestionIds.add(q.id)
                }
        }
        questions
            .filter { it.id !in seenQuestionIds }
            .sortedWith(
                compareBy<com.korfarm.api.diagnostic.DiagQuestionEntity> { it.passageId }
                    .thenBy { it.orderInPassage }
                    .thenBy { it.id }
            )
            .forEach { orderedQuestions.add(it) }

        val questionsPayload = orderedQuestions.mapIndexed { idx, q ->
            // choices_json: 진단 스키마 [{choice_id, text, vector, error_path}] → 일일퀴즈 스키마 [{id, text}]
            val rawChoices: List<Map<String, Any?>> = try {
                objectMapper.readValue(q.choicesJson, object : TypeReference<List<Map<String, Any?>>>() {})
            } catch (_: Exception) { emptyList() }
            val choices = rawChoices.mapIndexed { i, m ->
                mapOf(
                    "id" to (m["choice_id"] ?: m["id"] ?: ('A' + i).toString()).toString(),
                    "text" to (m["text"] ?: "").toString(),
                    // 진단 전용 메타데이터는 보존 (저장 시 round-trip 가능)
                    "vector" to m["vector"],
                    "errorPath" to m["error_path"]
                )
            }
            val passage = passageMap[q.passageId]?.textMd ?: ""
            val type = when (q.questionType.uppercase()) {
                "OBJECTIVE", "MULTI_CHOICE", "객관식" -> "MULTI_CHOICE"
                "ESSAY", "서술형" -> "ESSAY"
                else -> "MULTI_CHOICE"
            }
            mapOf(
                "id" to q.id,
                "number" to idx + 1,
                "type" to type,
                "stem" to q.stem,
                "passage" to passage,
                "passageId" to q.passageId,
                "choices" to choices,
                "answerId" to (q.correctChoice ?: ""),
                "modelAnswer" to (q.modelAnswer ?: ""),
                // 진단 전용 메타 보존
                "tier" to q.tier,
                "questionType" to q.questionType,
                "boxContent" to q.boxContent,
                "pairId" to q.pairId,
                "orderInPassage" to q.orderInPassage,
                "scoring" to mapOf("correctDeltaSec" to 0, "wrongDeltaSec" to 0)
            )
        }
        return objectMapper.writeValueAsString(
            mapOf(
                "kind" to "diagnostic",
                "tier" to tier,
                "passages" to passagesPayload,
                "questions" to questionsPayload
            )
        )
    }

    /**
     * 비주얼 에디터에서 저장된 payload 를 진단 테이블에 반영 (편집 가능 양방향 동기화).
     * passage/question id 가 일치하면 UPDATE, 신규면 INSERT, 사라진 row 는 그대로 둠 (안전).
     */
    @Transactional
    private fun applyPayloadToDiagnostic(tier: String, payloadJson: String) {
        val payload: Map<String, Any?> = objectMapper.readValue(
            payloadJson, object : TypeReference<Map<String, Any?>>() {}
        )
        val passagesIn = (payload["passages"] as? List<*>)?.filterIsInstance<Map<String, Any?>>() ?: emptyList()
        val questionsIn = (payload["questions"] as? List<*>)?.filterIsInstance<Map<String, Any?>>() ?: emptyList()

        // ── 지문 동기화 ──
        for (p in passagesIn) {
            val id = (p["id"] as? String) ?: continue
            val text = (p["text"] as? String) ?: ""
            val genre = (p["genre"] as? String) ?: "비문학"
            val level = (p["level"] as? Number)?.toInt() ?: 1
            val existing = diagPassageRepo.findById(id).orElse(null)
            if (existing != null) {
                existing.textMd = text
                existing.genre = genre
                existing.level = level
                existing.tier = tier
            } else {
                diagPassageRepo.save(com.korfarm.api.diagnostic.DiagPassageEntity(
                    id = id, tier = tier, level = level, genre = genre, textMd = text
                ))
            }
        }

        // ── 문항 동기화 ──
        for (q in questionsIn) {
            val id = (q["id"] as? String) ?: continue
            val stem = (q["stem"] as? String) ?: ""
            val passageId = (q["passageId"] as? String) ?: ""
            val answerId = (q["answerId"] as? String)?.takeIf { it.isNotBlank() }
            val rawChoices = (q["choices"] as? List<*>)?.filterIsInstance<Map<String, Any?>>() ?: emptyList()
            // 비주얼 에디터 스키마({id,text,vector,errorPath}) → 진단 스키마({choice_id,text,vector,error_path})
            val diagChoices = rawChoices.map { c ->
                val out = mutableMapOf<String, Any?>(
                    "choice_id" to c["id"],
                    "text" to c["text"]
                )
                if (c["vector"] != null) out["vector"] = c["vector"]
                if (c["errorPath"] != null) out["error_path"] = c["errorPath"]
                out
            }
            val choicesJson = objectMapper.writeValueAsString(diagChoices)
            val questionType = (q["questionType"] as? String) ?: when ((q["type"] as? String)?.uppercase()) {
                "ESSAY" -> "ESSAY"
                else -> "OBJECTIVE"
            }
            val orderInPassage = (q["orderInPassage"] as? Number)?.toInt() ?: 1
            val existing = diagQuestionRepo.findById(id).orElse(null)
            if (existing != null) {
                existing.stem = stem
                existing.passageId = passageId
                existing.tier = tier
                existing.questionType = questionType
                existing.choicesJson = choicesJson
                existing.correctChoice = answerId
                existing.modelAnswer = (q["modelAnswer"] as? String)?.takeIf { it.isNotBlank() }
                existing.boxContent = q["boxContent"] as? String
                existing.pairId = q["pairId"] as? String
                existing.orderInPassage = orderInPassage
            } else {
                diagQuestionRepo.save(com.korfarm.api.diagnostic.DiagQuestionEntity(
                    id = id,
                    passageId = passageId,
                    tier = tier,
                    questionType = questionType,
                    stem = stem,
                    boxContent = q["boxContent"] as? String,
                    correctChoice = answerId,
                    choicesJson = choicesJson,
                    modelAnswer = (q["modelAnswer"] as? String)?.takeIf { it.isNotBlank() },
                    pairId = q["pairId"] as? String,
                    orderInPassage = orderInPassage
                ))
            }
        }
    }

    /**
     * 진단 시험 성적표 — diag_sessions / diag_responses 에서 변환.
     * 종류별 통합 어드민 페이지가 학생 성적표 모달을 띄울 때 호출됨.
     */
    @Transactional(readOnly = true)
    fun diagnosticReport(testId: String, userId: String): TestReportResponse {
        val tier = testId.removePrefix("diag_paper_")
        val paper = findPaper(testId)

        // 가장 최근 completed 세션 사용
        val sessions = diagSessionRepo.findByUserIdAndTierOrderByStartedAtDesc(userId, tier)
            .filter { it.status == "completed" }
        val session = sessions.firstOrNull()
            ?: throw ApiException("NOT_SUBMITTED", "아직 제출하지 않았습니다.", HttpStatus.NOT_FOUND)

        val responses = diagResponseRepo.findBySessionIdOrderByResponseOrderAsc(session.id)
        val tierQuestions = diagQuestionRepo.findByTierOrderByIdAsc(tier)
        val questionMap = tierQuestions.associateBy { it.id }
        val questionNumberMap = tierQuestions.withIndex().associate { (idx, q) -> q.id to (idx + 1) }
        val passageMap = diagPassageRepo.findByTierOrderByLevelAscIdAsc(tier).associateBy { it.id }

        val details = responses.mapNotNull { r ->
            val q = questionMap[r.questionId] ?: return@mapNotNull null
            val number = questionNumberMap[r.questionId] ?: 0
            val rawChoices: List<Map<String, Any?>> = try {
                objectMapper.readValue(q.choicesJson, object : TypeReference<List<Map<String, Any?>>>() {})
            } catch (_: Exception) { emptyList() }
            // 선택지 텍스트 매핑 (id 일치)
            val myAnswerText = rawChoices.firstOrNull {
                ((it["choice_id"] ?: it["id"]) as? String) == r.selectedChoice
            }?.get("text") as? String
            val correctText = rawChoices.firstOrNull {
                ((it["choice_id"] ?: it["id"]) as? String) == q.correctChoice
            }?.get("text") as? String
            QuestionResult(
                questionNumber = number,
                type = if (q.questionType.equals("ESSAY", ignoreCase = true) || q.questionType == "서술형") "서술형" else "객관식",
                domain = null,
                passage = passageMap[q.passageId]?.textMd,
                myAnswer = (r.selectedChoice ?: "") + (myAnswerText?.let { " — $it" } ?: ""),
                correctAnswer = (q.correctChoice ?: q.modelAnswer ?: "") + (correctText?.let { " — $it" } ?: ""),
                isCorrect = r.isCorrect,
                points = 1,
                earnedPoints = if (r.isCorrect) 1 else 0,
                choiceExplanation = null,
                intent = null
            )
        }

        // 영역별 = 10대 역량 (scoresJson + maxScoresJson)
        val scoresMap: Map<String, Any?> = session.scoresJson?.let {
            try { objectMapper.readValue(it, object : TypeReference<Map<String, Any?>>() {}) } catch (_: Exception) { emptyMap() }
        } ?: emptyMap()
        val maxMap: Map<String, Any?> = session.maxScoresJson?.let {
            try { objectMapper.readValue(it, object : TypeReference<Map<String, Any?>>() {}) } catch (_: Exception) { emptyMap() }
        } ?: emptyMap()
        val domainScores = scoresMap.keys.associate { key ->
            val sc = (scoresMap[key] as? Number)?.toInt() ?: 0
            val mx = (maxMap[key] as? Number)?.toInt() ?: 0
            // 정답/총수: 응답 기준이 아니라 가중치 기준이라 근사치 — 점수 비율로 표시
            val correct = if (mx > 0) ((sc.toDouble() / mx) * 10).toInt().coerceAtLeast(0) else 0
            key to DomainScore(score = sc, maxScore = mx, correct = correct, total = 10)
        }

        // 정답률 = 정답수 / 응답수 (빈답안 제외) — 2026-05-17 통일
        val answeredCount = session.answeredCount.coerceAtLeast(1)
        val accuracy = (session.correctCount.toDouble() / answeredCount) * 100.0
        val totalQ = responses.size.coerceAtLeast(session.answeredCount).coerceAtLeast(1)

        return TestReportResponse(
            testId = paper.id,
            testTitle = paper.title,
            totalQuestions = paper.totalQuestions.takeIf { it > 0 } ?: totalQ,
            totalPoints = paper.totalPoints.takeIf { it > 0 } ?: 100,
            score = session.rawTci?.toInt() ?: session.correctCount,
            correctCount = session.correctCount,
            accuracy = Math.round(accuracy * 10.0) / 10.0,
            submittedAt = session.completedAt ?: session.startedAt,
            details = details,
            domainScores = domainScores
        )
    }

    /**
     * 진단 시험 오답 노트.
     */
    @Transactional(readOnly = true)
    fun diagnosticWrongNote(testId: String, userId: String): WrongNoteResponse {
        val tier = testId.removePrefix("diag_paper_")
        val paper = findPaper(testId)

        val sessions = diagSessionRepo.findByUserIdAndTierOrderByStartedAtDesc(userId, tier)
            .filter { it.status == "completed" }
        val session = sessions.firstOrNull()
            ?: throw ApiException("NOT_SUBMITTED", "아직 제출하지 않았습니다.", HttpStatus.NOT_FOUND)

        val responses = diagResponseRepo.findBySessionIdOrderByResponseOrderAsc(session.id)
        val tierQuestions = diagQuestionRepo.findByTierOrderByIdAsc(tier)
        val questionMap = tierQuestions.associateBy { it.id }
        val questionNumberMap = tierQuestions.withIndex().associate { (idx, q) -> q.id to (idx + 1) }
        val passageMap = diagPassageRepo.findByTierOrderByLevelAscIdAsc(tier).associateBy { it.id }

        val wrongItems = responses.filter { !it.isCorrect }.mapNotNull { r ->
            val q = questionMap[r.questionId] ?: return@mapNotNull null
            val number = questionNumberMap[r.questionId] ?: 0
            val rawChoices: List<Map<String, Any?>> = try {
                objectMapper.readValue(q.choicesJson, object : TypeReference<List<Map<String, Any?>>>() {})
            } catch (_: Exception) { emptyList() }
            val myChoice = rawChoices.firstOrNull {
                ((it["choice_id"] ?: it["id"]) as? String) == r.selectedChoice
            }
            val correctChoice = rawChoices.firstOrNull {
                ((it["choice_id"] ?: it["id"]) as? String) == q.correctChoice
            }
            val myAnswerText = (myChoice?.get("text") as? String) ?: ""
            val correctAnswerText = (correctChoice?.get("text") as? String) ?: q.modelAnswer ?: ""
            val errorPath = (myChoice?.get("error_path") as? String) ?: ""
            val feedback = buildString {
                append("문제: ")
                appendLine(q.stem)
                append("내가 고른 답: ")
                appendLine("${r.selectedChoice ?: "-"}${if (myAnswerText.isNotBlank()) " — $myAnswerText" else ""}")
                if (errorPath.isNotBlank()) {
                    append("오답 패턴: ")
                    appendLine(errorPath)
                }
                append("정답: ")
                appendLine("${q.correctChoice ?: "-"}${if (correctAnswerText.isNotBlank()) " — $correctAnswerText" else ""}")
            }
            WrongNoteItem(
                questionNumber = number,
                type = if (q.questionType.equals("ESSAY", ignoreCase = true) || q.questionType == "서술형") "서술형" else "객관식",
                domain = null,
                passage = passageMap[q.passageId]?.textMd,
                myAnswer = "${r.selectedChoice ?: ""}${if (myAnswerText.isNotBlank()) " — $myAnswerText" else ""}",
                correctAnswer = "${q.correctChoice ?: ""}${if (correctAnswerText.isNotBlank()) " — $correctAnswerText" else ""}",
                points = 1,
                intent = null,
                feedback = feedback
            )
        }

        return WrongNoteResponse(
            testId = paper.id,
            testTitle = paper.title,
            wrongItems = wrongItems
        )
    }

    // ─── Student: report (성적표) ───
    @Transactional(readOnly = true)
    fun getReport(testId: String, userId: String): TestReportResponse {
        // 진단 시험은 diag_sessions/diag_responses 기반
        if (testId.startsWith("diag_paper_")) return diagnosticReport(testId, userId)

        val paper = findPaper(testId)
        val sub = submissionRepo.findFirstByTestIdAndUserIdOrderByAttemptNoDesc(testId, userId)
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

        // 정답률 = 정답수 / 응답수 (빈답안 제외) — 사용자 명시 2026-05-17
        val answeredCount = answers.values.count { it.isNotBlank() }
        val accuracy = if (answeredCount > 0) (sub.correctCount.toDouble() / answeredCount) * 100.0 else 0.0

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
        // 진단 시험은 diag_responses 의 incorrect 응답에서 오답 추출
        if (testId.startsWith("diag_paper_")) return diagnosticWrongNote(testId, userId)

        val paper = findPaper(testId)
        val sub = submissionRepo.findFirstByTestIdAndUserIdOrderByAttemptNoDesc(testId, userId)
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

    /**
     * 진단 시험 문항 목록 (관리자용 — 옛 흐름 호환).
     * diag_questions 를 TestQuestionView 형태로 변환.
     */
    @Transactional(readOnly = true)
    fun diagnosticQuestions(testId: String): List<TestQuestionView> {
        val tier = testId.removePrefix("diag_paper_")
        val questions = diagQuestionRepo.findByTierOrderByIdAsc(tier)
        val passages = diagPassageRepo.findByTierOrderByLevelAscIdAsc(tier).associateBy { it.id }
        return questions.mapIndexed { idx, q ->
            val number = idx + 1
            val rawChoices: List<Map<String, Any?>> = try {
                objectMapper.readValue(q.choicesJson, object : TypeReference<List<Map<String, Any?>>>() {})
            } catch (_: Exception) { emptyList() }
            val choices = rawChoices.mapIndexed { i, m ->
                ChoiceItem(
                    id = ((m["choice_id"] ?: m["id"]) as? String) ?: ('A' + i).toString(),
                    text = (m["text"] as? String) ?: ""
                )
            }
            val explanations = rawChoices.mapNotNull { m ->
                val cid = ((m["choice_id"] ?: m["id"]) as? String) ?: return@mapNotNull null
                val ep = (m["error_path"] as? String) ?: return@mapNotNull null
                cid to ep
            }.toMap()
            val mappedType = if (q.questionType.equals("ESSAY", ignoreCase = true) || q.questionType == "서술형")
                "서술형" else "객관식"
            TestQuestionView(
                questionId = q.id,
                number = number,
                type = mappedType,
                domain = null,
                subDomain = null,
                passage = passages[q.passageId]?.textMd,
                stem = q.stem,
                points = 1,
                correctAnswer = q.correctChoice,
                choices = choices.takeIf { it.isNotEmpty() },
                choiceExplanations = explanations.takeIf { it.isNotEmpty() },
                intent = q.boxContent,
                essayKeywords = null,
                essayRubric = q.gradingCriteriaJson,
                modelAnswer = q.modelAnswer
            )
        }
    }

    /**
     * 진단 시험 응시자 목록 (관리자용).
     * diag_sessions 를 SubmissionSummary 형태로 변환.
     */
    @Transactional(readOnly = true)
    fun diagnosticSubmissions(testId: String): List<SubmissionSummary> {
        val tier = testId.removePrefix("diag_paper_")
        val sessions = diagSessionRepo.findByTierAndStatus(tier, "completed")
        if (sessions.isEmpty()) return emptyList()
        val userMap = userRepository.findAllById(sessions.map { it.userId }).associateBy { it.id }
        return sessions.sortedByDescending { it.completedAt ?: it.startedAt }.map { s ->
            val totalQ = s.answeredCount.coerceAtLeast(1)
            val accuracy = (s.correctCount.toDouble() / totalQ) * 100.0
            SubmissionSummary(
                userId = s.userId,
                userName = userMap[s.userId]?.name,
                score = s.rawTci?.toInt() ?: s.correctCount,
                correctCount = s.correctCount,
                accuracy = Math.round(accuracy * 10.0) / 10.0,
                submittedBy = null,
                submittedAt = s.completedAt ?: s.startedAt
            )
        }
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
            // 정답률 = 정답수 / 응답수 (빈답안 제외) — 2026-05-17 통일
            val sAnswers = parseAnswers(s.answersJson)
            val sAnswered = sAnswers.values.count { it.isNotBlank() }
            val accuracy = if (sAnswered > 0) (s.correctCount.toDouble() / sAnswered) * 100.0 else 0.0
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
        // ORG_ADMIN이면 자동으로 소속 기관 ID 설정. 본사(HQ_ADMIN)면 지정 값 또는 본사 표준 ID(org_hq).
        // test_papers.org_id 는 NOT NULL 이므로 null 대신 "org_hq" 사용.
        val orgId = if (SecurityUtils.hasAnyRole("HQ_ADMIN")) {
            req.orgId ?: "org_hq"
        } else {
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

    // ─── Admin: set ANSWER PDF file id (진단·기타 테스트 전용 정답·해설 PDF) ───
    @Transactional
    fun setAnswerPdfFileId(testId: String, fileId: String?): TestPaperEntity {
        val paper = findPaper(testId)
        paper.answerPdfFileId = fileId
        return testPaperRepo.save(paper)
    }

    /**
     * 학생이 해당 시험에 응시 완료했는지 검증 — 정답·해설 PDF 접근용.
     * 진단: diag_sessions 의 completed 세션 존재 → OK.
     * 기타·챕터: test_submissions 의 graded 또는 submitted 상태 row 존재 → OK.
     */
    @Transactional(readOnly = true)
    fun hasStudentSubmitted(testId: String, userId: String): Boolean {
        if (testId.startsWith("diag_paper_")) {
            val tier = testId.removePrefix("diag_paper_")
            return diagSessionRepo.findByUserIdAndTierOrderByStartedAtDesc(userId, tier)
                .any { it.status == "completed" }
        }
        val sub = submissionRepo.findFirstByTestIdAndUserIdOrderByAttemptNoDesc(testId, userId) ?: return false
        return sub.status == "graded" || sub.status == "submitted"
    }

    // ─── Admin: get questions ───
    @Transactional(readOnly = true)
    fun getQuestions(testId: String): List<TestQuestionView> {
        if (testId.startsWith("diag_paper_")) return diagnosticQuestions(testId)

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
        if (testId.startsWith("diag_paper_")) {
            throw ApiException(
                "UNSUPPORTED",
                "진단 시험은 일괄 문항 입력을 지원하지 않습니다. 비주얼 에디터(/edit)로 편집해 주세요.",
                HttpStatus.BAD_REQUEST
            )
        }
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

        // 권한 정책 (2026-05-13 사용자 명시):
        //   - HQ_ADMIN: 본사 시험 + 모든 기관 시험
        //   - ORG_ADMIN: 본사 시험 + 자기 기관 시험만 (타 기관 시험 차단)
        if (!SecurityUtils.hasAnyRole("HQ_ADMIN")) {
            val callerOrgIds = orgMembershipRepository.findByUserIdAndStatus(callerUserId, "active").map { it.orgId }
            papers = papers.filter {
                it.orgId == null || it.orgId == "org_hq" || callerOrgIds.contains(it.orgId)
            }
        }

        val orgIds = papers.mapNotNull { it.orgId }.distinct()
        val orgMap = if (orgIds.isNotEmpty()) orgRepository.findAllById(orgIds).associateBy { it.id } else emptyMap()
        // 종류별 응시 카운트 집계 — 한 번에 모두 조회 후 메모리에서 group
        val paperIds = papers.map { it.id }
        // 챕터·기타 응시: test_submissions (graded). pro_test_sessions 는 응시 시작 세션 마스터이지 채점 결과 row 가 아니라 카운트 기준에 부적합.
        val subCountByPaper: Map<String, Int> = if (paperIds.isNotEmpty()) {
            submissionRepo.findByTestIdIn(paperIds)
                .filter { it.status == "graded" }
                .groupingBy { it.testId }
                .eachCount()
        } else emptyMap()
        // 진단 응시: diag_sessions (tier 매핑) — diag_paper_<tier> 형태
        val diagCountByTier: Map<String, Int> = diagSessionRepo
            .findByStatusOrderByStartedAtDesc("completed")
            .groupingBy { it.tier }
            .eachCount()
        return papers.map { p ->
            val kind = resolveKind(p)
            val subCount = when (kind) {
                "diagnostic" -> {
                    val tier = p.id.removePrefix("diag_paper_")
                    diagCountByTier[tier] ?: 0
                }
                else -> subCountByPaper[p.id] ?: 0
            }
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
                pdfFileId = p.pdfFileId,
                answerPdfFileId = p.answerPdfFileId,
                createdAt = p.createdAt,
                kind = kind
            )
        }
    }

    // ─── Admin: submission list ───
    @Transactional(readOnly = true)
    fun getSubmissions(testId: String): List<SubmissionSummary> {
        if (testId.startsWith("diag_paper_")) return diagnosticSubmissions(testId)

        val paper = findPaper(testId)
        val subs = submissionRepo.findByTestId(testId)
        val userMap = userRepository.findAllById(subs.map { it.userId }).associateBy { it.id }
        return subs.sortedByDescending { it.createdAt }.map { s ->
            // 정답률 = 정답수 / 응답수 (빈답안 제외) — 2026-05-17 통일
            val sAnswers = parseAnswers(s.answersJson)
            val sAnswered = sAnswers.values.count { it.isNotBlank() }
            val accuracy = if (sAnswered > 0) (s.correctCount.toDouble() / sAnswered) * 100.0 else 0.0
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
        // 본사 시험은 orgId == null 또는 "org_hq" (test_papers.org_id NOT NULL 인 환경 호환)
        val isHqPaper = paper.orgId == null || paper.orgId == "org_hq"

        // STUDENT 역할 멤버십만 필터링
        val studentMemberships = if (!isHqPaper) {
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
        // 기관·수강반 정보 조회 (어드민 OMR 입력 페이지의 다단 필터링용)
        val orgMembershipsByUser = studentMemberships
            .filter { it.role == "STUDENT" }
            .groupBy { it.userId }
        val orgIdsAll = orgMembershipsByUser.values.flatten().map { it.orgId }.distinct()
        val orgNameMap = if (orgIdsAll.isNotEmpty()) orgRepository.findAllById(orgIdsAll).associate { it.id to it.name } else emptyMap()
        val classMembershipsByUser = classMembershipRepository.findAll()
            .filter { it.status == "active" && it.userId in studentUserIds }
            .groupBy { it.userId }
        val classMap = classRepository.findAll().associateBy { it.id }
        return studentUserIds.mapNotNull { uid ->
            val u = users[uid] ?: return@mapNotNull null
            val sub = subs[uid]
            val firstOrg = orgMembershipsByUser[uid]?.firstOrNull()
            val userClasses = classMembershipsByUser[uid] ?: emptyList()
            StudentForTest(
                userId = u.id,
                name = u.name ?: u.email,
                orgId = firstOrg?.orgId,
                orgName = firstOrg?.orgId?.let { orgNameMap[it] },
                classIds = userClasses.map { it.classId },
                classNames = userClasses.mapNotNull { classMap[it.classId]?.name },
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
        if (paper.orgId == null || paper.orgId == "org_hq") return // 본사 시험은 모든 관리자 접근 가능
        val callerOrgIds = orgMembershipRepository.findByUserIdAndStatus(callerUserId, "active").map { it.orgId }
        if (!callerOrgIds.contains(paper.orgId)) {
            throw ApiException("FORBIDDEN", "다른 기관의 시험에 접근할 수 없습니다.", HttpStatus.FORBIDDEN)
        }
    }

    /**
     * 관리자가 시험을 **편집**(수정·삭제·문항 변경·PDF 생성·AI 분석 등) 할 수 있는지 검증.
     * 본사 시험: HQ_ADMIN 만 편집 가능 (ORG_ADMIN 차단).
     * 기관 시험: 해당 기관 ORG_ADMIN 또는 HQ_ADMIN 만 편집 가능.
     * (조회 전용 verifyAdminTestAccess 와 분리 — 2026-05-16 회귀 fix)
     */
    fun verifyAdminTestEditAccess(testId: String, callerUserId: String) {
        if (SecurityUtils.hasAnyRole("HQ_ADMIN")) return
        val paper = findPaper(testId)
        if (paper.orgId == null || paper.orgId == "org_hq") {
            // 본사 시험: ORG_ADMIN 편집 차단
            throw ApiException(
                "FORBIDDEN",
                "본사에서 관리하는 시험은 편집할 수 없습니다. 통계만 조회 가능합니다.",
                HttpStatus.FORBIDDEN
            )
        }
        val callerOrgIds = orgMembershipRepository.findByUserIdAndStatus(callerUserId, "active").map { it.orgId }
        if (!callerOrgIds.contains(paper.orgId)) {
            throw ApiException("FORBIDDEN", "다른 기관의 시험을 편집할 수 없습니다.", HttpStatus.FORBIDDEN)
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
        return try {
            objectMapper.readValue(json, object : TypeReference<List<ChoiceItem>>() {})
        } catch (_: Exception) {
            // 진단 등 다른 스키마({choice_id, text, vector, error_path}) → loose 변환
            try {
                val raw: List<Map<String, Any?>> = objectMapper.readValue(
                    json, object : TypeReference<List<Map<String, Any?>>>() {}
                )
                raw.mapIndexed { i, m ->
                    val id = (m["id"] ?: m["choice_id"] ?: ('A' + i).toString()).toString()
                    val text = (m["text"] ?: "").toString()
                    ChoiceItem(id = id, text = text)
                }
            } catch (_: Exception) { null }
        }
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

    // ─── 다중 응시 — 이력 조회 ───
    // 한 학생의 한 시험에 대한 모든 응시 이력 (최신순). 어드민 OMR 일괄 입력 후 이력 화면용.
    @Transactional(readOnly = true)
    fun listAttempts(testId: String, userId: String): List<Map<String, Any?>> {
        val attempts = submissionRepo.findByTestIdAndUserIdOrderByAttemptNoDesc(testId, userId)
        return attempts.map { s ->
            mapOf(
                "id" to s.id,
                "attemptNo" to s.attemptNo,
                "attemptedAt" to (s.attemptedAt ?: s.createdAt),
                "submittedBy" to s.submittedBy,
                "score" to s.score,
                "correctCount" to s.correctCount,
                "createdAt" to s.createdAt,
            )
        }
    }

    // 어드민 OMR 일괄 — 학생 1인 1테스트 응시 처리 (재사용 진입점)
    // submitOmr 와 동일하지만 응시 일자 명시. submittedBy 는 호출자(adminId).
    @Transactional
    fun adminOfflineOmrSubmit(
        testId: String,
        userId: String,
        adminId: String,
        answers: Map<String, String>,
        attemptedAt: LocalDateTime?,
    ): TestSubmissionEntity {
        return submitOmr(testId, userId, adminId, answers, attemptedAt)
    }
}
