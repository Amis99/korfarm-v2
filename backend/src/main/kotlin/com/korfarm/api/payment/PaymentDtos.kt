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

// 자몽 충전 — 1자몽=250원(개인), 최소 250원
data class GrapefruitPrepareRequest(
    @field:Min(1000) val amountWon: Int
)

// 기관 자몽 충전 — 1자몽=200원, 최소 200원. 호출자의 ORG_ADMIN 기관에 충전.
data class OrgGrapefruitPrepareRequest(
    @field:Min(200) val amountWon: Int
)

// 기관 사용료 결제 — 발행된 청구서 ID
data class OrgBillingPrepareRequest(
    @field:NotBlank
    val billingId: String
)

data class PaymentPrepareResult(
    val paymentId: String,
    val tossOrderId: String,
    val amount: Int,
    val orderName: String,
    val clientKey: String,
    /** 토스 customerKey — 사용자별 고유 ID. 비회원이면 ANONYMOUS. */
    val customerKey: String,
    val customerName: String? = null,
    val customerEmail: String? = null,
    val customerMobilePhone: String? = null,
)

data class ChildGrapefruitPrepareRequest(
    @field:NotBlank
    val studentUserId: String,
    @field:Min(1000)
    val amountWon: Int,
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
    val receiptUrl: String? = null,
    /** subscription / shop / grapefruit / org_grapefruit / org_billing — 결제 후 안내 페이지 분기용 */
    val paymentType: String? = null,
    /** 결제 금액 (환불·환산 표시용) */
    val amount: Int? = null,
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

