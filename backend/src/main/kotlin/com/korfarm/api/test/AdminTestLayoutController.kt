package com.korfarm.api.test

import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import org.springframework.http.HttpStatus
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
    private val objectMapper: ObjectMapper
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
            testLayoutService.buildAnswerLayout(paper)
        } else {
            testLayoutService.buildPaperLayout(paper)
        }
        val json = objectMapper.writeValueAsString(layout)
        if (type == "answer") paper.answerLayoutJson = json else paper.layoutJson = json
        testPaperRepo.save(paper)
        return ApiResponse(success = true, data = mapOf("layout" to layout, "type" to type))
    }
}
