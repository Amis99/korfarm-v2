package com.korfarm.api.payment

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "app.toss")
data class TossProperties(
    val clientKey: String,
    val secretKey: String
)
