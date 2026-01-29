package com.korfarm.api.learning

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.contracts.SubmitRequest
import com.korfarm.api.security.SecurityUtils
import com.korfarm.api.system.FeatureFlagService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/learning")
class LearningController(
    private val learningService: LearningService,
    private val featureFlagService: FeatureFlagService
) {
    @GetMapping("/daily-quiz")
    fun dailyQuiz(): ApiResponse<DailyQuizContent> {
        val userId = SecurityUtils.currentUserId()
        featureFlagService.requireEnabled("feature.free.daily_quiz", userId)
        return ApiResponse(success = true, data = learningService.getDailyQuiz())
    }

    @PostMapping("/daily-quiz/submit")
    fun submitDailyQuiz(@Valid @RequestBody request: SubmitRequest): ApiResponse<SubmitResult> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        featureFlagService.requireEnabled("feature.free.daily_quiz", userId)
        val result = learningService.submit(userId, "daily_quiz", "dq_today", request)
        return ApiResponse(success = true, data = result)
    }

    @GetMapping("/daily-reading")
    fun dailyReading(): ApiResponse<DailyReadingContent> {
        val userId = SecurityUtils.currentUserId()
        featureFlagService.requireEnabled("feature.free.daily_reading", userId)
        return ApiResponse(success = true, data = learningService.getDailyReading())
    }

    @PostMapping("/daily-reading/submit")
    fun submitDailyReading(@Valid @RequestBody request: SubmitRequest): ApiResponse<SubmitResult> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        featureFlagService.requireEnabled("feature.free.daily_reading", userId)
        val result = learningService.submit(userId, "daily_reading", "dr_today", request)
        return ApiResponse(success = true, data = result)
    }
}
