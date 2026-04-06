package com.korfarm.api.study

// ─────────────────────────────────────────────
// 관리자용 요청
// ─────────────────────────────────────────────
data class StudyContentCreateRequest(
    val title: String,
    val description: String? = null,
    val levelId: String? = null,
    val markdown: String,
    val evalPoints: List<String> = emptyList(),
    val errorPatterns: List<String> = emptyList(),
    val visibility: String, // PUBLIC | ORG (HQ_ADMIN만 PUBLIC, ORG_ADMIN은 ORG)
    val ownerOrgId: String? = null
)

data class StudyContentUpdateRequest(
    val title: String? = null,
    val description: String? = null,
    val levelId: String? = null,
    val markdown: String? = null,
    val evalPoints: List<String>? = null,
    val errorPatterns: List<String>? = null,
    val visibility: String? = null,
    val ownerOrgId: String? = null,
    val status: String? = null
)

data class StudyQuestionDto(
    val id: String? = null,
    val questionNo: Int,
    val questionType: String, // MULTI_CHOICE | OX | ESSAY
    val stem: String,
    val choices: List<StudyChoiceDto>? = null,
    val modelAnswer: String? = null,
    val fillBlanks: List<StudyFillBlankDto>? = null,
    val evalPointIdx: List<Int> = emptyList(),
    val difficulty: Int = 3
)

data class StudyChoiceDto(
    val id: String,
    val text: String,
    val isCorrect: Boolean,
    val errorPatternIdx: Int? = null
)

data class StudyFillBlankDto(
    val phrase: String,
    val position: Int? = null
)

data class StudyQuestionsBulkRequest(
    val questions: List<StudyQuestionDto>
)

// ─────────────────────────────────────────────
// 관리자용 응답
// ─────────────────────────────────────────────
data class StudyContentSummary(
    val id: String,
    val title: String,
    val description: String? = null,
    val levelId: String? = null,
    val visibility: String,
    val ownerOrgId: String? = null,
    val ownerOrgName: String? = null,
    val creatorId: String,
    val questionCount: Int,
    val status: String,
    val createdAt: String,
    val updatedAt: String
)

data class StudyContentDetail(
    val id: String,
    val title: String,
    val description: String? = null,
    val levelId: String? = null,
    val area: String,
    val visibility: String,
    val ownerOrgId: String? = null,
    val creatorId: String,
    val markdown: String,
    val evalPoints: List<String>,
    val errorPatterns: List<String>,
    val questionCount: Int,
    val status: String,
    val questions: List<StudyQuestionDto>,
    val createdAt: String,
    val updatedAt: String
)

// ─────────────────────────────────────────────
// 학생용 (학습 세션)
// ─────────────────────────────────────────────
data class StudyContentStudentItem(
    val id: String,
    val title: String,
    val description: String? = null,
    val levelId: String? = null,
    val visibility: String,
    val questionCount: Int,
    val seenRatio: Double = 0.0, // 0~1
    val accuracy: Double = 0.0,  // 0~1
    val totalSessions: Int = 0
)

data class StudyContentStudentDetail(
    val id: String,
    val title: String,
    val description: String? = null,
    val levelId: String? = null,
    val markdown: String,
    val questionCount: Int
)

data class StudySessionStartRequest(
    val target: Int = 20
)

data class StudySessionStartResponse(
    val sessionId: String,
    val logId: String,
    val questions: List<StudySessionQuestionDto>
)

// 학생에게 노출할 문제 (정답 마스킹)
data class StudySessionQuestionDto(
    val id: String,
    val questionNo: Int,
    val questionType: String,
    val stem: String,
    val choices: List<StudySessionChoiceDto>? = null,
    val fillBlanks: List<StudyFillBlankDto>? = null,
    val modelAnswerHint: String? = null // ESSAY: 채워야 할 자리수만 제공
)

data class StudySessionChoiceDto(
    val id: String,
    val text: String
    // isCorrect, errorPatternIdx 마스킹
)

data class StudyAttemptSubmitRequest(
    val sessionId: String,
    val questionId: String,
    val selectedChoiceId: String? = null, // MULTI_CHOICE/OX
    val userAnswer: String? = null         // ESSAY
)

data class StudyAttemptSubmitResponse(
    val isCorrect: Boolean,
    val correctChoiceId: String? = null,
    val correctAnswer: String? = null,
    val triggeredErrorPatternIdx: List<Int>? = null,
    val explanation: String? = null
)

data class StudySessionCompleteRequest(
    val sessionId: String
)

data class StudySessionCompleteResponse(
    val totalAttempted: Int,
    val totalCorrect: Int,
    val accuracy: Double,
    val earnedSeed: Int,
    val seedType: String,
    val weaknessHint: List<String> = emptyList()
)
