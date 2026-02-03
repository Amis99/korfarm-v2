package com.korfarm.api.learning

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

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
}

interface ContentCountProjection {
    val contentId: String
    val cnt: Long
}
