package com.korfarm.api.payment

import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.shop.OrderRepository
import com.korfarm.api.shop.OrderItemRepository
import com.korfarm.api.shop.ProductRepository
import com.korfarm.api.shop.ShipmentRepository
import com.korfarm.api.user.UserRepository
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

        // 토스 결제 승인 API 호출
        val tossResult = tossPaymentClient.confirmPayment(request.paymentKey, request.orderId, request.amount)

        // 토스 응답에서 금액 재검증
        val confirmedAmount = (tossResult["totalAmount"] as? Number)?.toInt()
        if (confirmedAmount != null && confirmedAmount != payment.amount) {
            throw ApiException("AMOUNT_MISMATCH", "토스 승인 금액 불일치", HttpStatus.BAD_GATEWAY)
        }

        // 결제 정보 업데이트
        payment.status = "paid"
        payment.paymentKey = request.paymentKey
        payment.paymentMethod = tossResult["method"]?.toString()
        payment.receiptUrl = (tossResult["receipt"] as? Map<*, *>)?.get("url")?.toString()
        payment.metadata = objectMapper.writeValueAsString(tossResult)
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
        }

        return PaymentConfirmResult(
            paymentId = payment.id,
            status = payment.status,
            receiptUrl = payment.receiptUrl
        )
    }

    @Transactional
    fun refundPayment(userId: String, request: PaymentRefundRequest): PaymentRefundResult {
        val payment = paymentRepository.findById(request.paymentId).orElseThrow {
            ApiException("NOT_FOUND", "결제 정보를 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        if (payment.userId != userId) {
            throw ApiException("FORBIDDEN", "접근 권한이 없습니다", HttpStatus.FORBIDDEN)
        }
        if (payment.status != "paid") {
            throw ApiException("INVALID_STATE", "환불 가능한 상태가 아닙니다", HttpStatus.CONFLICT)
        }
        val pk = payment.paymentKey
            ?: throw ApiException("INVALID_STATE", "결제 키가 없어 환불할 수 없습니다", HttpStatus.BAD_REQUEST)

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

