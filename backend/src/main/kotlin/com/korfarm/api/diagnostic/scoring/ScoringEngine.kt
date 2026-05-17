package com.korfarm.api.diagnostic.scoring

import com.korfarm.api.diagnostic.RecommendedLevel

/**
 * 벡터 채점 엔진.
 *
 * v2 알고리즘 (정답률 가중 평균):
 *   - 시작 점수 0
 *   - 각 응시 문항: 그 문항의 정답 vector 양수를 maxScores 에 누적 (측정 가능 가중치)
 *   - 정답 응답: 정답 vector 양수를 scores 에 누적 (실제 획득 가중치)
 *   - 최종 역량 점수 = scores / maxScores × 100
 *
 *   → 무작위 답안 (정답률 ~20%) → 약 20점
 *   → 만점 → 100점
 *   → 정답률에 비례한 직관적 점수
 *
 *   choices_json 의 음수 vector 는 더 이상 채점에 영향 없음
 *   (원하면 error_path 분류·기록용으로 보존)
 */
object ScoringEngine {

    /** 정답 응답 시 호출 — vector 의 양수만 scores 에 누적 */
    fun applyCorrectVector(
        scores: MutableMap<String, Double>,
        vector: Map<String, Double>
    ) {
        for ((k, v) in vector) {
            if (v <= 0) continue
            val nk = normalizeKey(k)
            if (nk !in scores) continue
            scores[nk] = scores[nk]!! + v
        }
    }

    /** 매 응시 문항에서 호출 — 정답 vector 의 양수를 maxScores 에 누적 */
    fun accumulateMaxScores(
        maxScores: MutableMap<String, Double>,
        correctVector: Map<String, Double>
    ) {
        for ((k, v) in correctVector) {
            if (v <= 0) continue
            val nk = normalizeKey(k)
            if (nk !in maxScores) continue
            maxScores[nk] = maxScores[nk]!! + v
        }
    }

    /**
     * 오답 응답 시 호출 — 학생이 고른 선택지의 wrongVector 양수를 scores 에서 차감.
     * (사용자 결정 Option B, 2026-04-28: 오답 → 약점 가중 음수 영향)
     * earned 가 음수가 될 수 있지만 ratioScores 가 0~100 clamp.
     */
    fun applyWrongVector(
        scores: MutableMap<String, Double>,
        wrongVector: Map<String, Double>,
    ) {
        for ((k, v) in wrongVector) {
            if (v <= 0) continue
            val nk = normalizeKey(k)
            if (nk !in scores) continue
            scores[nk] = scores[nk]!! - v
        }
    }

    /** earned / max × 100. 측정 0 인 역량은 0 으로 반환. */
    fun ratioScores(
        earned: Map<String, Double>,
        max: Map<String, Double>
    ): Map<String, Double> {
        return earned.mapValues { (k, v) ->
            val m = max[k] ?: 0.0
            if (m == 0.0) 0.0 else (v / m * 100.0).coerceIn(0.0, 100.0)
        }
    }

    /** [DEPRECATED] 옛 알고리즘용 — 호환을 위해 유지하지만 새 코드 경로에서는 사용 금지. */
    @Deprecated("v2 알고리즘에서는 사용하지 않음. applyCorrectVector + accumulateMaxScores 사용")
    fun applyVector(
        scores: MutableMap<String, Double>,
        vector: Map<String, Double>,
        weight: Double,
        multiplier: Double = 1.0
    ) {
        for ((k, v) in vector) {
            val nk = normalizeKey(k)
            if (nk !in scores) continue
            var delta = v * weight
            if (v < 0) {
                delta *= multiplier
            }
            scores[nk] = scores[nk]!! + delta
        }
    }

    /** [DEPRECATED] v2 는 ratioScores 로 0~100 범위 보장. clamp 별도 호출 불필요. */
    @Deprecated("v2 알고리즘에서는 ratioScores 가 자동 클램프")
    fun clampScores(scores: MutableMap<String, Double>, low: Double = 0.0, high: Double = 100.0) {
        for (k in scores.keys) {
            scores[k] = scores[k]!!.coerceIn(low, high)
        }
    }

    /** 오류경로 기여도 누적 */
    fun accumulateError(
        errorContrib: MutableMap<String, MutableMap<String, Double>>,
        vector: Map<String, Double>,
        errorPath: String?,
        weight: Double,
        multiplier: Double = 1.0
    ) {
        val path = if (errorPath.isNullOrBlank()) "unknown" else errorPath
        for ((k, v) in vector) {
            val nk = normalizeKey(k)
            if (nk !in errorContrib) continue
            var penalty = Math.abs(v * weight)
            if (v < 0) {
                penalty *= multiplier
            }
            if (penalty <= 0) continue
            val pathMap = errorContrib[nk]!!
            pathMap[path] = (pathMap[path] ?: 0.0) + penalty
        }
    }

