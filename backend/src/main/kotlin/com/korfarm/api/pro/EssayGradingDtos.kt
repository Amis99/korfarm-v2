package com.korfarm.api.pro

import java.time.LocalDateTime

// 키워드 채점 요청
data class KeywordGradeRequest(
    val submissionId: String,
    val questionNumber: Int
)

// AI 채점 요청
data class AiGradeRequest(
    val submissionId: String,
    val questionNumber: Int
)

// AI 일괄 채점 요청
data class AiGradeBatchRequest(
    val submissionId: String
)

// 최종 점수 확정 요청
data class ConfirmGradeRequest(
    val gradingId: String,
    val finalScore: Int
)

// 채점 결과 뷰
data class EssayGradingView(
    val gradingId: String,
    val submissionId: String,
    val testId: String,
    val questionNumber: Int,
    val userId: String,
    val studentAnswer: String?,
    val keywordScore: Int?,
    val keywordDetail: KeywordDetailView?,
    val aiScore: Int?,
    val aiFeedback: String?,
    val finalScore: Int?,
    val maxPoints: Int,
    val modelAnswer: String?,
    val status: String,
    val createdAt: LocalDateTime
)

data class KeywordDetailView(
    val matched: List<String>,
    val missed: List<String>,
    val totalKeywords: Int
)
