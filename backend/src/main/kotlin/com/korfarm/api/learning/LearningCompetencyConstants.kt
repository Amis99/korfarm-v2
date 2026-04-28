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

/**
 * test_questions.domain → 10대 역량명 매핑 (1차 default).
 * domain 값은 "어휘", "문법", "독해", "문학", "쓰기", "종합", "비문학", "추론" 등 다양.
 * 매핑 안 되는 domain (예: "쓰기", "종합") 은 null 반환 → 누적 대상 제외.
 *
 * 추후 세분화 가능 (예: "독해" 를 "문장 독해력"·"구조 독해력" 으로 분기).
 */
fun mapDomainToCompetency(domain: String?): String? {
    if (domain.isNullOrBlank()) return null
    val d = domain.trim()
    return when {
        d.contains("어휘") -> "어휘력"
        d.contains("문법") || d.contains("어법") -> "어법·문법 능력"
        d.contains("문장") -> "문장 독해력"
        d.contains("구조") -> "구조 독해력"
        d.contains("논리") || d.contains("추론") -> "논리 사고력"
        d.contains("개념") -> "국어 개념 적용 능력"
        d.contains("문학") -> "국어 관련 배경지식"
        d.contains("비문학") -> "비문학 배경지식"
        d.contains("발문") || d.contains("문제 분석") -> "문제 분석 및 전략 수립 능력"
        d.contains("선택지") -> "선택지 분석 및 전략 수립 능력"
        // 일반 "독해" 는 구조 독해력으로 (가장 포괄적)
        d.contains("독해") -> "구조 독해력"
        else -> null  // 쓰기/종합 등 매핑 불가 → 누적 제외
    }
}