    /** 신뢰도 계산: 응답 수 기반 [0.0, 1.0] */
    fun calculateConfidence(answeredCount: Int, minQ: Int = MIN_QUESTIONS, fullQ: Int = FULL_CONFIDENCE_QUESTIONS): Double {
        if (answeredCount < minQ) return 0.0
        if (answeredCount >= fullQ) return 1.0
        return (answeredCount - minQ).toDouble() / (fullQ - minQ).toDouble()
    }

    /** TCI를 기준점(base)으로 신뢰도만큼 수축 */
    fun applyConfidenceToTci(rawTci: Double, confidence: Double, base: Double = BASE_SCORE): Double {
        return base + confidence * (rawTci - base)
    }

    /**
     * 벡터합 기반 raw 점수 산식 (2026-05-18 사용자 정의).
     *   점수 = (earnedSum − wrongSum − 0.5 × midSkipCount) / maxSum × 100
     *     earnedSum    : 맞힌 문항의 정답 vector 양수 합 (scores 합)
     *     wrongSum     : 오답 시 고른 선택지의 vector 양수 합
     *     midSkipCount : 마지막 응답 번호 이전의 미응답 문항 수 (시간 부족 후속 빈칸은 제외)
     *     maxSum       : 시험지 전체 정답 vector 양수 합 (maxScores 합)
     *   결과는 0~100 으로 clamp.
     */
    fun calculateVectorSumScore(
        earnedSum: Double,
        wrongSum: Double,
        midSkipCount: Int,
        maxSum: Double,
    ): Double {
        if (maxSum <= 0) return 0.0
        val raw = (earnedSum - wrongSum - 0.5 * midSkipCount) / maxSum * 100.0
        return raw.coerceIn(0.0, 100.0)
    }

    /**
     * raw_tci 기반 레벨 판정 (2026-05-18 새 구간).
     *   < 30 → 한 단계 아래 tier 3 (최저 tier 면 그대로 1)
     *   30 ~ < 45 → 같은 tier 1
     *   45 ~ < 60 → 같은 tier 2
     *   ≥ 60 → 같은 tier 3 (한 단계 위 승급 없음)
     * 낮은 신뢰도(<0.5) 일 때 라벨 뒤에 "(참고)" 표시.
     */
    fun calculateRecommendation(tierKey: String, rawTci: Double, confidence: Double = 1.0): RecommendedLevel {
        val idx = TEST_ORDER.indexOf(tierKey)
        if (idx < 0) return RecommendedLevel(tierKey, null, "Unknown")

        val label = TIER_LABELS[tierKey] ?: tierKey
        val suffix = if (confidence < 0.5) " (참고)" else ""

        if (rawTci < 30) {
            if (idx == 0) return RecommendedLevel(tierKey, 1, "$label 1$suffix")
            val prevKey = TEST_ORDER[idx - 1]
            val prevLabel = TIER_LABELS[prevKey] ?: prevKey
            return RecommendedLevel(prevKey, 3, "$prevLabel 3$suffix")
        }
        if (rawTci < 45) return RecommendedLevel(tierKey, 1, "$label 1$suffix")
        if (rawTci < 60) return RecommendedLevel(tierKey, 2, "$label 2$suffix")
        return RecommendedLevel(tierKey, 3, "$label 3$suffix")
    }

    /** 초기 점수맵 생성 (v2: 시작 0). */
    fun initScores(): MutableMap<String, Double> {
        return COMPETENCIES.associateWith { 0.0 }.toMutableMap()
    }

    /** 초기 maxScores 맵 생성 (v2 신규). */
    fun initMaxScores(): MutableMap<String, Double> {
        return COMPETENCIES.associateWith { 0.0 }.toMutableMap()
    }

    /** 초기 터치카운트 생성 */
    fun initTouchCounts(): MutableMap<String, Int> {
        return COMPETENCIES.associateWith { 0 }.toMutableMap()
    }

    /** 초기 오류기여 맵 생성 */
    fun initErrorContrib(): MutableMap<String, MutableMap<String, Double>> {
        return COMPETENCIES.associateWith { mutableMapOf<String, Double>() }.toMutableMap()
    }

    /** TCI = 전체 역량 점수 평균 */
    fun calculateTci(scores: Map<String, Double>): Double {
        if (scores.isEmpty()) return BASE_SCORE
        return scores.values.sum() / scores.size
    }
}
