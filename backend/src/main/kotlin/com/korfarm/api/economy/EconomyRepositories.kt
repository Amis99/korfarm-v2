package com.korfarm.api.economy

import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface UserSeedRepository : JpaRepository<UserSeedEntity, String> {
    fun findByUserId(userId: String): List<UserSeedEntity>

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from UserSeedEntity s where s.userId = :userId and s.seedType = :seedType")
    fun findForUpdate(@Param("userId") userId: String, @Param("seedType") seedType: String): UserSeedEntity?
}

interface UserCropRepository : JpaRepository<UserCropEntity, String> {
    fun findByUserId(userId: String): List<UserCropEntity>

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from UserCropEntity c where c.userId = :userId and c.cropType = :cropType")
    fun findForUpdate(@Param("userId") userId: String, @Param("cropType") cropType: String): UserCropEntity?
}

interface UserFertilizerRepository : JpaRepository<UserFertilizerEntity, String> {
    fun findByUserId(userId: String): UserFertilizerEntity?

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select f from UserFertilizerEntity f where f.userId = :userId")
    fun findForUpdate(@Param("userId") userId: String): UserFertilizerEntity?
}

interface EconomyLedgerRepository : JpaRepository<EconomyLedgerEntity, String> {
    fun findByUserIdOrderByCreatedAtDesc(userId: String): List<EconomyLedgerEntity>
}
