package com.korfarm.api.shop

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "shipments")
class ShipmentEntity(
    @Id
    var id: String,

    @Column(name = "order_id", nullable = false)
    var orderId: String,

    @Column(nullable = false)
    var status: String,

    @Column(name = "address_json", nullable = false, columnDefinition = "json")
    var addressJson: String,

    @Column(name = "tracking_number")
    var trackingNumber: String? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    @PrePersist
    fun onCreate() {
        val now = LocalDateTime.now()
        createdAt = now
        updatedAt = now
    }

    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }
}

