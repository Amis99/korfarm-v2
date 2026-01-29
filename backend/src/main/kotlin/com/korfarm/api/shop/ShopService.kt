package com.korfarm.api.shop

import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.user.UserRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class ShopService(
    private val productRepository: ProductRepository,
    private val orderRepository: OrderRepository,
    private val orderItemRepository: OrderItemRepository,
    private val shipmentRepository: ShipmentRepository,
    private val userRepository: UserRepository,
    private val objectMapper: ObjectMapper
) {
    @Transactional(readOnly = true)
    fun listProducts(): List<ProductView> {
        return productRepository.findByStatus("active").map { it.toView() }
    }

    @Transactional(readOnly = true)
    fun listProductsAdmin(): List<ProductView> {
        return productRepository.findAll().sortedBy { it.createdAt }.map { it.toView() }
    }

    @Transactional(readOnly = true)
    fun getProduct(productId: String): ProductView {
        val product = productRepository.findById(productId).orElseThrow {
            ApiException("NOT_FOUND", "product not found", HttpStatus.NOT_FOUND)
        }
        if (product.status != "active") {
            throw ApiException("NOT_FOUND", "product not found", HttpStatus.NOT_FOUND)
        }
        return product.toView()
    }

    @Transactional
    fun createOrder(userId: String, request: OrderCreateRequest): OrderView {
        if (request.items.isEmpty()) {
            throw ApiException("INVALID_ITEMS", "order items required", HttpStatus.BAD_REQUEST)
        }
        val productIds = request.items.map { it.productId }.distinct()
        val products = productRepository.findAllById(productIds).associateBy { it.id }
        if (products.size != productIds.size) {
            throw ApiException("INVALID_ITEMS", "invalid product", HttpStatus.BAD_REQUEST)
        }
        val lineItems = request.items.map { item ->
            val product = products[item.productId]
                ?: throw ApiException("INVALID_ITEMS", "invalid product", HttpStatus.BAD_REQUEST)
            if (product.status != "active") {
                throw ApiException("INVALID_ITEMS", "inactive product", HttpStatus.BAD_REQUEST)
            }
            if (product.stock < item.quantity) {
                throw ApiException("OUT_OF_STOCK", "insufficient stock", HttpStatus.CONFLICT)
            }
            OrderItemDraft(
                productId = product.id,
                quantity = item.quantity,
                unitPrice = product.price
            )
        }
        val totalAmount = lineItems.sumOf { it.unitPrice * it.quantity }
        val order = OrderEntity(
            id = IdGenerator.newId("ord"),
            userId = userId,
            totalAmount = totalAmount,
            status = "created",
            createdAt = LocalDateTime.now(),
            updatedAt = LocalDateTime.now()
        )
        orderRepository.save(order)
        val orderItems = lineItems.map { draft ->
            OrderItemEntity(
                id = IdGenerator.newId("oi"),
                orderId = order.id,
                productId = draft.productId,
                quantity = draft.quantity,
                unitPrice = draft.unitPrice,
                createdAt = LocalDateTime.now(),
                updatedAt = LocalDateTime.now()
            )
        }
        orderItemRepository.saveAll(orderItems)
        val addressJson = objectMapper.writeValueAsString(request.address)
        shipmentRepository.save(
            ShipmentEntity(
                id = IdGenerator.newId("ship"),
                orderId = order.id,
                status = "pending",
                addressJson = addressJson,
                createdAt = LocalDateTime.now(),
                updatedAt = LocalDateTime.now()
            )
        )
        return order.toView(orderItems)
    }

    @Transactional(readOnly = true)
    fun listOrders(userId: String): List<OrderView> {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId).map { order ->
            val items = orderItemRepository.findByOrderId(order.id)
            order.toView(items)
        }
    }

    @Transactional(readOnly = true)
    fun getOrder(userId: String, orderId: String): OrderView {
        val order = orderRepository.findById(orderId).orElseThrow {
            ApiException("NOT_FOUND", "order not found", HttpStatus.NOT_FOUND)
        }
        if (order.userId != userId) {
            throw ApiException("FORBIDDEN", "not allowed", HttpStatus.FORBIDDEN)
        }
        val items = orderItemRepository.findByOrderId(order.id)
        return order.toView(items)
    }

    @Transactional(readOnly = true)
    fun listOrdersAdmin(): List<AdminOrderView> {
        val orders = orderRepository.findAllByOrderByCreatedAtDesc()
        val userIds = orders.map { it.userId }.distinct()
        val userMap = userRepository.findAllById(userIds).associateBy { it.id }
        return orders.map { order ->
            val items = orderItemRepository.findByOrderId(order.id)
            val user = userMap[order.userId]
            order.toAdminView(items, user?.name ?: user?.email ?: order.userId)
        }
    }

    @Transactional
    fun createProduct(request: AdminProductRequest): ProductView {
        val product = ProductEntity(
            id = IdGenerator.newId("prod"),
            name = request.name,
            price = request.price,
            stock = request.stock ?: 0,
            status = request.status ?: "active",
            createdAt = LocalDateTime.now(),
            updatedAt = LocalDateTime.now()
        )
        productRepository.save(product)
        return product.toView()
    }

    @Transactional
    fun updateProduct(productId: String, request: AdminProductRequest): ProductView {
        val product = productRepository.findById(productId).orElseThrow {
            ApiException("NOT_FOUND", "product not found", HttpStatus.NOT_FOUND)
        }
        product.name = request.name
        product.price = request.price
        if (request.stock != null) {
            product.stock = request.stock
        }
        if (request.status != null) {
            product.status = request.status
        }
        return productRepository.save(product).toView()
    }

    @Transactional
    fun deleteProduct(productId: String) {
        val product = productRepository.findById(productId).orElseThrow {
            ApiException("NOT_FOUND", "product not found", HttpStatus.NOT_FOUND)
        }
        product.status = "deleted"
        product.stock = 0
        productRepository.save(product)
    }

    private data class OrderItemDraft(
        val productId: String,
        val quantity: Int,
        val unitPrice: Int
    )

    private fun ProductEntity.toView(): ProductView {
        return ProductView(
            productId = id,
            name = name,
            price = price,
            stock = stock,
            status = status
        )
    }

    private fun OrderEntity.toView(items: List<OrderItemEntity>): OrderView {
        return OrderView(
            orderId = id,
            status = status,
            totalAmount = totalAmount,
            createdAt = createdAt,
            items = items.map {
                OrderItemView(
                    productId = it.productId,
                    quantity = it.quantity,
                    unitPrice = it.unitPrice
                )
            }
        )
    }

    private fun OrderEntity.toAdminView(items: List<OrderItemEntity>, customerName: String): AdminOrderView {
        return AdminOrderView(
            orderId = id,
            userId = userId,
            customerName = customerName,
            status = status,
            totalAmount = totalAmount,
            createdAt = createdAt,
            items = items.map {
                OrderItemView(
                    productId = it.productId,
                    quantity = it.quantity,
                    unitPrice = it.unitPrice
                )
            }
        )
    }
}

