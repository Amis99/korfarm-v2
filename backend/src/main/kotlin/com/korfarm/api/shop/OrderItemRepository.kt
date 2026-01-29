package com.korfarm.api.shop

import org.springframework.data.jpa.repository.JpaRepository

interface OrderItemRepository : JpaRepository<OrderItemEntity, String> {
    fun findByOrderId(orderId: String): List<OrderItemEntity>
}

