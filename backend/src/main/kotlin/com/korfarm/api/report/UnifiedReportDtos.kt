package com.korfarm.api.report

import java.time.LocalDate

// 최상위 응답
data class UnifiedReportResponse(
    val studentId: String,
    val studentName: String,
    val period: ReportPeriod,
    val summary: ReportSummary,
    val sections: ReportSections,
    val trend: List<TrendPoint>,
    val radarData: RadarData,
    val areaStats: List<AreaStats> = emptyList(),
    val competencyStats: List<CompetencyStats> = emptyList(),
    val competencyRadarData: RadarData? = null,
    val recommendations: List<LearningRecommendation> = emptyList(),
    val calendar: List<CalendarDay> = emptyList()
)

data class ReportPeriod(
    val startDate: LocalDate,
    val endDate: LocalDate
)

data class ReportSummary(
    val totalActivities: Int,
    val averageScore: Double,
    val bestSection: String?,
    val weakestSection: String?,
    val totalStudyDays: Int,
    val bestCompetency: String? = null,
    val weakestCompetency: String? = null
)

data class ReportSections(
    val examOmr: ExamOmrSection,
    val farmMode: FarmModeSection,
    val dailyQuiz: DailyActivitySection,
    val dailyReading: DailyActivitySection,
    val proMode: ProModeSection,
    val studyPlan: StudyPlanSection? = null
)

// 시험 OMR 영역
data class ExamOmrSection(
    val count: Int,
    val averageScore: Double,
    val averageAccuracy: Double,
    val highestScore: Int?,
    val lowestScore: Int?,
    val normalizedScore: Double,
    val items: List<ExamOmrItem>
)

data class ExamOmrItem(
    val testId: String,
    val testTitle: String,
    val score: Int,
    val totalPoints: Int,
    val correctCount: Int,
    val totalQuestions: Int,
    val accuracy: Double,
    val submittedAt: String?,
    val submissionId: String? = null
)

// 농장 모드 영역
data class FarmModeSection(
    val count: Int,
    val averageScore: Double,
    val averageAccuracy: Double,
    val normalizedScore: Double,
    val totalEarnedSeed: Int,
    val items: List<FarmModeItem>,
    val modeSummary: List<FarmModeSummary> = emptyList()
)

data class FarmModeItem(
    val contentId: String,
    val contentType: String,
    val contentTypeLabel: String? = null,
    val contentTitle: String? = null,
    val score: Int?,
    val accuracy: Int?,
    val earnedSeed: Int,
    val completedAt: String?
)

data class FarmModeSummary(
    val modeLabel: String,
    val count: Int
)

// 일일 퀴즈 / 일일 독해 공용
data class DailyActivitySection(
    val count: Int,
    val averageScore: Double,
    val normalizedScore: Double,
    val items: List<DailyActivityItem>
)

data class DailyActivityItem(
    val contentId: String,
    val score: Int?,
    val submittedAt: String?
)

// 프로 모드 영역
data class ProModeSection(
    val completedItems: Int,
    val testCount: Int,
    val averageTestScore: Double,
    val normalizedScore: Double,
    val items: List<ProModeItem>,
    val chapters: List<ReportProChapter> = emptyList()
)

data class ReportProChapter(
    val chapterId: String,
    val chapterNumber: Int,
    val title: String,
    val progressPercent: Int,
    val isTestPassed: Boolean,
    val testAccuracy: Double?,
    val status: String
)

data class ProModeItem(
    val chapterId: String,
    val itemId: String?,
    val contentTitle: String? = null,
    val learningType: String? = null,
    val score: Int?,
    val status: String,
    val createdAt: String?
)

// 역량별 누적 분석 (프로 모드 테스트 전체 합산) — 하위호환용 유지
data class CompetencyBreakdown(
    val correct: Int,
    val total: Int,
    val accuracy: Double
)

// 학습 계획표 영역
data class StudyPlanSection(
    val totalCells: Int,
    val completedCells: Int,
    val submittedCells: Int,
    val pendingCells: Int,
    val rejectedCells: Int,
    val completionRate: Double,
    val normalizedScore: Double,
    val items: List<StudyPlanItem>,
    val planIds: List<String> = emptyList()
)

data class StudyPlanItem(
    val planTitle: String,
    val scopeLabel: String?,
    val assetLabel: String?,
    val assetType: String?,
    val status: String,
    val score: Int?,
    val reviewedAt: String?
)

// 추이 데이터
data class TrendPoint(
    val date: String,
    val examOmr: Double?,
    val farmMode: Double?,
    val dailyQuiz: Double?,
    val dailyReading: Double?,
    val proMode: Double?,
    val studyPlan: Double? = null,
    val overall: Double?
)

// 레이더 차트
data class RadarData(
    val labels: List<String>,
    val scores: List<Double>
)

// 영역별 통계 (비문학/문학/문법/기타)
data class AreaStats(
    val areaKey: String,
    val areaLabel: String,
    val activityCount: Int,
    val averageScore: Double,
    val subAreas: List<SubAreaStats> = emptyList()
)

data class SubAreaStats(
    val subAreaLabel: String,
    val activityCount: Int,
    val averageScore: Double
)

// 역량별 통계
data class CompetencyStats(
    val competencyKey: String,
    val competencyLabel: String,
    val score: Double,
    val correct: Int,
    val total: Int,
    val accuracy: Double,
    val sources: List<String>,
    val grade: String
)

// 추천 학습
data class LearningRecommendation(
    val reason: String,
    val targetLabel: String,
    val items: List<RecommendedItem>
)

data class RecommendedItem(
    val contentId: String,
    val contentType: String,
    val label: String,
    val path: String
)

// 캘린더 데이터
data class CalendarDay(
    val date: String,
    val totalCount: Int,
    val activities: List<CalendarActivity>,
    val averageAccuracy: Double? = null
)

data class CalendarActivity(
    val typeLabel: String,
    val count: Int
)
