package com.korfarm.api.learning

data class SeedGrant(
    val seedType: String,
    val count: Int
)

data class SubmitResult(
    val score: Int,
    val correctCount: Int,
    val seedGrant: SeedGrant
)

data class StreakInfo(
    val currentStreak: Int,
    val bestStreak: Int
)
