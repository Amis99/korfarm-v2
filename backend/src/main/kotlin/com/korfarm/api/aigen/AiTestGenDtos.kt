package com.korfarm.api.aigen

// ─── 지문 생성 ───
data class PassageGenRequest(
    val testId: String,
    val area: String? = null,
    val subArea: String? = null,
    val levelId: String? = null,         // 시험지 레벨 (소쉬르1 등) — 학년 라벨 도출용
    val targetLength: Int = 600,
    val paragraphs: Int = 3,
    val concepts: List<String> = emptyList(),  // 강조 학습 개념 이름들
    val moodPrompt: String? = null,
    val grammarTopic: String? = null  // GRAM 영역인 경우 RAG 검색용
)

data class PassageGenResponse(
    val text: String,
    val title: String?,
    val author: String?,
    val summary: String?,
    val area: String?,
    val subArea: String?,
    val model: String,
    val durationMs: Int
)

// ─── 문항 생성 ───
data class QuestionGenRequest(
    val testId: String,
    val passageText: String = "",           // 지문 본문 (지문 없는 문항이면 빈 문자열)
    val passageId: String? = null,
    val area: String? = null,
    val subArea: String? = null,
    val levelId: String? = null,
    val type: String = "MULTI_CHOICE",      // "MULTI_CHOICE" | "ESSAY"
    val questionType: String? = null,       // READ_/LIT_QUESTION_TYPE 코드
    val boxType: String? = null,            // "A"|"B"|"C"|"D"|"E" — 객관식 보기 5종 양식
    val needsCondition: Boolean = false,    // 서술형 조건 유무
    val conditionText: String? = null,      // 서술형 조건 본문
    val attachment: String? = null,         // 첨부 자료 (해설/모범답안 등)
    val stemHint: String? = null,           // 발문 가이드
    val grammarTopic: String? = null
)

data class QuestionGenResponse(
    val question: Map<String, Any?>,        // 비주얼 에디터 스키마와 정확히 일치
    val passed: Boolean,
    val reviewScore: Int?,
    val reviewIssues: List<String>,
    val suggestedFixes: List<String>,
    val retryCount: Int,
    val model: String,
    val durationMs: Int
)

// ─── 학생 페르소나 검증 결과 ───
data class StudentPersonaReviewResult(
    val passed: Boolean,
    val score: Int,                         // 0~100
    val issues: List<String>,
    val suggestedFixes: List<String>
)

// ─── 학습 개념 (모달 체크박스용) ───
data class LearningConceptDto(
    val id: String,
    val area: String,
    val subArea: String?,
    val name: String,
    val description: String?,
    val displayOrder: Int
)
