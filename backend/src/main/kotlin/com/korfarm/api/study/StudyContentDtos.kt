package com.korfarm.api.study

// ─────────────────────────────────────────────
// 관리자용 요청
// ─────────────────────────────────────────────
data class StudyContentCreateRequest(
    val title: String,
    val description: String? = null,
    val levelId: String? = null,
    val area: String? = null,           // LIT/READ/GRAM/SPEAK/WRITE/MEDIA
    val subArea: String? = null,         // 현대시·고전시·논설 등
    val markdown: String,
    val evalPoints: List<String> = emptyList(),
    val errorPatterns: List<String> = emptyList(),
    val visibility: String, // PUBLIC | ORG (HQ_ADMIN만 PUBLIC, ORG_ADMIN은 ORG)
    val ownerOrgId: String? = null,
    // 원본 자료 (PDF/이미지를 마크다운으로 변환한 경우 출처 보관)
    val sourceType: String = "manual",   // manual | pdf | image
    val sourceFileUrl: String? = null,
    val sourceFileName: String? = null,
    val sourceFileHash: String? = null,
    val sourceFileSizeBytes: Long? = null
)

data class StudyContentUpdateRequest(
    val title: String? = null,
    val description: String? = null,
    val levelId: String? = null,
    val area: String? = null,
    val subArea: String? = null,
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
    val questionType: String, // MULTI_CHOICE | OX | SHORT_ANSWER | ESSAY
    val stem: String,
    /** <보기> 본문 (마크다운). 객관식·서술형에서 사용 */
    val boxContent: String? = null,
    /** <조건> 본문 (서술형 위주) */
    val conditionContent: String? = null,
    val choices: List<StudyChoiceDto>? = null,
    val modelAnswer: String? = null,        // ESSAY: 모범답안 / SHORT_ANSWER: 정답
    val fillBlanks: List<StudyFillBlankDto>? = null,  // ESSAY 빈칸 (각 빈칸에 choices 포함)
    /** SHORT_ANSWER 오답 음절 풀 (정답 글자 외, 중복 금지) */
    val distractorSyllables: List<String>? = null,
    /** 평가 포인트 인덱스 — Int 또는 String(checkpoint id). 둘 다 허용. */
    val evalPointIdx: List<Any>? = null,
    val difficulty: Int = 3,
    /** 정답 시 누적 가중치 {역량명: 가중치} */
    val competencyVector: Map<String, Double>? = null,
    /** SHORT_ANSWER/ESSAY 오답 시 마이너스 누적 가중치. MULTI_CHOICE/OX 는 choices.wrongVector 사용 */
    val wrongVector: Map<String, Double>? = null
)

data class StudyChoiceDto(
    val id: String,
    val text: String,
    val isCorrect: Boolean,
    val errorPatternIdx: Int? = null,
    /** 이 선택지를 골라 틀렸을 때 마이너스로 누적될 가중치 */
    val wrongVector: Map<String, Double>? = null
)

data class StudyFillBlankDto(
    val phrase: String,                       // 정답 어구 (한 단어 ~ 두 단어)
    val position: Int? = null,
    /** 정답 + 오답 보기 (학생은 선택지에서 고름. 정답이 포함되어 있어야 함) */
    val choices: List<String>? = null
)

data class StudyQuestionsBulkRequest(
    val questions: List<StudyQuestionDto>
)

// ─────────────────────────────────────────────
// 페이지 (V0076 이후) — 페이지별 본문 + 출제 포인트 + 문제
// ─────────────────────────────────────────────
data class StudyPageDto(
    val id: String,
    val pageNo: Int,
    val title: String? = null,
    val markdown: String,
    val checkpoints: List<StudyCheckpointDto> = emptyList(),
    val questions: List<StudyQuestionDto> = emptyList(),
    val createdAt: String? = null,
    val updatedAt: String? = null
)

data class StudyCheckpointDto(
    val id: String,
    val text: String,
    val kind: String,    // FACT|RELATION|INTENT|STRUCTURE|INFER
    val evidence: String? = null
)

