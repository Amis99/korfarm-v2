package com.korfarm.api.learning

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.SecurityUtils
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/learning/farm")
class FarmLearningController(
    private val farmLearningService: FarmLearningService
) {
    @GetMapping("/history")
    fun history(): ApiResponse<FarmHistoryResponse> {
        val userId = SecurityUtils.currentUserId()
            ?: return ApiResponse(success = true, data = FarmHistoryResponse(logs = emptyList()))
        return ApiResponse(success = true, data = farmLearningService.getHistory(userId))
    }

    @PostMapping("/start")
    fun start(@Valid @RequestBody request: FarmStartRequest): ApiResponse<FarmStartResponse> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        return ApiResponse(success = true, data = farmLearningService.start(userId, request))
    }

    @PostMapping("/complete")
    fun complete(@Valid @RequestBody request: FarmCompleteRequest): ApiResponse<FarmCompleteResponse> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        return ApiResponse(success = true, data = farmLearningService.complete(userId, request))
    }

    @PostMapping("/progress")
    fun progress(@Valid @RequestBody request: FarmProgressRequest): ApiResponse<FarmProgressResponse> {
        val userId = SecurityUtils.currentUserId()
        return ApiResponse(success = true, data = farmLearningService.getProgress(userId, request.contentIds))
    }

    @PostMapping("/page-complete")
    fun pageComplete(@Valid @RequestBody request: PageCompleteRequest): ApiResponse<PageCompleteResponse> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        return ApiResponse(success = true, data = farmLearningService.pageComplete(userId, request))
    }

    @PostMapping("/page-progress")
    fun pageProgress(@Valid @RequestBody request: PageProgressRequest): ApiResponse<PageProgressResponse> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        return ApiResponse(success = true, data = farmLearningService.pageProgress(userId, request))
    }
}
