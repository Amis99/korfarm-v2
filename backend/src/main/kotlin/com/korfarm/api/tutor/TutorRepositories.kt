package com.korfarm.api.tutor

import org.springframework.data.jpa.repository.JpaRepository

interface TutorChatSessionRepository : JpaRepository<TutorChatSessionEntity, String> {
    fun findByUserIdAndStatusOrderByUpdatedAtDesc(userId: String, status: String): List<TutorChatSessionEntity>
}

interface TutorChatMessageRepository : JpaRepository<TutorChatMessageEntity, String> {
    fun findBySessionIdOrderByCreatedAtAsc(sessionId: String): List<TutorChatMessageEntity>
}

interface TutorUsageLogRepository : JpaRepository<TutorUsageLogEntity, String> {
    fun countByUserId(userId: String): Long
}

interface TutorDailyQuotaRepository : JpaRepository<TutorDailyQuotaEntity, TutorDailyQuotaId>

