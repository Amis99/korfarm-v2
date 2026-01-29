package com.korfarm.api.season

data class Season(
    val seasonId: String,
    val levelId: String,
    val name: String,
    val startAt: String,
    val endAt: String,
    val status: String
)

data class HarvestRankingItem(
    val rank: Int,
    val userId: String,
    val value: Int
)

data class DuelLeaderboardItem(
    val rank: Int,
    val userId: String,
    val value: Double,
    val matches: Int? = null
)

data class DuelLeaderboards(
    val wins: List<DuelLeaderboardItem>,
    val winRate: List<DuelLeaderboardItem>,
    val bestStreak: List<DuelLeaderboardItem>
)

data class SeasonAwards(
    val harvestAwards: Map<String, Any>,
    val duelAwards: Map<String, Any>
)
