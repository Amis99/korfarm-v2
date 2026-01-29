package com.korfarm.api.economy

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "user_seeds")
class UserSeedEntity(
    @Id
    var id: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(name = "seed_type", nullable = false)
    var seedType: String,

    @Column(nullable = false)
    var count: Int,

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

@Entity
@Table(name = "user_crops")
class UserCropEntity(
    @Id
    var id: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(name = "crop_type", nullable = false)
    var cropType: String,

    @Column(nullable = false)
    var count: Int,

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

@Entity
@Table(name = "user_fertilizer")
class UserFertilizerEntity(
    @Id
    var id: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(nullable = false)
    var count: Int,

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

@Entity
@Table(name = "economy_ledger")
class EconomyLedgerEntity(
    @Id
    var id: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(name = "currency_type", nullable = false)
    var currencyType: String,

    @Column(name = "item_type")
    var itemType: String?,

    @Column(nullable = false)
    var delta: Int,

    @Column(nullable = false)
    var reason: String,

    @Column(name = "ref_type")
    var refType: String?,

    @Column(name = "ref_id")
    var refId: String?,

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
