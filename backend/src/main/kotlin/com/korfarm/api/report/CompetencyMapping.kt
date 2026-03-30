package com.korfarm.api.report

/** questionKind → 역량 라벨, contentType → 영역(비문학/문학/문법/기타) 매핑 */
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

    fun gradeFor(score: Double): String = when {
        score >= 80 -> "A"
        score >= 70 -> "B"
        score >= 60 -> "C"
        score >= 50 -> "D"
        else -> "F"
    }

    /** contentType → 영역(도메인) 분류: 비문학/문학/문법/기타 */
    fun domainAreaFor(contentType: String): String = when (contentType) {
        "READING_NONFICTION", "BACKGROUND_KNOWLEDGE", "BACKGROUND_KNOWLEDGE_QUIZ",
        "CONTENT_PDF", "CONTENT_PDF_QUIZ", "PRO_BACKGROUND", "PRO_READING",
        "DAILY_READING" -> "비문학"

        "READING_LITERATURE" -> "문학"

        "GRAMMAR_BASIC", "GRAMMAR_ADVANCED", "GRAMMAR_PRACTICE", "GRAMMAR_REVIEW",
        "LANGUAGE_CONCEPT", "LANGUAGE_CONCEPT_QUIZ" -> "문법"

        else -> "기타"
    }

    /** contentType → 한국어 라벨 */
    fun contentTypeLabel(contentType: String): String = when (contentType) {
        "VOCAB_BASIC" -> "기본 어휘"
        "VOCAB_DICTIONARY" -> "사전 어휘"
        "GRAMMAR_BASIC" -> "문법 기초"
        "GRAMMAR_ADVANCED" -> "문법 심화"
        "GRAMMAR_PRACTICE" -> "문법 연습"
        "GRAMMAR_REVIEW" -> "문법 복습"
        "READING_NONFICTION" -> "비문학 독해"
        "READING_LITERATURE" -> "문학 독해"
        "BACKGROUND_KNOWLEDGE" -> "배경지식"
        "BACKGROUND_KNOWLEDGE_QUIZ" -> "배경지식 퀴즈"
        "LANGUAGE_CONCEPT" -> "언어 개념"
        "LANGUAGE_CONCEPT_QUIZ" -> "언어 개념 퀴즈"
        "LOGIC_REASONING" -> "논리 추론"
        "LOGIC_REASONING_QUIZ" -> "논리 추론 퀴즈"
        "CHOICE_JUDGEMENT" -> "선택지 판별"
        "WRITING_DESCRIPTIVE" -> "서술형 쓰기"
        "CONTENT_PDF" -> "PDF 학습"
        "CONTENT_PDF_QUIZ" -> "PDF 퀴즈"
        "DAILY_QUIZ" -> "일일 퀴즈"
        "DAILY_READING" -> "일일 독해"
        "PRO_VOCAB" -> "프로 어휘"
        "PRO_READING" -> "프로 독해"
        "PRO_BACKGROUND" -> "프로 배경지식"
        "PRO_LOGIC" -> "프로 논리"
        "PRO_ANSWER" -> "프로 서답형"
        else -> contentType
    }

    /** 역량별 추천 contentType 목록 */
    fun recommendedContentTypes(competencyLabel: String): List<String> = when (competencyLabel) {
        "어휘력" -> listOf("VOCAB_BASIC", "VOCAB_DICTIONARY")
        "독해력", "구조 독해력" -> listOf("READING_NONFICTION", "READING_LITERATURE")
        "어법·문법" -> listOf("GRAMMAR_BASIC", "GRAMMAR_PRACTICE")
        "배경지식" -> listOf("BACKGROUND_KNOWLEDGE", "BACKGROUND_KNOWLEDGE_QUIZ")
        "논리 사고력" -> listOf("LOGIC_REASONING", "CHOICE_JUDGEMENT")
        "문제 해결력" -> listOf("LOGIC_REASONING", "WRITING_DESCRIPTIVE")
        else -> emptyList()
    }
}
