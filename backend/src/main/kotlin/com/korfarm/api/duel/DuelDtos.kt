package com.korfarm.api.duel

import java.time.LocalDateTime

data class DuelRoomView(
    val roomId: String,
    val levelId: String,
    val roomSize: Int,
    val stakeAmount: Int,
    val status: String,
    val playerCount: Int,
    val createdAt: LocalDateTime
)

data class DuelRoomDetail(
    val room: DuelRoomView,
    val players: List<DuelRoomPlayerView>
)

data class DuelRoomPlayerView(
    val userId: String,
    val status: String,
    val stakeCropType: String,
    val joinedAt: LocalDateTime
)

data class DuelQueueStatus(
    val status: String,
    val position: Int? = null,
    val estimatedWaitSeconds: Int? = null,
    val matchId: String? = null
)

data class DuelRoomJoinResult(
    val room: DuelRoomDetail,
    val matchId: String? = null
)

data class DuelStatsView(
    val wins: Int,
    val losses: Int,
    val winRate: Double,
    val currentStreak: Int,
    val bestStreak: Int,
    val forfeitLosses: Int
)

data class DuelMatchState(
    val matchId: String,
    val totalQuestions: Int,
    val players: List<DuelPlayerProgress>
)

data class DuelPlayerProgress(
    val userId: String,
    val answered: Int
)

data class DuelMatchResultView(
    val userId: String,
    val result: String,
    val rankPosition: Int?
)
