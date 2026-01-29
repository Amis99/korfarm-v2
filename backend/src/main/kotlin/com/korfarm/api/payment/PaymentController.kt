package com.korfarm.api.payment

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.SecurityUtils
import com.korfarm.api.system.FeatureFlagService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/payments")
class PaymentController(
    private val paymentService: PaymentService,
    private val featureFlagService: FeatureFlagService
) {
    @PostMapping("/checkout")
    fun checkout(@Valid @RequestBody request: PaymentCheckoutRequest): ApiResponse<PaymentCheckoutResult> {
        featureFlagService.requireNotKilled("ops.kill_switch.payments")
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        featureFlagService.requireEnabled("feature.payments.subscription", userId)
        val result = paymentService.checkoutSubscription(userId, request)
        return ApiResponse(success = true, data = result)
    }

    @PostMapping("/shop")
    fun shop(@Valid @RequestBody request: PaymentCheckoutRequest): ApiResponse<PaymentCheckoutResult> {
        featureFlagService.requireNotKilled("ops.kill_switch.payments")
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        featureFlagService.requireEnabled("feature.payments.shop", userId)
        val result = paymentService.checkoutShop(userId, request)
        return ApiResponse(success = true, data = result)
    }
}

