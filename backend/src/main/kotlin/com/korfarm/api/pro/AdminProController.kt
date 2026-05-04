package com.korfarm.api.pro

import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.security.SecurityUtils
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/v1/admin/pro")
class AdminProController(
    private val proModeService: ProModeService,
    private val proTestSessionService: ProTestSessionService
) {
    @PostMapping("/chapters")
    fun createChapter(@Valid @RequestBody request: CreateProChapterRequest): ApiResponse<ProChapterEntity> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val chapter = proModeService.createChapter(request)
        return ApiResponse(success = true, data = chapter)
    }

    @PutMapping("/chapters/{id}")
    fun updateChapter(
        @PathVariable id: String,
        @Valid @RequestBody request: UpdateProChapterRequest
    ): ApiResponse<ProChapterEntity> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val chapter = proModeService.updateChapter(id, request)
        return ApiResponse(success = true, data = chapter)
    }

    @GetMapping("/chapters")
    fun listChapters(@RequestParam(required = false) levelId: String?): ApiResponse<List<ProChapterEntity>> {
        // 학습 계획표에서 ORG_ADMIN 도 챕터를 학생에게 배정할 수 있어야 함
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val chapters = proModeService.listAllChapters(levelId)
        return ApiResponse(success = true, data = chapters)
    }

    @PostMapping("/chapters/{id}/items")
    fun setChapterItems(
        @PathVariable id: String,
        @Valid @RequestBody request: SetProChapterItemsRequest
    ): ApiResponse<Map<String, String>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        proModeService.setChapterItems(id, request)
        return ApiResponse(success = true, data = mapOf("status" to "ok"))
    }

    @PostMapping("/chapters/{id}/tests")
    fun registerTest(
        @PathVariable id: String,
        @Valid @RequestBody request: RegisterProChapterTestRequest
    ): ApiResponse<ProChapterTestEntity> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val test = proTestSessionService.registerChapterTest(id, request)
        return ApiResponse(success = true, data = test)
    }

    @GetMapping("/chapters/{id}/content-status")
    fun getContentStatus(@PathVariable id: String): ApiResponse<ChapterContentStatusResponse> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val status = proModeService.getContentStatus(id)
        return ApiResponse(success = true, data = status)
    }

    @GetMapping("/chapters/{id}/answer-content")
    fun getAnswerContent(@PathVariable id: String): ApiResponse<AdminAnswerContentResponse> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val answer = proModeService.getAnswerContent(id)
        return ApiResponse(success = true, data = answer)
    }

    @PutMapping("/chapters/{id}/answer-content")
    fun updateAnswerContent(
        @PathVariable id: String,
        @Valid @RequestBody request: UpdateAnswerContentRequest
    ): ApiResponse<AdminAnswerContentResponse> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val userId = SecurityUtils.currentUserId() ?: "system"
        val result = proModeService.updateAnswerContent(id, request, userId)
        return ApiResponse(success = true, data = result)
    }

    /** 신규 단순화 — 정답·해설 PDF 파일 ID 저장 (또는 제거 fileId=null) */
    @PutMapping("/chapters/{id}/answer-pdf")
    fun setAnswerPdf(
        @PathVariable id: String,
        @RequestBody body: Map<String, String?>
    ): ApiResponse<Map<String, String?>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val fileId = body["fileId"]?.takeIf { it.isNotBlank() }
        proModeService.setAnswerPdfFileId(id, fileId)
        return ApiResponse(success = true, data = mapOf("chapterId" to id, "pdfFileId" to fileId))
    }
}
