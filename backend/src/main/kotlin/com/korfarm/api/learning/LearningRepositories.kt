package com.korfarm.api.learning

import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDateTime

interface LearningAttemptRepository : JpaRepository<LearningAttemptEntity, String> {
    fun existsByUserIdAndActivityTypeAndSubmittedAtBetween(
        userId: String,
        activityType: String,
        start: LocalDateTime,
        end: LocalDateTime
    ): Boolean

    fun findByUserIdAndActivityTypeAndSubmittedAtBetween(
        userId: String,
        activityType: String,
        start: LocalDateTime,
        end: LocalDateTime
    ): List<LearningAttemptEntity>

    /** 같은 학생이 같은 콘텐츠를 오늘 이미 제출했는지 (2026-05-17 contentId 기반 1회 보상 정책). */
    fun existsByUserIdAndContentIdAndSubmittedAtBetween(
        userId: String,
        contentId: String,
        start: LocalDateTime,
        end: LocalDateTime
    ): Boolean
}

interface LearningStreakRepository : JpaRepository<LearningStreakEntity, String> {
    fun findByUserId(userId: String): LearningStreakEntity?
}
