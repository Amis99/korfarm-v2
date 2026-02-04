package com.korfarm.api.user

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

interface UserRepository : JpaRepository<UserEntity, String> {
    fun findByEmail(email: String): UserEntity?
    fun existsByEmail(email: String): Boolean
    fun countByStatus(status: String): Long
    fun countByCreatedAtAfter(after: LocalDateTime): Long

    @Modifying
    @Transactional
    @Query(
        "update UserEntity u set u.lastLoginAt = :lastLoginAt, u.updatedAt = :updatedAt where u.id = :id"
    )
    fun updateLastLoginAt(
        @Param("id") id: String,
        @Param("lastLoginAt") lastLoginAt: LocalDateTime,
        @Param("updatedAt") updatedAt: LocalDateTime
    ): Int
}
