package com.korfarm.api.test

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.files.FileService
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.security.SecurityUtils
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*

/**
 * 시험지 워드프로세서 HTML 어드민 API.
 *  GET  /v1/admin/test-papers/{id}/html?type=paper|answer
 *  PUT  /v1/admin/test-papers/{id}/html?type=...   (body: { html })
 *  POST /v1/admin/test-papers/{id}/html/save-pdf?type=...   (body: { html })
 *      → HTML 저장 + Chrome 컴파일 + 서버 파일 저장 + fileId 응답
 */
@RestController
@RequestMapping("/v1/admin/test-papers/{testId}/html")
class AdminTestHtmlController(
    private val testService: TestService,
    private val testPaperRepo: TestPaperRepo,
    private val htmlToPdf: HtmlToPdfService,
    private val htmlBuilder: HtmlBuilder,
    private val fileService: FileService
) {
    private fun requireAdmin() = AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
    private fun current() = SecurityUtils.currentUserId()
        ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)

    /** test.payload → HTML 자동 생성 + DB 저장. 기존 html 덮어씀 (어드민 확인 후 호출) */
    @PostMapping("/auto-fill")
    @Transactional
    fun autoFill(
        @PathVariable testId: String,
        @RequestParam(defaultValue = "paper") type: String
    ): ApiResponse<Map<String, Any?>> {
        requireAdmin()
        testService.verifyAdminTestAccess(testId, current())
        val paper = testPaperRepo.findById(testId).orElseThrow {
            ApiException("NOT_FOUND", "test not found", HttpStatus.NOT_FOUND)
        }
        val html = if (type == "answer") htmlBuilder.buildAnswer(paper) else htmlBuilder.buildPaper(paper)
        if (type == "answer") paper.answerHtmlContent = html else paper.htmlContent = html
        testPaperRepo.save(paper)
        return ApiResponse(success = true, data = mapOf("type" to type, "html" to html))
    }

    @GetMapping
    fun getHtml(
        @PathVariable testId: String,
        @RequestParam(defaultValue = "paper") type: String
    ): ApiResponse<Map<String, Any?>> {
        requireAdmin()
        testService.verifyAdminTestAccess(testId, current())
        val paper = testPaperRepo.findById(testId).orElseThrow {
            ApiException("NOT_FOUND", "test not found", HttpStatus.NOT_FOUND)
        }
        return ApiResponse(success = true, data = mapOf(
            "type" to type,
            "html" to (if (type == "answer") paper.answerHtmlContent else paper.htmlContent),
            "pdfFileId" to (if (type == "answer") paper.answerHtmlPdfFileId else paper.htmlPdfFileId),
            "title" to paper.title
        ))
    }

    @PutMapping
    @Transactional
    fun saveHtml(
        @PathVariable testId: String,
        @RequestParam(defaultValue = "paper") type: String,
        @RequestBody body: Map<String, Any?>
    ): ApiResponse<Map<String, String>> {
        requireAdmin()
        testService.verifyAdminTestAccess(testId, current())
        val paper = testPaperRepo.findById(testId).orElseThrow {
            ApiException("NOT_FOUND", "test not found", HttpStatus.NOT_FOUND)
        }
        val html = body["html"] as? String
        if (type == "answer") paper.answerHtmlContent = html else paper.htmlContent = html
        testPaperRepo.save(paper)
        return ApiResponse(success = true, data = mapOf("status" to "saved", "type" to type))
    }

    /**
     * HTML 저장 + 즉시 PDF 컴파일 + 서버 파일 저장.
     * 응답에 fileId 와 download URL 반환 → 학습 계획표 등 다른 화면에서 활용.
     */
    @PostMapping("/save-pdf")
    @Transactional
    fun saveAndCompilePdf(
        @PathVariable testId: String,
        @RequestParam(defaultValue = "paper") type: String,
        @RequestBody body: Map<String, Any?>
    ): ApiResponse<Map<String, Any?>> {
        requireAdmin()
        testService.verifyAdminTestAccess(testId, current())
        val paper = testPaperRepo.findById(testId).orElseThrow {
            ApiException("NOT_FOUND", "test not found", HttpStatus.NOT_FOUND)
        }
        val html = (body["html"] as? String)?.takeIf { it.isNotBlank() }
            ?: throw ApiException("BAD_REQUEST", "html 이 비어 있습니다", HttpStatus.BAD_REQUEST)

        // 1) HTML 저장
        if (type == "answer") paper.answerHtmlContent = html else paper.htmlContent = html

        // 2) PDF 컴파일
        val pdfBytes = try {
            htmlToPdf.convert(html)
        } catch (e: Exception) {
            throw ApiException("COMPILE_ERROR", e.message ?: "PDF 변환 실패", HttpStatus.UNPROCESSABLE_ENTITY)
        }

        // 3) 서버 파일 저장
        val filename = if (type == "answer") "${paper.title}_정답해설.pdf" else "${paper.title}.pdf"
        val fileId = fileService.saveBinary(
            ownerUserId = current(),
            purpose = "test_paper_pdf",
            filename = filename,
            mime = "application/pdf",
            data = pdfBytes
        )
        if (type == "answer") paper.answerHtmlPdfFileId = fileId else paper.htmlPdfFileId = fileId
        testPaperRepo.save(paper)

        return ApiResponse(success = true, data = mapOf(
            "type" to type,
            "fileId" to fileId,
            "size" to pdfBytes.size
        ))
    }

    /**
     * 즉시 PDF 응답 (편집 중 미리보기 용).
     * body 에 html 보내면 그것 우선, 없으면 DB 저장된 것.
     */
    @PostMapping("/compile")
    fun compile(
        @PathVariable testId: String,
        @RequestParam(defaultValue = "paper") type: String,
        @RequestBody(required = false) body: Map<String, Any?>?
    ): ResponseEntity<ByteArray> {
        requireAdmin()
        testService.verifyAdminTestAccess(testId, current())
        val paper = testPaperRepo.findById(testId).orElseThrow {
            ApiException("NOT_FOUND", "test not found", HttpStatus.NOT_FOUND)
        }
        val html = (body?.get("html") as? String)?.takeIf { it.isNotBlank() }
            ?: (if (type == "answer") paper.answerHtmlContent else paper.htmlContent)
            ?: throw ApiException("BAD_REQUEST", "HTML 이 없습니다", HttpStatus.BAD_REQUEST)

        val pdf = try {
            htmlToPdf.convert(html)
        } catch (e: Exception) {
            throw ApiException("COMPILE_ERROR", e.message ?: "변환 실패", HttpStatus.UNPROCESSABLE_ENTITY)
        }
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_PDF
        headers.set(HttpHeaders.CONTENT_DISPOSITION, """inline; filename="test_${testId}_${type}.pdf"""")
        headers.set(HttpHeaders.CACHE_CONTROL, "no-store")
        return ResponseEntity.ok().headers(headers).body(pdf)
    }
}
