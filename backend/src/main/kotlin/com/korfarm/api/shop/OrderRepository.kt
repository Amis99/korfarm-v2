package com.korfarm.api.shop

import org.springframework.data.jpa.repository.JpaRepository

interface OrderRepository : JpaRepository<OrderEntity, String> {
    fun findByUserIdOrderByCreatedAtDesc(userId: String): List<OrderEntity>
    fun findAllByOrderByCreatedAtDesc(): List<OrderEntity>
}

