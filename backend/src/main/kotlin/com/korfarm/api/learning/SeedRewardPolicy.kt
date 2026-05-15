package com.korfarm.api.learning

import com.korfarm.api.economy.SeedCatalogEntity

object SeedRewardPolicy {
    private val levelOrder = listOf(
        "saussure1",
        "saussure2",
        "saussure3",
        "frege1",
        "frege2",
        "frege3",
        "russell1",
        "russell2",
        "russell3",
        "wittgenstein1",
        "wittgenstein2",
        "wittgenstein3"
    )

    // 농장ID → 씨앗타입 매핑
    private val farmSeedMapping = mapOf(
        "vocab" to "seed_wheat",      // 어휘 농장 → 밀
        "grammar" to "seed_wheat",    // 문법 농장 → 밀
        "reading" to "seed_rice",     // 독해 농장 → 쌀
        "story" to "seed_rice",       // 이야기 농장 → 쌀
        "classic" to "seed_rice",     // 고전 농장 → 쌀
        "content" to "seed_rice",     // 내용숙지 농장 → 쌀
        "background" to "seed_corn",  // 배경지식 농장 → 옥수수
        "concept" to "seed_corn",     // 국어개념 농장 → 옥수수
        "logic" to "seed_grape",      // 논리사고력 농장 → 포도
        "choice" to "seed_grape",     // 선택지판별 농장 → 포도
        "writing" to "seed_apple"     // 서술형 농장 → 사과
    )

    // contentType → farmId 매핑
    private val contentTypeFarmMapping = mapOf(
        "VOCAB_BASIC" to "vocab",
        "VOCAB_DICTIONARY" to "vocab",
        "GRAMMAR_WORD_FORMATION" to "grammar",
        "GRAMMAR_SENTENCE_STRUCTURE" to "grammar",
        "GRAMMAR_PHONEME_CHANGE" to "grammar",
        "GRAMMAR_POS" to "grammar",
        "READING_NONFICTION" to "reading",
        "READING_LITERATURE" to "reading",
        "STUDY_CONTENT" to "content",
        "BACKGROUND_KNOWLEDGE" to "background",
        "BACKGROUND_KNOWLEDGE_QUIZ" to "background",
        "LANGUAGE_CONCEPT" to "concept",
        "LANGUAGE_CONCEPT_QUIZ" to "concept",
        "LOGIC_REASONING" to "logic",
        "LOGIC_REASONING_QUIZ" to "logic",
        "CHOICE_JUDGEMENT" to "choice",
        "WRITING_DESCRIPTIVE" to "writing",
        "DAILY_QUIZ" to "vocab",        // 일일퀴즈 → 밀 씨앗
        "DAILY_READING" to "reading",  // 일일독해 → 쌀 씨앗
        "PRO_VOCAB" to "vocab",        // 프로 어휘 → 밀 씨앗
        "PRO_READING" to "reading",    // 프로 독해 → 쌀 씨앗
        "PRO_BACKGROUND" to "background", // 프로 배경지식 → 옥수수 씨앗
        "PRO_LOGIC" to "logic",        // 프로 논리 → 포도 씨앗
        "PRO_ANSWER" to "reading"      // 프로 정답해설 → 쌀 씨앗
    )

    fun seedCountFor(userLevelId: String?, contentLevelId: String?): Int {
        if (userLevelId.isNullOrBlank() || contentLevelId.isNullOrBlank()) {
            return 3
        }

        val userIndex = levelOrder.indexOf(userLevelId)
        val contentIndex = levelOrder.indexOf(contentLevelId)
        if (userIndex == -1 || contentIndex == -1) {
            return 3
        }

        val diff = contentIndex - userIndex
        return when {
            diff >= 2 -> 5
            diff == 1 -> 4
            diff == 0 -> 3
            diff == -1 -> 2
            else -> 1
        }
    }

