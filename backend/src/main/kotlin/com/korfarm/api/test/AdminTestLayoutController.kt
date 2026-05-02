package com.korfarm.api.test

import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*

/**
 * 시험지 시각 레이아웃 (디자인 에디터) 어드민 API.
 * - GET  /v1/admin/test-papers/{id}/layout?type=paper|answer  → 현재 레이아웃 (없으면 null)
 * - PUT  /v1/admin/test-papers/{id}/layout?type=paper|answer  → 저장
 * - POST /v1/admin/test-papers/{id}/layout/auto-fill?type=paper|answer  → test.payload → 레이아웃 자동 생성
 *
 * 학생/관리자 인쇄 라우트 (프론트 라우트 — 별도) 가 GET 으로 layout 를 받아 그대로 렌더 + window.print().
 */
@RestController
@RequestMapping("/v1/admin/test-papers/{testId}/layout")
class AdminTestLayoutController(
    private val testService: TestService,
    private val testLayoutService: TestLayoutService,
    private val testPaperRepo: TestPaperRepo,
    private val objectMapper: ObjectMapper,
    private val layoutToTypst: LayoutToTypstConverter,
    private val typstCompiler: TypstCompileService
) {
    private fun requireAdmin() = AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
    private fun current() = com.korfarm.api.security.SecurityUtils.currentUserId()
        ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)

    @GetMapping
    fun getLayout(
        @PathVariable testId: String,
        @RequestParam(defaultValue = "paper") type: String
    ): ApiResponse<Map<String, Any?>> {
        requireAdmin()
        testService.verifyAdminTestAccess(testId, current())
        val paper = testPaperRepo.findById(testId).orElseThrow {
            ApiException("NOT_FOUND", "test not found", HttpStatus.NOT_FOUND)
        }
        val raw = if (type == "answer") paper.answerLayoutJson else paper.layoutJson
        val parsed: Any? = if (raw.isNullOrBlank()) null else
            try { objectMapper.readValue(raw, Any::class.java) } catch (_: Exception) { null }
        return ApiResponse(success = true, data = mapOf("layout" to parsed, "type" to type))
    }

    @PutMapping
    @Transactional
    fun saveLayout(
        @PathVariable testId: String,
        @RequestParam(defaultValue = "paper") type: String,
        @RequestBody body: Map<String, Any?>
    ): ApiResponse<Map<String, String>> {
        requireAdmin()
        testService.verifyAdminTestAccess(testId, current())
        val paper = testPaperRepo.findById(testId).orElseThrow {
            ApiException("NOT_FOUND", "test not found", HttpStatus.NOT_FOUND)
        }
        val layout = body["layout"]
        val json = if (layout == null) null else objectMapper.writeValueAsString(layout)
        if (type == "answer") paper.answerLayoutJson = json else paper.layoutJson = json
        testPaperRepo.save(paper)
        return ApiResponse(success = true, data = mapOf("status" to "saved", "type" to type))
    }

    /**
     * test.payload → 레이아웃 자동 생성. 기존 레이아웃이 있으면 덮어쓰기 (어드민 확인 후 호출).
     */
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
        val layout = if (type == "answer") {
            testLayoutService.buildAnswerLayoutV2(paper)
        } else {
            testLayoutService.buildPaperLayoutV2(paper)
        }
        val json = objectMapper.writeValueAsString(layout)
        if (type == "answer") paper.answerLayoutJson = json else paper.layoutJson = json
        testPaperRepo.save(paper)
        return ApiResponse(success = true, data = mapOf("layout" to layout, "type" to type))
    }

    /**
     * 편집기 layout 을 typst 로 변환·컴파일하여 PDF 응답.
     * body 에 layout 이 있으면 그걸 우선 사용 (편집 중 미리보기), 없으면 DB 의 저장된 layout 사용.
     */
    @PostMapping("/compile")
    fun compileLayout(
        @PathVariable testId: String,
        @RequestParam(defaultValue = "paper") type: String,
        @RequestBody(required = false) body: Map<String, Any?>?
    ): ResponseEntity<ByteArray> {
        requireAdmin()
        testService.verifyAdminTestAccess(testId, current())
        val paper = testPaperRepo.findById(testId).orElseThrow {
            ApiException("NOT_FOUND", "test not found", HttpStatus.NOT_FOUND)
        }
        @Suppress("UNCHECKED_CAST")
        val layout: Map<String, Any?> = (body?.get("layout") as? Map<String, Any?>)
            ?: run {
                val raw = if (type == "answer") paper.answerLayoutJson else paper.layoutJson
                if (raw.isNullOrBlank()) {
                    throw ApiException("BAD_REQUEST", "레이아웃이 없습니다. 자동 채우기를 먼저 실행해주세요.", HttpStatus.BAD_REQUEST)
                }
                @Suppress("UNCHECKED_CAST")
                objectMapper.readValue(raw, Map::class.java) as Map<String, Any?>
            }
        val typstSource = layoutToTypst.convert(layout)
        val pdf = try {
            typstCompiler.compileToPdf(typstSource)
        } catch (e: Exception) {
            throw ApiException("COMPILE_ERROR", e.message ?: "컴파일 실패", HttpStatus.UNPROCESSABLE_ENTITY)
        }
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_PDF
        headers.set(HttpHeaders.CONTENT_DISPOSITION, """inline; filename="test_${testId}_${type}.pdf"""")
        headers.set(HttpHeaders.CACHE_CONTROL, "no-store")
        return ResponseEntity.ok().headers(headers).body(pdf)
    }
}
