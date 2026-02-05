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
        "CONTENT_PDF" to "content",
        "CONTENT_PDF_QUIZ" to "content",
        "BACKGROUND_KNOWLEDGE" to "background",
        "BACKGROUND_KNOWLEDGE_QUIZ" to "background",
        "LANGUAGE_CONCEPT" to "concept",
        "LANGUAGE_CONCEPT_QUIZ" to "concept",
        "LOGIC_REASONING" to "logic",
        "LOGIC_REASONING_QUIZ" to "logic",
        "CHOICE_JUDGEMENT" to "choice",
        "WRITING_DESCRIPTIVE" to "writing"
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
}
