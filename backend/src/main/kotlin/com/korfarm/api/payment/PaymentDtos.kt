package com.korfarm.api.payment

import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import java.time.LocalDateTime

data class PaymentCheckoutRequest(
    @field:Min(1)
    val amount: Int,
    val orderId: String? = null,
    val subscription: Boolean? = null,
    @field:NotBlank
    val method: String,
    val months: Int? = null
)

data class PaymentCheckoutResult(
    val paymentId: String,
    val status: String,
    val redirectUrl: String? = null
)

data class PaymentView(
    val paymentId: String,
    val paymentType: String,
    val amount: Int,
    val status: String,
    val paymentMethod: String? = null,
    val receiptUrl: String? = null,
    val createdAt: LocalDateTime
)

// 토스페이먼츠 연동 DTO
data class SubscriptionPrepareRequest(
    @field:Min(1)
    val months: Int
)

data class ShopPrepareRequest(
    @field:NotBlank
    val orderId: String
)

data class PaymentPrepareResult(
    val paymentId: String,
    val tossOrderId: String,
    val amount: Int,
    val orderName: String,
    val clientKey: String
)

data class PaymentConfirmRequest(
    @field:NotBlank
    val paymentKey: String,
    @field:NotBlank
    val orderId: String,
    @field:Min(1)
    val amount: Int
)

data class PaymentConfirmResult(
    val paymentId: String,
    val status: String,
    val receiptUrl: String? = null
)

data class PaymentRefundRequest(
    @field:NotBlank
    val paymentId: String,
    @field:NotBlank
    val cancelReason: String,
    val cancelAmount: Int? = null
)

data class PaymentRefundResult(
    val paymentId: String,
    val status: String,
    val cancelAmount: Int? = null,
    val cancelReason: String? = null
)

data class TossClientKeyResponse(
    val clientKey: String
)

data class SubscriptionView(
    val status: String,
    val startAt: LocalDateTime? = null,
    val endAt: LocalDateTime? = null,
    val nextBillingAt: LocalDateTime? = null
)

