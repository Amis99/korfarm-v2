package com.korfarm.api.pro

import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
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
        AdminGuard.requireAnyRole("HQ_ADMIN")
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
}
