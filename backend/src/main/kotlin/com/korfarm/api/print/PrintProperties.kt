package com.korfarm.api.print

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "app.print")
data class PrintProperties(
    val enabled: Boolean = false,
    val command: String? = null,
    val workingDir: String? = null,
    val timeoutSeconds: Long = 30
)
