package com.korfarm.api.learning

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

@Suppress("SpringDataRepositoryMethodReturnTypeInspection")
interface FarmLearningLogRepository : JpaRepository<FarmLearningLogEntity, String> {

    fun findTopByUserIdAndContentIdOrderByCreatedAtDesc(
        userId: String,
        contentId: String
    ): FarmLearningLogEntity?

    fun findByUserIdAndContentIdIn(
        userId: String,
        contentIds: List<String>
    ): List<FarmLearningLogEntity>

    fun findTop50ByUserIdOrderByCreatedAtDesc(userId: String): List<FarmLearningLogEntity>

    fun findByUserIdAndStatusAndCompletedAtBetween(
        userId: String,
        status: String,
        start: java.time.LocalDateTime,
        end: java.time.LocalDateTime
    ): List<FarmLearningLogEntity>

    @Query(
        "SELECT f.contentId AS contentId, COUNT(f) AS cnt " +
        "FROM FarmLearningLogEntity f " +
        "WHERE f.contentId IN :contentIds " +
        "GROUP BY f.contentId"
    )
    fun countByContentIds(contentIds: List<String>): List<ContentCountProjection>

    @Query(
        "SELECT f.contentId AS contentId, COUNT(f) AS cnt " +
        "FROM FarmLearningLogEntity f " +
        "WHERE f.contentId IN :contentIds AND f.status = 'COMPLETED' " +
        "GROUP BY f.contentId"
    )
    fun countCompletedByContentIds(contentIds: List<String>): List<ContentCountProjection>

    // 오늘 학습 완료한 고유 학생 수 (전체)
    @Query(
        "SELECT COUNT(DISTINCT f.userId) FROM FarmLearningLogEntity f " +
        "WHERE f.completedAt >= :since"
    )
    fun countDistinctUserByCompletedAtAfter(since: java.time.LocalDateTime): Long

    // 오늘 학습 완료한 고유 학생 수 (특정 기관 소속)
    @Query(
        "SELECT COUNT(DISTINCT f.userId) FROM FarmLearningLogEntity f " +
        "WHERE f.completedAt >= :since " +
        "AND f.userId IN (SELECT m.userId FROM com.korfarm.api.org.OrgMembershipEntity m WHERE m.orgId = :orgId AND m.status = 'active')"
    )
    fun countDistinctUserByCompletedAtAfterAndOrgId(since: java.time.LocalDateTime, orgId: String): Long

    @Query(
        "SELECT COALESCE(SUM(f.earnedSeed), 0) FROM FarmLearningLogEntity f " +
        "WHERE f.userId = :userId AND f.contentType = :contentType " +
        "AND f.status = 'COMPLETED' AND f.completedAt >= :since"
    )
    fun sumEarnedSeedByUserAndContentTypeSince(
        userId: String, contentType: String, since: java.time.LocalDateTime
    ): Int
}

interface ContentCountProjection {
    val contentId: String
    val cnt: Long
}

