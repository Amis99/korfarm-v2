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
}

interface LearningStreakRepository : JpaRepository<LearningStreakEntity, String> {
    fun findByUserId(userId: String): LearningStreakEntity?
}
