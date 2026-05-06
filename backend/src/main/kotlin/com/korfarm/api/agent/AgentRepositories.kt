package com.korfarm.api.agent

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDateTime

interface AgentChatSessionRepository : JpaRepository<AgentChatSessionEntity, String> {
    fun findByUserIdOrderByUpdatedAtDesc(userId: String): List<AgentChatSessionEntity>

    fun findByUserIdAndStatusOrderByUpdatedAtDesc(userId: String, status: String): List<AgentChatSessionEntity>
}

interface AgentChatMessageRepository : JpaRepository<AgentChatMessageEntity, String> {
    fun findBySessionIdOrderByCreatedAtAsc(sessionId: String): List<AgentChatMessageEntity>

    fun deleteBySessionId(sessionId: String)
}

interface AgentUsageLogRepository : JpaRepository<AgentUsageLogEntity, String> {
    @Query(
        """
        SELECT COUNT(u) FROM AgentUsageLogEntity u
        WHERE u.userId = :userId
          AND u.createdAt >= :start
          AND u.createdAt < :end
          AND u.isExtra = false
    """,
    )
    fun countTurnsInRange(
        @Param("userId") userId: String,
        @Param("start") start: LocalDateTime,
        @Param("end") end: LocalDateTime,
    ): Long

    @Query(
        """
        SELECT COUNT(u) FROM AgentUsageLogEntity u
        WHERE u.userId = :userId
          AND u.createdAt >= :start
          AND u.createdAt < :end
    """,
    )
    fun countAllTurnsInRange(
        @Param("userId") userId: String,
        @Param("start") start: LocalDateTime,
        @Param("end") end: LocalDateTime,
    ): Long
}

interface NotificationRepository : JpaRepository<NotificationEntity, String> {
    fun findByUserIdOrderByCreatedAtDesc(userId: String): List<NotificationEntity>

    @Query(
        """
        SELECT COUNT(n) FROM NotificationEntity n
        WHERE n.userId = :userId AND n.readAt IS NULL
    """,
    )
    fun countUnread(@Param("userId") userId: String): Long
}
