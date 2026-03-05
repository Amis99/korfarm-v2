package com.korfarm.api.diagnostic.scoring

import com.korfarm.api.diagnostic.RecommendedLevel

/**
 * 벡터 채점 엔진 — scoring.py 포팅.
 * 모든 함수는 순수 함수 또는 in-place 변경.
 */
object ScoringEngine {

    /** 역량 벡터를 누적 점수에 적용 */
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

    /** 모든 점수를 [low, high]로 클램프 */
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

    /** TCI + 신뢰도 기반 레벨 추천 (raw TCI 사용, 낮은 신뢰도 시 "(참고)" 표시) */
    fun calculateRecommendation(tierKey: String, rawTci: Double, confidence: Double = 1.0): RecommendedLevel {
        val idx = TEST_ORDER.indexOf(tierKey)
        if (idx < 0) return RecommendedLevel(tierKey, null, "Unknown")

        val label = TIER_LABELS[tierKey] ?: tierKey
        val suffix = if (confidence < 0.5) " (참고)" else ""

        if (rawTci < 35) {
            if (idx == 0) return RecommendedLevel(tierKey, 1, "$label 1$suffix")
            val prevKey = TEST_ORDER[idx - 1]
            val prevLabel = TIER_LABELS[prevKey] ?: prevKey
            return RecommendedLevel(prevKey, 3, "$prevLabel 3$suffix")
        }
        if (rawTci < 45) return RecommendedLevel(tierKey, 1, "$label 1$suffix")
        if (rawTci < 55) return RecommendedLevel(tierKey, 2, "$label 2$suffix")
        if (rawTci < 65) return RecommendedLevel(tierKey, 3, "$label 3$suffix")

        if (idx == TEST_ORDER.size - 1) return RecommendedLevel(tierKey, 3, "$label 3$suffix")
        val nextKey = TEST_ORDER[idx + 1]
        val nextLabel = TIER_LABELS[nextKey] ?: nextKey
        return RecommendedLevel(nextKey, 1, "$nextLabel 1$suffix")
    }

    /** 초기 점수맵 생성 */
    fun initScores(): MutableMap<String, Double> {
        return COMPETENCIES.associateWith { BASE_SCORE }.toMutableMap()
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
