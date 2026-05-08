package com.korfarm.api.learning

/**
 * 레벨별 우선순위 가중치 — 약점이 없거나 분석 불가할 때 추천 fallback 에 사용.
 *
 * 12레벨 체계:
 *   saussure1~3       (초등 저학년 1~3) — 어휘·문장 독해 우선
 *   frege1~3          (초등 고학년 4~6) — 어휘·문장 균형 + 구조·논리 부상
 *   russell1~3        (중등 1~3)        — 구조·논리 핵심, 선택지 분석 진입
 *   wittgenstein1~3   (고등 1~3)        — 선택지·논리·구조·문제분석 4대 핵심
 *
 * 각 레벨의 가중치 합 ≈ 1.0 으로 정규화. 사용자 명시 패턴(소쉬르1·비트겐슈타인3)은
 * 정확히 따르고, 중간 9개 레벨은 학년 발달 단계에 맞춰 부드럽게 보간.
 *
 * 레벨 별칭(saussure ↔ sohssure, wittgenstein ↔ witt) 은 모두 인식.
 */
object LevelPriorityWeights {

    /** 10대 역량 키 — CompetencyMapping.TEN_COMPETENCIES 와 일치 */
    private val COMPETENCY_KEYS = listOf(
        "어휘력", "문장 독해력", "구조 독해력", "논리 사고력", "어법·문법 능력",
        "국어 개념 적용 능력", "국어 관련 배경지식", "비문학 배경지식",
        "문제 분석 및 전략 수립 능력", "선택지 분석 및 전략 수립 능력",
    )

    /** 4대 영역 키 — CompetencyMapping.AREA_CLASSIFICATION 과 일치 */
    private val AREA_KEYS = listOf("비문학", "문학", "문법", "기타")

