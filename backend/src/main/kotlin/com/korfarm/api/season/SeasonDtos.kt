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
    val userName: String = "",
    val value: Int,
    val profileImageUrl: String? = null
)

data class DuelLeaderboardItem(
    val rank: Int,
    val userId: String,
    val value: Double,
    val matches: Int? = null,
    /** "이름 (학교 학년)" 형식. 학생이면 채워지고, 정보 없거나 AI 면 null. */
    val displayName: String? = null,
    val name: String? = null,
    val school: String? = null,
    val grade: String? = null
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
