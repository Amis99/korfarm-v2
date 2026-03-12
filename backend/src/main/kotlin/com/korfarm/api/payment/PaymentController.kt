package com.korfarm.api.payment

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
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
@RequestMapping("/v1/payments")
class PaymentController(
    private val paymentService: PaymentService,
    private val featureFlagService: FeatureFlagService
) {
    // 기존 mock 결제 엔드포인트 (하위 호환)
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

    // 토스페이먼츠 연동 엔드포인트
    @GetMapping("/config")
    fun config(): ApiResponse<TossClientKeyResponse> {
        return ApiResponse(success = true, data = paymentService.getClientKey())
    }

    @PostMapping("/prepare/subscription")
    fun prepareSubscription(@Valid @RequestBody request: SubscriptionPrepareRequest): ApiResponse<PaymentPrepareResult> {
        featureFlagService.requireNotKilled("ops.kill_switch.payments")
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        featureFlagService.requireEnabled("feature.payments.subscription", userId)
        val result = paymentService.prepareSubscription(userId, request)
        return ApiResponse(success = true, data = result)
    }

    @PostMapping("/prepare/shop")
    fun prepareShop(@Valid @RequestBody request: ShopPrepareRequest): ApiResponse<PaymentPrepareResult> {
        featureFlagService.requireNotKilled("ops.kill_switch.payments")
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        featureFlagService.requireEnabled("feature.payments.shop", userId)
        val result = paymentService.prepareShop(userId, request)
        return ApiResponse(success = true, data = result)
    }

    @PostMapping("/confirm")
    fun confirm(@Valid @RequestBody request: PaymentConfirmRequest): ApiResponse<PaymentConfirmResult> {
        featureFlagService.requireNotKilled("ops.kill_switch.payments")
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val result = paymentService.confirmPayment(userId, request)
        return ApiResponse(success = true, data = result)
    }

    @PostMapping("/refund")
    fun refund(@Valid @RequestBody request: PaymentRefundRequest): ApiResponse<PaymentRefundResult> {
        featureFlagService.requireNotKilled("ops.kill_switch.payments")
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val result = paymentService.refundPayment(userId, request)
        return ApiResponse(success = true, data = result)
    }

    @GetMapping
    fun myPayments(): ApiResponse<List<PaymentView>> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        return ApiResponse(success = true, data = paymentService.listPaymentsByUser(userId))
    }
}

