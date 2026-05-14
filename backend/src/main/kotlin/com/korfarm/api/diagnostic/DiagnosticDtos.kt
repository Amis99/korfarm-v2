package com.korfarm.api.diagnostic

// ── 요청 DTO ──

data class CreateSessionRequest(
    val tier: String,
    val mode: String? = "online" // 'online' (기본) | 'offline' (인쇄 OMR)
)

data class SubmitResponsesRequest(
    val responses: List<SingleResponse>
)

data class SingleResponse(
    val questionId: String,
    val choice: String // "A"~"E"
)

/** 인쇄 OMR 답안 일괄 제출 (test_papers의 number → 정답 매핑) */
data class FromOmrRequest(
    val tier: String,
    /** key = test_questions.number(문항번호), value = "A"|"B"|"C"|"D"|"E"|null */
    val answers: Map<String, String?>
)

data class FromOmrResponse(
    val sessionId: String,
    val report: DiagnosticReport
)

// ── 응답 DTO ──

data class TierInfo(
    val tier: String,
    val label: String,
    val questionCount: Long,
    val hasCompleted: Boolean,
    val lastTci: Double?,
    val lastSessionId: String? = null,
    val objectiveCount: Long = 0  // 서술형 제외 문항 수
)

data class SessionCreatedResponse(
    val sessionId: String,
    val firstBatch: List<QuestionDto>
)

data class SessionStatusResponse(
    val sessionId: String,
    val status: String,
    val answeredCount: Int,
    val currentBatch: List<QuestionDto>?,
    val mode: String?
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
    val gradeContext: String? = null,
    // 풀이 시간 정보
    val timeSpentSec: Int? = null,        // 시작~마지막 마킹 경과(초)
    val effectiveSpeedSec: Int? = null,   // 보정 풀이속도 = timeSpentSec + (오답수 × 180)
    val speedMinPerQuestion: Double? = null, // 풀이속도 (분/문항) = effectiveSpeedSec/60/answeredCount
    val speedPercentile: Double? = null,  // 같은 tier 내 풀이속도 백분위 (낮을수록 빠름, 1등 0% 꼴등 100%)
    val speedDistribution: SpeedDistribution? = null,  // 0% / 50% / 100% 의 분/문항 값
    val totalQuestions: Int = 48,         // 전체 문항 수 (진단은 항상 48)
    // AI 총평 (Claude Sonnet 생성, 무과금) — 진단 결과 종합 분석 500자 내외
    val aiSummary: String? = null,
    // 약점 역량 기반 상세 추천 콘텐츠 목록 (RecommendationService)
    val recommendedContents: List<RecommendedContentBrief> = emptyList(),
)

/** 같은 단계 응시자의 풀이 속도 분포 (분/문항) */
data class SpeedDistribution(
    val fastestMinPerQ: Double,   // 0% — 가장 빠른 응시자의 분/문항
    val medianMinPerQ: Double,    // 50% — 중앙값
    val slowestMinPerQ: Double,   // 100% — 가장 느린 응시자의 분/문항
    val sampleSize: Int,          // 비교 대상 응시자 수
)

/** 진단 리포트에 박는 추천 콘텐츠 간략 DTO */
data class RecommendedContentBrief(
    val contentId: String,
    val title: String,
    val contentType: String,
    val levelId: String?,
    val area: String?,
    val subArea: String?,
    val reason: String,
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
    val score: Double?,          // 측정된 정답률 (0~100), 미측정 시 null
    val measured: Boolean,       // 한 번이라도 측정됐는지
    val grade: String,           // "상", "중", "하", "미측정"
    val rank: Int,               // 측정된 역량 중 순위 (1=최고), 미측정시 0
    val description: String,     // 역량 설명
    val narrative: String,       // 진단 내러티브
    val touchCount: Int,         // 측정 횟수
    val relatedAccuracy: Double, // 관련 문항 정답률 (%) — score와 동일
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
