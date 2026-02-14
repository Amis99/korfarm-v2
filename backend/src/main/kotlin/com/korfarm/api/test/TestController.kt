package com.korfarm.api.test

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.SecurityUtils
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/test-storage")
class TestController(
    private val testService: TestService,
    private val testPaperRepo: TestPaperRepo
) {
    private fun currentUser(): String =
        SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)

    @GetMapping
    fun list(
        @RequestParam(required = false) levelId: String?,
        @RequestParam(required = false) source: String?
    ): ApiResponse<List<TestPaperSummary>> {
        val data = testService.listTests(currentUser(), levelId, source)
        return ApiResponse(success = true, data = data)
    }

    @GetMapping("/diagnostic")
    fun listDiagnostic(): ApiResponse<List<TestPaperSummary>> {
        val userId = currentUser()
        val data = testService.listDiagnosticTests(userId)
        return ApiResponse(success = true, data = data)
    }

    @GetMapping("/{testId}")
    fun detail(@PathVariable testId: String): ApiResponse<TestPaperDetail> {
        val data = testService.getTestDetail(testId, currentUser())
        return ApiResponse(success = true, data = data)
    }

    @GetMapping("/{testId}/pdf")
    fun pdf(@PathVariable testId: String): ResponseEntity<String> {
        currentUser()
        val paper = testPaperRepo.findById(testId).orElseThrow {
            ApiException("NOT_FOUND", "test not found", HttpStatus.NOT_FOUND)
        }
        if (paper.pdfFileId.isNullOrBlank()) {
            throw ApiException("NO_PDF", "시험지 PDF가 없습니다.", HttpStatus.NOT_FOUND)
        }
        // Return the file ID — the frontend will fetch the actual file via the file service
        val headers = HttpHeaders()
        headers.set("Content-Disposition", "inline")
        headers.set("Cache-Control", "no-store")
        return ResponseEntity.ok()
            .headers(headers)
            .body(paper.pdfFileId)
    }

    @GetMapping("/{testId}/questions")
    fun questions(@PathVariable testId: String): ApiResponse<List<TestQuestionStub>> {
        currentUser()
        val data = testService.getQuestionStubs(testId)
        return ApiResponse(success = true, data = data)
    }

    @PostMapping("/{testId}/submit")
    fun submit(
        @PathVariable testId: String,
        @RequestBody request: SubmitOmrRequest
    ): ApiResponse<Map<String, Any>> {
        val userId = currentUser()
        val sub = testService.submitOmr(testId, userId, userId, request.answers)
        return ApiResponse(
            success = true,
            data = mapOf(
                "submissionId" to sub.id,
                "score" to sub.score,
                "correctCount" to sub.correctCount
            )
        )
    }

    @GetMapping("/{testId}/report")
    fun report(@PathVariable testId: String): ApiResponse<TestReportResponse> {
        val data = testService.getReport(testId, currentUser())
        return ApiResponse(success = true, data = data)
    }

    @GetMapping("/{testId}/wrong-note")
    fun wrongNote(@PathVariable testId: String): ApiResponse<WrongNoteResponse> {
        val data = testService.getWrongNote(testId, currentUser())
        return ApiResponse(success = true, data = data)
    }

    @GetMapping("/history")
    fun history(): ApiResponse<List<TestHistoryItem>> {
        val data = testService.getHistory(currentUser())
        return ApiResponse(success = true, data = data)
    }
}
