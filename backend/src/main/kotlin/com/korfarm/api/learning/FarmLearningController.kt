package com.korfarm.api.learning

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.payment.SubscriptionService
import com.korfarm.api.security.SecurityUtils
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/learning/farm")
class FarmLearningController(
    private val farmLearningService: FarmLearningService,
    private val subscriptionService: SubscriptionService,
    private val farmLearningLogRepository: FarmLearningLogRepository,
) {
    // 무료 학생도 가능한 학습 — 정책: 일일 독해 / 일일 퀴즈만.
    // 농장 학습(VOCAB/GRAMMAR/READING/STUDY_CONTENT/...) 은 PAID 전용.
    // 2026-05-16: 일일 독해가 farm/complete 시 PAYMENT_REQUIRED 로 silent fail 하여
    // log status="STARTED" 로 멈추던 사고 fix.
    private val freeAllowedContentTypes = setOf("DAILY_QUIZ", "DAILY_READING")

    @GetMapping("/history")
    fun history(): ApiResponse<FarmHistoryResponse> {
        val userId = SecurityUtils.currentUserId()
            ?: return ApiResponse(success = true, data = FarmHistoryResponse(logs = emptyList()))
        return ApiResponse(success = true, data = farmLearningService.getHistory(userId))
    }

    @GetMapping("/daily-seed-status")
    fun dailySeedStatus(@RequestParam contentType: String): ApiResponse<DailySeedStatusResponse> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        return ApiResponse(success = true, data = farmLearningService.getDailySeedStatus(userId, contentType))
    }

    @PostMapping("/start")
    fun start(@Valid @RequestBody request: FarmStartRequest): ApiResponse<FarmStartResponse> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        // 일일 독해·일일 퀴즈만 무료 학생 통과. 농장 학습은 PAID 검증.
        if (request.contentType !in freeAllowedContentTypes) {
            subscriptionService.requireActive(userId)
        }
        return ApiResponse(success = true, data = farmLearningService.start(userId, request))
    }

    @PostMapping("/complete")
    fun complete(@Valid @RequestBody request: FarmCompleteRequest): ApiResponse<FarmCompleteResponse> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        // log 의 contentType 으로 분기 — 일일 학습이면 무료 통과
        val log = farmLearningLogRepository.findById(request.logId).orElse(null)
        if (log == null || log.contentType !in freeAllowedContentTypes) {
            subscriptionService.requireActive(userId)
        }
        return ApiResponse(success = true, data = farmLearningService.complete(userId, request))
    }

    @PostMapping("/progress")
    fun progress(@Valid @RequestBody request: FarmProgressRequest): ApiResponse<FarmProgressResponse> {
        val userId = SecurityUtils.currentUserId()
        return ApiResponse(success = true, data = farmLearningService.getProgress(userId, request.contentIds))
    }

}
