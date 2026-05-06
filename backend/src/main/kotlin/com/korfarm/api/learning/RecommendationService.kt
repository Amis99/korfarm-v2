package com.korfarm.api.learning

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.classification.ContentClassificationRepository
import com.korfarm.api.diagnostic.scoring.COMPETENCIES
import com.korfarm.api.paid.ContentEntity
import com.korfarm.api.paid.ContentRepository
import com.korfarm.api.paid.ContentVersionRepository
import com.korfarm.api.user.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * 학습 콘텐츠 추천 서비스 — AI 비서·튜터 양쪽이 호출하는 공용 서비스.
 *
 * 추천 3종 (사용자 명시):
 * 1. 10대 역량별 × 레벨별 — 약점 보강 (recommendForCompetency)
 * 2. 영역·세부영역별 × 레벨별 (recommendForArea)
 * 3. 주제·태그별 × 레벨별 (recommendForTheme)
 *
 * 모든 추천은 "이미 푼 콘텐츠 제외" 규칙 적용.
 */
@Service
class RecommendationService(
    private val contentRepository: ContentRepository,
    private val contentVersionRepository: ContentVersionRepository,
    private val contentClassificationRepository: ContentClassificationRepository,
    private val competencyLogRepository: LearningCompetencyLogRepository,
    private val competencySummaryRepository: UserCompetencySummaryRepository,
    private val userRepository: UserRepository,
    private val objectMapper: ObjectMapper,
) {
    private val log = LoggerFactory.getLogger(RecommendationService::class.java)

    data class RecommendedContent(
        val contentId: String,
        val title: String,
        val contentType: String,
        val levelId: String?,
        val area: String?,
        val subArea: String?,
        val score: Double,
        val reason: String,
    )

    /**
     * 1. 역량별 추천 — 학생의 약점 역량 보강.
     * - userId 의 가장 약한 역량 1~3개를 자동 식별 (또는 인자 competency 명시)
     * - 해당 역량의 competencyVector 가중치가 높은 콘텐츠 우선
     * - 학생이 이미 풀어 본 콘텐츠 제외
     */
    @Transactional(readOnly = true)
    fun recommendForCompetency(
        userId: String,
        competency: String? = null,
        levelId: String? = null,
        limit: Int = 10,
    ): List<RecommendedContent> {
        val targetLevel = levelId ?: userRepository.findById(userId).orElse(null)?.levelId

        // 약점 역량 자동 식별 (competency 미지정 시)
        val targetCompetencies: List<String> = if (competency != null) {
            if (competency in COMPETENCIES) listOf(competency) else return emptyList()
        } else {
            val summaries = competencySummaryRepository.findByUserId(userId)
            // 측정된 것 중 ratioScore 낮은 순, 측정 없는 것은 prior 50 으로 가정
            COMPETENCIES.sortedBy { c ->
                summaries.firstOrNull { it.competency == c }?.ratioScore ?: 50.0
            }.take(3)
        }

        // 이미 푼 콘텐츠 제외
        val solvedIds = competencyLogRepository.findInWindowDesc(userId).map { it.contentId }.toSet()

        // 후보 콘텐츠 — 레벨 일치 + active. competencyVector 보유 우선.
        val candidates = if (targetLevel != null) {
            contentRepository.findByContentTypeAndLevelIdAndStatus("DAILY_QUIZ", targetLevel, "active")
                .ifEmpty { contentRepository.findByAreaAndLevelIdAndStatus("nonfiction", targetLevel, "active") }
        } else {
            contentRepository.findByStatus("active").take(500)  // 안전 제한
        }

        val pool = candidates.filter { it.id !in solvedIds }
        if (pool.isEmpty()) return emptyList()

        // 각 후보의 점수 = 약점 역량들에 대한 competencyVector 가중치 합
        val typeRef = object : TypeReference<Map<String, Any>>() {}
        val scored = pool.mapNotNull { content ->
            try {
                val ver = contentVersionRepository.findTopByContentIdOrderByCreatedAtDesc(content.id)
                    ?: return@mapNotNull null
                val root: Map<String, Any> = objectMapper.readValue(ver.contentJson, typeRef)
                @Suppress("UNCHECKED_CAST")
                val payload = (root["payload"] as? Map<String, Any>) ?: root
                @Suppress("UNCHECKED_CAST")
                val questions = (payload["questions"] as? List<Map<String, Any>>) ?: emptyList()

                var totalScore = 0.0
                for (q in questions) {
                    @Suppress("UNCHECKED_CAST")
                    val cv = (q["competencyVector"] as? Map<String, Any>)
                        ?: q["competency"]?.toString()?.let { mapOf(it to 1.0) }
                        ?: continue
                    for (tc in targetCompetencies) {
                        val w = (cv[tc] as? Number)?.toDouble() ?: 0.0
                        if (w > 0.0) totalScore += w
                    }
                }
                if (totalScore <= 0.0) null
                else RecommendedContent(
                    contentId = content.id,
                    title = content.title,
                    contentType = content.contentType,
                    levelId = content.levelId,
                    area = content.area,
                    subArea = content.subArea,
                    score = totalScore,
                    reason = "약점 보강(${targetCompetencies.joinToString("/")})",
                )
            } catch (e: Exception) {
                log.debug("recommendForCompetency: skip {} — {}", content.id, e.message)
                null
            }
        }.sortedByDescending { it.score }

        return scored.take(limit)
    }

    /**
     * 2. 영역·세부영역별 추천 — area + subArea 매칭. 이미 푼 것 제외.
     */
    @Transactional(readOnly = true)
    fun recommendForArea(
        userId: String,
        area: String? = null,
        subArea: String? = null,
        levelId: String? = null,
        limit: Int = 10,
    ): List<RecommendedContent> {
        val targetLevel = levelId ?: userRepository.findById(userId).orElse(null)?.levelId
        val solvedIds = competencyLogRepository.findInWindowDesc(userId).map { it.contentId }.toSet()

        val pool: List<ContentEntity> = when {
            area != null && targetLevel != null -> contentRepository.findByAreaAndLevelIdAndStatus(area, targetLevel, "active")
            area != null -> contentRepository.findByAreaAndStatus(area, "active")
            targetLevel != null -> contentRepository.findByContentTypeAndLevelIdAndStatus("DAILY_READING", targetLevel, "active")
            else -> emptyList()
        }
        val filtered = pool
            .filter { it.id !in solvedIds }
            .filter { subArea == null || it.subArea == subArea }
        return filtered.take(limit).map {
            RecommendedContent(
                contentId = it.id,
                title = it.title,
                contentType = it.contentType,
                levelId = it.levelId,
                area = it.area,
                subArea = it.subArea,
                score = 1.0,
                reason = "영역(${area ?: "-"})/세부영역(${subArea ?: "-"}) 매칭",
            )
        }
    }

    /**
     * 3. 주제·태그별 추천 — content_classifications 의 theme 코드로 매칭.
     */
    @Transactional(readOnly = true)
    fun recommendForTheme(
        userId: String,
        theme: String,
        levelId: String? = null,
        limit: Int = 10,
    ): List<RecommendedContent> {
        val targetLevel = levelId ?: userRepository.findById(userId).orElse(null)?.levelId
        val solvedIds = competencyLogRepository.findInWindowDesc(userId).map { it.contentId }.toSet()

        val ids = contentClassificationRepository.findContentIdsByCode(theme)
        if (ids.isEmpty()) return emptyList()
        val pool = contentRepository.findAllById(ids)
            .filter { it.status == "active" && it.id !in solvedIds }
            .filter { targetLevel == null || it.levelId == targetLevel }
        return pool.take(limit).map {
            RecommendedContent(
                contentId = it.id,
                title = it.title,
                contentType = it.contentType,
                levelId = it.levelId,
                area = it.area,
                subArea = it.subArea,
                score = 1.0,
                reason = "주제 코드($theme) 매칭",
            )
        }
    }
}
