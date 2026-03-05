package com.korfarm.api.diagnostic

// ── 요청 DTO ──

data class CreateSessionRequest(
    val tier: String,
    val mode: String // "full" | "cat"
)

data class SubmitResponsesRequest(
    val responses: List<SingleResponse>
)

data class SingleResponse(
    val questionId: String,
    val choice: String // "A"~"E"
)

// ── 응답 DTO ──

data class TierInfo(
    val tier: String,
    val label: String,
    val questionCount: Long,
    val hasCompleted: Boolean,
    val lastTci: Double?
)

data class SessionCreatedResponse(
    val sessionId: String,
    val firstBatch: List<QuestionDto>
)

data class SessionStatusResponse(
    val sessionId: String,
    val status: String,
    val answeredCount: Int,
    val currentBatch: List<QuestionDto>?
)

data class SubmitResponsesResponse(
    val nextBatch: List<QuestionDto>?,
    val shouldStop: Boolean,
    val interim: InterimReport?
)

data class QuestionDto(
    val questionId: String,
    val passageId: String,
    val passageText: String?,
    val tier: String,
    val questionType: String,
    val stem: String,
    val boxContent: String?,
    val choices: List<ChoiceDto>,
    val orderInPassage: Int
)

data class ChoiceDto(
    val choiceId: String,
    val text: String
    // vector와 error_path는 클라이언트에 노출하지 않음
)

data class InterimReport(
    val answeredCount: Int,
    val correctCount: Int,
    val rawTci: Double,
    val adjustedTci: Double,
    val confidence: Double,
    val scores: Map<String, Double>,
    val weakCompetencies: List<String>
)

data class DiagnosticReport(
    val sessionId: String,
    val tier: String,
    val tierLabel: String,
    val mode: String,
    val answeredCount: Int,
    val correctCount: Int,
    val rawTci: Double,
    val adjustedTci: Double,
    val confidence: Double,
    val recommendedLevel: RecommendedLevel,
    val competencyScores: Map<String, Double>,
    val weakCompetencies: List<String>,
    val strongCompetencies: List<String>,
    val bottleneckAnalysis: List<BottleneckItem>,
    // v2 확장 필드
    val accuracyRate: Double = 0.0,
    val completedAt: String? = null,
    val competencyDetails: List<CompetencyDetail> = emptyList(),
    val questionTypeAnalysis: List<QuestionTypeStats> = emptyList(),
    val genreAnalysis: List<GenreStats> = emptyList(),
    val passageAnalysis: List<PassageStats> = emptyList(),
    val fullErrorAnalysis: List<BottleneckItem> = emptyList(),
    val questionReviews: List<QuestionReviewItem> = emptyList(),
    val touchCounts: Map<String, Int> = emptyMap(),
    val competencyNarratives: Map<String, String> = emptyMap(),
    val statistics: TierStatistics? = null,
    val percentiles: PercentileInfo? = null,
)

data class RecommendedLevel(
    val testKey: String,
    val level: Int?,
    val label: String
)

data class BottleneckItem(
    val competency: String,
    val score: Double,
    val topErrorPaths: List<ErrorPathEntry>
)

data class ErrorPathEntry(
    val path: String,
    val contribution: Double
)

// ── 리포트 확장 DTO ──

data class CompetencyDetail(
    val name: String,
    val score: Double,
    val grade: String,           // "상", "중", "하"
    val rank: Int,               // 10개 역량 중 순위 (1=최고)
    val description: String,     // 역량 설명
    val narrative: String,       // 진단 내러티브
    val touchCount: Int,         // 측정 횟수
    val relatedAccuracy: Double, // 관련 문항 정답률 (%)
    val topErrorPaths: List<ErrorPathEntry>,
    val percentile: Double? = null,  // 동일 tier 내 백분위
)

data class QuestionTypeStats(
    val questionType: String,
    val totalCount: Int,
    val correctCount: Int,
    val accuracyRate: Double,    // 정답률 (%)
)

data class GenreStats(
    val genre: String,
    val totalCount: Int,
    val correctCount: Int,
    val accuracyRate: Double,
)

data class PassageStats(
    val passageId: String,
    val genre: String,
    val level: Int,
    val preview: String,         // 지문 미리보기 (첫 100자)
    val totalQuestions: Int,
    val correctCount: Int,
    val accuracyRate: Double,
)

data class QuestionReviewItem(
    val questionId: String,
    val stem: String,
    val questionType: String,
    val choices: List<ReviewChoiceItem>,
    val correctChoice: String?,
    val selectedChoice: String?,
    val isCorrect: Boolean,
    val affectedCompetencies: List<String>,
    val errorPath: String?,
)

data class ReviewChoiceItem(
    val choiceId: String,
    val text: String,
    val isCorrect: Boolean,
    val isSelected: Boolean,
)

data class TierStatistics(
    val totalSessions: Int,
    val tciStats: ScoreStats,
    val accuracyStats: ScoreStats,
    val competencyStats: Map<String, ScoreStats>,
)

data class ScoreStats(
    val average: Double,
    val max: Double,
    val min: Double,
)

data class PercentileInfo(
    val tciPercentile: Double,
    val accuracyPercentile: Double,
    val competencyPercentiles: Map<String, Double>,
)

data class SessionHistoryItem(
    val sessionId: String,
    val tier: String,
    val tci: Double?,
    val level: String?,
    val date: String,
    val mode: String,
    val status: String
)

// ── 관리자 DTO ──

data class AdminQuestionSummary(
    val id: String,
    val passageId: String,
    val tier: String,
    val questionType: String,
    val stem: String,
    val correctChoice: String?
)

data class AdminSessionSummary(
    val sessionId: String,
    val userId: String,
    val tier: String,
    val mode: String,
    val status: String,
    val answeredCount: Int,
    val adjustedTci: Double?,
    val startedAt: String
)

data class AdminSessionDetail(
    val session: AdminSessionSummary,
    val responses: List<AdminResponseItem>,
    val report: DiagnosticReport?
)

data class AdminResponseItem(
    val responseOrder: Int,
    val questionId: String,
    val selectedChoice: String?,
    val isCorrect: Boolean,
    val batchNumber: Int?
)

data class DiagnosticStatistics(
    val totalSessions: Long,
    val completedSessions: Long,
    val tierStats: List<TierStat>
)

data class TierStat(
    val tier: String,
    val totalSessions: Long,
    val completedSessions: Long,
    val averageTci: Double?
)
