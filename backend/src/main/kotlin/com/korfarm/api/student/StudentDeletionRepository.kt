package com.korfarm.api.student

import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDateTime

interface StudentDeletionLogRepository : JpaRepository<StudentDeletionLogEntity, String> {
    fun findAllByHardDeletedAtIsNullOrderByCreatedAtDesc(): List<StudentDeletionLogEntity>
    fun findByUserIdAndHardDeletedAtIsNull(userId: String): StudentDeletionLogEntity?
}
