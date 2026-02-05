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
    private val testService: TestService
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
        val data = testService.listAllTests()
        return ApiResponse(success = true, data = data)
    }

    @PostMapping
    fun create(@RequestBody request: CreateTestRequest): ApiResponse<Map<String, String>> {
        requireAdmin()
        val entity = testService.createTest(request)
        return ApiResponse(success = true, data = mapOf("testId" to entity.id))
    }

    @PutMapping("/{testId}")
    fun update(
        @PathVariable testId: String,
        @RequestBody request: UpdateTestRequest
    ): ApiResponse<Map<String, String>> {
        requireAdmin()
        val entity = testService.updateTest(testId, request)
        return ApiResponse(success = true, data = mapOf("testId" to entity.id))
    }

    @DeleteMapping("/{testId}")
    fun delete(@PathVariable testId: String): ApiResponse<Map<String, String>> {
        requireAdmin()
        testService.deleteTest(testId)
        return ApiResponse(success = true, data = mapOf("testId" to testId))
    }

    @PostMapping("/{testId}/pdf")
    fun uploadPdf(
        @PathVariable testId: String,
        @RequestBody body: Map<String, String>
    ): ApiResponse<Map<String, String>> {
        requireAdmin()
        val fileId = body["fileId"]
            ?: throw ApiException("BAD_REQUEST", "fileId is required", HttpStatus.BAD_REQUEST)
        val entity = testService.setPdfFileId(testId, fileId)
        return ApiResponse(success = true, data = mapOf("testId" to entity.id))
    }

    @GetMapping("/{testId}")
    fun getTestPaper(@PathVariable testId: String): ApiResponse<TestPaperEntity> {
        requireAdmin()
        val entity = testService.getTestPaper(testId)
        return ApiResponse(success = true, data = entity)
    }

    @GetMapping("/{testId}/questions")
    fun getQuestions(@PathVariable testId: String): ApiResponse<List<TestQuestionView>> {
        requireAdmin()
        val data = testService.getQuestions(testId)
        return ApiResponse(success = true, data = data)
    }

    @PostMapping("/{testId}/questions")
    fun setQuestions(
        @PathVariable testId: String,
        @RequestBody request: SetQuestionsRequest
    ): ApiResponse<Map<String, Any>> {
        requireAdmin()
        testService.setQuestions(testId, request.questions)
        return ApiResponse(success = true, data = mapOf("count" to request.questions.size))
    }

    @GetMapping("/{testId}/submissions")
    fun getSubmissions(@PathVariable testId: String): ApiResponse<List<SubmissionSummary>> {
        requireAdmin()
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
        val data = testService.getStudentsForTest(testId)
        return ApiResponse(success = true, data = data)
    }
}
