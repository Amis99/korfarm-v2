package com.korfarm.api.duel

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.LocalDateTime

@Entity
@Table(name = "duel_rooms")
class DuelRoomEntity(
    @Id
    var id: String,

    @Column(name = "mode_id", nullable = false)
    var modeId: String,

    @Column(name = "level_id", nullable = false)
    var levelId: String,

    @Column(name = "room_size", nullable = false)
    var roomSize: Int,

    @Column(name = "stake_amount", nullable = false)
    var stakeAmount: Int,

    @Column(nullable = false)
    var status: String,

    @Column(name = "created_by", nullable = false)
    var createdBy: String,

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
@Table(name = "duel_room_players")
class DuelRoomPlayerEntity(
    @Id
    var id: String,

    @Column(name = "room_id", nullable = false)
    var roomId: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(name = "stake_crop_type", nullable = false)
    var stakeCropType: String,

    @Column(nullable = false)
    var status: String,

    @Column(name = "joined_at", nullable = false)
    var joinedAt: LocalDateTime,

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
@Table(name = "duel_matches")
class DuelMatchEntity(
    @Id
    var id: String,

    @Column(name = "season_id", nullable = false)
    var seasonId: String,

    @Column(name = "level_id", nullable = false)
    var levelId: String,

    @Column(nullable = false)
    var status: String,

    @Column(name = "started_at")
    var startedAt: LocalDateTime? = null,

    @Column(name = "ended_at")
    var endedAt: LocalDateTime? = null,

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
@Table(name = "duel_match_players")
class DuelMatchPlayerEntity(
    @Id
    var id: String,

    @Column(name = "match_id", nullable = false)
    var matchId: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(nullable = false)
    var result: String,

    @Column(name = "rank_position")
    var rankPosition: Int? = null,

    @Column(name = "stake_crop_type", nullable = false)
    var stakeCropType: String,

    @Column(name = "stake_amount", nullable = false)
    var stakeAmount: Int,

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
@Table(name = "duel_questions")
class DuelQuestionEntity(
    @Id
    var id: String,

    @Column(name = "match_id", nullable = false)
    var matchId: String,

    @Column(name = "question_id", nullable = false)
    var questionId: String,

    @Column(name = "order_index", nullable = false)
    var orderIndex: Int,

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
@Table(name = "duel_answers")
class DuelAnswerEntity(
    @Id
    var id: String,

    @Column(name = "match_id", nullable = false)
    var matchId: String,

    @Column(name = "question_id", nullable = false)
    var questionId: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(name = "answer_json", columnDefinition = "json")
    var answerJson: String? = null,

    @Column(name = "is_correct")
    var isCorrect: Boolean? = null,

    @Column(name = "submitted_at")
    var submittedAt: LocalDateTime? = null,

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
@Table(name = "duel_stats")
class DuelStatEntity(
    @Id
    var id: String,

    @Column(name = "season_id", nullable = false)
    var seasonId: String,

    @Column(name = "level_id", nullable = false)
    var levelId: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(nullable = false)
    var wins: Int,

    @Column(nullable = false)
    var losses: Int,

    @Column(name = "win_rate", nullable = false, precision = 5, scale = 4)
    var winRate: BigDecimal,

    @Column(name = "current_streak", nullable = false)
    var currentStreak: Int,

    @Column(name = "best_streak", nullable = false)
    var bestStreak: Int,

    @Column(name = "forfeit_losses", nullable = false)
    var forfeitLosses: Int,

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
@Table(name = "duel_escrow")
class DuelEscrowEntity(
    @Id
    var id: String,

    @Column(name = "match_id", nullable = false)
    var matchId: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(name = "crop_type", nullable = false)
    var cropType: String,

    @Column(nullable = false)
    var amount: Int,

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
