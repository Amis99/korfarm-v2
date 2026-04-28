package com.korfarm.api.learning

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.diagnostic.scoring.COMPETENCIES
import com.korfarm.api.diagnostic.scoring.normalizeKey
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

/**
 * 한 문항의 응시 결과 (벡터 기반).
 * - correctVector: 이 문항의 정답 시 누적될 역량 가중치 (예: {어휘력: 0.7, 문장 독해력: 0.3})
 * - chosenWrongVector: 학생이 고른 오답 선택지의 약점 벡터 (정답일 땐 null)
 * - isCorrect: 정답 여부
 *
 * 누적 규칙 (Option B, 사용자 결정):
 *   max[c]    += sourceWeight × correctVector[c]   (항상)
 *   if 정답: earned[c] += sourceWeight × correctVector[c]
 *   if 오답: earned[c] -= sourceWeight × chosenWrongVector[c]
 */
data class QuestionResult(
    val correctVector: Map<String, Double>,
    val chosenWrongVector: Map<String, Double>? = null,
    val isCorrect: Boolean,
)

/**
 * 학습/테스트 종합 누적 역량 서비스
 *
 * 흐름:
 *  1) 학습/테스트 완료 시 record() 호출
 *  2) 동일 (user_id, content_id) 가 이미 in_window 면 무시 (해당 학습 최초 1회만)
 *  3) 새 log INSERT (in_window=true)
 *  4) in_window=true 가 N(=100) 초과 시 가장 오래된 1개를 in_window=false 로 처리
 *  5) user_competency_summary 재계산 (윈도우 내 entry 가중평균)
 *
 * 알고리즘 (가중 ratio, 진단 v2 패턴 + weight 도입):
 *   for each competency c:
 *     earned[c] = Σ (weight_i × measured_i[c] × ratio_i[c])
 *     max[c]    = Σ (weight_i × measured_i[c])
 *     ratio[c]  = earned[c] / max[c] × 100   (max=0 이면 0)
 */