data class StudyPageCreateRequest(
    val title: String? = null,
    val markdown: String = "",
    val pageNo: Int? = null   // null 이면 마지막 다음 번호
)

data class StudyPageUpdateRequest(
    val title: String? = null,
    val markdown: String? = null,
    val pageNo: Int? = null,                  // 페이지 순서 변경
    val checkpoints: List<StudyCheckpointDto>? = null
)

data class StudyPageQuestionsBulkRequest(
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
    val area: String? = null,
    val subArea: String? = null,
    val visibility: String,
    val ownerOrgId: String? = null,
    val ownerOrgName: String? = null,
    val creatorId: String,
    val questionCount: Int,
    val status: String,
    val sourceType: String = "manual",
    val createdAt: String,
    val updatedAt: String
)

data class StudyContentDetail(
    val id: String,
    val title: String,
    val description: String? = null,
    val levelId: String? = null,
    val area: String? = null,
    val subArea: String? = null,
    val visibility: String,
    val ownerOrgId: String? = null,
    val creatorId: String,
    val markdown: String,
    val evalPoints: List<String>,
    val errorPatterns: List<String>,
    val questionCount: Int,
    val status: String,
    val questions: List<StudyQuestionDto>,
    val sourceType: String = "manual",
    val sourceFileUrl: String? = null,
    val sourceFileName: String? = null,
    val sourceFileSizeBytes: Long? = null,
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
    val area: String? = null,
    val subArea: String? = null,
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
    val area: String? = null,
    val subArea: String? = null,
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

// ─────────────────────────────────────────────
// V0076 이후 — 페이지 단위 학생 학습 (시험지 디자인)
// ─────────────────────────────────────────────
/** 학생 화면용 — 콘텐츠 메타 + 모든 페이지(본문+문제) 정답 마스킹된 형태 */
data class StudyContentFullStudentDto(
    val id: String,
    val title: String,
    val description: String? = null,
    val levelId: String? = null,
    val area: String? = null,
    val subArea: String? = null,
    val pages: List<StudyPageStudentDto>,
    val sessionId: String,    // 학습 세션 ID (저장 시 사용)
    val logId: String         // farm_learning_log ID (완료 시 사용)
)

data class StudyPageStudentDto(
    val id: String,
    val pageNo: Int,
    val title: String? = null,
    val markdown: String,
    val questions: List<StudyPageStudentQuestionDto>
)

/** 정답 마스킹된 문제 (correctChoiceId, modelAnswer.fillBlanks 정답 등 제거) */
data class StudyPageStudentQuestionDto(
    val id: String,
    val questionNo: Int,
    val questionType: String,
    val stem: String,
    /** <보기> 본문 (마스킹 X — 학습 자료) */
    val boxContent: String? = null,
    /** <조건> 본문 */
    val conditionContent: String? = null,
    /** MULTI_CHOICE/OX: 선택지 (id, text 만 — isCorrect 마스킹) */
    val choices: List<StudyPageStudentChoiceDto>? = null,
    /** SHORT_ANSWER: 정답 글자수 — 음절 카드 생성용. 정답 자체는 마스킹 */
    val answerLength: Int? = null,
    /** SHORT_ANSWER: 음절 카드 풀 (정답 글자 + 더미 글자 셔플, 글자수×2) */
    val syllableCards: List<String>? = null,
    /** ESSAY: 모범답안 (빈칸 위치는 fillBlanks 의 phrase 를 ___ 로 마스킹) */
    val modelAnswerMasked: String? = null,
    val fillBlanksCount: Int? = null,
    /**
     * ESSAY: 빈칸별 선택지 (정답 + 오답 보기, 셔플됨).
     * 학생은 빈칸 클릭 시 이 카드 중 하나를 고름.
     * blank 인덱스 순서대로.
     */
    val fillBlanksChoices: List<List<String>>? = null
)

data class StudyPageStudentChoiceDto(
    val id: String,
    val text: String
)
