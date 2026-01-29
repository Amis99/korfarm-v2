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
    val method: String
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
    val createdAt: LocalDateTime
)

data class SubscriptionView(
    val status: String,
    val startAt: LocalDateTime? = null,
    val endAt: LocalDateTime? = null,
    val nextBillingAt: LocalDateTime? = null
)

