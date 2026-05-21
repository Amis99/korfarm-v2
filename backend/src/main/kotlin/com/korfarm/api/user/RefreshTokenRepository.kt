package com.korfarm.api.user

import org.springframework.data.jpa.repository.JpaRepository

interface RefreshTokenRepository : JpaRepository<RefreshTokenEntity, String> {
    fun findByUserIdAndRevokedAtIsNull(userId: String): List<RefreshTokenEntity>
    fun findByTokenHash(tokenHash: String): RefreshTokenEntity?
    // N-33 (2026-05-22) — 비번 변경·재설정 시 모든 활성 토큰 revoke
    fun findByUserId(userId: String): List<RefreshTokenEntity>
}
