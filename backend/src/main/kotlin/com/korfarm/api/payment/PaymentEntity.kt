package com.korfarm.api.payment

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "payments")
class PaymentEntity(
    @Id
    var id: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(name = "payment_type", nullable = false)
    var paymentType: String,

    @Column(nullable = false)
    var amount: Int,

    @Column(nullable = false)
    var status: String,

    @Column(nullable = false)
    var provider: String,

    @Column(name = "provider_ref")
    var providerRef: String? = null,

    @Column(name = "order_name")
    var orderName: String? = null,

    @Column(name = "payment_key")
    var paymentKey: String? = null,

    @Column(name = "payment_method")
    var paymentMethod: String? = null,

    @Column(name = "toss_order_id")
    var tossOrderId: String? = null,

    @Column(name = "receipt_url")
    var receiptUrl: String? = null,

    @Column(name = "cancel_reason")
    var cancelReason: String? = null,

    @Column(name = "canceled_at")
    var canceledAt: LocalDateTime? = null,

    @Column(name = "metadata", columnDefinition = "JSON")
    var metadata: String? = null,

    @Column(name = "subscription_months")
    var subscriptionMonths: Int? = null,

    @Column(name = "shop_order_id")
    var shopOrderId: String? = null,

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

