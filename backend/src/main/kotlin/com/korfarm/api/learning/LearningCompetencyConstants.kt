package com.korfarm.api.learning

/**
 * 학습/테스트 단위 누적 가중치 (사용자 결정 — Option B, 2026-04-28)
 * - 챕터 테스트 / 테스트 창고: 10
 * - 일일퀴즈: 3
 * - 농장/프로 학습: 1
 */
object LearningCompetencyWeights {
    const val CHAPTER_TEST = 10.0
    const val TEST_PAPER = 10.0
    const val DAILY_QUIZ = 3.0
    const val FARM_LEARNING = 1.0
    const val PRO_LEARNING = 1.0

    fun forSource(source: String): Double = when (source.lowercase()) {
        "chapter_test" -> CHAPTER_TEST
        "test_paper" -> TEST_PAPER
        "daily_quiz" -> DAILY_QUIZ
        "farm_learning" -> FARM_LEARNING
        "pro_learning" -> PRO_LEARNING
        else -> FARM_LEARNING
    }
}

/**
 * 학습 source 분류 — log.contentType (DAILY_QUIZ, PRO_VOCAB 등) 기반.
 * 챕터 테스트/시험지(test_paper) 는 별도 호출 경로에서 명시 지정.
 */
fun resolveSourceFromContentType(contentType: String?): String {
    val ct = (contentType ?: "").uppercase()
    return when {
        ct.contains("DAILY_QUIZ") -> "daily_quiz"
        ct.startsWith("PRO_") -> "pro_learning"
        else -> "farm_learning"
    }
}

/** 슬라이딩 윈도우 크기 — N개 학습/테스트 entry 만 누적에 반영 */
const val LEARNING_COMPETENCY_WINDOW_SIZE = 100
