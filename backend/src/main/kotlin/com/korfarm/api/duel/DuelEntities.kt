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

    @Column(name = "server_id", nullable = false)
    var serverId: String,

    @Column(name = "room_name", nullable = false)
    var roomName: String = "",

    @Column(name = "room_size", nullable = false)
    var roomSize: Int = 10,

    @Column(name = "stake_amount", nullable = false)
    var stakeAmount: Int,

    @Column(name = "level_id", nullable = false)
    var levelId: String = "",

    @Column(name = "mode_id", nullable = false)
    var modeId: String = "",

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

    @Column(nullable = false)
    var status: String,

    @Column(name = "is_ready", nullable = false)
    var isReady: Boolean = false,

    @Column(name = "stake_seed_type")
    var stakeSeedType: String? = null,

    @Column(name = "stake_crop_type", nullable = false)
    var stakeCropType: String = "",

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

    @Column(name = "room_id")
    var roomId: String? = null,

    @Column(name = "server_id", nullable = false)
    var serverId: String,

    @Column(name = "level_id", nullable = false)
    var levelId: String = "",

    @Column(nullable = false)
    var status: String,

    @Column(name = "time_limit_sec", nullable = false)
    var timeLimitSec: Int = 300,

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

    @Column(name = "stake_amount", nullable = false)
    var stakeAmount: Int,

    @Column(name = "stake_crop_type", nullable = false)
    var stakeCropType: String = "",

    @Column(name = "correct_count", nullable = false)
    var correctCount: Int = 0,

    @Column(name = "total_time_ms", nullable = false)
    var totalTimeMs: Long = 0,

    @Column(name = "reward_amount", nullable = false)
    var rewardAmount: Int = 0,

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

    @Column(name = "time_ms", nullable = false)
    var timeMs: Long = 0,

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

    @Column(name = "server_id", nullable = false)
    var serverId: String,

    @Column(name = "level_id", nullable = false)
    var levelId: String = "",

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

    @Column(name = "seed_type", nullable = false)
    var seedType: String,

    @Column(name = "crop_type", nullable = false)
    var cropType: String = "",

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

@Entity
@Table(name = "duel_question_pool")
class DuelQuestionPoolEntity(
    @Id
    var id: String,

    @Column(name = "server_id", nullable = false)
    var serverId: String,

    @Column(name = "question_type", nullable = false)
    var questionType: String,

    @Column(nullable = false)
    var category: String,

    @Column(name = "question_json", columnDefinition = "json", nullable = false)
    var questionJson: String,

    @Column(nullable = false)
    var status: String = "ACTIVE",

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
