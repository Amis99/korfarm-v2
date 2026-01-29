package com.korfarm.api.payment

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.SecurityUtils
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1")
class SubscriptionController(
    private val subscriptionService: SubscriptionService
) {
    @GetMapping("/subscription")
    fun subscription(): ApiResponse<SubscriptionView> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        return ApiResponse(success = true, data = subscriptionService.currentSubscription(userId))
    }

    @PostMapping("/subscription/cancel")
    fun cancel(): ApiResponse<Map<String, String>> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val result = subscriptionService.cancelSubscription(userId)
        return ApiResponse(success = true, data = mapOf("status" to result.status))
    }
}

