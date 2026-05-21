package com.korfarm.api.test

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.files.FileService
import com.korfarm.api.security.SecurityUtils
import org.springframework.core.io.ByteArrayResource
import org.springframework.core.io.Resource
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

@RestController
@RequestMapping("/v1/test-storage")
class TestController(
    private val testService: TestService,
    private val testPaperRepo: TestPaperRepo,
    private val fileService: FileService,
    private val essayGradingService: com.korfarm.api.pro.EssayGradingService,
) {
    private fun currentUser(): String =
        SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)

    private fun requireStudent() {
        if (SecurityUtils.hasAnyRole("PARENT")) {
            throw ApiException("FORBIDDEN", "학부모 계정으로는 시험에 응시할 수 없습니다.", HttpStatus.FORBIDDEN)
        }
    }

    @GetMapping
    fun list(
        @RequestParam(required = false) levelId: String?,
        @RequestParam(required = false) source: String?
    ): ApiResponse<List<TestPaperSummary>> {
        val userId = currentUser()
        // 학부모는 빈 목록 반환
        if (SecurityUtils.hasAnyRole("PARENT")) {
            return ApiResponse(success = true, data = emptyList())
        }
        val data = testService.listTests(userId, levelId, source)
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
        val userId = currentUser()
        requireStudent()
        testService.verifyStudentTestAccess(testId, userId)
        val data = testService.getTestDetail(testId, userId)
        return ApiResponse(success = true, data = data)
    }

    @GetMapping("/{testId}/pdf")
    fun pdf(@PathVariable testId: String): ApiResponse<String> {
        val userId = currentUser()
        requireStudent()
        testService.verifyStudentTestAccess(testId, userId)
        val paper = testPaperRepo.findById(testId).orElseThrow {
            ApiException("NOT_FOUND", "test not found", HttpStatus.NOT_FOUND)
        }
        if (paper.pdfFileId.isNullOrBlank()) {
            throw ApiException("NO_PDF", "시험지 PDF가 없습니다.", HttpStatus.NOT_FOUND)
        }
        // pdfFileId가 http(s) URL이면 그대로, 아니면 file id로 반환 (프론트에서 분기 처리)
        return ApiResponse(success = true, data = paper.pdfFileId!!)
    }

    /**
     * 정답·해설 PDF 다운로드 메타 — 인쇄 버튼 노출 여부 확인용.
     * - 관리자: 항상 가능 (answer_pdf_file_id 가 있을 때만)
     * - 학생: 본인이 해당 시험 제출 완료 시 가능
     */
    @GetMapping("/{testId}/answer-pdf/meta")
    fun answerPdfMeta(@PathVariable testId: String): ApiResponse<Map<String, Any?>> {
        val userId = currentUser()
        val isAdmin = SecurityUtils.hasAnyRole("HQ_ADMIN", "ORG_ADMIN")
        // 관리자는 시험 접근 권한, 학생은 학생 접근 권한으로 검증
        if (isAdmin) testService.verifyAdminTestAccess(testId, userId)
        else testService.verifyStudentTestAccess(testId, userId)
        val paper = testPaperRepo.findById(testId).orElseThrow {
            ApiException("NOT_FOUND", "test not found", HttpStatus.NOT_FOUND)
        }
        val hasFile = !paper.answerPdfFileId.isNullOrBlank()
        val hasSubmitted = testService.hasStudentSubmitted(testId, userId)
        val available = hasFile && (isAdmin || hasSubmitted)
        return ApiResponse(success = true, data = mapOf(
            "available" to available,
            "hasFile" to hasFile,
            "hasSubmitted" to hasSubmitted,
        ))
    }

    /**
     * 정답·해설 PDF 직접 스트리밍 (byte[] 반환).
     * 학생은 본인이 제출 완료한 경우만 통과. 관리자는 항상 통과.
     * file purpose ("test_answer_pdf") 가 broadCommunity 가 아니라서 /v1/files/{id}/download 로는 학생이 받을 수 없음.
     * 이 엔드포인트는 검증을 거친 뒤 FileService.readBytes 로 우회 노출.
     */
    @GetMapping("/{testId}/answer-pdf")
    fun answerPdf(@PathVariable testId: String): ResponseEntity<Resource> {
        val userId = currentUser()
        if (SecurityUtils.hasAnyRole("PARENT")) {
            throw ApiException("FORBIDDEN", "학부모 계정은 정답·해설 PDF 를 다운로드할 수 없습니다.", HttpStatus.FORBIDDEN)
        }
        val isAdmin = SecurityUtils.hasAnyRole("HQ_ADMIN", "ORG_ADMIN")
        if (isAdmin) testService.verifyAdminTestAccess(testId, userId)
        else testService.verifyStudentTestAccess(testId, userId)
        val paper = testPaperRepo.findById(testId).orElseThrow {
            ApiException("NOT_FOUND", "test not found", HttpStatus.NOT_FOUND)
        }
        if (!isAdmin && !testService.hasStudentSubmitted(testId, userId)) {
            throw ApiException("NOT_SUBMITTED", "OMR 제출 후 정답·해설을 다운로드할 수 있습니다.", HttpStatus.FORBIDDEN)
        }
        val fileId = paper.answerPdfFileId
            ?: throw ApiException("NO_PDF", "정답·해설 PDF 가 아직 생성되지 않았습니다.", HttpStatus.NOT_FOUND)
        val bytes = fileService.readBytes(fileId)
            ?: throw ApiException("FILE_NOT_FOUND", "정답·해설 PDF 파일이 존재하지 않습니다.", HttpStatus.NOT_FOUND)
        val safeTitle = paper.title.replace(Regex("[\\\\/:*?\"<>|]"), "_").take(80).ifBlank { "test_paper" }
        val filename = "${safeTitle}_정답해설.pdf"
        val encoded = URLEncoder.encode(filename, StandardCharsets.UTF_8).replace("+", "%20")
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .contentLength(bytes.size.toLong())
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename*=UTF-8''$encoded")
            .body(ByteArrayResource(bytes))
    }

    @GetMapping("/{testId}/questions")
    fun questions(@PathVariable testId: String): ApiResponse<List<TestQuestionStub>> {
        val userId = currentUser()
        requireStudent()
        testService.verifyStudentTestAccess(testId, userId)
        val data = testService.getQuestionStubs(testId)
        return ApiResponse(success = true, data = data)
    }

    // N-20B (2026-05-21) — 학생 응시 세션 시작 / 활성 세션 조회
    @PostMapping("/{testId}/start")
    fun startSession(@PathVariable testId: String): ApiResponse<TestActiveSessionResponse> {
        val userId = currentUser()
        requireStudent()
        val data = testService.startStudentTestSession(testId, userId)
        return ApiResponse(success = true, data = data)
    }

    @GetMapping("/{testId}/active-session")
    fun activeSession(@PathVariable testId: String): ApiResponse<TestActiveSessionResponse?> {
        val userId = currentUser()
        requireStudent()
        val data = testService.getStudentActiveSession(testId, userId)
        return ApiResponse(success = true, data = data)
    }

    @PostMapping("/{testId}/submit")
    fun submit(
        @PathVariable testId: String,
        @RequestBody request: SubmitOmrRequest
    ): ApiResponse<Map<String, Any>> {
        val userId = currentUser()
        requireStudent()
        testService.verifyStudentTestAccess(testId, userId)
        val sub = testService.submitOmr(testId, userId, userId, request.answers)
        // N-26 (2026-05-21) — 기타 테스트도 서술형 grading row + AI(Sonnet) 자동 채점
        try {
            essayGradingService.createGradingsForSubmission(sub.id, testId, userId, request.answers)
            essayGradingService.aiGradeAllEssaysOfSubmission(sub.id)
        } catch (e: Exception) {
            org.slf4j.LoggerFactory.getLogger(TestController::class.java)
                .warn("AI 자동 채점 실패 (submission=${sub.id}): ${e.message}")
        }
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
        val userId = currentUser()
        testService.verifyStudentTestAccess(testId, userId)
        val data = testService.getReport(testId, userId)
        return ApiResponse(success = true, data = data)
    }

    @GetMapping("/{testId}/wrong-note")
    fun wrongNote(@PathVariable testId: String): ApiResponse<WrongNoteResponse> {
        val userId = currentUser()
        testService.verifyStudentTestAccess(testId, userId)
        val data = testService.getWrongNote(testId, userId)
        return ApiResponse(success = true, data = data)
    }

    @GetMapping("/history")
    fun history(): ApiResponse<List<TestHistoryItem>> {
        val data = testService.getHistory(currentUser())
        return ApiResponse(success = true, data = data)
    }
}
