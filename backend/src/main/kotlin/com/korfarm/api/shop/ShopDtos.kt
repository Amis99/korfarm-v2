package com.korfarm.api.shop

import jakarta.validation.Valid
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotEmpty
import jakarta.validation.constraints.NotNull
import java.time.LocalDateTime

data class ProductView(
    val productId: String,
    val name: String,
    val price: Int,
    val stock: Int,
    val status: String
)

data class OrderItemRequest(
    val productId: String,
    @field:Min(1)
    val quantity: Int
)

data class OrderCreateRequest(
    @field:NotEmpty
    @field:Valid
    val items: List<OrderItemRequest>,
    @field:NotNull
    val address: Map<String, Any>
)

data class OrderItemView(
    val productId: String,
    val quantity: Int,
    val unitPrice: Int
)

data class OrderView(
    val orderId: String,
    val status: String,
    val totalAmount: Int,
    val createdAt: LocalDateTime,
    val items: List<OrderItemView>
)

data class AdminOrderView(
    val orderId: String,
    val userId: String,
    val customerName: String,
    val status: String,
    val totalAmount: Int,
    val createdAt: LocalDateTime,
    val items: List<OrderItemView>
)

data class AdminProductRequest(
    val name: String,
    @field:Min(0)
    val price: Int,
    val stock: Int? = null,
    val status: String? = null
)

