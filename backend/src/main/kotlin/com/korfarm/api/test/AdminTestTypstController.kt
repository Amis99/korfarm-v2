package com.korfarm.api.test

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.security.SecurityUtils
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*

/**
 * 시험지 Typst 디자인 어드민 API.
 *  GET  /v1/admin/test-papers/{id}/typst?type=paper|answer  → 소스 + 컴파일 결과 메타
 *  PUT  /v1/admin/test-papers/{id}/typst?type=...           → 소스 저장
 *  POST /v1/admin/test-papers/{id}/typst/auto-fill?type=... → payload → typst 자동 생성
 *  POST /v1/admin/test-papers/{id}/typst/compile?type=...   → PDF 컴파일 (응답 body=PDF)
 */
@RestController
@RequestMapping("/v1/admin/test-papers/{testId}/typst")
class AdminTestTypstController(
    private val testService: TestService,
    private val typstBuilder: TypstBuilder,
    private val typstCompiler: TypstCompileService,
    private val testPaperRepo: TestPaperRepo
) {
    private fun requireAdmin() = AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
    private fun current() = SecurityUtils.currentUserId()
        ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)

    private fun getSource(paper: TestPaperEntity, type: String): String? =
        if (type == "answer") paper.answerTypstSource else paper.typstSource

    private fun setSource(paper: TestPaperEntity, type: String, source: String?) {
        if (type == "answer") paper.answerTypstSource = source else paper.typstSource = source
    }

    @GetMapping
    fun getSource(
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
            "source" to getSource(paper, type),
            "title" to paper.title
        ))
    }

    @PutMapping
    @Transactional
    fun saveSource(
        @PathVariable testId: String,
        @RequestParam(defaultValue = "paper") type: String,
        @RequestBody body: Map<String, Any?>
    ): ApiResponse<Map<String, String>> {
        requireAdmin()
        testService.verifyAdminTestAccess(testId, current())
        val paper = testPaperRepo.findById(testId).orElseThrow {
            ApiException("NOT_FOUND", "test not found", HttpStatus.NOT_FOUND)
        }
        val source = body["source"] as? String
        setSource(paper, type, source)
        testPaperRepo.save(paper)
        return ApiResponse(success = true, data = mapOf("status" to "saved", "type" to type))
    }

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
        val source = if (type == "answer") typstBuilder.buildAnswer(paper) else typstBuilder.buildPaper(paper)
        setSource(paper, type, source)
        testPaperRepo.save(paper)
        return ApiResponse(success = true, data = mapOf("type" to type, "source" to source))
    }

    /**
     * 현재 저장된 typst 소스를 컴파일해 PDF 응답.
     * body 에 source 가 같이 오면 그것을 우선 사용 (편집 중 미리보기).
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
        val source = (body?.get("source") as? String)?.takeIf { it.isNotBlank() }
            ?: getSource(paper, type)
            ?: throw ApiException("BAD_REQUEST", "typst 소스가 없습니다. 자동 채우기를 먼저 실행해주세요.", HttpStatus.BAD_REQUEST)

        val pdf = try {
            typstCompiler.compileToPdf(source)
        } catch (e: Exception) {
            throw ApiException("COMPILE_ERROR", e.message ?: "컴파일 실패", HttpStatus.UNPROCESSABLE_ENTITY)
        }
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_PDF
        headers.set(HttpHeaders.CONTENT_DISPOSITION,
            """inline; filename="test_${testId}_${type}.pdf"""")
        headers.set(HttpHeaders.CACHE_CONTROL, "no-store")
        return ResponseEntity.ok().headers(headers).body(pdf)
    }
}
