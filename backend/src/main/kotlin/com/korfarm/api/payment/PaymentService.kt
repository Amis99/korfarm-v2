package com.korfarm.api.payment

import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.shop.OrderRepository
import com.korfarm.api.shop.OrderItemRepository
import com.korfarm.api.shop.ProductRepository
import com.korfarm.api.shop.ShipmentRepository
import com.korfarm.api.user.UserRepository
import com.korfarm.api.grapefruit.GrapefruitService
import com.korfarm.api.billing.OrgBillingService
import com.korfarm.api.billing.OrgBillingRepository
import com.korfarm.api.org.OrgMembershipRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.util.UUID

@Service
class PaymentService(
    private val paymentRepository: PaymentRepository,
    private val subscriptionRepository: SubscriptionRepository,
    private val subscriptionService: SubscriptionService,
    private val orderRepository: OrderRepository,
    private val orderItemRepository: OrderItemRepository,
    private val productRepository: ProductRepository,
    private val shipmentRepository: ShipmentRepository,
    private val tossPaymentClient: TossPaymentClient,
    private val tossProperties: TossProperties,
    private val objectMapper: ObjectMapper,
    private val userRepository: UserRepository,
    private val grapefruitService: GrapefruitService,
    private val orgBillingService: OrgBillingService,
    private val orgBillingRepository: OrgBillingRepository,
    private val orgMembershipRepository: OrgMembershipRepository,
) {
    /** 토스 customerKey: 사용자 ID 그대로. 비회원이면 ANONYMOUS. */
    private fun resolveCustomer(userId: String): TossCustomer {
        val user = userRepository.findById(userId).orElse(null)
        return TossCustomer(
            customerKey = userId,
            customerName = user?.name,
            customerEmail = user?.email,
            customerMobilePhone = user?.studentPhone?.replace("-", ""),
        )
    }

    private data class TossCustomer(
        val customerKey: String,
        val customerName: String?,
        val customerEmail: String?,
        val customerMobilePhone: String?,
    )
    companion object {
        val PLAN_PRICES = mapOf(1 to 65000, 3 to 175500, 6 to 312000, 12 to 546000)
    }

    @Transactional
    fun checkoutSubscription(userId: String, request: PaymentCheckoutRequest): PaymentCheckoutResult {
        validateCardMethod(request.method)
        if (request.orderId != null) {
            throw ApiException("INVALID_REQUEST", "order_id not allowed", HttpStatus.BAD_REQUEST)
        }
        if (request.subscription == false) {
            throw ApiException("INVALID_REQUEST", "subscription payment required", HttpStatus.BAD_REQUEST)
        }
        val months = request.months ?: 1
        val expectedAmount = PLAN_PRICES[months]
            ?: throw ApiException("INVALID_REQUEST", "invalid months: $months", HttpStatus.BAD_REQUEST)
        if (request.amount != expectedAmount) {
            throw ApiException("AMOUNT_MISMATCH", "expected $expectedAmount but got ${request.amount}", HttpStatus.BAD_REQUEST)
        }
        val payment = PaymentEntity(
            id = IdGenerator.newId("pay"),
            userId = userId,
            paymentType = "subscription",
            amount = request.amount,
            status = "paid",
            provider = "mock",
            providerRef = IdGenerator.newId("mock"),
            createdAt = LocalDateTime.now(),
            updatedAt = LocalDateTime.now()
        )
        paymentRepository.save(payment)
        upsertSubscription(userId, months)
        return PaymentCheckoutResult(paymentId = payment.id, status = payment.status, redirectUrl = null)
    }

    @Transactional
    fun checkoutShop(userId: String, request: PaymentCheckoutRequest): PaymentCheckoutResult {
        validateCardMethod(request.method)
        if (request.subscription == true) {
            throw ApiException("INVALID_REQUEST", "shop payment required", HttpStatus.BAD_REQUEST)
        }
        val orderId = request.orderId
            ?: throw ApiException("INVALID_REQUEST", "order_id required", HttpStatus.BAD_REQUEST)
        val order = orderRepository.findById(orderId).orElseThrow {
            ApiException("NOT_FOUND", "order not found", HttpStatus.NOT_FOUND)
        }
        if (order.userId != userId) {
            throw ApiException("FORBIDDEN", "not allowed", HttpStatus.FORBIDDEN)
        }
        if (order.status == "paid") {
            throw ApiException("ALREADY_PAID", "order already paid", HttpStatus.CONFLICT)
        }
        if (order.totalAmount != request.amount) {
            throw ApiException("AMOUNT_MISMATCH", "amount mismatch", HttpStatus.BAD_REQUEST)
        }
        val items = orderItemRepository.findByOrderId(order.id)
        if (items.isEmpty()) {
            throw ApiException("INVALID_ORDER", "order items missing", HttpStatus.BAD_REQUEST)
        }
        val productIds = items.map { it.productId }.distinct()
        val products = productRepository.findAllById(productIds).associateBy { it.id }
        items.forEach { item ->
            val product = products[item.productId]
                ?: throw ApiException("INVALID_ORDER", "product missing", HttpStatus.BAD_REQUEST)
            if (product.status != "active") {
                throw ApiException("INVALID_ORDER", "inactive product", HttpStatus.BAD_REQUEST)
            }
            if (product.stock < item.quantity) {
                throw ApiException("OUT_OF_STOCK", "insufficient stock", HttpStatus.CONFLICT)
            }
        }
        val payment = PaymentEntity(
            id = IdGenerator.newId("pay"),
            userId = userId,
            paymentType = "shop",
            amount = request.amount,
            status = "paid",
            provider = "mock",
            providerRef = IdGenerator.newId("mock"),
            createdAt = LocalDateTime.now(),
            updatedAt = LocalDateTime.now()
        )
        paymentRepository.save(payment)
        items.forEach { item ->
            val product = products[item.productId]
                ?: return@forEach
            product.stock -= item.quantity
            productRepository.save(product)
        }
        order.status = "paid"
        orderRepository.save(order)
        val shipment = shipmentRepository.findByOrderId(order.id)
        if (shipment != null) {
            shipment.status = "paid"
            shipmentRepository.save(shipment)
        }
        return PaymentCheckoutResult(paymentId = payment.id, status = payment.status, redirectUrl = null)
    }

    @Transactional(readOnly = true)
    fun listPaymentsAdmin(): List<PaymentView> {
        return paymentRepository.findAllByOrderByCreatedAtDesc().map {
            PaymentView(
                paymentId = it.id,
                paymentType = it.paymentType,
                amount = it.amount,
                status = it.status,
                paymentMethod = it.paymentMethod,
                receiptUrl = it.receiptUrl,
                createdAt = it.createdAt
            )
        }
    }

    @Transactional(readOnly = true)
    fun listPaymentsByUser(userId: String): List<PaymentView> {
        return paymentRepository.findByUserIdOrderByCreatedAtDesc(userId).map {
            PaymentView(
                paymentId = it.id,
                paymentType = it.paymentType,
                amount = it.amount,
                status = it.status,
                paymentMethod = it.paymentMethod,
                receiptUrl = it.receiptUrl,
                createdAt = it.createdAt
            )
        }
    }

    private fun upsertSubscription(userId: String, months: Int = 1) {
        val now = LocalDateTime.now()
        val current = subscriptionRepository.findTopByUserIdOrderByEndAtDesc(userId)
        if (current != null && subscriptionService.isEntitled(current) && current.status == "active") {
            current.endAt = current.endAt.plusMonths(months.toLong())
            current.nextBillingAt = current.endAt
            subscriptionRepository.save(current)
            return
        }
        val startAt = if (current != null && current.endAt.isAfter(now)) current.endAt else now
        val endAt = startAt.plusMonths(months.toLong())
        val subscription = SubscriptionEntity(
            id = IdGenerator.newId("sub"),
            userId = userId,
            status = "active",
            startAt = startAt,
            endAt = endAt,
            nextBillingAt = endAt,
            createdAt = LocalDateTime.now(),
            updatedAt = LocalDateTime.now()
        )
        subscriptionRepository.save(subscription)
    }

    // === 토스페이먼츠 연동 메서드 ===

    @Transactional
    fun prepareSubscription(userId: String, request: SubscriptionPrepareRequest): PaymentPrepareResult {
        val months = request.months
        val expectedAmount = PLAN_PRICES[months]
            ?: throw ApiException("INVALID_REQUEST", "유효하지 않은 구독 기간: $months", HttpStatus.BAD_REQUEST)

        val tossOrderId = generateTossOrderId(userId)
        val orderName = "국어농장 구독 ${months}개월"

        val payment = PaymentEntity(
            id = IdGenerator.newId("pay"),
            userId = userId,
            paymentType = "subscription",
            amount = expectedAmount,
            status = "pending",
            provider = "toss",
            orderName = orderName,
            tossOrderId = tossOrderId,
            subscriptionMonths = months
        )
        paymentRepository.save(payment)

        val customer = resolveCustomer(userId)
        return PaymentPrepareResult(
            paymentId = payment.id,
            tossOrderId = tossOrderId,
            amount = expectedAmount,
            orderName = orderName,
            clientKey = tossProperties.clientKey,
            customerKey = customer.customerKey,
            customerName = customer.customerName,
            customerEmail = customer.customerEmail,
            customerMobilePhone = customer.customerMobilePhone,
        )
    }

    /**
     * 학부모(payingUserId) 가 자녀(childUserId) 의 구독을 결제 대행.
     * payments.user_id = 학부모, payments.target_user_id = 자녀.
     * 토스 customer 정보는 학부모 기준 (실제 카드 결제자).
     * confirm 시점에 자녀의 subscription 이 갱신됨.
     */
    @Transactional
    fun prepareSubscriptionForChild(payingUserId: String, childUserId: String, months: Int): PaymentPrepareResult {
        val expectedAmount = PLAN_PRICES[months]
            ?: throw ApiException("INVALID_REQUEST", "유효하지 않은 구독 기간: $months", HttpStatus.BAD_REQUEST)

        val tossOrderId = generateTossOrderId(payingUserId)
        val childUser = userRepository.findById(childUserId).orElseThrow {
            ApiException("CHILD_NOT_FOUND", "자녀 사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        val orderName = "국어농장 구독 ${months}개월 (${childUser.name ?: "자녀"})"

        val payment = PaymentEntity(
            id = IdGenerator.newId("pay"),
            userId = payingUserId,
            targetUserId = childUserId,
            paymentType = "subscription",
            amount = expectedAmount,
            status = "pending",
            provider = "toss",
            orderName = orderName,
            tossOrderId = tossOrderId,
            subscriptionMonths = months
        )
        paymentRepository.save(payment)

        val customer = resolveCustomer(payingUserId)
        return PaymentPrepareResult(
            paymentId = payment.id,
            tossOrderId = tossOrderId,
            amount = expectedAmount,
            orderName = orderName,
            clientKey = tossProperties.clientKey,
            customerKey = customer.customerKey,
            customerName = customer.customerName,
            customerEmail = customer.customerEmail,
            customerMobilePhone = customer.customerMobilePhone,
        )
    }

    @Transactional
    fun prepareShop(userId: String, request: ShopPrepareRequest): PaymentPrepareResult {
        val order = orderRepository.findById(request.orderId).orElseThrow {
            ApiException("NOT_FOUND", "주문을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        if (order.userId != userId) {
            throw ApiException("FORBIDDEN", "접근 권한이 없습니다", HttpStatus.FORBIDDEN)
        }
        if (order.status == "paid") {
            throw ApiException("ALREADY_PAID", "이미 결제된 주문입니다", HttpStatus.CONFLICT)
        }

        val items = orderItemRepository.findByOrderId(order.id)
        if (items.isEmpty()) {
            throw ApiException("INVALID_ORDER", "주문 항목이 없습니다", HttpStatus.BAD_REQUEST)
        }
        val productIds = items.map { it.productId }.distinct()
        val products = productRepository.findAllById(productIds).associateBy { it.id }
        items.forEach { item ->
            val product = products[item.productId]
                ?: throw ApiException("INVALID_ORDER", "상품이 존재하지 않습니다", HttpStatus.BAD_REQUEST)
            if (product.status != "active") {
                throw ApiException("INVALID_ORDER", "비활성 상품입니다", HttpStatus.BAD_REQUEST)
            }
            if (product.stock < item.quantity) {
                throw ApiException("OUT_OF_STOCK", "재고가 부족합니다", HttpStatus.CONFLICT)
            }
        }

        val tossOrderId = generateTossOrderId(userId)
        val firstProductName = products.values.firstOrNull()?.name ?: "상품"
        val orderName = if (items.size > 1) "${firstProductName} 외 ${items.size - 1}건" else firstProductName

        val payment = PaymentEntity(
            id = IdGenerator.newId("pay"),
            userId = userId,
            paymentType = "shop",
            amount = order.totalAmount,
            status = "pending",
            provider = "toss",
            orderName = orderName,
            tossOrderId = tossOrderId,
            shopOrderId = order.id
        )
        paymentRepository.save(payment)

        val customer = resolveCustomer(userId)
        return PaymentPrepareResult(
            paymentId = payment.id,
            tossOrderId = tossOrderId,
            amount = order.totalAmount,
            orderName = orderName,
            clientKey = tossProperties.clientKey,
            customerKey = customer.customerKey,
            customerName = customer.customerName,
            customerEmail = customer.customerEmail,
            customerMobilePhone = customer.customerMobilePhone,
        )
    }

    /** 자몽 충전 — 1자몽=250원 (개인). amountWon 만큼 결제 후 confirm 시 잔액 증가. */
    @Transactional
    fun prepareUserGrapefruit(userId: String, request: GrapefruitPrepareRequest): PaymentPrepareResult {
        if (request.amountWon < 1000) {
            throw ApiException("INVALID_REQUEST", "최소 충전 금액은 1,000원입니다", HttpStatus.BAD_REQUEST)
        }

        val tossOrderId = generateTossOrderId(userId)
        val grapefruits = request.amountWon / 250  // 1자몽=250원
        val orderName = "국어농장 자몽 ${grapefruits}개 충전 (${request.amountWon.toString().reversed().chunked(3).joinToString(",").reversed()}원)"

        val payment = PaymentEntity(
            id = IdGenerator.newId("pay"),
            userId = userId,
            paymentType = "grapefruit",
            amount = request.amountWon,
            status = "pending",
            provider = "toss",
            orderName = orderName,
            tossOrderId = tossOrderId,
        )
        paymentRepository.save(payment)

        val customer = resolveCustomer(userId)
        return PaymentPrepareResult(
            paymentId = payment.id,
            tossOrderId = tossOrderId,
            amount = request.amountWon,
            orderName = orderName,
            clientKey = tossProperties.clientKey,
            customerKey = customer.customerKey,
            customerName = customer.customerName,
            customerEmail = customer.customerEmail,
            customerMobilePhone = customer.customerMobilePhone,
        )
    }

    /**
     * 학부모 → 자녀 자몽 충전 prepare. 1자몽=250원 (개인 단가).
     * confirm 시 payment.targetUserId(=자녀) 지갑에 충전.
     * 연결 검증은 호출자(컨트롤러) 에서 수행 — 여기선 단순히 prepare.
     */
    @Transactional
    fun prepareChildGrapefruit(parentUserId: String, childUserId: String, amountWon: Int): PaymentPrepareResult {
        if (amountWon < 1000) {
            throw ApiException("INVALID_REQUEST", "최소 충전 금액은 1,000원입니다", HttpStatus.BAD_REQUEST)
        }
        val tossOrderId = generateTossOrderId(parentUserId)
        val grapefruits = amountWon / 250
        val orderName = "자녀 자몽 ${grapefruits}개 충전 (${amountWon.toString().reversed().chunked(3).joinToString(",").reversed()}원)"

        val payment = PaymentEntity(
            id = IdGenerator.newId("pay"),
            userId = parentUserId,             // 결제자 = 학부모
            targetUserId = childUserId,        // 잔액 누적 = 자녀
            paymentType = "grapefruit",
            amount = amountWon,
            status = "pending",
            provider = "toss",
            orderName = orderName,
            tossOrderId = tossOrderId,
        )
        paymentRepository.save(payment)

        val customer = resolveCustomer(parentUserId)
        return PaymentPrepareResult(
            paymentId = payment.id,
            tossOrderId = tossOrderId,
            amount = amountWon,
            orderName = orderName,
            clientKey = tossProperties.clientKey,
            customerKey = customer.customerKey,
            customerName = customer.customerName,
            customerEmail = customer.customerEmail,
            customerMobilePhone = customer.customerMobilePhone,
        )
    }

    /** 기관 자몽 충전 — 1자몽=200원. 호출자의 ORG_ADMIN 기관에 confirm 시 충전. */
    @Transactional
    fun prepareOrgGrapefruit(userId: String, request: OrgGrapefruitPrepareRequest): PaymentPrepareResult {
        if (request.amountWon < 200) {
            throw ApiException("INVALID_REQUEST", "최소 충전 금액은 200원입니다", HttpStatus.BAD_REQUEST)
        }

        val orgId = orgMembershipRepository.findByUserIdAndStatus(userId, "active")
            .firstOrNull { it.role == "ORG_ADMIN" }?.orgId
            ?: throw ApiException("NOT_FOUND", "소속 기관 없음", HttpStatus.NOT_FOUND)

        val tossOrderId = generateTossOrderId(userId)
        val grapefruits = request.amountWon / 200  // 1자몽=200원 (기관)
        val orderName = "국어농장 기관 자몽 ${grapefruits}개 충전 (${request.amountWon.toString().reversed().chunked(3).joinToString(",").reversed()}원)"

        val payment = PaymentEntity(
            id = IdGenerator.newId("pay"),
            userId = userId,
            paymentType = "org_grapefruit",
            amount = request.amountWon,
            status = "pending",
            provider = "toss",
            orderName = orderName,
            tossOrderId = tossOrderId,
            metadata = objectMapper.writeValueAsString(mapOf("orgId" to orgId)),
        )
        paymentRepository.save(payment)

        val customer = resolveCustomer(userId)
        return PaymentPrepareResult(
            paymentId = payment.id,
            tossOrderId = tossOrderId,
            amount = request.amountWon,
            orderName = orderName,
            clientKey = tossProperties.clientKey,
            customerKey = customer.customerKey,
            customerName = customer.customerName,
            customerEmail = customer.customerEmail,
            customerMobilePhone = customer.customerMobilePhone,
        )
    }

    /** 기관 사용료 결제 — 발행된 청구서를 토스로 결제. */
    @Transactional
    fun prepareOrgBilling(userId: String, request: OrgBillingPrepareRequest): PaymentPrepareResult {
        val billing = orgBillingRepository.findById(request.billingId).orElseThrow {
            ApiException("NOT_FOUND", "청구서를 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        if (billing.status == "paid") {
            throw ApiException("ALREADY_PAID", "이미 결제된 청구서입니다", HttpStatus.CONFLICT)
        }

        val tossOrderId = generateTossOrderId(userId)
        val orderName = "국어농장 기관 월 사용료 (청구서 ${billing.id})"

        val payment = PaymentEntity(
            id = IdGenerator.newId("pay"),
            userId = userId,
            paymentType = "org_billing",
            amount = billing.totalFee,
            status = "pending",
            provider = "toss",
            orderName = orderName,
            tossOrderId = tossOrderId,
            metadata = objectMapper.writeValueAsString(mapOf("billingId" to billing.id, "orgId" to billing.orgId)),
        )
        paymentRepository.save(payment)

        val customer = resolveCustomer(userId)
        return PaymentPrepareResult(
            paymentId = payment.id,
            tossOrderId = tossOrderId,
            amount = billing.totalFee,
            orderName = orderName,
            clientKey = tossProperties.clientKey,
            customerKey = customer.customerKey,
            customerName = customer.customerName,
            customerEmail = customer.customerEmail,
            customerMobilePhone = customer.customerMobilePhone,
        )
    }

    @Transactional
    fun confirmPayment(userId: String, request: PaymentConfirmRequest): PaymentConfirmResult {
        val payment = paymentRepository.findByTossOrderId(request.orderId)
            ?: throw ApiException("NOT_FOUND", "결제 정보를 찾을 수 없습니다", HttpStatus.NOT_FOUND)

        if (payment.userId != userId) {
            throw ApiException("FORBIDDEN", "접근 권한이 없습니다", HttpStatus.FORBIDDEN)
        }
        if (payment.status != "pending") {
            throw ApiException("INVALID_STATE", "이미 처리된 결제입니다", HttpStatus.CONFLICT)
        }
        if (payment.amount != request.amount) {
            throw ApiException("AMOUNT_MISMATCH", "결제 금액이 일치하지 않습니다", HttpStatus.BAD_REQUEST)
        }

        // 후처리에서 사용할 prepare metadata (orgId / billingId 등) 보존
        val prepareMetadata: Map<String, Any?> = try {
            if (!payment.metadata.isNullOrBlank()) {
                @Suppress("UNCHECKED_CAST")
                objectMapper.readValue(payment.metadata!!, Map::class.java) as Map<String, Any?>
            } else emptyMap()
        } catch (_: Exception) { emptyMap() }

        // 토스 결제 승인 API 호출
        val tossResult = tossPaymentClient.confirmPayment(request.paymentKey, request.orderId, request.amount)

        // 토스 응답에서 금액 재검증
        val confirmedAmount = (tossResult["totalAmount"] as? Number)?.toInt()
        if (confirmedAmount != null && confirmedAmount != payment.amount) {
            throw ApiException("AMOUNT_MISMATCH", "토스 승인 금액 불일치", HttpStatus.BAD_GATEWAY)
        }

        // 결제 정보 업데이트 — prepare metadata 와 toss 응답 모두 보존
        payment.status = "paid"
        payment.paymentKey = request.paymentKey
        payment.paymentMethod = tossResult["method"]?.toString()
        payment.receiptUrl = (tossResult["receipt"] as? Map<*, *>)?.get("url")?.toString()
        payment.metadata = objectMapper.writeValueAsString(
            mapOf("prepare" to prepareMetadata, "toss" to tossResult)
        )
        paymentRepository.save(payment)

        // 후처리: 구독 생성 또는 쇼핑 주문 완료
        // 결제 대행(학부모→자녀) 시 targetUserId 가 실제 구독자
        when (payment.paymentType) {
            "subscription" -> {
                val months = payment.subscriptionMonths ?: 1
                val subscriberUserId = payment.targetUserId ?: userId
                upsertSubscription(subscriberUserId, months)
            }
            "shop" -> {
                completeShopOrder(payment)
            }
            "grapefruit" -> {
                // amount 는 원화. 1자몽=250원으로 자몽 충전.
                // targetUserId 가 있으면 학부모→자녀 대행 결제 — 자녀 지갑에 충전.
                val chargeUserId = payment.targetUserId ?: payment.userId
                grapefruitService.chargeUser(
                    userId = chargeUserId,
                    amountWon = payment.amount,
                    paymentId = payment.id,
                    memo = if (payment.targetUserId != null) "자몽 충전 (학부모 결제)" else "자몽 충전 (토스)",
                )
            }
            "org_grapefruit" -> {
                // amount 는 원화. 1자몽=200원으로 기관 자몽 충전
                val orgId = prepareMetadata["orgId"] as? String
                    ?: throw ApiException("INVALID_STATE", "기관 ID 누락", HttpStatus.INTERNAL_SERVER_ERROR)
                grapefruitService.chargeOrg(
                    orgId = orgId,
                    amountWon = payment.amount,
                    paymentId = payment.id,
                    memo = "기관 자몽 충전 (토스)",
                )
            }
            "org_billing" -> {
                // prepareMetadata.billingId 로 청구서 결제 처리
                val billingId = prepareMetadata["billingId"] as? String
                    ?: throw ApiException("INVALID_STATE", "청구서 ID 누락", HttpStatus.INTERNAL_SERVER_ERROR)
                orgBillingService.payBilling(billingId, payment.id)
            }
        }

        return PaymentConfirmResult(
            paymentId = payment.id,
            status = payment.status,
            receiptUrl = payment.receiptUrl,
            paymentType = payment.paymentType,
            amount = payment.amount,
        )
    }

    /**
     * 환불 — 보안상 HQ_ADMIN 만 트리거 가능 (사용자 직접 호출 X).
     * 사용자는 1:1 문의 → CS → 관리자가 환불 처리.
     *
     * paymentType 별 부수효과:
     *  - org_billing: 부분 환불 정책상 거부 (RefundPolicyPage 제4조 1항)
     *  - subscription: 구독 즉시 종료
     *  - shop: 주문 status="refunded", 재고 복구
     *  - grapefruit: 사용자 자몽 잔액 차감 (잔액 부족 시 거부)
     *  - org_grapefruit: 기관 자몽 잔액 차감 (잔액 부족 시 거부)
     */
    @Transactional
    fun refundPayment(adminUserId: String, request: PaymentRefundRequest): PaymentRefundResult {
        val payment = paymentRepository.findById(request.paymentId).orElseThrow {
            ApiException("NOT_FOUND", "결제 정보를 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        if (payment.status != "paid") {
            throw ApiException("INVALID_STATE", "환불 가능한 상태가 아닙니다", HttpStatus.CONFLICT)
        }
        val pk = payment.paymentKey
            ?: throw ApiException("INVALID_STATE", "결제 키가 없어 환불할 수 없습니다", HttpStatus.BAD_REQUEST)

        // 정책 거부 — 기관 월 사용료는 부분 환불 X (회사 사유 중단 시만 별도 처리)
        if (payment.paymentType == "org_billing") {
            throw ApiException(
                "REFUND_FORBIDDEN",
                "기관 월 사용료는 환불 정책상 부분 환불이 불가합니다 (회사 사유 중단 시 별도 처리)",
                HttpStatus.FORBIDDEN
            )
        }

        // 부수효과 — 자몽은 잔액 차감을 토스 cancel 전에 시도해 잔액 부족이면 cancel 안 함
        when (payment.paymentType) {
            "grapefruit" -> {
                grapefruitService.refundUserCharge(
                    userId = payment.userId,
                    amountWon = payment.amount,
                    paymentId = payment.id,
                    memo = "환불 (by $adminUserId): ${request.cancelReason}",
                )
            }
            "org_grapefruit" -> {
                val prepareMeta: Map<String, Any?> = try {
                    @Suppress("UNCHECKED_CAST")
                    val full = objectMapper.readValue(payment.metadata ?: "{}", Map::class.java) as Map<String, Any?>
                    @Suppress("UNCHECKED_CAST")
                    (full["prepare"] as? Map<String, Any?>) ?: full
                } catch (_: Exception) { emptyMap() }
                val orgId = prepareMeta["orgId"] as? String
                    ?: throw ApiException("INVALID_STATE", "기관 ID 누락", HttpStatus.INTERNAL_SERVER_ERROR)
                grapefruitService.refundOrgCharge(
                    orgId = orgId,
                    amountWon = payment.amount,
                    paymentId = payment.id,
                    memo = "환불 (by $adminUserId): ${request.cancelReason}",
                )
            }
            "subscription" -> {
                // 구독 즉시 종료 — 잔여 일수 일할 환불은 본 endpoint 가 amount 만 반영
                val subscriberUserId = payment.targetUserId ?: payment.userId
                subscriptionRepository.findTopByUserIdOrderByEndAtDesc(subscriberUserId)?.let { sub ->
                    if (sub.status == "active" || sub.status == "canceled") {
                        sub.endAt = LocalDateTime.now()
                        sub.status = "refunded"
                        subscriptionRepository.save(sub)
                    }
                }
            }
            "shop" -> {
                val orderId = payment.shopOrderId
                if (orderId != null) {
                    orderRepository.findById(orderId).ifPresent { order ->
                        // 재고 복구
                        orderItemRepository.findByOrderId(order.id).forEach { item ->
                            productRepository.findById(item.productId).ifPresent { p ->
                                p.stock += item.quantity
                                productRepository.save(p)
                            }
                        }
                        order.status = "refunded"
                        orderRepository.save(order)
                        shipmentRepository.findByOrderId(order.id)?.let { sh ->
                            sh.status = "refunded"
                            shipmentRepository.save(sh)
                        }
                    }
                }
            }
            // 그 외 paymentType 은 단순 status 만 변경
        }

        // 토스 cancel — 부수효과 성공 후 호출
        tossPaymentClient.cancelPayment(pk, request.cancelReason, request.cancelAmount)

        payment.status = "refunded"
        payment.cancelReason = request.cancelReason
        payment.canceledAt = LocalDateTime.now()
        paymentRepository.save(payment)

        return PaymentRefundResult(
            paymentId = payment.id,
            status = payment.status,
            cancelAmount = request.cancelAmount ?: payment.amount,
            cancelReason = request.cancelReason
        )
    }

    fun getClientKey(): TossClientKeyResponse {
        return TossClientKeyResponse(clientKey = tossProperties.clientKey)
    }

    private fun completeShopOrder(payment: PaymentEntity) {
        val orderId = payment.shopOrderId ?: return
        val order = orderRepository.findById(orderId).orElse(null) ?: return
        val items = orderItemRepository.findByOrderId(order.id)
        val productIds = items.map { it.productId }.distinct()
        val products = productRepository.findAllById(productIds).associateBy { it.id }

        items.forEach { item ->
            val product = products[item.productId] ?: return@forEach
            product.stock -= item.quantity
            productRepository.save(product)
        }
        order.status = "paid"
        orderRepository.save(order)
        val shipment = shipmentRepository.findByOrderId(order.id)
        if (shipment != null) {
            shipment.status = "paid"
            shipmentRepository.save(shipment)
        }
    }

    private fun generateTossOrderId(userId: String): String {
        val ts = System.currentTimeMillis()
        val rand = UUID.randomUUID().toString().take(8)
        return "kf_${userId.takeLast(6)}_${ts}_$rand"
    }

    private fun validateCardMethod(method: String) {
        if (method.lowercase() != "card") {
            throw ApiException("PAYMENT_METHOD_UNSUPPORTED", "card only", HttpStatus.BAD_REQUEST)
        }
    }
}

