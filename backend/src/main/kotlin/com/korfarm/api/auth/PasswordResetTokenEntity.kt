package com.korfarm.api.auth

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.Table
import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDateTime

/**
 * N-34 (2026-05-22) — 이메일 토큰 기반 비밀번호 재설정.
 * tokenHash 만 저장 (평문은 이메일 링크에서만 노출). 1회 사용 + 30분 만료.
 */
@Entity
@Table(name = "password_reset_tokens")
class PasswordResetTokenEntity(
    @Id
    var id: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(name = "token_hash", nullable = false, unique = true)
    var tokenHash: String,

    @Column(name = "expires_at", nullable = false)
    var expiresAt: LocalDateTime,

    @Column(name = "used_at")
    var usedAt: LocalDateTime? = null,

    @Column(name = "request_ip")
    var requestIp: String? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),
) {
    @PrePersist
    fun onCreate() {
        createdAt = LocalDateTime.now()
    }
}

interface PasswordResetTokenRepository : JpaRepository<PasswordResetTokenEntity, String> {
    fun findByTokenHash(tokenHash: String): PasswordResetTokenEntity?
    fun findByUserIdAndUsedAtIsNull(userId: String): List<PasswordResetTokenEntity>
}
