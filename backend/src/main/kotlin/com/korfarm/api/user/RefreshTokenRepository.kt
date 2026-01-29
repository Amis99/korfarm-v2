package com.korfarm.api.user

import org.springframework.data.jpa.repository.JpaRepository

interface RefreshTokenRepository : JpaRepository<RefreshTokenEntity, String> {
    fun findByUserIdAndRevokedAtIsNull(userId: String): List<RefreshTokenEntity>
}
