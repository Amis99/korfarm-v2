package com.korfarm.api.chat

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDateTime

interface OcrUsageLogRepository : JpaRepository<OcrUsageLogEntity, String> {
    @Query(
        """
        SELECT COALESCE(SUM(o.imageCount), 0) FROM OcrUsageLogEntity o
        WHERE o.userId = :userId
          AND o.channel = :channel
          AND o.occurredAt >= :start
        """,
    )
    fun sumImageCountByUserAndChannelSince(
        @Param("userId") userId: String,
        @Param("channel") channel: String,
        @Param("start") start: LocalDateTime,
    ): Long

    @Query(
        """
        SELECT COALESCE(SUM(o.imageCount), 0) FROM OcrUsageLogEntity o
        WHERE o.orgId = :orgId
          AND o.channel = :channel
          AND o.occurredAt >= :start
        """,
    )
    fun sumImageCountByOrgAndChannelSince(
        @Param("orgId") orgId: String,
        @Param("channel") channel: String,
        @Param("start") start: LocalDateTime,
    ): Long
}
