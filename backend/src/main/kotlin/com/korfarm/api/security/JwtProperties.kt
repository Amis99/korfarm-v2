package com.korfarm.api.security

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "app.jwt")
data class JwtProperties(
    val issuer: String,
    val secret: String,
    /** 관리자(HQ_ADMIN/ORG_ADMIN) access token 수명 (초). 기본 8시간 */
    val accessTokenSeconds: Long,
    /** 학생/학부모 access token 수명 (초). 기본 8시간 (관리자와 동일).
     *  차이점은 refresh token 미발급 — 탭/브라우저 닫으면 즉시 로그아웃. */
    val studentAccessTokenSeconds: Long = 28800,
    /** 관리자 전용 refresh token 수명 (초). 기본 14일 */
    val refreshTokenSeconds: Long
)
