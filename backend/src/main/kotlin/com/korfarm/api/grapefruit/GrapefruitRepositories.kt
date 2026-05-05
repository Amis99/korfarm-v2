package com.korfarm.api.grapefruit

import org.springframework.data.jpa.repository.JpaRepository

interface GrapefruitPricingRepository : JpaRepository<GrapefruitPricingEntity, String> {
    fun findAllByActiveOrderByKindAsc(active: Boolean): List<GrapefruitPricingEntity>
}

interface OrgGrapefruitWalletRepository : JpaRepository<OrgGrapefruitWalletEntity, String>

interface UserGrapefruitWalletRepository : JpaRepository<UserGrapefruitWalletEntity, String>

interface GrapefruitTransactionRepository : JpaRepository<GrapefruitTransactionEntity, String> {
    fun findTop100ByWalletTypeAndWalletOwnerIdOrderByCreatedAtDesc(
        walletType: String,
        walletOwnerId: String,
    ): List<GrapefruitTransactionEntity>
}

interface UserCropWalletRepository : org.springframework.data.jpa.repository.JpaRepository<UserCropWalletEntity, UserCropWalletId> {
    fun findByIdUserId(userId: String): List<UserCropWalletEntity>
}
