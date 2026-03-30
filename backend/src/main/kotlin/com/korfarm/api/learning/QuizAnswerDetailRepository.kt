package com.korfarm.api.learning

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.time.LocalDateTime

interface QuizAnswerDetailRepository : JpaRepository<QuizAnswerDetailEntity, String> {

    fun findByLogId(logId: String): List<QuizAnswerDetailEntity>

    fun deleteByLogId(logId: String)

    fun findByUserIdAndAnsweredAtBetween(
        userId: String,
        start: LocalDateTime,
        end: LocalDateTime
    ): List<QuizAnswerDetailEntity>

    @Query(
        "SELECT q.questionKind AS questionKind, " +
        "SUM(CASE WHEN q.correct = true THEN 1 ELSE 0 END) AS correctCount, " +
        "COUNT(q) AS totalCount " +
        "FROM QuizAnswerDetailEntity q " +
        "WHERE q.userId = :userId AND q.answeredAt BETWEEN :start AND :end " +
        "AND q.questionKind IS NOT NULL " +
        "GROUP BY q.questionKind"
    )
    fun aggregateByQuestionKind(
        userId: String,
        start: LocalDateTime,
        end: LocalDateTime
    ): List<QuestionKindAggregation>
}

interface QuestionKindAggregation {
    val questionKind: String
    val correctCount: Long
    val totalCount: Long
}
