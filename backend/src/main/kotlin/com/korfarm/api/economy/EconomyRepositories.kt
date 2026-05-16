package com.korfarm.api.economy

import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface SeedCatalogRepository : JpaRepository<SeedCatalogEntity, String>

interface UserSeedRepository : JpaRepository<UserSeedEntity, String> {
    fun findByUserId(userId: String): List<UserSeedEntity>

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from UserSeedEntity s where s.userId = :userId and s.seedType = :seedType")
    fun findForUpdate(@Param("userId") userId: String, @Param("seedType") seedType: String): UserSeedEntity?

    /** 시즌 시작 시 랭킹용 씨앗 잔액 일괄 0 리셋 (결제용 user_grapefruit_wallet 은 무관) */
    @Modifying
    @Query("update UserSeedEntity s set s.count = 0, s.updatedAt = :now where s.count > 0")
    fun resetAllSeasonSeedsToZero(@Param("now") now: java.time.LocalDateTime): Int
}

interface UserCropRepository : JpaRepository<UserCropEntity, String> {
    fun findByUserId(userId: String): List<UserCropEntity>

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from UserCropEntity c where c.userId = :userId and c.cropType = :cropType")
    fun findForUpdate(@Param("userId") userId: String, @Param("cropType") cropType: String): UserCropEntity?

    /** 시즌 시작 시 랭킹용 작물 잔액 일괄 0 리셋 (AI 결제용 user_crop_wallet 은 무관) */
    @Modifying
    @Query("update UserCropEntity c set c.count = 0, c.updatedAt = :now where c.count > 0")
    fun resetAllSeasonCropsToZero(@Param("now") now: java.time.LocalDateTime): Int
}

interface UserFertilizerRepository : JpaRepository<UserFertilizerEntity, String> {
    fun findByUserId(userId: String): UserFertilizerEntity?

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select f from UserFertilizerEntity f where f.userId = :userId")
    fun findForUpdate(@Param("userId") userId: String): UserFertilizerEntity?
}

interface EconomyLedgerRepository : JpaRepository<EconomyLedgerEntity, String> {
    fun findByUserIdOrderByCreatedAtDesc(userId: String): List<EconomyLedgerEntity>

    @Query(
        "SELECT e.userId AS userId, SUM(e.delta) AS total " +
        "FROM EconomyLedgerEntity e " +
        "WHERE e.currencyType = 'seed' AND e.delta > 0 " +
        "AND e.createdAt BETWEEN :start AND :end " +
        "GROUP BY e.userId ORDER BY SUM(e.delta) DESC"
    )
    fun sumSeedEarningsByPeriod(
        @Param("start") start: java.time.LocalDateTime,
        @Param("end") end: java.time.LocalDateTime
    ): List<SeedRankingProjection>
}

interface SeedRankingProjection {
    fun getUserId(): String
    fun getTotal(): Long
}