@Service
class LearningCompetencyService(
    private val logRepository: LearningCompetencyLogRepository,
    private val summaryRepository: UserCompetencySummaryRepository,
    private val objectMapper: ObjectMapper,
) {

    /**
     * [DEPRECATED] 단순 ratio 기반 — vector 가 없는 옛 호출자를 위한 fallback.
     * 내부적으로 ratioByCompetency 를 자동 벡터로 변환 (각 역량 가중치=1.0).
     */
    @Deprecated("벡터 기반 record(results) 사용 권장")
    @Transactional
    fun record(
        userId: String,
        contentId: String,
        source: String,
        ratioByCompetency: Map<String, Double>,
    ): Boolean {
        if (ratioByCompetency.isEmpty()) return false
        // 단일 역량당 1개 entry 로 변환: correctVector={c: 1.0}, isCorrect = (ratio==1.0). 부분 정답 표현 어려움 → 점진 폐기.
        val results = ratioByCompetency.map { (c, r) ->
            QuestionResult(
                correctVector = mapOf(c to 1.0),
                chosenWrongVector = null,
                isCorrect = r >= 1.0,  // 단순화 — 진단 v2 패턴이라 1.0 외엔 모두 오답 처리
            )
        }
        return recordVector(userId, contentId, source, results)
    }

    /**
     * 학습 1회 결과(벡터 기반)를 누적 시스템에 기록.
     *
     * @param results 문항별 응시 결과 (correctVector + chosenWrongVector + isCorrect)
     * @return true=신규 누적, false=재응시로 무시
     */
    @Transactional
    fun recordVector(
        userId: String,
        contentId: String,
        source: String,
        results: List<QuestionResult>,
    ): Boolean {
        if (results.isEmpty()) return false
        // 재응시 차단
        if (logRepository.existsByUserIdAndContentId(userId, contentId)) return false

        val weight = LearningCompetencyWeights.forSource(source)

        // 이번 학습의 entry 한 row — 학습 전체 누적 (correctVector × weight 합산 × 정답률)
        // log 안에는 "이 학습이 측정한 정답률(0~1)" 을 역량별로 저장 (재계산용)
        val earned = COMPETENCIES.associateWith { 0.0 }.toMutableMap()
        val maxV = COMPETENCIES.associateWith { 0.0 }.toMutableMap()
        for (r in results) {
            for ((c, w) in r.correctVector) {
                if (w <= 0) continue
                val nk = normalizeKey(c)
                if (nk !in maxV) continue
                maxV[nk] = maxV.getValue(nk) + w
                if (r.isCorrect) earned[nk] = earned.getValue(nk) + w
            }
            if (!r.isCorrect && r.chosenWrongVector != null) {
                for ((c, w) in r.chosenWrongVector) {
                    if (w <= 0) continue
                    val nk = normalizeKey(c)
                    if (nk !in earned) continue
                    earned[nk] = earned.getValue(nk) - w  // Option B: 약점 가중 음수
                }
            }
        }

        // 학습 전체 ratio (역량별 정답률 0~1)
        val ratio = COMPETENCIES.associateWith { c ->
            val m = maxV.getValue(c)
            if (m <= 0.0) 0.0 else (earned.getValue(c) / m).coerceIn(-1.0, 1.0)  // 음수 가능
        }
        val measured = COMPETENCIES.associateWith { c -> if (maxV.getValue(c) > 0) 1 else 0 }

        val now = LocalDateTime.now()
        val log = LearningCompetencyLogEntity(
            id = IdGenerator.newId("lcl"),
            userId = userId,
            contentId = contentId,
            source = source,
            weight = weight,
            vectorJson = objectMapper.writeValueAsString(ratio),
            measuredJson = objectMapper.writeValueAsString(measured),
            inWindow = true,
            completedAt = now,
        )
        logRepository.save(log)

        evictOldestIfExceeded(userId)
        recomputeSummary(userId)
        return true
    }

    /** 윈도우 N 초과 시 가장 오래된 in_window=true 1개를 false 처리 */
    private fun evictOldestIfExceeded(userId: String) {
        val count = logRepository.countInWindow(userId)
        if (count <= LEARNING_COMPETENCY_WINDOW_SIZE) return
        // 1개씩 밀어냄 (현재 호출에서 1건만 추가했으므로 1번만)
        val asc = logRepository.findInWindowAsc(userId)
        val toEvict = asc.size - LEARNING_COMPETENCY_WINDOW_SIZE
        if (toEvict <= 0) return
        for (i in 0 until toEvict) {
            asc[i].inWindow = false
        }
        logRepository.saveAll(asc.take(toEvict))
    }

    /** 윈도우 내 모든 entry 를 모아 user_competency_summary 갱신 */
    private fun recomputeSummary(userId: String) {
        val entries = logRepository.findInWindowDesc(userId)
        val typeRef = object : TypeReference<Map<String, Double>>() {}
        val intTypeRef = object : TypeReference<Map<String, Int>>() {}

        val earnedTotal = COMPETENCIES.associateWith { 0.0 }.toMutableMap()
        val maxTotal = COMPETENCIES.associateWith { 0.0 }.toMutableMap()
        val sampleCount = COMPETENCIES.associateWith { 0 }.toMutableMap()

        for (e in entries) {
            val v: Map<String, Double> = try { objectMapper.readValue(e.vectorJson, typeRef) } catch (_: Exception) { emptyMap() }
            val m: Map<String, Int> = try { objectMapper.readValue(e.measuredJson, intTypeRef) } catch (_: Exception) { emptyMap() }
            for (c in COMPETENCIES) {
                val measured = (m[c] ?: 0).toDouble()
                if (measured == 0.0) continue
                // Option B: ratio 가 음수 가능 (학생이 약점 누적). -1.0 ~ 1.0 범위 허용.
                val ratio = (v[c] ?: 0.0).coerceIn(-1.0, 1.0)
                earnedTotal[c] = earnedTotal.getValue(c) + e.weight * measured * ratio
                maxTotal[c] = maxTotal.getValue(c) + e.weight * measured
                sampleCount[c] = sampleCount.getValue(c) + 1
            }
        }

        val now = LocalDateTime.now()
        val existing = summaryRepository.findByUserId(userId).associateBy { it.competency }.toMutableMap()
        val updates = mutableListOf<UserCompetencySummaryEntity>()
        for (c in COMPETENCIES) {
            val ent = existing[c] ?: UserCompetencySummaryEntity(userId = userId, competency = c)
            ent.earnedTotal = earnedTotal.getValue(c)
            ent.maxTotal = maxTotal.getValue(c)
            // 표시용 ratioScore: 0~100 clamp (earned 가 음수면 0)
            ent.ratioScore = if (ent.maxTotal > 0.0)
                ((ent.earnedTotal / ent.maxTotal) * 100.0).coerceIn(0.0, 100.0)
            else 0.0
            ent.sampleCount = sampleCount.getValue(c)
            ent.updatedAt = now
            updates.add(ent)
        }
        summaryRepository.saveAll(updates)
    }

    /** 사용자별 누적 요약 조회 (10대 역량 모두 포함) */
    @Transactional(readOnly = true)
    fun getSummary(userId: String): Map<String, UserCompetencySummaryView> {
        val rows = summaryRepository.findByUserId(userId).associateBy { it.competency }
        return COMPETENCIES.associateWith { c ->
            val r = rows[c]
            UserCompetencySummaryView(
                competency = c,
                ratioScore = r?.ratioScore ?: 0.0,
                sampleCount = r?.sampleCount ?: 0,
                updatedAt = r?.updatedAt?.toString(),
            )
        }
    }
}

data class UserCompetencySummaryView(
    val competency: String,
    val ratioScore: Double,
    val sampleCount: Int,
    val updatedAt: String?,
)
