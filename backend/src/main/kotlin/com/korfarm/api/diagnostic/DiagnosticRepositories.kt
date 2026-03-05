package com.korfarm.api.diagnostic

import org.springframework.data.jpa.repository.JpaRepository

interface DiagPassageRepository : JpaRepository<DiagPassageEntity, String> {
    fun findByTierOrderByLevelAscIdAsc(tier: String): List<DiagPassageEntity>
}

interface DiagQuestionRepository : JpaRepository<DiagQuestionEntity, String> {
    fun findByTierOrderByIdAsc(tier: String): List<DiagQuestionEntity>
    fun findByPassageIdOrderByOrderInPassageAsc(passageId: String): List<DiagQuestionEntity>
    fun findByTierAndQuestionTypeNotOrderByIdAsc(tier: String, excludeType: String): List<DiagQuestionEntity>
    fun countByTier(tier: String): Long
    fun countByTierAndQuestionTypeNot(tier: String, excludeType: String): Long
}

interface DiagSessionRepository : JpaRepository<DiagSessionEntity, String> {
    fun findByUserIdOrderByStartedAtDesc(userId: String): List<DiagSessionEntity>
    fun findByUserIdAndTierOrderByStartedAtDesc(userId: String, tier: String): List<DiagSessionEntity>
    fun findByUserIdAndStatus(userId: String, status: String): List<DiagSessionEntity>
    fun findByStatusOrderByStartedAtDesc(status: String): List<DiagSessionEntity>
    fun findByTierAndStatus(tier: String, status: String): List<DiagSessionEntity>
}

interface DiagResponseRepository : JpaRepository<DiagResponseEntity, String> {
    fun findBySessionIdOrderByResponseOrderAsc(sessionId: String): List<DiagResponseEntity>
    fun countBySessionId(sessionId: String): Long
}
