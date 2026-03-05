package com.korfarm.api.diagnostic.scoring

import kotlin.math.abs

private const val CAT_MIN_QUESTIONS = 15
private const val CAT_MAX_QUESTIONS = 40
private const val EARLY_STOP_MARGIN = 5.0
private const val MIN_TOUCHES_ALL = 3

/**
 * CAT(적응형 테스트) 엔진 — cat_engine.py 포팅.
 * 서술형 문항은 풀에서 제외.
 */
class CatEngine(
    pool: List<QuestionData>,
    private val tier: String
) {
    /** 서술형 제외한 문항 풀 */
    private val pool: List<QuestionData> = pool.filter { it.questionType != "서술형" }

    val scores: MutableMap<String, Double> = ScoringEngine.initScores()
    val touchCounts: MutableMap<String, Int> = ScoringEngine.initTouchCounts()
    val errorContrib: MutableMap<String, MutableMap<String, Double>> = ScoringEngine.initErrorContrib()
    val used: MutableSet<String> = mutableSetOf()
    var answeredCount: Int = 0
    var correctCount: Int = 0

    /** 문항이 측정하는 역량 집합 */
    private fun questionCompetencies(q: QuestionData): Set<String> {
        val comps = mutableSetOf<String>()
        for (choice in q.choices) {
            for (k in choice.vector.keys) {
                val nk = normalizeKey(k)
                if (nk in scores) comps.add(nk)
            }
        }
        return comps
    }

    /** 미측정 역량 */
    private fun untouchedCompetencies(): List<String> {
        return touchCounts.filter { it.value == 0 }.keys.toList()
    }

    /** 약한 역량 n개 */
    private fun weakCompetencies(n: Int = 2): List<String> {
        val touched = scores.filter { touchCounts[it.key]!! > 0 }
        if (touched.isEmpty()) return scores.keys.take(n)
        return touched.entries.sortedBy { it.value }.take(n).map { it.key }
    }

    /** 다음 배치 선택 */
    fun selectNextBatch(batchSize: Int = 5): List<QuestionData> {
        val available = pool.filter { it.questionId !in used }
        if (available.isEmpty()) return emptyList()

        val untouched = untouchedCompetencies()
        val targetComps = if (untouched.isNotEmpty()) untouched.toSet()
        else weakCompetencies(2).toSet()

        data class ScoredQ(val score: Double, val difficulty: Int, val question: QuestionData)

        val scored = available.map { q ->
            val qComps = questionCompetencies(q)
            val overlap = qComps.count { it in targetComps }
            val info = qComps.size
            val s = overlap * 10.0 + info * 2.0 + Math.random()
            ScoredQ(s, q.level ?: 6, q)
        }.sortedByDescending { it.score }

        val batch = mutableListOf<QuestionData>()
        val levelsUsed = mutableSetOf<Int>()
        for (sq in scored) {
            if (batch.size >= batchSize) break
            if (sq.difficulty !in levelsUsed || batch.size < batchSize) {
                batch.add(sq.question)
                levelsUsed.add(sq.difficulty)
                used.add(sq.question.questionId)
            }
        }
        return batch
    }

    /** 응답 처리 → 점수/터치 갱신 */
    fun processResponse(question: QuestionData, choiceId: String) {
        val selected = question.choices.find { it.choiceId == choiceId } ?: return
        answeredCount++
        val vector = selected.vector
        val multiplier = getLevelMultiplier(tier, question.level)
        val isCorrect = choiceId == question.correctChoice

        if (isCorrect) {
            correctCount++
            ScoringEngine.applyVector(scores, vector, CORRECT_WEIGHT, 1.0)
        } else {
            ScoringEngine.applyVector(scores, vector, INCORRECT_WEIGHT, multiplier)
            ScoringEngine.accumulateError(errorContrib, vector, selected.errorPath, INCORRECT_WEIGHT, multiplier)
        }

        for (k in vector.keys) {
            val nk = normalizeKey(k)
            if (nk in touchCounts) {
                touchCounts[nk] = touchCounts[nk]!! + 1
            }
        }

        ScoringEngine.clampScores(scores)
    }

    /** 현재 TCI */
    fun currentTci(): Double = ScoringEngine.calculateTci(scores)

    /** 조기 종료 판단 */
    fun shouldStop(): Pair<Boolean, String> {
        if (answeredCount < CAT_MIN_QUESTIONS) return false to "min_not_reached"
        if (answeredCount >= CAT_MAX_QUESTIONS) return true to "max_reached"

        val available = pool.count { it.questionId !in used }
        if (available == 0) return true to "pool_exhausted"

        val tci = currentTci()
        val boundaries = listOf(35.0, 45.0, 55.0, 65.0)
        val minDist = boundaries.minOf { abs(tci - it) }

        if (minDist >= EARLY_STOP_MARGIN && answeredCount >= 20) {
            val allMeasured = touchCounts.values.all { it >= MIN_TOUCHES_ALL }
            if (allMeasured) return true to "stable_classification"
        }

        if (answeredCount >= 25) {
            val allMeasured = touchCounts.values.all { it >= MIN_TOUCHES_ALL }
            if (allMeasured) {
                val values = scores.values.toList()
                val mean = values.sum() / values.size
                val variance = values.sumOf { (it - mean) * (it - mean) } / values.size
                if (variance < 100) return true to "scores_stable"
            }
        }

        return false to "continue"
    }
}

/** 문항 데이터 (JSON 파싱 후 사용) */
data class QuestionData(
    val questionId: String,
    val passageId: String,
    val tier: String,
    val questionType: String,
    val level: Int?,
    val correctChoice: String?,
    val choices: List<ChoiceData>
)

data class ChoiceData(
    val choiceId: String,
    val text: String,
    val vector: Map<String, Double>,
    val errorPath: String?
)