    /** 레벨 → 10대 역량 가중치 (합 ≈ 1.0) */
    val COMPETENCY: Map<String, Map<String, Double>> = mapOf(
        // ─── 소쉬르 (초등 저학년) — 어휘·문장 독해·어법 우선 ───
        "saussure1" to mapOf(
            "어휘력" to 0.20, "문장 독해력" to 0.16, "어법·문법 능력" to 0.13,
            "국어 관련 배경지식" to 0.10, "비문학 배경지식" to 0.10,
            "구조 독해력" to 0.08, "논리 사고력" to 0.08,
            "국어 개념 적용 능력" to 0.06,
            "문제 분석 및 전략 수립 능력" to 0.05, "선택지 분석 및 전략 수립 능력" to 0.04,
        ),
        "saussure2" to mapOf(
            "어휘력" to 0.18, "문장 독해력" to 0.17, "어법·문법 능력" to 0.13,
            "국어 관련 배경지식" to 0.10, "비문학 배경지식" to 0.09,
            "구조 독해력" to 0.09, "논리 사고력" to 0.08,
            "국어 개념 적용 능력" to 0.07,
            "문제 분석 및 전략 수립 능력" to 0.05, "선택지 분석 및 전략 수립 능력" to 0.04,
        ),
        "saussure3" to mapOf(
            "어휘력" to 0.16, "문장 독해력" to 0.17, "어법·문법 능력" to 0.13,
            "구조 독해력" to 0.10, "논리 사고력" to 0.09,
            "국어 관련 배경지식" to 0.10, "비문학 배경지식" to 0.09,
            "국어 개념 적용 능력" to 0.07,
            "문제 분석 및 전략 수립 능력" to 0.05, "선택지 분석 및 전략 수립 능력" to 0.04,
        ),

        // ─── 프레게 (초등 고학년) — 어휘·문장 균형 + 구조·논리 부상 ───
        "frege1" to mapOf(
            "어휘력" to 0.15, "문장 독해력" to 0.16, "어법·문법 능력" to 0.12,
            "구조 독해력" to 0.12, "논리 사고력" to 0.10,
            "국어 개념 적용 능력" to 0.08,
            "국어 관련 배경지식" to 0.09, "비문학 배경지식" to 0.09,
            "문제 분석 및 전략 수립 능력" to 0.05, "선택지 분석 및 전략 수립 능력" to 0.04,
        ),
        "frege2" to mapOf(
            "어휘력" to 0.14, "문장 독해력" to 0.15, "어법·문법 능력" to 0.11,
            "구조 독해력" to 0.13, "논리 사고력" to 0.11,
            "국어 개념 적용 능력" to 0.09,
            "국어 관련 배경지식" to 0.09, "비문학 배경지식" to 0.09,
            "문제 분석 및 전략 수립 능력" to 0.05, "선택지 분석 및 전략 수립 능력" to 0.04,
        ),
        "frege3" to mapOf(
            "어휘력" to 0.13, "문장 독해력" to 0.14, "어법·문법 능력" to 0.10,
            "구조 독해력" to 0.14, "논리 사고력" to 0.12,
            "국어 개념 적용 능력" to 0.10,
            "국어 관련 배경지식" to 0.08, "비문학 배경지식" to 0.09,
            "문제 분석 및 전략 수립 능력" to 0.06, "선택지 분석 및 전략 수립 능력" to 0.04,
        ),

        // ─── 러셀 (중등) — 구조·논리 핵심, 선택지·문제분석 진입 ───
        "russell1" to mapOf(
            "어휘력" to 0.11, "문장 독해력" to 0.13, "어법·문법 능력" to 0.09,
            "구조 독해력" to 0.15, "논리 사고력" to 0.13,
            "국어 개념 적용 능력" to 0.10,
            "국어 관련 배경지식" to 0.07, "비문학 배경지식" to 0.09,
            "문제 분석 및 전략 수립 능력" to 0.07, "선택지 분석 및 전략 수립 능력" to 0.06,
        ),
        "russell2" to mapOf(
            "어휘력" to 0.10, "문장 독해력" to 0.12, "어법·문법 능력" to 0.08,
            "구조 독해력" to 0.15, "논리 사고력" to 0.14,
            "국어 개념 적용 능력" to 0.10,
            "국어 관련 배경지식" to 0.06, "비문학 배경지식" to 0.10,
            "문제 분석 및 전략 수립 능력" to 0.08, "선택지 분석 및 전략 수립 능력" to 0.07,
        ),
        "russell3" to mapOf(
            "어휘력" to 0.09, "문장 독해력" to 0.11, "어법·문법 능력" to 0.07,
            "구조 독해력" to 0.15, "논리 사고력" to 0.14,
            "국어 개념 적용 능력" to 0.10,
            "국어 관련 배경지식" to 0.05, "비문학 배경지식" to 0.10,
            "문제 분석 및 전략 수립 능력" to 0.10, "선택지 분석 및 전략 수립 능력" to 0.09,
        ),

        // ─── 비트겐슈타인 (고등) — 선택지·논리·구조·문제분석 4대 핵심 ───
        "wittgenstein1" to mapOf(
            "어휘력" to 0.07, "문장 독해력" to 0.10, "어법·문법 능력" to 0.07,
            "구조 독해력" to 0.14, "논리 사고력" to 0.15,
            "국어 개념 적용 능력" to 0.10,
            "국어 관련 배경지식" to 0.04, "비문학 배경지식" to 0.08,
            "문제 분석 및 전략 수립 능력" to 0.12, "선택지 분석 및 전략 수립 능력" to 0.13,
        ),
        "wittgenstein2" to mapOf(
            "어휘력" to 0.05, "문장 독해력" to 0.10, "어법·문법 능력" to 0.06,
            "구조 독해력" to 0.14, "논리 사고력" to 0.15,
            "국어 개념 적용 능력" to 0.10,
            "국어 관련 배경지식" to 0.04, "비문학 배경지식" to 0.08,
            "문제 분석 및 전략 수립 능력" to 0.13, "선택지 분석 및 전략 수립 능력" to 0.15,
        ),
        "wittgenstein3" to mapOf(
            "어휘력" to 0.04, "문장 독해력" to 0.09, "어법·문법 능력" to 0.06,
            "구조 독해력" to 0.14, "논리 사고력" to 0.16,
            "국어 개념 적용 능력" to 0.10,
            "국어 관련 배경지식" to 0.03, "비문학 배경지식" to 0.07,
            "문제 분석 및 전략 수립 능력" to 0.13, "선택지 분석 및 전략 수립 능력" to 0.18,
        ),
    )

