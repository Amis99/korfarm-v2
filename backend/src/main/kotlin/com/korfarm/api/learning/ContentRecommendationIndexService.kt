package com.korfarm.api.learning

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.classification.ContentClassificationRepository
import com.korfarm.api.diagnostic.scoring.COMPETENCIES
import com.korfarm.api.paid.ContentEntity
import com.korfarm.api.paid.ContentRepository
import com.korfarm.api.paid.ContentVersionRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

/**
 * content_recommendation_index 빌드·갱신 서비스.
 *
 * 한 콘텐츠의 questions[] 의 competencyVector 를 합산해 10대 역량 컬럼을 채우고,
 * area/sub_area/levelId/contentType 을 매핑된 form 으로 정규화.
 */
@Service
class ContentRecommendationIndexService(
    private val indexRepository: ContentRecommendationIndexRepository,
    private val contentRepository: ContentRepository,
    private val contentVersionRepository: ContentVersionRepository,
    private val classificationRepository: ContentClassificationRepository,
    private val objectMapper: ObjectMapper,
) {
    private val log = LoggerFactory.getLogger(ContentRecommendationIndexService::class.java)

    /**
     * 단일 콘텐츠 인덱스 갱신. 콘텐츠 저장·수정 hook 또는 백필이 호출.
     * 콘텐츠가 학습 콘텐츠가 아니면(test·answer-explanation·manuscript 등) 인덱스에서 제거.
     */
    @Transactional
    fun upsertOne(contentId: String): Boolean {
        val content = contentRepository.findById(contentId).orElse(null)
        if (content == null || content.status != "active") {
            indexRepository.deleteById(contentId)
            return false
        }
        val kind = resolveContentKind(content)
        if (kind == null) {
            // 학습 콘텐츠 아님 (test 등) — 인덱스 제거
            indexRepository.deleteById(contentId)
            return false
        }
        val ver = contentVersionRepository.findTopByContentIdOrderByCreatedAtDesc(contentId)
        val (rawSums, qCount) = if (ver != null) computeCompetencySums(ver.contentJson) else Pair(emptyMap(), 0)

        // 가중치 합이 0 이면 type/area 기반 default 부여 (DAILY_READING / PRO_READING 의 모듈형 payload,
        // LOGIC, 옛 콘텐츠 등이 payload.questions[].competencyVector 가 없어도 추천 풀에 포함되도록)
        val rawTotal = rawSums.values.sum()
        val compSums: Map<String, Double> = if (rawTotal > 0.0) rawSums else {
            val ct = content.contentType.uppercase()
            val area = (content.area ?: "").lowercase()
            resolveDefaultVectorForIndex(ct, area)
        }

        val classifs = classificationRepository.findByIdContentId(contentId)
            .map { it.id.classificationCode }
        val codesJson = objectMapper.writeValueAsString(classifs)

        val now = LocalDateTime.now()
        val existing = indexRepository.findById(contentId).orElse(null)
        val ent = existing ?: ContentRecommendationIndexEntity(contentId = contentId)
        ent.levelId = content.levelId
        ent.levelNum = parseLevelNumber(content.levelId)
        ent.contentKind = kind
        ent.area = content.area
        ent.subArea = content.subArea
        ent.compLexical = compSums["어휘력"] ?: 0.0
        ent.compSentence = compSums["문장 독해력"] ?: 0.0
        ent.compStructure = compSums["구조 독해력"] ?: 0.0
        ent.compLogic = compSums["논리 사고력"] ?: 0.0
        ent.compGrammar = compSums["어법·문법 능력"] ?: 0.0
        ent.compConcept = compSums["국어 개념 적용 능력"] ?: 0.0
        ent.compKorbg = compSums["국어 관련 배경지식"] ?: 0.0
        ent.compNonfic = compSums["비문학 배경지식"] ?: 0.0
        ent.compQanalysis = compSums["문제 분석 및 전략 수립 능력"] ?: 0.0
        ent.compCanalysis = compSums["선택지 분석 및 전략 수립 능력"] ?: 0.0
        ent.classificationCodes = codesJson
        ent.questionCount = qCount
        ent.updatedAt = now
        if (existing == null) ent.createdAt = now
        indexRepository.save(ent)
        return true
    }

    /**
     * 전체 콘텐츠 인덱스 백필 — 운영 중 1회 또는 일괄 변환 시.
     * 4500여 콘텐츠 × 인덱스 1 row.
     */
    @Transactional
    fun rebuildAll(): RebuildResult {
        val all = contentRepository.findAll()
        var indexed = 0
        var skipped = 0
        var errors = 0
        for (c in all) {
            try {
                if (upsertOne(c.id)) indexed++ else skipped++
            } catch (e: Exception) {
                log.warn("rebuild 실패 — contentId={} : {}", c.id, e.message)
                errors++
            }
        }
        return RebuildResult(total = all.size, indexed = indexed, skipped = skipped, errors = errors)
    }

    data class RebuildResult(val total: Int, val indexed: Int, val skipped: Int, val errors: Int)

    private fun resolveContentKind(content: ContentEntity): String? {
        val ct = content.contentType.uppercase()
        // 학습 아닌 것은 제외
        if (ct.contains("TEST") || ct.contains("ANSWER_EXPLANATION") || ct.contains("MANUSCRIPT")) return null
        return when {
            ct.contains("DAILY_QUIZ") || ct.contains("DAILYQUIZ") -> "daily_quiz"
            ct.contains("DAILY_READING") -> "farm"
            ct.startsWith("PRO_") -> "pro"
            ct.contains("LOGIC") -> "logic"
            ct.contains("STUDY") -> "study"
            ct.contains("FARM") -> "farm"
            // 농장 모드 세분 분류 — V3 추천 fallback 용 (BACKGROUND_KNOWLEDGE/VOCAB_*/GRAMMAR_* 가 'other' 로
            // 묶여 SQL 필터에 누락되던 사고 방지)
            ct.contains("BACKGROUND_KNOWLEDGE") -> "background"
            ct.contains("VOCAB") -> "vocab"
            ct.contains("GRAMMAR") -> "grammar"
            else -> "other"
        }
    }

    /**
     * questions[].competencyVector / competency 합산.
     * 반환: (역량명 → 가중치 합, questions 수)
     */
    private fun computeCompetencySums(contentJson: String): Pair<Map<String, Double>, Int> {
        val sums = COMPETENCIES.associateWith { 0.0 }.toMutableMap()
        var qCount = 0
        try {
            val root: Map<String, Any> = objectMapper.readValue(contentJson, object : TypeReference<Map<String, Any>>() {})
            @Suppress("UNCHECKED_CAST")
            val payload = (root["payload"] as? Map<String, Any>) ?: root
            @Suppress("UNCHECKED_CAST")
            val questions = (payload["questions"] as? List<Map<String, Any>>) ?: return Pair(sums, 0)
            qCount = questions.size
            for (q in questions) {
                @Suppress("UNCHECKED_CAST")
                val cv = (q["competencyVector"] as? Map<String, Any>)?.mapNotNull { (k, v) ->
                    val w = (v as? Number)?.toDouble() ?: return@mapNotNull null
                    if (k !in COMPETENCIES) null else (k to w)
                }?.toMap()
                val map = if (!cv.isNullOrEmpty()) cv else {
                    val single = q["competency"]?.toString()?.trim()
                    if (single != null && single in COMPETENCIES) mapOf(single to 1.0) else emptyMap()
                }
                for ((k, v) in map) {
                    sums[k] = (sums[k] ?: 0.0) + v
                }
            }
        } catch (_: Exception) { /* skip */ }
        return Pair(sums, qCount)
    }

    /**
     * 인덱스 빌드용 default vector — payload.questions[].competencyVector 가 없는 콘텐츠를 위한
     * type/area 기반 default. AdminContentService.resolveDefaultVector 와 동일 정책.
     */
    private fun resolveDefaultVectorForIndex(ct: String, area: String): Map<String, Double> = when {
        ct.contains("LOGIC") -> mapOf("논리 사고력" to 1.0)
        ct.contains("PRO_VOCAB") -> mapOf("어휘력" to 0.7, "국어 개념 적용 능력" to 0.3)
        ct.contains("PRO_GRAMMAR") -> mapOf("어법·문법 능력" to 0.7, "국어 개념 적용 능력" to 0.3)
        ct.contains("PRO_BACKGROUND") -> {
            if (area.contains("fiction") && !area.contains("non")) {
                mapOf("국어 관련 배경지식" to 0.7, "문장 독해력" to 0.3)
            } else {
                mapOf("비문학 배경지식" to 0.7, "국어 관련 배경지식" to 0.3)
            }
        }
        ct.contains("PRO_READING") -> {
            if (area.contains("fiction") && !area.contains("non")) {
                mapOf("국어 관련 배경지식" to 0.4, "문장 독해력" to 0.4, "문제 분석 및 전략 수립 능력" to 0.2)
            } else {
                mapOf("비문학 배경지식" to 0.4, "구조 독해력" to 0.4, "문제 분석 및 전략 수립 능력" to 0.2)
            }
        }
        ct.contains("BACKGROUND_KNOWLEDGE") -> {
            if (area.contains("fiction") && !area.contains("non")) {
                mapOf("국어 관련 배경지식" to 0.7, "문장 독해력" to 0.3)
            } else {
                mapOf("비문학 배경지식" to 0.7, "국어 관련 배경지식" to 0.3)
            }
        }
        ct.contains("VOCAB") -> mapOf("어휘력" to 0.8, "국어 개념 적용 능력" to 0.2)
        ct.contains("GRAMMAR") -> mapOf("어법·문법 능력" to 0.8, "국어 개념 적용 능력" to 0.2)
        ct.contains("DAILY_READING") || ct.contains("FARM") -> {
            if (area.contains("fiction") && !area.contains("non")) {
                mapOf("국어 관련 배경지식" to 0.5, "문장 독해력" to 0.5)
            } else {
                mapOf("비문학 배경지식" to 0.5, "구조 독해력" to 0.5)
            }
        }
        ct.contains("STUDY_CONTENT") || ct.contains("STUDY") -> {
            if (area.contains("fiction")) mapOf("국어 관련 배경지식" to 0.5, "문장 독해력" to 0.5)
            else if (area.contains("grammar")) mapOf("어법·문법 능력" to 1.0)
            else if (area.contains("vocab")) mapOf("어휘력" to 1.0)
            else mapOf("비문학 배경지식" to 0.4, "구조 독해력" to 0.4, "국어 개념 적용 능력" to 0.2)
        }
        else -> emptyMap()
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
}
