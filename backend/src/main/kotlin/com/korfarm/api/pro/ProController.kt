package com.korfarm.api.pro

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.paid.ContentRepository
import com.korfarm.api.paid.ContentVersionRepository
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
    private val subscriptionService: SubscriptionService,
    private val contentRepository: ContentRepository,
    private val contentVersionRepository: ContentVersionRepository
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

    @GetMapping("/chapters/{chapterId}/answer-key")
    fun answerKey(@PathVariable chapterId: String): ApiResponse<AnswerKeyResponse> {
        val userId = requireUserId()
        subscriptionService.requireActive(userId)

        // 기본 4개 완료 확인
        if (!proModeService.checkAllBaseCompleted(userId, chapterId)) {
            throw ApiException("LOCKED", "기본 학습 4개를 모두 완료해야 모범답안을 볼 수 있습니다.", HttpStatus.FORBIDDEN)
        }

        // answer 아이템의 콘텐츠 조회
        val items = proModeService.listChapterItems(userId, chapterId)
        val answerItem = items.find { it.type == "answer" }
            ?: throw ApiException("NOT_FOUND", "모범답안 아이템이 없습니다.", HttpStatus.NOT_FOUND)

        val contentId = answerItem.contentId
            ?: throw ApiException("NOT_FOUND", "모범답안 콘텐츠가 연결되지 않았습니다.", HttpStatus.NOT_FOUND)

        val content = contentRepository.findById(contentId).orElseThrow {
            ApiException("NOT_FOUND", "콘텐츠를 찾을 수 없습니다.", HttpStatus.NOT_FOUND)
        }
        val version = contentVersionRepository.findTopByContentIdOrderByCreatedAtDesc(contentId)
            ?: throw ApiException("NOT_FOUND", "콘텐츠 버전이 없습니다.", HttpStatus.NOT_FOUND)

        return ApiResponse(success = true, data = AnswerKeyResponse(
            contentId = contentId,
            title = content.title,
            payload = version.contentJson
        ))
    }
}
