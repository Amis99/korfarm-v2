package com.korfarm.api.learning

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.diagnostic.scoring.COMPETENCIES
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

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
     * 학습 1회 결과를 누적 시스템에 기록.
     *
     * @param userId 사용자
     * @param contentId 콘텐츠 ID — 동일 contentId 재응시는 무시
     * @param source chapter_test / test_paper / daily_quiz / farm_learning / pro_learning
     * @param ratioByCompetency 이 학습이 측정한 역량별 정답률 (0~1). 측정 안 한 역량은 키 자체 없음.
     * @return true=신규 누적, false=재응시로 무시
     */
    @Transactional
    fun record(
        userId: String,
        contentId: String,
        source: String,
        ratioByCompetency: Map<String, Double>,
    ): Boolean {
        // 측정 가능한 competency 가 0개면 누적할 게 없음
        if (ratioByCompetency.isEmpty()) return false

        // 재응시 차단 — 동일 user × content 가 이미 in_window 안에 있으면 무시
        if (logRepository.existsByUserIdAndContentId(userId, contentId)) {
            return false
        }

        val weight = LearningCompetencyWeights.forSource(source)

        // measured map: 측정한 역량은 1, 아니면 0
        val measured = COMPETENCIES.associateWith { name ->
            if (ratioByCompetency.containsKey(name)) 1 else 0
        }
        // vector: 측정 안 한 역량은 0.0 (의미 없음, measured=0 이라 누적에 안 들어감)
        val vector = COMPETENCIES.associateWith { name ->
            ratioByCompetency[name]?.coerceIn(0.0, 1.0) ?: 0.0
        }

        val now = LocalDateTime.now()
        val log = LearningCompetencyLogEntity(
            id = IdGenerator.newId("lcl"),
            userId = userId,
            contentId = contentId,
            source = source,
            weight = weight,
            vectorJson = objectMapper.writeValueAsString(vector),
            measuredJson = objectMapper.writeValueAsString(measured),
            inWindow = true,
            completedAt = now,
        )
        logRepository.save(log)

        // 슬라이딩 윈도우 — 윈도우 초과 시 가장 오래된 entry 를 in_window=false 로
        evictOldestIfExceeded(userId)

        // 요약 재계산
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
                val ratio = (v[c] ?: 0.0).coerceIn(0.0, 1.0)
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
            ent.ratioScore = if (ent.maxTotal > 0.0) (ent.earnedTotal / ent.maxTotal) * 100.0 else 0.0
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
