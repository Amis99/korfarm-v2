package com.korfarm.api.learning

data class FarmStartRequest(
    val contentId: String,
    val contentType: String
)

data class FarmStartResponse(
    val logId: String
)

data class FarmCompleteRequest(
    val logId: String,
    val score: Int,
    val earnedSeed: Int,
    val seedType: String?,
    val accuracy: Int,
    val answers: List<AnswerDetailRequest>? = null
)

data class AnswerDetailRequest(
    val questionId: String,
    val questionKind: String? = null,
    val correct: Boolean
)

data class FarmCompleteResponse(
    val success: Boolean,
    val earnedSeed: Int,
    val dailySeedRemaining: Int? = null
)

data class DailySeedStatusResponse(
    val todayEarned: Int,
    val dailyLimit: Int,
    val remaining: Int
)

data class FarmProgressRequest(
    val contentIds: List<String>
)

data class ContentStats(
    val startCount: Long,
    val completeCount: Long
)

data class PersonalStatus(
    val status: String  // NONE | STARTED | COMPLETED
)

data class FarmProgressResponse(
    val stats: Map<String, ContentStats>,
    val myStatus: Map<String, PersonalStatus>
)

data class FarmHistoryEntry(
    val logId: String,
    val contentId: String,
    val contentType: String,
    val contentTitle: String? = null,
    val status: String,
    val score: Int?,
    val accuracy: Int?,
    val earnedSeed: Int,
    val earnedSeedType: String? = null,
    val startedAt: String,
    val completedAt: String?
)

data class FarmHistoryResponse(
    val logs: List<FarmHistoryEntry>
)

