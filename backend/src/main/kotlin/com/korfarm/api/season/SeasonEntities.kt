package com.korfarm.api.season

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "seasons")
class SeasonEntity(
    @Id
    var id: String,

    @Column(nullable = false)
    var name: String,

    @Column(name = "level_id", nullable = false)
    var levelId: String,

    @Column(name = "start_at", nullable = false)
    var startAt: LocalDateTime,

    @Column(name = "end_at", nullable = false)
    var endAt: LocalDateTime,

    @Column(nullable = false)
    var status: String,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    @PrePersist
    fun onCreate() {
        val now = LocalDateTime.now()
        createdAt = now
        updatedAt = now
    }

    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }
}

@Entity
@Table(name = "season_harvest_rankings")
class SeasonHarvestRankingEntity(
    @Id
    var id: String,

    @Column(name = "season_id", nullable = false)
    var seasonId: String,

    @Column(name = "level_id", nullable = false)
    var levelId: String,

    @Column(name = "ranking_json", columnDefinition = "json", nullable = false)
    var rankingJson: String,

    @Column(name = "generated_at", nullable = false)
    var generatedAt: LocalDateTime,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    @PrePersist
    fun onCreate() {
        val now = LocalDateTime.now()
        createdAt = now
        updatedAt = now
    }

    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }
}

@Entity
@Table(name = "season_duel_rankings")
class SeasonDuelRankingEntity(
    @Id
    var id: String,

    @Column(name = "season_id", nullable = false)
    var seasonId: String,

    @Column(name = "level_id", nullable = false)
    var levelId: String,

    @Column(name = "ranking_json", columnDefinition = "json", nullable = false)
    var rankingJson: String,

    @Column(name = "generated_at", nullable = false)
    var generatedAt: LocalDateTime,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    @PrePersist
    fun onCreate() {
        val now = LocalDateTime.now()
        createdAt = now
        updatedAt = now
    }

    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }
}

@Entity
@Table(name = "season_award_snapshots")
class SeasonAwardSnapshotEntity(
    @Id
    var id: String,

    @Column(name = "season_id", nullable = false)
    var seasonId: String,

    @Column(name = "snapshot_json", columnDefinition = "json", nullable = false)
    var snapshotJson: String,

    @Column(name = "captured_at", nullable = false)
    var capturedAt: LocalDateTime,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    @PrePersist
    fun onCreate() {
        val now = LocalDateTime.now()
        createdAt = now
        updatedAt = now
    }

    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }
}
