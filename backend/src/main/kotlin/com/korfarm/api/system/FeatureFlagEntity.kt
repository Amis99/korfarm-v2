package com.korfarm.api.system

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "feature_flags")
class FeatureFlagEntity(
    @Id
    @Column(name = "flag_key")
    var flagKey: String,

    @Column(nullable = false)
    var enabled: Boolean,

    @Column(name = "rollout_percent", nullable = false)
    var rolloutPercent: Int,

    @Column
    var description: String? = null,

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    @PrePersist
    fun onCreate() {
        updatedAt = LocalDateTime.now()
    }

    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }
}
