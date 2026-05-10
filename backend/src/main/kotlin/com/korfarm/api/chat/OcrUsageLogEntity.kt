package com.korfarm.api.chat

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "ocr_usage_log")
class OcrUsageLogEntity(
    @Id
    var id: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(nullable = false, length = 16)
    var channel: String,

    @Column(name = "org_id")
    var orgId: String? = null,

    @Column(name = "image_count", nullable = false)
    var imageCount: Int = 1,

    @Column(name = "occurred_at", nullable = false)
    var occurredAt: LocalDateTime = LocalDateTime.now(),
)
