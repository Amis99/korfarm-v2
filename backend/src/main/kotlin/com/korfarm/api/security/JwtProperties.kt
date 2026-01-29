package com.korfarm.api.security

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "app.jwt")
data class JwtProperties(
    val issuer: String,
    val secret: String,
    val accessTokenSeconds: Long,
    val refreshTokenSeconds: Long
)