    /** 레벨 → 4대 영역 가중치 (합 ≈ 1.0). 학년 올라갈수록 비문학 ↑ 문법 ↓ 패턴. */
    val AREA: Map<String, Map<String, Double>> = mapOf(
        "saussure1" to mapOf("비문학" to 0.20, "문학" to 0.40, "문법" to 0.25, "기타" to 0.15),
        "saussure2" to mapOf("비문학" to 0.22, "문학" to 0.38, "문법" to 0.25, "기타" to 0.15),
        "saussure3" to mapOf("비문학" to 0.25, "문학" to 0.36, "문법" to 0.24, "기타" to 0.15),
        "frege1" to mapOf("비문학" to 0.28, "문학" to 0.34, "문법" to 0.23, "기타" to 0.15),
        "frege2" to mapOf("비문학" to 0.30, "문학" to 0.32, "문법" to 0.23, "기타" to 0.15),
        "frege3" to mapOf("비문학" to 0.32, "문학" to 0.30, "문법" to 0.23, "기타" to 0.15),
        "russell1" to mapOf("비문학" to 0.35, "문학" to 0.30, "문법" to 0.22, "기타" to 0.13),
        "russell2" to mapOf("비문학" to 0.38, "문학" to 0.30, "문법" to 0.20, "기타" to 0.12),
        "russell3" to mapOf("비문학" to 0.40, "문학" to 0.30, "문법" to 0.20, "기타" to 0.10),
        "wittgenstein1" to mapOf("비문학" to 0.42, "문학" to 0.30, "문법" to 0.18, "기타" to 0.10),
        "wittgenstein2" to mapOf("비문학" to 0.44, "문학" to 0.30, "문법" to 0.16, "기타" to 0.10),
        "wittgenstein3" to mapOf("비문학" to 0.45, "문학" to 0.30, "문법" to 0.15, "기타" to 0.10),
    )

    /** 레벨 별칭 정규화 — sohssure→saussure, witt→wittgenstein. 미인식 시 saussure1 fallback. */
    fun normalizeLevelId(levelId: String?): String {
        if (levelId.isNullOrBlank()) return "saussure1"
        val lower = levelId.lowercase()
        val tier = lower.dropLastWhile { it.isDigit() }
        val num = lower.takeLastWhile { it.isDigit() }.ifBlank { "1" }
        val canonical = when (tier) {
            "saussure", "sohssure" -> "saussure"
            "frege" -> "frege"
            "russell" -> "russell"
            "wittgenstein", "witt" -> "wittgenstein"
            else -> return "saussure1"
        }
        val n = num.toIntOrNull()?.coerceIn(1, 3) ?: 1
        return "$canonical$n"
    }

    /** 레벨별 역량 가중치 — 미인식 레벨은 saussure1 사용. */
    fun competencyWeights(levelId: String?): Map<String, Double> =
        COMPETENCY[normalizeLevelId(levelId)] ?: COMPETENCY["saussure1"]!!

    /** 레벨별 영역 가중치 */
    fun areaWeights(levelId: String?): Map<String, Double> =
        AREA[normalizeLevelId(levelId)] ?: AREA["saussure1"]!!

    /** 가중치 상위 N개 역량 키 */
    fun topCompetencies(levelId: String?, n: Int = 3): List<String> =
        competencyWeights(levelId).entries
            .sortedByDescending { it.value }
            .take(n)
            .map { it.key }

    /** 가중치 상위 N개 영역 키 */
    fun topAreas(levelId: String?, n: Int = 2): List<String> =
        areaWeights(levelId).entries
            .sortedByDescending { it.value }
            .take(n)
            .map { it.key }
}
