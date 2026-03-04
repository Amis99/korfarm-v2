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
    val radarData: RadarData
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
    val totalStudyDays: Int
)

data class ReportSections(
    val examOmr: ExamOmrSection,
    val farmMode: FarmModeSection,
    val dailyQuiz: DailyActivitySection,
    val dailyReading: DailyActivitySection,
    val proMode: ProModeSection
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
    val submittedAt: String?
)

// 농장 모드 영역
data class FarmModeSection(
    val count: Int,
    val averageScore: Double,
    val averageAccuracy: Double,
    val normalizedScore: Double,
    val totalEarnedSeed: Int,
    val items: List<FarmModeItem>
)

data class FarmModeItem(
    val contentId: String,
    val contentType: String,
    val score: Int?,
    val accuracy: Int?,
    val earnedSeed: Int,
    val completedAt: String?
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
    val items: List<ProModeItem>
)

data class ProModeItem(
    val chapterId: String,
    val itemId: String?,
    val score: Int?,
    val status: String,
    val createdAt: String?
)

// 추이 데이터
data class TrendPoint(
    val date: String,
    val examOmr: Double?,
    val farmMode: Double?,
    val dailyQuiz: Double?,
    val dailyReading: Double?,
    val proMode: Double?,
    val overall: Double?
)

// 레이더 차트
data class RadarData(
    val labels: List<String>,
    val scores: List<Double>
)
