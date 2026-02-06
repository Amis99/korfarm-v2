package com.korfarm.api.duel

import java.time.LocalDateTime

data class DuelRoomView(
    val roomId: String,
    val serverId: String,
    val roomName: String,
    val roomSize: Int,
    val stakeAmount: Int,
    val status: String,
    val playerCount: Int,
    val createdBy: String,
    val createdAt: LocalDateTime
)

data class DuelRoomDetail(
    val room: DuelRoomView,
    val players: List<DuelRoomPlayerView>
)

data class DuelRoomPlayerView(
    val userId: String,
    val userName: String?,
    val status: String,
    val isReady: Boolean,
    val joinedAt: LocalDateTime,
    val profileImageUrl: String? = null,
    val levelId: String? = null,
    val wins: Int = 0,
    val losses: Int = 0,
    val winRate: Double = 0.0
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
    val currentQuestionIndex: Int = 0,
    val timeRemainingSec: Int? = null,
    val players: List<DuelPlayerProgress>
)

data class DuelPlayerProgress(
    val userId: String,
    val userName: String? = null,
    val answered: Int,
    val correctCount: Int = 0,
    val answeredCurrent: Boolean = false,
    val active: Boolean = true
)

data class DuelQuestionView(
    val questionId: String,
    val orderIndex: Int,
    val questionType: String,
    val category: String,
    val stem: String,
    val passage: String?,
    val choices: List<DuelChoiceView>,
    val timeLimitSec: Int? = null
)

data class DuelChoiceView(
    val id: String,
    val text: String
)

data class DuelMatchResultView(
    val userId: String,
    val userName: String?,
    val result: String,
    val rankPosition: Int?,
    val correctCount: Int,
    val answeredCount: Int,
    val totalTimeMs: Long,
    val rewardAmount: Int
)

data class DuelMatchResultDetailView(
    val matchId: String,
    val serverId: String,
    val roomId: String? = null,
    val results: List<DuelMatchResultView>,
    val totalEscrow: Int,
    val systemFee: Int
)
