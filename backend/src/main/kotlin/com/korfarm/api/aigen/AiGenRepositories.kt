package com.korfarm.api.aigen

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDateTime

interface GrammarCorpusRepository : JpaRepository<GrammarCorpusEntity, String> {
    fun findByTopicAndStatusOrderByCreatedAtDesc(topic: String, status: String): List<GrammarCorpusEntity>
    fun findByStatusOrderByCreatedAtDesc(status: String): List<GrammarCorpusEntity>
}

interface LearningConceptRepository : JpaRepository<LearningConceptEntity, String> {
    fun findByAreaAndStatusOrderByDisplayOrderAsc(area: String, status: String): List<LearningConceptEntity>
    fun findByAreaAndSubAreaAndStatusOrderByDisplayOrderAsc(
        area: String, subArea: String, status: String
    ): List<LearningConceptEntity>
}

interface AiGenLogRepository : JpaRepository<AiGenLogEntity, String> {
    /**
     * 사용자별 특정 kind 의 시간 범위 안 호출 횟수 (성공만 — error 는 미과금 회피).
     * 일일 사용 한도 검사용. 같은 generate() 호출이 여러 callClaude row 를 만들 수
     * 있으니, 정확히 "사용자가 봇을 호출한 횟수"를 세려면 별도 카운트 필요. 일단은 row 단위.
     */
    @Query("""
        SELECT COUNT(l) FROM AiGenLogEntity l
        WHERE l.userId = :userId
          AND l.kind IN :kinds
          AND l.status = 'success'
          AND l.createdAt >= :from
          AND l.createdAt < :to
    """)
    fun countByUserAndKindsInRange(
        @Param("userId") userId: String,
        @Param("kinds") kinds: Collection<String>,
        @Param("from") from: LocalDateTime,
        @Param("to") to: LocalDateTime
    ): Long
}
