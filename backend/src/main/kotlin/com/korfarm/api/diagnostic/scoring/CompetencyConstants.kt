package com.korfarm.api.diagnostic.scoring

/** 10대 핵심 역량 */
val COMPETENCIES = listOf(
    "어휘력",
    "문장 독해력",
    "구조 독해력",
    "논리 사고력",
    "어법·문법 능력",
    "국어 개념 적용 능력",
    "국어 관련 배경지식",
    "비문학 배경지식",
    "문제 분석 및 전략 수립 능력",
    "선택지 분석 및 전략 수립 능력",
)

val COMPETENCIES_SET = COMPETENCIES.toSet()

/** 레거시 역량명 → 정규화 매핑 */
val KEY_MAPPING = mapOf(
    "문학 배경지식" to "국어 관련 배경지식",
    "배경지식" to "국어 관련 배경지식",
)

fun normalizeKey(k: String): String {
    val trimmed = k.trim()
    return KEY_MAPPING[trimmed] ?: trimmed
}

/** tier별 레벨 범위 */
val LEVEL_BAND_RANGES = mapOf(
    "sohssure" to (1 to 3),
    "frege" to (4 to 6),
    "russell" to (7 to 9),
    "wittgenstein" to (10 to 12),
)

/** 밴드 내 위치별 multiplier */
val LEVEL_MULTIPLIERS = mapOf(1 to 1.0, 2 to 1.2, 3 to 1.4)

/** tier 표시 라벨 */
val TIER_LABELS = mapOf(
    "sohssure" to "소쉬르",
    "frege" to "프레게",
    "russell" to "러셀",
    "wittgenstein" to "비트겐슈타인",
)

val TEST_ORDER = listOf("sohssure", "frege", "russell", "wittgenstein")

/** tier별 대상 학년 매핑 */
val TIER_GRADE_RANGES = mapOf(
    "sohssure" to listOf("초1", "초2", "초3"),
    "frege" to listOf("초4", "초5", "초6"),
    "russell" to listOf("중1", "중2", "중3"),
    "wittgenstein" to listOf("고1", "고2", "고3"),
)

/** 레벨 multiplier 계산 */
fun getLevelMultiplier(tier: String, level: Int?): Double {
    if (level == null) return 1.0
    val range = LEVEL_BAND_RANGES[tier] ?: return 1.0
    if (level !in range.first..range.second) return 1.0
    val band = level - range.first + 1
    return LEVEL_MULTIPLIERS[band] ?: 1.0
}

/** 10대 역량별 설명 텍스트 */
val COMPETENCY_DESCRIPTIONS = mapOf(
    "어휘력" to "단어의 의미, 어원, 관용 표현 등을 정확히 이해하고 활용하는 능력입니다. 어휘력이 높을수록 글의 세밀한 뉘앙스를 파악하고 정확한 표현을 구사할 수 있습니다.",
    "문장 독해력" to "개별 문장의 의미를 정확히 파악하고, 문장 내 핵심 정보를 추출하는 능력입니다. 복잡한 문장 구조에서도 주어-서술어 관계와 수식 관계를 올바르게 이해합니다.",
    "구조 독해력" to "글 전체의 구조와 흐름을 파악하는 능력입니다. 문단 간 관계, 글의 전개 방식, 논증 구조 등을 이해하여 글의 핵심 주제와 논지를 정확히 읽어냅니다.",
    "논리 사고력" to "글에 담긴 논리적 관계를 분석하고 추론하는 능력입니다. 전제와 결론의 관계, 인과관계, 비교·대조 등의 논리적 구조를 파악하고 타당성을 평가합니다.",
    "어법·문법 능력" to "한국어의 문법 규칙과 어법을 정확히 이해하고 적용하는 능력입니다. 맞춤법, 띄어쓰기, 문장 성분의 호응, 높임법 등 국어 규범에 대한 이해도를 나타냅니다.",
    "국어 개념 적용 능력" to "교과 과정에서 배운 국어 개념(비유법, 서사 구조, 논증 방식 등)을 실제 작품이나 글에 적용하는 능력입니다.",
    "국어 관련 배경지식" to "문학사, 작가, 시대적 배경, 갈래별 특성 등 국어 교과 관련 배경지식의 폭과 깊이를 나타냅니다.",
    "비문학 배경지식" to "사회, 과학, 기술, 예술, 철학 등 비문학 제재에 대한 배경지식입니다. 다양한 분야의 글을 이해하는 데 기반이 됩니다.",
    "문제 분석 및 전략 수립 능력" to "문제(발문)를 정확히 분석하고 풀이 전략을 수립하는 능력입니다. 문제가 요구하는 바를 정확히 파악하고 효율적인 접근법을 선택합니다.",
    "선택지 분석 및 전략 수립 능력" to "선택지 간의 미세한 차이를 비교·분석하고, 오답을 소거하며 정답에 도달하는 전략적 사고 능력입니다.",
)

/** 점수 구간별 진단 내러티브 생성 */
fun generateNarrative(name: String, score: Double, touchCount: Int): String {
    val reliability = when {
        touchCount >= 8 -> "충분히 측정되었습니다"
        touchCount >= 4 -> "보통 수준으로 측정되었습니다"
        else -> "측정 횟수가 적어 참고 수준입니다"
    }
    val level = when {
        score >= 75 -> "'$name' 역량이 매우 우수합니다. 상위권 실력으로, 관련 문항에서 높은 정답률을 보였습니다."
        score >= 65 -> "'$name' 역량이 우수합니다. 대부분의 관련 문항을 정확히 풀었으며, 고난도 문항에 도전할 수 있는 수준입니다."
        score >= 55 -> "'$name' 역량은 평균 이상입니다. 기본적인 이해는 갖추고 있으나, 심화 문항에서 실수가 나타납니다."
        score >= 45 -> "'$name' 역량은 평균 수준입니다. 기초는 갖추고 있으나 응용력 강화가 필요합니다."
        score >= 35 -> "'$name' 역량이 다소 부족합니다. 기초 개념을 재점검하고 관련 유형의 문제를 집중적으로 연습할 필요가 있습니다."
        else -> "'$name' 역량이 취약합니다. 기초부터 체계적으로 학습하는 것을 권장합니다."
    }
    return "$level ($reliability)"
}

// 채점 설정 상수
const val BASE_SCORE = 50.0
const val CORRECT_WEIGHT = 0.5
const val INCORRECT_WEIGHT = 0.8
const val MIN_QUESTIONS = 10
const val FULL_CONFIDENCE_QUESTIONS = 40
