package com.korfarm.api.learning

data class Question(
    val questionId: String,
    val text: String,
    val type: String,
    val choices: List<String> = emptyList()
)

data class DailyQuizContent(
    val contentId: String,
    val title: String,
    val questions: List<Question>
)

data class DailyReadingContent(
    val contentId: String,
    val title: String,
    val passage: String,
    val questions: List<Question>
)

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
