package com.korfarm.api.shop

import org.springframework.data.jpa.repository.JpaRepository

interface ShipmentRepository : JpaRepository<ShipmentEntity, String> {
    fun findByOrderId(orderId: String): ShipmentEntity?
    fun findByOrderIdIn(orderIds: List<String>): List<ShipmentEntity>
}

