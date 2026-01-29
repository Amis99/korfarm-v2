package com.korfarm.api.shop

import org.springframework.data.jpa.repository.JpaRepository

interface ShipmentRepository : JpaRepository<ShipmentEntity, String> {
    fun findByOrderId(orderId: String): ShipmentEntity?
}

