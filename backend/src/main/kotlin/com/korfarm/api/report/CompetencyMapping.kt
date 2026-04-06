package com.korfarm.api.report

object CompetencyMapping {

    /** 10대 핵심 역량 */
    val TEN_COMPETENCIES = listOf(
        "어휘력", "문장 독해력", "구조 독해력", "논리 사고력", "어법·문법 능력",
        "국어 개념 적용 능력", "국어 관련 배경지식", "비문학 배경지식",
        "문제 분석 및 전략 수립 능력", "선택지 분석 및 전략 수립 능력"
    )

    /** questionKind → 10대 역량 매핑 */
    fun competencyForQuestionKind(kind: String): String? = when (kind) {
        "WORD_TO_MEANING" -> "어휘력"
        "READING_COMPREHENSION" -> "문장 독해력"
        "STRUCTURE_READING" -> "구조 독해력"
        "GRAMMAR" -> "어법·문법 능력"
        "SENTENCE_BUILDING" -> "국어 개념 적용 능력"
        "BACKGROUND_KNOWLEDGE" -> "비문학 배경지식"
        "INFERENCE" -> "논리 사고력"
        "CRITICAL_THINKING" -> "문제 분석 및 전략 수립 능력"
        "PROBLEM_SOLVING" -> "선택지 분석 및 전략 수립 능력"
        "CREATIVE_THINKING" -> "논리 사고력"
        else -> null
    }

    /** contentType → 10대 역량 매핑 */
    fun competencyForContentType(contentType: String): String? = when (contentType) {
        "VOCAB_BASIC", "VOCAB_DICTIONARY", "PRO_VOCAB", "DAILY_QUIZ" -> "어휘력"
        "GRAMMAR_BASIC", "GRAMMAR_ADVANCED", "GRAMMAR_PRACTICE", "GRAMMAR_REVIEW" -> "어법·문법 능력"
        "READING_NONFICTION", "READING_LITERATURE", "PRO_READING", "DAILY_READING", "PRO_ANSWER" -> "문장 독해력"
        "LANGUAGE_CONCEPT", "LANGUAGE_CONCEPT_QUIZ" -> "국어 개념 적용 능력"
        "BACKGROUND_KNOWLEDGE", "BACKGROUND_KNOWLEDGE_QUIZ", "PRO_BACKGROUND" -> "비문학 배경지식"
        "LOGIC_REASONING", "LOGIC_REASONING_QUIZ", "PRO_LOGIC" -> "논리 사고력"
        "CHOICE_JUDGEMENT" -> "선택지 분석 및 전략 수립 능력"
        "WRITING_DESCRIPTIVE" -> "문제 분석 및 전략 수립 능력"
        "STUDY_CONTENT" -> "구조 독해력"
        else -> null
    }

    /** contentType → 영역(도메인) 분류 */
    fun domainAreaFor(contentType: String): String = when (contentType) {
        "READING_NONFICTION", "BACKGROUND_KNOWLEDGE", "BACKGROUND_KNOWLEDGE_QUIZ",
        "STUDY_CONTENT", "PRO_BACKGROUND", "PRO_READING",
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
        "STUDY_CONTENT" -> "내용 숙지 학습"
        "DAILY_QUIZ" -> "일일 퀴즈"
        "DAILY_READING" -> "일일 독해"
        "PRO_VOCAB" -> "프로 어휘"
        "PRO_READING" -> "프로 독해"
        "PRO_BACKGROUND" -> "프로 배경지식"
        "PRO_LOGIC" -> "프로 논리사고력"
        "PRO_ANSWER" -> "프로 모범답안/정답해설"
        else -> contentType
    }

    fun gradeFor(score: Double): String = when {
        score >= 80 -> "A"
        score >= 70 -> "B"
        score >= 60 -> "C"
        score >= 50 -> "D"
        else -> "F"
    }

    /** 역량별 추천 contentType 목록 */
    fun recommendedContentTypes(competencyLabel: String): List<String> = when (competencyLabel) {
        "어휘력" -> listOf("VOCAB_BASIC", "VOCAB_DICTIONARY")
        "문장 독해력", "구조 독해력" -> listOf("READING_NONFICTION", "READING_LITERATURE")
        "어법·문법 능력" -> listOf("GRAMMAR_BASIC", "GRAMMAR_PRACTICE")
        "국어 개념 적용 능력" -> listOf("LANGUAGE_CONCEPT", "LANGUAGE_CONCEPT_QUIZ")
        "국어 관련 배경지식", "비문학 배경지식" -> listOf("BACKGROUND_KNOWLEDGE", "BACKGROUND_KNOWLEDGE_QUIZ")
        "논리 사고력" -> listOf("LOGIC_REASONING", "CHOICE_JUDGEMENT")
        "문제 분석 및 전략 수립 능력" -> listOf("LOGIC_REASONING", "WRITING_DESCRIPTIVE")
        "선택지 분석 및 전략 수립 능력" -> listOf("CHOICE_JUDGEMENT", "LOGIC_REASONING_QUIZ")
        else -> emptyList()
    }

    /** 영역 분류: subArea 값 → 대분류 역산 */
    val AREA_CLASSIFICATION = mapOf(
        "비문학" to listOf(
            "서양철학", "동양철학", "역사", "논리학", "법학", "경제학",
            "물리학", "화학", "생명과학", "지구과학", "기계공학", "전기공학",
            "의약학", "IT", "기타"
        ),
        "문학" to listOf(
            "현대시", "현대소설", "고전시가", "고전소설", "수필", "극"
        ),
        "문법" to listOf(
            "품사", "형태소", "단어의 형성", "문장의 짜임", "음운", "문법 요소",
            "어문 규정", "국어의 역사", "기타"
        ),
        "기타" to listOf(
            "화법", "작문", "매체", "생활문", "건의문", "기타"
        )
    )

    /** subArea 값 → 대분류 영역 역산 */
    fun areaForSubArea(subArea: String): String? {
        for ((area, subs) in AREA_CLASSIFICATION) {
            if (subArea in subs) return area
        }
        return null
    }

    /** 순수 농장 모드 contentType (일일학습/프로모드 제외) */
    val FARM_ONLY_TYPES = setOf(
        "VOCAB_BASIC", "VOCAB_DICTIONARY",
        "GRAMMAR_BASIC", "GRAMMAR_ADVANCED", "GRAMMAR_PRACTICE", "GRAMMAR_REVIEW",
        "READING_NONFICTION", "READING_LITERATURE",
        "BACKGROUND_KNOWLEDGE", "BACKGROUND_KNOWLEDGE_QUIZ",
        "LANGUAGE_CONCEPT", "LANGUAGE_CONCEPT_QUIZ",
        "LOGIC_REASONING", "LOGIC_REASONING_QUIZ",
        "CHOICE_JUDGEMENT", "WRITING_DESCRIPTIVE",
        "STUDY_CONTENT"
    )
}
