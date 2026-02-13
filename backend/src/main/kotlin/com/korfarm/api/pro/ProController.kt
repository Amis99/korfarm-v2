package com.korfarm.api.pro

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.payment.SubscriptionService
import com.korfarm.api.security.SecurityUtils
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/v1/pro")
class ProController(
    private val proModeService: ProModeService,
    private val proTestSessionService: ProTestSessionService,
    private val subscriptionService: SubscriptionService
) {
    private fun requireUserId(): String {
        return SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "로그인이 필요합니다.", HttpStatus.UNAUTHORIZED)
    }

    @GetMapping("/chapters")
    fun listChapters(): ApiResponse<List<ProChapterSummary>> {
        val userId = requireUserId()
        subscriptionService.requireActive(userId)
        val chapters = proModeService.listChapters(userId)
        return ApiResponse(success = true, data = chapters)
    }

    @GetMapping("/chapters/{chapterId}/items")
    fun listChapterItems(@PathVariable chapterId: String): ApiResponse<List<ProChapterItemView>> {
        val userId = requireUserId()
        subscriptionService.requireActive(userId)
        val items = proModeService.listChapterItems(userId, chapterId)
        return ApiResponse(success = true, data = items)
    }

    @PostMapping("/progress/complete")
    fun completeItem(@Valid @RequestBody request: ProCompleteRequest): ApiResponse<ProCompleteResponse> {
        val userId = requireUserId()
        subscriptionService.requireActive(userId)
        val result = proModeService.completeItem(userId, request)
        return ApiResponse(success = true, data = result)
    }

    @PostMapping("/test/print")
    fun printTest(@Valid @RequestBody request: ProTestPrintRequest): ApiResponse<ProTestPrintResponse> {
        val userId = requireUserId()
        subscriptionService.requireActive(userId)
        val result = proTestSessionService.printTest(userId, request.chapterId)
        return ApiResponse(success = true, data = result)
    }

    @PostMapping("/test/submit")
    fun submitTest(@Valid @RequestBody request: ProTestSubmitRequest): ApiResponse<ProTestSubmitResponse> {
        val userId = requireUserId()
        subscriptionService.requireActive(userId)
        val result = proTestSessionService.submitOmr(userId, request)
        return ApiResponse(success = true, data = result)
    }

    @GetMapping("/chapters/{chapterId}/test-status")
    fun testStatus(@PathVariable chapterId: String): ApiResponse<ProTestStatusResponse> {
        val userId = requireUserId()
        subscriptionService.requireActive(userId)
        val result = proTestSessionService.getTestStatus(userId, chapterId)
        return ApiResponse(success = true, data = result)
    }
}
