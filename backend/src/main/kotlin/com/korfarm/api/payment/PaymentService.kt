package com.korfarm.api.payment

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.shop.OrderRepository
import com.korfarm.api.shop.OrderItemRepository
import com.korfarm.api.shop.ProductRepository
import com.korfarm.api.shop.ShipmentRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class PaymentService(
    private val paymentRepository: PaymentRepository,
    private val subscriptionRepository: SubscriptionRepository,
    private val subscriptionService: SubscriptionService,
    private val orderRepository: OrderRepository,
    private val orderItemRepository: OrderItemRepository,
    private val productRepository: ProductRepository,
    private val shipmentRepository: ShipmentRepository
) {
    @Transactional
    fun checkoutSubscription(userId: String, request: PaymentCheckoutRequest): PaymentCheckoutResult {
        validateCardMethod(request.method)
        if (request.orderId != null) {
            throw ApiException("INVALID_REQUEST", "order_id not allowed", HttpStatus.BAD_REQUEST)
        }
        if (request.subscription == false) {
            throw ApiException("INVALID_REQUEST", "subscription payment required", HttpStatus.BAD_REQUEST)
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
        upsertSubscription(userId)
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
                createdAt = it.createdAt
            )
        }
    }

    private fun upsertSubscription(userId: String) {
        val now = LocalDateTime.now()
        val current = subscriptionRepository.findTopByUserIdOrderByEndAtDesc(userId)
        if (current != null && subscriptionService.isEntitled(current) && current.status == "active") {
            current.endAt = current.endAt.plusMonths(1)
            current.nextBillingAt = current.endAt
            subscriptionRepository.save(current)
            return
        }
        val startAt = if (current != null && current.endAt.isAfter(now)) current.endAt else now
        val endAt = startAt.plusMonths(1)
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

    private fun validateCardMethod(method: String) {
        if (method.lowercase() != "card") {
            throw ApiException("PAYMENT_METHOD_UNSUPPORTED", "card only", HttpStatus.BAD_REQUEST)
        }
    }
}

