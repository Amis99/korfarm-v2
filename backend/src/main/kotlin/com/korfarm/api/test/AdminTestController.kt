package com.korfarm.api.test

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.files.FileService
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.security.SecurityUtils
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/admin/test-papers")
class AdminTestController(
    private val testService: TestService,
    private val testStatisticsService: TestStatisticsService,
    private val testPdfService: TestPdfService,
    private val fileService: FileService,
    private val objectMapper: com.fasterxml.jackson.databind.ObjectMapper,
    private val testAnalysisService: com.korfarm.api.aigen.TestAnalysisService,
    private val grapefruitService: com.korfarm.api.grapefruit.GrapefruitService,
) {
    private fun requireAdmin() {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
    }

    private fun currentUser(): String =
        SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)

    @GetMapping
    fun list(): ApiResponse<List<TestPaperSummary>> {
        requireAdmin()
        val data = testService.listAllTests(currentUser())
        return ApiResponse(success = true, data = data)
    }

    @PostMapping
    fun create(@RequestBody request: CreateTestRequest): ApiResponse<Map<String, String>> {
        requireAdmin()
        val entity = testService.createTest(request, currentUser())
        return ApiResponse(success = true, data = mapOf("testId" to entity.id))
    }

    @PutMapping("/{testId}")
    fun update(
        @PathVariable testId: String,
        @RequestBody request: UpdateTestRequest
    ): ApiResponse<Map<String, String>> {
        requireAdmin()
        testService.verifyAdminTestAccess(testId, currentUser())
        val entity = testService.updateTest(testId, request)
        return ApiResponse(success = true, data = mapOf("testId" to entity.id))
    }

    @DeleteMapping("/{testId}")
    fun delete(@PathVariable testId: String): ApiResponse<Map<String, String>> {
        requireAdmin()
        testService.verifyAdminTestAccess(testId, currentUser())
        testService.deleteTest(testId)
        return ApiResponse(success = true, data = mapOf("testId" to testId))
    }

    @PostMapping("/{testId}/pdf")
    fun uploadPdf(
        @PathVariable testId: String,
        @RequestBody body: Map<String, String>
    ): ApiResponse<Map<String, String>> {
        requireAdmin()
        testService.verifyAdminTestAccess(testId, currentUser())
        val fileId = body["fileId"]
            ?: throw ApiException("BAD_REQUEST", "fileId is required", HttpStatus.BAD_REQUEST)
        val entity = testService.setPdfFileId(testId, fileId)
        return ApiResponse(success = true, data = mapOf("testId" to entity.id))
    }

    /**
     * 시험지 PDF + 정답·해설 PDF 자동 생성 (typst CLI).
     *
     * 진단(diag_paper_*) · 기타 테스트 → 학생용(pdf_file_id) + 정답·해설(answer_pdf_file_id) **두 PDF** 생성.
     * 챕터 테스트 (series == "chapter") → 기존 통합 PDF 한 개만 생성 (정책 유지).
     *
     * 학생용 purpose = "test_paper_pdf" (로그인 사용자 누구나 다운로드 OK)
     * 정답·해설 purpose = "test_answer_pdf" (관리자만 / 학생은 별도 검증 엔드포인트 경유)
     */
    @PostMapping("/{testId}/pdf-generate")
    fun generatePdf(@PathVariable testId: String): ApiResponse<Map<String, Any?>> {
        requireAdmin()
        testService.verifyAdminTestAccess(testId, currentUser())
        val paper = testService.getTestPaper(testId)
        val isChapter = paper.series == "chapter"

        val safeTitle = paper.title.replace(Regex("[\\\\/:*?\"<>|]"), "_").take(80).ifBlank { "test_paper" }

        if (isChapter) {
            // 챕터 테스트는 기존 통합 PDF 유지
            val pdfBytes = try {
                testPdfService.generate(paper)
            } catch (e: IllegalStateException) {
                throw ApiException("BAD_REQUEST", e.message ?: "payload 가 비어 있습니다", HttpStatus.BAD_REQUEST)
            } catch (e: Exception) {
                throw ApiException("COMPILE_ERROR", e.message ?: "PDF 생성 실패", HttpStatus.UNPROCESSABLE_ENTITY)
            }
            val fileId = fileService.saveBinary(
                ownerUserId = currentUser(),
                purpose = "test_paper_pdf",
                filename = "${safeTitle}.pdf",
                mime = "application/pdf",
                data = pdfBytes,
            )
            testService.setPdfFileId(testId, fileId)
            return ApiResponse(success = true, data = mapOf(
                "testId" to testId,
                "fileId" to fileId,
                "size" to pdfBytes.size,
                "title" to paper.title,
                "downloadUrl" to "/v1/files/$fileId/download",
                "examFileId" to fileId,
                "examDownloadUrl" to "/v1/files/$fileId/download",
                "answerFileId" to null,
                "answerDownloadUrl" to null,
                "split" to false,
            ))
        }

        // 진단·기타: 학생용 + 정답·해설 두 PDF
        val examBytes = try {
            testPdfService.generateExam(paper)
        } catch (e: IllegalStateException) {
            throw ApiException("BAD_REQUEST", e.message ?: "payload 가 비어 있습니다", HttpStatus.BAD_REQUEST)
        } catch (e: Exception) {
            throw ApiException("COMPILE_ERROR", e.message ?: "PDF 생성 실패", HttpStatus.UNPROCESSABLE_ENTITY)
        }
        val answerBytes = try {
            testPdfService.generateAnswer(paper)
        } catch (e: IllegalStateException) {
            throw ApiException("BAD_REQUEST", e.message ?: "payload 가 비어 있습니다", HttpStatus.BAD_REQUEST)
        } catch (e: Exception) {
            throw ApiException("COMPILE_ERROR", e.message ?: "정답·해설 PDF 생성 실패", HttpStatus.UNPROCESSABLE_ENTITY)
        }

        val examFileId = fileService.saveBinary(
            ownerUserId = currentUser(),
            purpose = "test_paper_pdf",
            filename = "${safeTitle}.pdf",
            mime = "application/pdf",
            data = examBytes,
        )
        val answerFileId = fileService.saveBinary(
            ownerUserId = currentUser(),
            purpose = "test_answer_pdf",
            filename = "${safeTitle}_정답해설.pdf",
            mime = "application/pdf",
            data = answerBytes,
        )
        testService.setPdfFileId(testId, examFileId)
        testService.setAnswerPdfFileId(testId, answerFileId)

        return ApiResponse(success = true, data = mapOf(
            "testId" to testId,
            "fileId" to examFileId,                        // 호환: 기존 클라이언트가 fileId 만 보던 경로 대비
            "size" to examBytes.size,
            "title" to paper.title,
            "downloadUrl" to "/v1/files/$examFileId/download",  // 호환
            "examFileId" to examFileId,
            "examDownloadUrl" to "/v1/files/$examFileId/download",
            "examSize" to examBytes.size,
            "answerFileId" to answerFileId,
            "answerDownloadUrl" to "/v1/files/$answerFileId/download",
            "answerSize" to answerBytes.size,
            "split" to true,
        ))
    }

    @GetMapping("/{testId}")
    fun getTestPaper(@PathVariable testId: String): ApiResponse<TestPaperEntity> {
        requireAdmin()
        testService.verifyAdminTestAccess(testId, currentUser())
        val entity = testService.getTestPaper(testId)
        return ApiResponse(success = true, data = entity)
    }

    @GetMapping("/{testId}/questions")
    fun getQuestions(@PathVariable testId: String): ApiResponse<List<TestQuestionView>> {
        requireAdmin()
        testService.verifyAdminTestAccess(testId, currentUser())
        val data = testService.getQuestions(testId)
        return ApiResponse(success = true, data = data)
    }

    @PostMapping("/{testId}/questions")
    fun setQuestions(
        @PathVariable testId: String,
        @RequestBody request: SetQuestionsRequest
    ): ApiResponse<Map<String, Any>> {
        requireAdmin()
        testService.verifyAdminTestAccess(testId, currentUser())
        testService.setQuestions(testId, request.questions)
        return ApiResponse(success = true, data = mapOf("count" to request.questions.size))
    }

    @GetMapping("/{testId}/submissions")
    fun getSubmissions(@PathVariable testId: String): ApiResponse<List<SubmissionSummary>> {
        requireAdmin()
        testService.verifyAdminTestAccess(testId, currentUser())
        val data = testService.getSubmissions(testId)
        return ApiResponse(success = true, data = data)
    }

    @PostMapping("/{testId}/submit-for-student")
    fun submitForStudent(
        @PathVariable testId: String,
        @RequestBody request: SubmitOmrRequest
    ): ApiResponse<Map<String, Any>> {
        requireAdmin()
        val adminId = currentUser()
        testService.verifyAdminTestAccess(testId, adminId)
        val studentId = request.userId
            ?: throw ApiException("BAD_REQUEST", "userId is required for proxy submission", HttpStatus.BAD_REQUEST)
        val sub = testService.submitOmr(testId, studentId, adminId, request.answers)
        return ApiResponse(
            success = true,
            data = mapOf(
                "submissionId" to sub.id,
                "score" to sub.score,
                "correctCount" to sub.correctCount
            )
        )
    }

    @GetMapping("/{testId}/students")
    fun getStudents(@PathVariable testId: String): ApiResponse<List<StudentForTest>> {
        requireAdmin()
        val userId = currentUser()
        testService.verifyAdminTestAccess(testId, userId)
        val data = testService.getStudentsForTest(testId, userId)
        return ApiResponse(success = true, data = data)
    }

    // 관리자용: 특정 학생의 성적표 조회
    @GetMapping("/{testId}/submissions/{userId}/report")
    fun getStudentReport(
        @PathVariable testId: String,
        @PathVariable userId: String
    ): ApiResponse<TestReportResponse> {
        requireAdmin()
        testService.verifyAdminTestAccess(testId, currentUser())
        val data = testService.getReport(testId, userId)
        return ApiResponse(success = true, data = data)
    }

    // 관리자용: 특정 학생의 오답 노트 조회
    @GetMapping("/{testId}/submissions/{userId}/wrong-note")
    fun getStudentWrongNote(
        @PathVariable testId: String,
        @PathVariable userId: String
    ): ApiResponse<WrongNoteResponse> {
        requireAdmin()
        testService.verifyAdminTestAccess(testId, currentUser())
        val data = testService.getWrongNote(testId, userId)
        return ApiResponse(success = true, data = data)
    }

    // ─── 시험지 통계 (응시 즉시 캐시된 데이터) ───
    @GetMapping("/{testId}/statistics")
    fun getStatistics(@PathVariable testId: String): ApiResponse<TestPaperStatistics> {
        requireAdmin()
        testService.verifyAdminTestAccess(testId, currentUser())
        val data = testStatisticsService.getStatistics(testId)
        return ApiResponse(success = true, data = data)
    }

    // ─── 학생별 응시 상세 (학생 테이블·영역별·틀린 번호) ───
    @GetMapping("/{testId}/students-detail")
    fun getStudentsDetail(@PathVariable testId: String): ApiResponse<List<StudentSubmissionDetail>> {
        requireAdmin()
        testService.verifyAdminTestAccess(testId, currentUser())
        val data = testStatisticsService.getStudentDetails(testId)
        return ApiResponse(success = true, data = data)
    }

    // ─── 문항별 분석 (오답률·선택지 분포·고른 학생·역량 벡터) ───
    @GetMapping("/{testId}/question-analysis")
    fun getQuestionAnalysis(@PathVariable testId: String): ApiResponse<List<QuestionAnalysis>> {
        requireAdmin()
        testService.verifyAdminTestAccess(testId, currentUser())
        val data = testStatisticsService.getQuestionAnalysis(testId)
        return ApiResponse(success = true, data = data)
    }

    // ─── 시험지 비주얼 에디터 payload ───
    // 권한: 본사 시험은 HQ_ADMIN만 편집 가능, 기관 시험은 해당 기관 ORG_ADMIN 또는 HQ_ADMIN
    @GetMapping("/{testId}/payload")
    fun getPayload(@PathVariable testId: String): ApiResponse<Map<String, Any?>> {
        requireAdmin()
        testService.verifyAdminTestAccess(testId, currentUser())
        val raw = testService.getPayload(testId)
        val parsed: Any? = if (raw.isNullOrBlank()) null else
            try { objectMapper.readValue(raw, Any::class.java) } catch (_: Exception) { null }
        return ApiResponse(success = true, data = mapOf("payload" to parsed))
    }

    @PutMapping("/{testId}/payload")
    fun savePayload(
        @PathVariable testId: String,
        @RequestBody body: Map<String, Any?>
    ): ApiResponse<Map<String, String>> {
        requireAdmin()
        testService.verifyAdminTestAccess(testId, currentUser())
        val payload = body["payload"]
        val json = objectMapper.writeValueAsString(payload)
        testService.savePayload(testId, json)
        return ApiResponse(success = true, data = mapOf("status" to "saved"))
    }

    // ─── AI 시험 정보 분석 ──────────────────────────────────────────────
    // 1) charge — 자몹 1자몹 차감 + jobId 발급 (ORG_ADMIN 만 차감, HQ_ADMIN 무료)
    // 2) passage/{id} — 지문 1개 분석 + payload merge·저장
    // 3) question/{id} — 문항 1개 분석 + payload merge·저장
    // 프론트가 모달에서 charge → passages 순회 → questions 순회 호출.
    @PostMapping("/{testId}/ai-analysis/charge")
    fun aiAnalysisCharge(
        @PathVariable testId: String,
        @RequestBody body: Map<String, String>
    ): ApiResponse<Map<String, Any?>> {
        requireAdmin()
        testService.verifyAdminTestAccess(testId, currentUser())
        val isHqAdmin = SecurityUtils.hasAnyRole("HQ_ADMIN")
        val model = testAnalysisService.pickModel(isHqAdmin)
        // 자몹 차감 — HQ_ADMIN 은 spendForCaller 가 자동 무료 처리.
        grapefruitService.spendForCaller("test-analysis-full", memo = "시험 정보 AI 분석 (시험지 $testId)")
        // jobId 는 logging·UI 추적용. 단순 UUID.
        val jobId = "tan_${java.util.UUID.randomUUID().toString().replace("-", "").take(16)}"
        return ApiResponse(success = true, data = mapOf(
            "jobId" to jobId,
            "model" to model,
            "mode" to (body["mode"] ?: "full"),
        ))
    }

    @PostMapping("/{testId}/ai-analysis/passage/{passageId}")
    fun aiAnalysisPassage(
        @PathVariable testId: String,
        @PathVariable passageId: String,
        @RequestBody body: Map<String, String>
    ): ApiResponse<Map<String, Any?>> {
        requireAdmin()
        testService.verifyAdminTestAccess(testId, currentUser())
        val isHqAdmin = SecurityUtils.hasAnyRole("HQ_ADMIN")
        val mode = body["mode"] ?: "full"
        val raw = testService.getPayload(testId)
            ?: throw ApiException("NO_PAYLOAD", "payload 가 비어 있습니다", HttpStatus.BAD_REQUEST)
        @Suppress("UNCHECKED_CAST")
        val payload = objectMapper.readValue(raw, MutableMap::class.java) as MutableMap<String, Any?>
        @Suppress("UNCHECKED_CAST")
        val passages = (payload["passages"] as? MutableList<MutableMap<String, Any?>>)
            ?: throw ApiException("NO_PASSAGES", "지문 목록이 없습니다", HttpStatus.BAD_REQUEST)
        val passage = passages.firstOrNull { it["id"] == passageId }
            ?: throw ApiException("NOT_FOUND", "지문을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        val analysis = testAnalysisService.analyzePassage(currentUser(), testId, isHqAdmin, passage, mode)
        testAnalysisService.mergePassage(passage, analysis, mode)
        testService.savePayload(testId, objectMapper.writeValueAsString(payload))
        // 분류 자동 INSERT
        try { testAnalysisService.applyClassificationsForPassage(passageId, analysis) } catch (e: Exception) {
            org.slf4j.LoggerFactory.getLogger(javaClass).warn("지문 분류 매핑 실패 ({}): {}", passageId, e.message)
        }
        return ApiResponse(success = true, data = mapOf(
            "passageId" to passageId,
            "analysis" to analysis,
        ))
    }

    @PostMapping("/{testId}/ai-analysis/question/{questionId}")
    fun aiAnalysisQuestion(
        @PathVariable testId: String,
        @PathVariable questionId: String,
        @RequestBody body: Map<String, String>
    ): ApiResponse<Map<String, Any?>> {
        requireAdmin()
        testService.verifyAdminTestAccess(testId, currentUser())
        val isHqAdmin = SecurityUtils.hasAnyRole("HQ_ADMIN")
        val mode = body["mode"] ?: "full"
        val raw = testService.getPayload(testId)
            ?: throw ApiException("NO_PAYLOAD", "payload 가 비어 있습니다", HttpStatus.BAD_REQUEST)
        @Suppress("UNCHECKED_CAST")
        val payload = objectMapper.readValue(raw, MutableMap::class.java) as MutableMap<String, Any?>
        @Suppress("UNCHECKED_CAST")
        val questions = (payload["questions"] as? MutableList<MutableMap<String, Any?>>)
            ?: throw ApiException("NO_QUESTIONS", "문항 목록이 없습니다", HttpStatus.BAD_REQUEST)
        val question = questions.firstOrNull { it["id"] == questionId }
            ?: throw ApiException("NOT_FOUND", "문항을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        @Suppress("UNCHECKED_CAST")
        val passages = (payload["passages"] as? List<Map<String, Any?>>) ?: emptyList()
        val passageText = (question["passageId"] as? String)?.let { pid ->
            passages.firstOrNull { it["id"] == pid }?.get("text") as? String
        }
        val analysis = testAnalysisService.analyzeQuestion(
            currentUser(), testId, isHqAdmin, passageText, question, mode
        )
        testAnalysisService.mergeQuestion(question, analysis, mode)
        testService.savePayload(testId, objectMapper.writeValueAsString(payload))
        // 분류 자동 INSERT (단일 호출도 ClassificationPicker 와 동기화)
        try { testAnalysisService.applyClassificationsForQuestion(questionId, analysis) } catch (e: Exception) {
            org.slf4j.LoggerFactory.getLogger(javaClass).warn("문항 분류 매핑 실패 ({}): {}", questionId, e.message)
        }
        return ApiResponse(success = true, data = mapOf(
            "questionId" to questionId,
            "analysis" to analysis,
        ))
    }

    /**
     * 배치 분석 — 지문 1개 + 문항 N개 묶음 또는 독립 문항 4~5개 묶음.
     * 한 번의 Claude 호출로 처리해 토큰 비용 절감 (5~8배).
     *
     * 입력:
     *   { scope: "passage_block"|"questions_solo", mode: "full"|"empty",
     *     passageId?: String,           // passage_block 일 때
     *     questionIds: List<String> }   // 분석할 문항 id 목록 (필수)
     */
    @PostMapping("/{testId}/ai-analysis/batch")
    fun aiAnalysisBatch(
        @PathVariable testId: String,
        @RequestBody body: Map<String, Any?>
    ): ApiResponse<Map<String, Any?>> {
        requireAdmin()
        testService.verifyAdminTestAccess(testId, currentUser())
        val isHqAdmin = SecurityUtils.hasAnyRole("HQ_ADMIN")
        val mode = (body["mode"] as? String) ?: "full"
        val scope = (body["scope"] as? String) ?: "passage_block"
        val passageId = body["passageId"] as? String
        @Suppress("UNCHECKED_CAST")
        val questionIds = (body["questionIds"] as? List<String>) ?: emptyList()
        if (questionIds.isEmpty()) {
            throw ApiException("NO_QUESTIONS", "questionIds 가 비어 있습니다", HttpStatus.BAD_REQUEST)
        }

        val raw = testService.getPayload(testId)
            ?: throw ApiException("NO_PAYLOAD", "payload 가 비어 있습니다", HttpStatus.BAD_REQUEST)
        @Suppress("UNCHECKED_CAST")
        val payload = objectMapper.readValue(raw, MutableMap::class.java) as MutableMap<String, Any?>
        @Suppress("UNCHECKED_CAST")
        val passagesList = (payload["passages"] as? MutableList<MutableMap<String, Any?>>) ?: mutableListOf()
        @Suppress("UNCHECKED_CAST")
        val questionsList = (payload["questions"] as? MutableList<MutableMap<String, Any?>>)
            ?: throw ApiException("NO_QUESTIONS", "문항 목록이 없습니다", HttpStatus.BAD_REQUEST)

        val passage: MutableMap<String, Any?>? = if (scope == "passage_block" && passageId != null) {
            passagesList.firstOrNull { it["id"] == passageId }
                ?: throw ApiException("NOT_FOUND", "지문을 찾을 수 없습니다: $passageId", HttpStatus.NOT_FOUND)
        } else null

        val targetQuestions = questionIds.mapNotNull { qid ->
            questionsList.firstOrNull { it["id"] == qid }
        }
        if (targetQuestions.size != questionIds.size) {
            val missing = questionIds - targetQuestions.mapNotNull { it["id"] as? String }.toSet()
            throw ApiException("NOT_FOUND", "문항을 찾을 수 없습니다: $missing", HttpStatus.NOT_FOUND)
        }

        val analysis = testAnalysisService.analyzeBatch(
            currentUser(), testId, isHqAdmin,
            scope = scope,
            passage = passage,
            questions = targetQuestions,
            mode = mode,
        )

        // payload merge
        @Suppress("UNCHECKED_CAST")
        val passageAnalysis = analysis["passage"] as? Map<String, Any?>
        if (passage != null && passageAnalysis != null) {
            testAnalysisService.mergePassage(passage, passageAnalysis, mode)
        }
        @Suppress("UNCHECKED_CAST")
        val questionAnalyses = (analysis["questions"] as? List<Map<String, Any?>>) ?: emptyList()
        for (qa in questionAnalyses) {
            val qid = qa["id"] as? String ?: continue
            val q = questionsList.firstOrNull { it["id"] == qid } ?: continue
            testAnalysisService.mergeQuestion(q, qa, mode)
        }
        testService.savePayload(testId, objectMapper.writeValueAsString(payload))

        // 분류 자동 INSERT (지문·문항·시험지 셋 모두)
        try {
            if (passageId != null && passageAnalysis != null) {
                testAnalysisService.applyClassificationsForPassage(passageId, passageAnalysis)
            }
            for (qa in questionAnalyses) {
                val qid = qa["id"] as? String ?: continue
                testAnalysisService.applyClassificationsForQuestion(qid, qa)
            }
            // 시험지 전체에 누적 합산
            val passageAnalysesAll = listOfNotNull(passageAnalysis)
            testAnalysisService.applyClassificationsForTestPaper(testId, passageAnalysesAll, questionAnalyses)
        } catch (e: Exception) {
            org.slf4j.LoggerFactory.getLogger(javaClass).warn("배치 분류 매핑 실패 (testId={}): {}", testId, e.message)
        }

        return ApiResponse(success = true, data = mapOf(
            "scope" to scope,
            "passageId" to passageId,
            "questionIds" to questionIds,
            "analysis" to analysis,
        ))
    }
}
