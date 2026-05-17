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
    private val featureFlagService: FeatureFlagService,
    private val parentStudentLinkRepository: com.korfarm.api.user.ParentStudentLinkRepository,
) {
    // mock 결제 엔드포인트 제거 (2026-05-17)
    //   기존 /checkout · /shop 은 토스 우회 mock 통로였음.
    //   feature flag 만으로는 운영 사고 시 실제 결제 받지 않고 활성화될 위험이 있어 컨트롤러에서 완전 제거.
    //   토스 연동은 아래 /prepare/* + /confirm 흐름만 사용.

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

    @PostMapping("/prepare/grapefruit")
    fun prepareGrapefruit(@Valid @RequestBody request: GrapefruitPrepareRequest): ApiResponse<PaymentPrepareResult> {
        featureFlagService.requireNotKilled("ops.kill_switch.payments")
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val result = paymentService.prepareUserGrapefruit(userId, request)
        return ApiResponse(success = true, data = result)
    }

    /** 학부모 → 자녀 자몽 충전 prepare. 학부모-자녀 active link 검증 후 prepare. */
    @PostMapping("/prepare/grapefruit-child")
    fun prepareGrapefruitChild(@Valid @RequestBody request: ChildGrapefruitPrepareRequest): ApiResponse<PaymentPrepareResult> {
        featureFlagService.requireNotKilled("ops.kill_switch.payments")
        val parentUserId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        if (!SecurityUtils.hasAnyRole("PARENT")) {
            throw ApiException("FORBIDDEN", "학부모만 자녀에게 충전할 수 있습니다.", HttpStatus.FORBIDDEN)
        }
        val link = parentStudentLinkRepository.findByParentUserIdAndStudentUserId(parentUserId, request.studentUserId)
            ?: throw ApiException("NOT_LINKED", "자녀와 연결되어 있지 않습니다.", HttpStatus.FORBIDDEN)
        if (link.status != "active") {
            throw ApiException("LINK_INACTIVE", "자녀 연결이 활성 상태가 아닙니다.", HttpStatus.FORBIDDEN)
        }
        val result = paymentService.prepareChildGrapefruit(parentUserId, request.studentUserId, request.amountWon)
        return ApiResponse(success = true, data = result)
    }

    @PostMapping("/prepare/org-billing")
    fun prepareOrgBilling(@Valid @RequestBody request: OrgBillingPrepareRequest): ApiResponse<PaymentPrepareResult> {
        featureFlagService.requireNotKilled("ops.kill_switch.payments")
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val result = paymentService.prepareOrgBilling(userId, request)
        return ApiResponse(success = true, data = result)
    }

    @PostMapping("/prepare/org-grapefruit")
    fun prepareOrgGrapefruit(@Valid @RequestBody request: OrgGrapefruitPrepareRequest): ApiResponse<PaymentPrepareResult> {
        featureFlagService.requireNotKilled("ops.kill_switch.payments")
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val result = paymentService.prepareOrgGrapefruit(userId, request)
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

    /**
     * 환불 — HQ_ADMIN 전용. 일반 사용자는 1:1 문의 → CS → 관리자가 환불 처리.
     * 보안 + 정합성: paymentType 별 부수효과(잔액 차감 / 구독 종료 / 재고 복구)는
     * PaymentService.refundPayment 안에서 트랜잭션 처리.
     */
    @PostMapping("/refund")
    fun refund(@Valid @RequestBody request: PaymentRefundRequest): ApiResponse<PaymentRefundResult> {
        featureFlagService.requireNotKilled("ops.kill_switch.payments")
        if (!com.korfarm.api.security.SecurityUtils.hasAnyRole("HQ_ADMIN")) {
            throw ApiException(
                "FORBIDDEN",
                "환불은 본사 관리자만 처리할 수 있습니다. 1:1 문의를 이용해 주세요.",
                HttpStatus.FORBIDDEN
            )
        }
        val adminUserId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val result = paymentService.refundPayment(adminUserId, request)
        return ApiResponse(success = true, data = result)
    }

    @GetMapping
    fun myPayments(): ApiResponse<List<PaymentView>> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        return ApiResponse(success = true, data = paymentService.listPaymentsByUser(userId))
    }
}

