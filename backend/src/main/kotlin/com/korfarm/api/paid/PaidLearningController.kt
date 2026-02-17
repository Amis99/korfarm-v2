package com.korfarm.api.paid

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.contracts.SubmitRequest
import com.korfarm.api.contracts.WritingSubmitRequest
import com.korfarm.api.learning.SubmitResult
import com.korfarm.api.payment.SubscriptionService
import com.korfarm.api.security.SecurityUtils
import com.korfarm.api.system.FeatureFlagService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Deprecated("레거시 컨트롤러 - ProController, FarmLearningController, TestController, WisdomController, EconomyController로 대체됨")
@RestController
@RequestMapping("/v1")
class PaidLearningController(
    private val paidLearningService: PaidLearningService,
    private val subscriptionService: SubscriptionService,
    private val featureFlagService: FeatureFlagService
) {
    @GetMapping("/pro-mode/levels")
    fun proModeLevels(): ApiResponse<List<ProModeLevel>> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        featureFlagService.requireEnabled("feature.paid.pro_mode", userId)
        subscriptionService.requireActive(userId)
        return ApiResponse(success = true, data = paidLearningService.proModeLevels())
    }

    @GetMapping("/pro-mode/chapters/{chapterId}")
    fun proModeChapter(@PathVariable chapterId: String): ApiResponse<ProModeChapter> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        featureFlagService.requireEnabled("feature.paid.pro_mode", userId)
        subscriptionService.requireActive(userId)
        return ApiResponse(success = true, data = paidLearningService.proModeChapter(chapterId))
    }

    @PostMapping("/pro-mode/chapters/{chapterId}/submit")
    fun submitProMode(
        @PathVariable chapterId: String,
        @Valid @RequestBody request: SubmitRequest
    ): ApiResponse<SubmitResult> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        featureFlagService.requireEnabled("feature.paid.pro_mode", userId)
        subscriptionService.requireActive(userId)
        val result = paidLearningService.submitLearning(userId, chapterId, "pro_mode", request)
        return ApiResponse(success = true, data = result)
    }

    @GetMapping("/farm-modes")
    fun farmModes(): ApiResponse<List<FarmMode>> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        featureFlagService.requireEnabled("feature.paid.farm_mode", userId)
        subscriptionService.requireActive(userId)
        return ApiResponse(success = true, data = paidLearningService.farmModes())
    }

    @PostMapping("/farm-modes/{modeId}/submit")
    fun submitFarmMode(
        @PathVariable modeId: String,
        @Valid @RequestBody request: SubmitRequest
    ): ApiResponse<SubmitResult> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        featureFlagService.requireEnabled("feature.paid.farm_mode", userId)
        subscriptionService.requireActive(userId)
        val result = paidLearningService.submitLearning(userId, modeId, "farm_mode", request)
        return ApiResponse(success = true, data = result)
    }

    @GetMapping("/writing/prompts")
    fun writingPrompts(): ApiResponse<List<WritingPrompt>> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        featureFlagService.requireEnabled("feature.paid.writing", userId)
        subscriptionService.requireActive(userId)
        return ApiResponse(success = true, data = paidLearningService.writingPrompts())
    }

    @PostMapping("/writing/submit")
    fun submitWriting(@Valid @RequestBody request: WritingSubmitRequest): ApiResponse<Map<String, String>> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        featureFlagService.requireEnabled("feature.paid.writing", userId)
        subscriptionService.requireActive(userId)
        val submissionId = paidLearningService.submitWriting(userId, request)
        return ApiResponse(success = true, data = mapOf("submission_id" to submissionId))
    }

    @GetMapping("/tests")
    fun tests(): ApiResponse<List<TestSummary>> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        featureFlagService.requireEnabled("feature.paid.test_bank", userId)
        subscriptionService.requireActive(userId)
        return ApiResponse(success = true, data = paidLearningService.tests())
    }

    @PostMapping("/tests/{testId}/submit")
    fun submitTest(
        @PathVariable testId: String,
        @Valid @RequestBody request: SubmitRequest
    ): ApiResponse<SubmitResult> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        featureFlagService.requireEnabled("feature.paid.test_bank", userId)
        subscriptionService.requireActive(userId)
        val result = paidLearningService.submitLearning(userId, testId, "test", request)
        return ApiResponse(success = true, data = result)
    }

    @GetMapping("/harvest-ledger")
    fun harvestLedger(): ApiResponse<List<com.korfarm.api.economy.LedgerEntry>> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val entries = paidLearningService.harvestLedger(userId)
        return ApiResponse(success = true, data = entries)
    }
}
