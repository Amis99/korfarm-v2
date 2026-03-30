package com.korfarm.api.report

/** questionKind → 역량 라벨 + 영역 매핑 */
object CompetencyMapping {

    data class CompetencyInfo(
        val competencyLabel: String,
        val areaKey: String,
        val areaLabel: String
    )

    // questionKind → 역량 정보
    private val questionKindMap = mapOf(
        "WORD_TO_MEANING" to CompetencyInfo("어휘력", "vocab", "어휘"),
        "READING_COMPREHENSION" to CompetencyInfo("독해력", "reading", "독해"),
        "STRUCTURE_READING" to CompetencyInfo("구조 독해력", "reading", "독해"),
        "GRAMMAR" to CompetencyInfo("어법·문법", "grammar", "문법"),
        "SENTENCE_BUILDING" to CompetencyInfo("어법·문법", "grammar", "문법"),
        "BACKGROUND_KNOWLEDGE" to CompetencyInfo("배경지식", "background", "배경지식"),
        "INFERENCE" to CompetencyInfo("논리 사고력", "thinking", "사고력"),
        "CRITICAL_THINKING" to CompetencyInfo("논리 사고력", "thinking", "사고력"),
        "PROBLEM_SOLVING" to CompetencyInfo("문제 해결력", "thinking", "사고력"),
        "CREATIVE_THINKING" to CompetencyInfo("문제 해결력", "thinking", "사고력")
    )

    // 농장 모드 contentType → 역량 정보
    private val contentTypeMap = mapOf(
        "VOCAB_BASIC" to CompetencyInfo("어휘력", "vocab", "어휘"),
        "VOCAB_DICTIONARY" to CompetencyInfo("어휘력", "vocab", "어휘"),
        "PRO_VOCAB" to CompetencyInfo("어휘력", "vocab", "어휘"),
        "GRAMMAR_BASIC" to CompetencyInfo("어법·문법", "grammar", "문법"),
        "GRAMMAR_ADVANCED" to CompetencyInfo("어법·문법", "grammar", "문법"),
        "GRAMMAR_PRACTICE" to CompetencyInfo("어법·문법", "grammar", "문법"),
        "GRAMMAR_REVIEW" to CompetencyInfo("어법·문법", "grammar", "문법"),
        "READING_NONFICTION" to CompetencyInfo("독해력", "reading", "독해"),
        "READING_LITERATURE" to CompetencyInfo("독해력", "reading", "독해"),
        "PRO_READING" to CompetencyInfo("독해력", "reading", "독해"),
        "DAILY_READING" to CompetencyInfo("독해력", "reading", "독해"),
        "DAILY_QUIZ" to CompetencyInfo("어휘력", "vocab", "어휘"),
        "BACKGROUND_KNOWLEDGE" to CompetencyInfo("배경지식", "background", "배경지식"),
        "BACKGROUND_KNOWLEDGE_QUIZ" to CompetencyInfo("배경지식", "background", "배경지식"),
        "PRO_BACKGROUND" to CompetencyInfo("배경지식", "background", "배경지식"),
        "LANGUAGE_CONCEPT" to CompetencyInfo("어법·문법", "grammar", "문법"),
        "LANGUAGE_CONCEPT_QUIZ" to CompetencyInfo("어법·문법", "grammar", "문법"),
        "LOGIC_REASONING" to CompetencyInfo("논리 사고력", "thinking", "사고력"),
        "LOGIC_REASONING_QUIZ" to CompetencyInfo("논리 사고력", "thinking", "사고력"),
        "PRO_LOGIC" to CompetencyInfo("논리 사고력", "thinking", "사고력"),
        "CHOICE_JUDGEMENT" to CompetencyInfo("논리 사고력", "thinking", "사고력"),
        "WRITING_DESCRIPTIVE" to CompetencyInfo("문제 해결력", "thinking", "사고력"),
        "CONTENT_PDF" to CompetencyInfo("독해력", "reading", "독해"),
        "CONTENT_PDF_QUIZ" to CompetencyInfo("독해력", "reading", "독해"),
        "PRO_ANSWER" to CompetencyInfo("독해력", "reading", "독해")
    )

    fun fromQuestionKind(kind: String): CompetencyInfo? = questionKindMap[kind]

    fun fromContentType(contentType: String): CompetencyInfo? = contentTypeMap[contentType]

    fun allCompetencyLabels(): List<String> = listOf(
        "어휘력", "독해력", "구조 독해력", "어법·문법", "배경지식", "논리 사고력", "문제 해결력"
    )

    fun gradeFor(score: Double): Pair<String, String> = when {
        score >= 80 -> "A" to "우수합니다. 고급 문제에 도전하세요."
        score >= 70 -> "B" to "양호합니다. 꾸준히 유지하세요."
        score >= 60 -> "C" to "보통입니다. 집중 학습을 권장합니다."
        score >= 50 -> "D" to "보강이 필요합니다."
        else -> "F" to "기초부터 다시 학습하세요."
    }
}