    fun randomSeedType(catalog: List<SeedCatalogEntity>): String {
        if (catalog.isEmpty()) return "seed_wheat"
        val weighted = catalog.flatMap { seed ->
            val weight = if (seed.rarity == "common") 70 else 30
            List(weight) { seed.seedType }
        }
        return weighted.random()
    }

    // 농장ID로 씨앗 타입 결정
    fun seedTypeForFarm(farmId: String): String {
        return farmSeedMapping[farmId] ?: "seed_wheat"
    }

    // contentType으로 씨앗 타입 결정 (농장 학습용)
    fun seedTypeForContentType(contentType: String?): String? {
        if (contentType.isNullOrBlank()) return null
        val farmId = contentTypeFarmMapping[contentType] ?: return null
        return farmSeedMapping[farmId]
    }

    // contentType으로 농장ID 조회
    fun farmIdForContentType(contentType: String?): String? {
        if (contentType.isNullOrBlank()) return null
        return contentTypeFarmMapping[contentType]
    }

    // ─── 통합 단일 진입점 (2026-05-15 일관성 재설계) ──────────────
    //
    // 모든 학습 완료 시 이 메서드 하나만 호출. 호출처는 결정의 적용(가산 + cap)
    // 외에는 어떤 자체 계산도 하지 않는다.

    enum class GrantSource { FARM_LEARNING, STUDY_CONTENT, TEST, PRO_MODE, LEGACY_LEARNING }

    data class SeedGrantDecision(
        val seedType: String,
        val rawCount: Int,                  // cap 적용 전
        val dailyCapPerContentType: Int,    // 9999 면 사실상 무제한
        val reasonCode: String,
    )

    /**
     * 통합 정책 — 모든 학습이 같은 식.
     *
     * 양 = seedCountFor(레벨차) × 정확도 가중 × source 가중
     *  - 정확도 <70% → 0
     *  - 정확도 70~99% → ×1
     *  - 정확도 100% → ×2
     *  - source = TEST → ×1.5  (테스트는 의미 있는 평가)
     *  - source = PRO_MODE → ×1.2
     *  - 그 외 → ×1
     *
     * 타입 = seedTypeForContentType (콘텐츠 매핑) ?: "seed_wheat"
     *
     * 하루 cap (per contentType, per user):
     *  - DAILY_QUIZ / DAILY_READING → 10  (사용자 정책)
     *  - 그 외 → 50  (악용 방지)
     */
    fun calculateGrant(
        userLevelId: String?,
        contentLevelId: String?,
        contentType: String?,
        accuracyPct: Int?,
        source: GrantSource,
    ): SeedGrantDecision {
        val acc = accuracyPct ?: 100
        val accBoost = when {
            acc < 70 -> 0.0
            acc < 100 -> 1.0
            else -> 2.0
        }
        val sourceBoost = when (source) {
            GrantSource.TEST -> 1.5
            GrantSource.PRO_MODE -> 1.2
            else -> 1.0
        }
        val base = seedCountFor(userLevelId, contentLevelId)
        val raw = (base * accBoost * sourceBoost).toInt().coerceAtLeast(0)

        val seedType = seedTypeForContentType(contentType) ?: "seed_wheat"
        val cap = when (contentType) {
            "DAILY_QUIZ", "DAILY_READING" -> 10
            else -> 50
        }

        return SeedGrantDecision(
            seedType = seedType,
            rawCount = raw,
            dailyCapPerContentType = cap,
            reasonCode = "base=$base acc=$acc src=$source ct=$contentType lv=$contentLevelId/$userLevelId",
        )
    }

    /** rawCount 를 (cap - todayEarned) 안으로 깎는다. todayEarned 가 cap 이상이면 0. */
    fun applyDailyCap(rawCount: Int, capLimit: Int, todayEarned: Int): Int {
        val remaining = (capLimit - todayEarned).coerceAtLeast(0)
        return rawCount.coerceAtMost(remaining)
    }
}
