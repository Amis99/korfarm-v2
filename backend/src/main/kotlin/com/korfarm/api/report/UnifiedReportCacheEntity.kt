package com.korfarm.api.report

import jakarta.persistence.*
import org.springframework.data.jpa.repository.JpaRepository
import java.io.Serializable
import java.time.LocalDateTime

@Embeddable
data class UnifiedReportCacheId(
    @Column(name = "user_id", nullable = false) var userId: String = "",
    @Column(name = "period_key", nullable = false) var periodKey: String = "",
) : Serializable

@Entity
@Table(name = "unified_report_cache")
class UnifiedReportCacheEntity(
    @EmbeddedId
    var id: UnifiedReportCacheId,

    @Column(name = "payload_json", columnDefinition = "LONGTEXT", nullable = false)
    var payloadJson: String,

    @Column(name = "ai_enabled", nullable = false)
    var aiEnabled: Boolean = false,

    @Column(name = "generated_at", nullable = false)
    var generatedAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "refreshed_at")
    var refreshedAt: LocalDateTime? = null,
)

interface UnifiedReportCacheRepository : JpaRepository<UnifiedReportCacheEntity, UnifiedReportCacheId>
