package com.korfarm.api.grapefruit

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import java.time.LocalDateTime

/** 자몽 단가표 — 본사가 운영 중에 수정 */
@Entity
@Table(name = "grapefruit_pricing")
class GrapefruitPricingEntity(
    @Id
    var kind: String,

    @Column(nullable = false)
    var label: String,

    @Column(nullable = false)
    var model: String,

    @Column(name = "price_grapefruits", nullable = false)
    var priceGrapefruits: Int,

    @Column(length = 500)
    var description: String? = null,

    @Column(nullable = false)
    var active: Boolean = true,

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_by")
    var updatedBy: String? = null,
) {
    @PrePersist
    @PreUpdate
    fun touch() {
        updatedAt = LocalDateTime.now()
    }
}

/** 기관 자몽 지갑 (org_id 1:1) */
@Entity
@Table(name = "org_grapefruit_wallet")
class OrgGrapefruitWalletEntity(
    @Id
    @Column(name = "org_id")
    var orgId: String,

    @Column(nullable = false)
    var balance: Int = 0,

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),
) {
    @PrePersist
    @PreUpdate
    fun touch() {
        updatedAt = LocalDateTime.now()
    }
}

/** 개인 자몽 지갑 (user_id 1:1) — Phase C 사용 예정 */
@Entity
@Table(name = "user_grapefruit_wallet")
class UserGrapefruitWalletEntity(
    @Id
    @Column(name = "user_id")
    var userId: String,

    @Column(nullable = false)
    var balance: Int = 0,

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),
) {
    @PrePersist
    @PreUpdate
    fun touch() {
        updatedAt = LocalDateTime.now()
    }
}

/** 자몽 거래 이력 — 충전(charge) / 차감(spend) */
@Entity
@Table(name = "grapefruit_transactions")
class GrapefruitTransactionEntity(
    @Id
    var id: String,

    @Column(name = "wallet_type", nullable = false, length = 8)
    var walletType: String,    // "org" or "user"

    @Column(name = "wallet_owner_id", nullable = false)
    var walletOwnerId: String,

    @Column(nullable = false, length = 8)
    var direction: String,     // "charge" or "spend"

    @Column(nullable = false)
    var amount: Int,           // 항상 양수

    @Column(length = 64)
    var kind: String? = null,

    @Column(name = "ai_log_id")
    var aiLogId: String? = null,

    @Column(name = "payment_id")
    var paymentId: String? = null,

    @Column(name = "amount_won")
    var amountWon: Int? = null,

    @Column(name = "balance_after", nullable = false)
    var balanceAfter: Int,

    @Column(length = 500)
    var memo: String? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),
) {
    @PrePersist
    fun onCreate() {
        if (createdAt == LocalDateTime.MIN) createdAt = LocalDateTime.now()
    }
}
