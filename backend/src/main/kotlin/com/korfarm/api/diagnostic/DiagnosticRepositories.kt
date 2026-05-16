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

interface DiagOmrDraftRepository : JpaRepository<DiagOmrDraftEntity, DiagOmrDraftId> {
    /** 만료된 pending draft — Scheduler 자동 제출 대상 */
    fun findByStatusAndDeadlineBefore(status: String, deadline: java.time.LocalDateTime): List<DiagOmrDraftEntity>

    /** 비관적 락 — 중복 submit 동시 호출 시 두 번째 호출이 첫 호출 commit 까지 대기.
     *  (이동건 사고 2026-05-16: 12초 간격 두 번 제출 → 두 세션 생성 fix.) */
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query(
        "select d from DiagOmrDraftEntity d where d.id.userId = :userId and d.id.tier = :tier"
    )
    fun findForUpdate(
        @org.springframework.data.repository.query.Param("userId") userId: String,
        @org.springframework.data.repository.query.Param("tier") tier: String
    ): DiagOmrDraftEntity?
}

