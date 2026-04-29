package com.korfarm.api.test

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
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
    private val objectMapper: com.fasterxml.jackson.databind.ObjectMapper,
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
}
