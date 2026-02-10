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
    val accuracy: Int
)

data class FarmCompleteResponse(
    val success: Boolean,
    val earnedSeed: Int
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

data class PageCompleteRequest(
    val logId: String,
    val contentId: String,
    val pageNo: Int,
    val score: Int,
    val accuracy: Int,
    val earnedSeed: Int,
    val seedType: String?
)

data class PageCompleteResponse(
    val success: Boolean,
    val totalEarnedSeed: Int
)

data class PageProgressRequest(
    val contentId: String
)

data class PageProgressResponse(
    val lastCompletedPage: Int,
    val pageResults: List<PageResultDto>
)

data class PageResultDto(
    val pageNo: Int,
    val score: Int,
    val accuracy: Int,
    val earnedSeed: Int
)
