package com.korfarm.api.learning

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.classification.ContentClassificationRepository
import com.korfarm.api.diagnostic.scoring.COMPETENCIES
import com.korfarm.api.paid.ContentEntity
import com.korfarm.api.paid.ContentRepository
import com.korfarm.api.paid.ContentVersionRepository
import com.korfarm.api.user.UserRepository
import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
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

    @PersistenceContext
    private lateinit var em: jakarta.persistence.EntityManager

    /** 역량명 → content_recommendation_index 컬럼명 */
    private val competencyColumnMap = mapOf(
        "어휘력" to "comp_lexical",
        "문장 독해력" to "comp_sentence",
        "구조 독해력" to "comp_structure",
        "논리 사고력" to "comp_logic",
        "어법·문법 능력" to "comp_grammar",
        "국어 개념 적용 능력" to "comp_concept",
        "국어 관련 배경지식" to "comp_korbg",
        "비문학 배경지식" to "comp_nonfic",
        "문제 분석 및 전략 수립 능력" to "comp_qanalysis",
        "선택지 분석 및 전략 수립 능력" to "comp_canalysis",
    )

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

    companion object {
        const val LEVEL_FALLBACK_RANGE = 2  // ±2 레벨 fallback (사용자 결정, 2026-05-06)
        const val LEARNING_CONTENT_TYPES = "DAILY_QUIZ,STUDY_CONTENT,FARM_READING,PRO_READING,PRO_VOCAB,PRO_GRAMMAR,LOGIC_REASONING_QUIZ"
    }

    /**
     * 농장·프로 학습 콘텐츠만 — 정답해설/테스트는 추천에서 제외.
     */
    private fun isLearningContent(content: ContentEntity): Boolean {
        val ct = content.contentType.uppercase()
        if (ct.contains("TEST") || ct.contains("ANSWER_EXPLANATION") || ct.contains("MANUSCRIPT")) return false
        return true
    }

    /** 학생 ID → 평생 풀이 이력 (in_window false 도 포함). 추후 user_completed_contents 테이블로 교체 예정. */
    private fun loadSolvedContentIds(userId: String): Set<String> {
        // 슬라이딩 윈도우 무관 — log 전체. 향후 user_completed_contents 인덱스 도입 시 단순 SELECT 1회로 대체.
        return competencyLogRepository.findAll()
            .filter { it.userId == userId }
            .map { it.contentId }
            .toSet()
    }

    /**
     * 인접 레벨 ±2 까지 콘텐츠 풀 확장. levelId="russell1"(7) → 5,6,7,8,9 (frege2~witt1).
     */
    private fun resolveAdjacentLevelIds(targetLevel: String?): List<String> {
        if (targetLevel == null) return emptyList()
        val tier = targetLevel.dropLastWhile { it.isDigit() }.lowercase()
        val num = targetLevel.takeLastWhile { it.isDigit() }.toIntOrNull() ?: return listOf(targetLevel)
        val base = when (tier) {
            "saussure", "sohssure" -> 0
            "frege" -> 3
            "russell" -> 6
            "wittgenstein", "witt" -> 9
            else -> return listOf(targetLevel)
        }
        val center = base + num
        val result = mutableListOf<String>()
        for (delta in -LEVEL_FALLBACK_RANGE..LEVEL_FALLBACK_RANGE) {
            val target = center + delta
            if (target < 1 || target > 12) continue
            val (t, n) = when {
                target <= 3 -> "saussure" to target
                target <= 6 -> "frege" to (target - 3)
                target <= 9 -> "russell" to (target - 6)
                else -> "wittgenstein" to (target - 9)
            }
            result.add("$t$n")
        }
        return result
    }

    /**
     * 1. 역량별 추천 — 학생의 약점 역량 보강.
     * 인덱스 기반 단일 SQL — content_recommendation_index 의 사전계산된 컬럼 활용.
     */
    @Transactional(readOnly = true)
    fun recommendForCompetency(
        userId: String,
        competency: String? = null,
        levelId: String? = null,
        limit: Int = 10,
    ): List<RecommendedContent> {
        val targetLevel = levelId ?: userRepository.findById(userId).orElse(null)?.levelId

        // 약점 역량 자동 식별 (competency 미지정 시 ratio 가장 낮은 1개)
        val targetCompetency: String = if (competency != null && competency in COMPETENCIES) competency else {
            val summaries = competencySummaryRepository.findByUserId(userId)
            COMPETENCIES.sortedBy { c ->
                summaries.firstOrNull { it.competency == c }?.ratioScore ?: 50.0
            }.first()
        }
        val compColumn = competencyColumnMap[targetCompetency] ?: return emptyList()

        // 인덱스에서 인덱스 기반 추천 — 단일 SELECT
        val rows = queryByCompetency(userId, compColumn, parseLevelNumber(targetLevel), limit)
        if (rows.isEmpty()) return emptyList()

        return rows.map {
            RecommendedContent(
                contentId = it.contentId,
                title = it.title,
                contentType = it.contentType,
                levelId = it.levelId,
                area = it.area,
                subArea = it.subArea,
                score = it.score,
                reason = "약점 보강 ($targetCompetency)",
            )
        }
    }

    private data class IndexRow(
        val contentId: String, val title: String, val contentType: String,
        val levelId: String?, val area: String?, val subArea: String?, val score: Double,
    )

    /**
     * 인덱스 SQL — 약점 역량 컬럼 DESC + level_num ±2 fallback + 평생 풀이 이력 제외 + 학습 콘텐츠만.
     */
    private fun queryByCompetency(userId: String, compColumn: String, levelNum: Int?, limit: Int): List<IndexRow> {
        val safeLimit = limit.coerceIn(1, 50)
        val levelClause = if (levelNum != null) "AND i.level_num BETWEEN ${levelNum - 2} AND ${levelNum + 2}" else ""
        val sql = """
            SELECT i.content_id, c.title, c.content_type, i.level_id, i.area, i.sub_area, i.$compColumn AS score
            FROM content_recommendation_index i
            JOIN contents c ON c.id = i.content_id
            WHERE i.$compColumn > 0
              AND i.content_kind IN ('farm','pro','daily_quiz','study','logic')
              $levelClause
              AND i.content_id NOT IN (
                  SELECT content_id FROM learning_competency_log WHERE user_id = :userId
              )
            ORDER BY i.$compColumn DESC, i.updated_at DESC
            LIMIT $safeLimit
        """.trimIndent()
        val q = em.createNativeQuery(sql)
        q.setParameter("userId", userId)
        @Suppress("UNCHECKED_CAST")
        val rows = q.resultList as List<Array<Any?>>
        return rows.map {
            IndexRow(
                contentId = it[0] as String,
                title = (it[1] as? String) ?: "",
                contentType = (it[2] as? String) ?: "",
                levelId = it[3] as? String,
                area = it[4] as? String,
                subArea = it[5] as? String,
                score = (it[6] as? Number)?.toDouble() ?: 0.0,
            )
        }
    }

    private fun parseLevelNumber(levelId: String?): Int? {
        if (levelId.isNullOrBlank()) return null
        val tier = levelId.dropLastWhile { it.isDigit() }.lowercase()
        val num = levelId.takeLastWhile { it.isDigit() }.toIntOrNull() ?: return null
        val base = when (tier) {
            "saussure", "sohssure" -> 0
            "frege" -> 3
            "russell" -> 6
            "wittgenstein", "witt" -> 9
            else -> return null
        }
        return base + num
    }

    // 옛 in-memory 추천 — 인덱스 미빌드된 콘텐츠를 위한 fallback (추후 제거)
    @Suppress("UNUSED_PARAMETER")
    private fun legacyRecommendForCompetency(userId: String, competency: String?, levelId: String?, limit: Int): List<RecommendedContent> {
        val targetLevel = levelId ?: userRepository.findById(userId).orElse(null)?.levelId
        val targetCompetencies: List<String> = if (competency != null) {
            if (competency in COMPETENCIES) listOf(competency) else return emptyList()
        } else {
            val summaries = competencySummaryRepository.findByUserId(userId)
            COMPETENCIES.sortedBy { c ->
                summaries.firstOrNull { it.competency == c }?.ratioScore ?: 50.0
            }.take(3)
        }
        val solvedIds = loadSolvedContentIds(userId)
        val candidateLevels = resolveAdjacentLevelIds(targetLevel)
        val candidates = if (candidateLevels.isNotEmpty()) {
            candidateLevels.flatMap { lvl ->
                contentRepository.findByContentTypeAndLevelIdAndStatus("DAILY_QUIZ", lvl, "active") +
                contentRepository.findByAreaAndLevelIdAndStatus("nonfiction", lvl, "active") +
                contentRepository.findByAreaAndLevelIdAndStatus("fiction", lvl, "active")
            }.distinctBy { it.id }
        } else {
            contentRepository.findByStatus("active").take(500)
        }

        val pool = candidates.filter { it.id !in solvedIds && isLearningContent(it) }
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
     * 2. 영역·세부영역별 추천 — area + subArea 매칭. ±2 레벨 fallback + 평생 이력 제외.
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
        val solvedIds = loadSolvedContentIds(userId)
        val candidateLevels = resolveAdjacentLevelIds(targetLevel)

        val pool: List<ContentEntity> = when {
            area != null && candidateLevels.isNotEmpty() ->
                candidateLevels.flatMap { contentRepository.findByAreaAndLevelIdAndStatus(area, it, "active") }
                    .distinctBy { it.id }
            area != null -> contentRepository.findByAreaAndStatus(area, "active")
            candidateLevels.isNotEmpty() ->
                candidateLevels.flatMap { contentRepository.findByContentTypeAndLevelIdAndStatus("DAILY_READING", it, "active") }
                    .distinctBy { it.id }
            else -> emptyList()
        }
        val filtered = pool
            .filter { it.id !in solvedIds && isLearningContent(it) }
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
     * 3. 주제·태그별 추천 — content_classifications 의 theme 코드로 매칭. ±2 레벨 fallback.
     */
    @Transactional(readOnly = true)
    fun recommendForTheme(
        userId: String,
        theme: String,
        levelId: String? = null,
        limit: Int = 10,
    ): List<RecommendedContent> {
        val targetLevel = levelId ?: userRepository.findById(userId).orElse(null)?.levelId
        val solvedIds = loadSolvedContentIds(userId)
        val allowedLevels = resolveAdjacentLevelIds(targetLevel).toSet()

        val ids = contentClassificationRepository.findContentIdsByCode(theme)
        if (ids.isEmpty()) return emptyList()
        val pool = contentRepository.findAllById(ids)
            .filter { it.status == "active" && it.id !in solvedIds && isLearningContent(it) }
            .filter { allowedLevels.isEmpty() || it.levelId in allowedLevels }
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

    /**
     * 4. 후보 통합 추천 — 한 번의 호출로 3종 카테고리 후보를 묶어 반환.
     * AI 튜터가 직접 판단해 1~2개씩 골라낼 수 있도록 후보 목록 제공.
     *
     * @return Triple(competency 후보, area 후보, theme 후보)
     */
    @Transactional(readOnly = true)
    fun recommendCandidatesAll(
        userId: String,
        levelId: String? = null,
        perCategory: Int = 10,
    ): RecommendationCandidates {
        val competencyCands = recommendForCompetency(userId, null, levelId, perCategory)

        // 영역 후보 — 학생이 부족한 영역(평생 이력에서 가장 적게 푼 영역) 자동 추정
        val recentAreas = loadStudentPreferredAreas(userId)
        val areaCands = if (recentAreas.isNotEmpty()) {
            recentAreas.take(2).flatMap {
                recommendForArea(userId, it, null, levelId, perCategory / 2)
            }
        } else {
            // 학생 이력 없으면 다양한 영역의 학습을 기본 추천
            listOf("nonfiction", "fiction", "grammar")
                .flatMap { recommendForArea(userId, it, null, levelId, perCategory / 3 + 1) }
                .take(perCategory)
        }

        // 주제 후보 — 학생이 자주 본 분류 코드 기반. 이력 없으면 빈 결과.
        val themeCands = loadStudentPreferredThemes(userId)
            .take(2)
            .flatMap { recommendForTheme(userId, it, levelId, perCategory / 2) }
            .take(perCategory)

        return RecommendationCandidates(
            competency = competencyCands,
            area = areaCands.distinctBy { it.contentId },
            theme = themeCands.distinctBy { it.contentId },
        )
    }

    /** 학생이 최근에 푼 콘텐츠들의 영역 빈도 — 좋은 추천 ratio 영역 우선 */
    private fun loadStudentPreferredAreas(userId: String): List<String> {
        val recent = competencyLogRepository.findInWindowDesc(userId).take(30)
        val ids = recent.map { it.contentId }.toSet()
        if (ids.isEmpty()) return emptyList()
        val areas = contentRepository.findAllById(ids).mapNotNull { it.area }
        return areas.groupingBy { it }.eachCount().entries
            .sortedByDescending { it.value }
            .map { it.key }
    }

    /** 학생이 최근에 푼 콘텐츠의 분류 코드 빈도 */
    private fun loadStudentPreferredThemes(userId: String): List<String> {
        val recent = competencyLogRepository.findInWindowDesc(userId).take(30)
        val ids = recent.map { it.contentId }
        if (ids.isEmpty()) return emptyList()
        val codes = ids.flatMap { id ->
            contentClassificationRepository.findByIdContentId(id)
                .filter { it.classificationType == "theme" }
                .map { it.id.classificationCode }
        }
        return codes.groupingBy { it }.eachCount().entries
            .sortedByDescending { it.value }
            .map { it.key }
    }
}

/** 후보 통합 추천 응답 — AI 튜터/에이전트가 후보를 받아 직접 선별 */
data class RecommendationCandidates(
    val competency: List<RecommendationService.RecommendedContent>,
    val area: List<RecommendationService.RecommendedContent>,
    val theme: List<RecommendationService.RecommendedContent>,
)
