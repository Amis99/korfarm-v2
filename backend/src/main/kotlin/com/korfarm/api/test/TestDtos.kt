package com.korfarm.api.test

import java.time.LocalDateTime

// ── Student: Test list ──
data class TestPaperSummary(
    val testId: String,
    val title: String,
    val description: String?,
    val levelId: String?,
    val totalQuestions: Int,
    val totalPoints: Int,
    val timeLimitMinutes: Int?,
    val examDate: String?,
    val series: String?,
    val orgId: String?,
    val orgName: String?,
    val hasSubmitted: Boolean,
    val score: Int?,
    val submissionCount: Int? = null,
    val pdfFileId: String? = null,
    val answerPdfFileId: String? = null,
    val createdAt: LocalDateTime,
    // 테스트 종류: "diagnostic" / "chapter" / "misc"
    // 종류별로 응시 카운트 소스가 다름 (diagnostic → diag_sessions, chapter → pro_test_sessions, misc → test_submissions)
    val kind: String = "misc"
)

// ── Student: Test detail ──
data class TestPaperDetail(
    val testId: String,
    val title: String,
    val description: String?,
    val pdfFileId: String?,
    val answerPdfFileId: String? = null,
    val levelId: String?,
    val totalQuestions: Int,
    val totalPoints: Int,
    val timeLimitMinutes: Int?,
    val examDate: String?,
    val series: String?,
    val hasQuestions: Boolean,
    val hasSubmitted: Boolean,
    val createdAt: LocalDateTime
)

// ── Admin: Question view ──
data class ChoiceItem(
    val id: String,
    val text: String
)

data class TestQuestionView(
    val questionId: String,
    val number: Int,
    val type: String,
    val domain: String?,
    val subDomain: String?,
    val passage: String?,
    val stem: String?,
    val points: Int,
    val correctAnswer: String?,
    val choices: List<ChoiceItem>?,
    val choiceExplanations: Map<String, String>?,
    val intent: String?,
    val essayKeywords: List<EssayKeyword>?,
    val essayRubric: String?,
    val modelAnswer: String?
)

data class EssayKeyword(
    val keyword: String,
    val weight: Int = 1
)

// ── Student: Question stubs (no correct answer) ──
data class TestQuestionStub(
    val number: Int,
    val type: String,
    val domain: String?,
    val points: Int,
    val passage: String? = null,
    val content: String? = null,
    val choices: List<String>? = null
)

// ── Student: OMR submit request ──
data class SubmitOmrRequest(
    val answers: Map<String, String>,
    val userId: String? = null
)

// ── Student: Report (성적표) ──
data class TestReportResponse(
    val testId: String,
    val testTitle: String,
    val totalQuestions: Int,
    val totalPoints: Int,
    val score: Int,
    val correctCount: Int,
    val accuracy: Double,
    val submittedAt: LocalDateTime,
    val details: List<QuestionResult>,
    val domainScores: Map<String, DomainScore>
)

data class QuestionResult(
    val questionNumber: Int,
    val type: String,
    val domain: String?,
    val passage: String?,
    val myAnswer: String,
    val correctAnswer: String,
    val isCorrect: Boolean,
    val points: Int,
    val earnedPoints: Int,
    val choiceExplanation: String?,
    val intent: String?
)

data class DomainScore(
    val score: Int,
    val maxScore: Int,
    val correct: Int,
    val total: Int
)

// ── Student: Wrong note (오답 노트) ──
data class WrongNoteResponse(
    val testId: String,
    val testTitle: String,
    val wrongItems: List<WrongNoteItem>
)

data class WrongNoteItem(
    val questionNumber: Int,
    val type: String,
    val domain: String?,
    val passage: String?,
    val myAnswer: String,
    val correctAnswer: String,
    val points: Int,
    val intent: String?,
    val feedback: String
)

// ── Admin: Create test ──
data class CreateTestRequest(
    val title: String,
    val description: String? = null,
    val levelId: String? = null,
    val totalQuestions: Int = 0,
    val totalPoints: Int = 0,
    val timeLimitMinutes: Int? = null,
    val examDate: String? = null,
    val series: String? = null,
    val orgId: String? = null
)

// ── Admin: Update test ──
data class UpdateTestRequest(
    val title: String? = null,
    val description: String? = null,
    val levelId: String? = null,
    val totalQuestions: Int? = null,
    val totalPoints: Int? = null,
    val timeLimitMinutes: Int? = null,
    val examDate: String? = null,
    val series: String? = null,
    val status: String? = null
)

// ── Admin: Set questions ──
data class SetQuestionsRequest(
    val questions: List<QuestionInput>
)

data class QuestionInput(
    val number: Int,
    val type: String = "객관식",
    val domain: String? = null,
    val subDomain: String? = null,
    val passage: String? = null,
    val stem: String? = null,
    val points: Int = 0,
    val correctAnswer: String? = null,
    val choices: List<ChoiceItem>? = null,
    val choiceExplanations: Map<String, String>? = null,
    val intent: String? = null,
    val essayKeywords: List<EssayKeyword>? = null,
    val essayRubric: String? = null,
    val modelAnswer: String? = null
)

// ── Admin: Submission summary ──
data class SubmissionSummary(
    val userId: String,
    val userName: String?,
    val score: Int,
    val correctCount: Int,
    val accuracy: Double,
    val submittedBy: String?,
    val submittedAt: LocalDateTime
)

// ── Student: History ──
data class TestHistoryItem(
    val testId: String,
    val testTitle: String,
    val examDate: String?,
    val score: Int,
    val totalPoints: Int,
    val correctCount: Int,
    val totalQuestions: Int,
    val accuracy: Double,
    val submittedAt: LocalDateTime,
    val avgScore: Double? = null,
    val maxScore: Int? = null,
    val minScore: Int? = null,
)

// ── Admin: Student list for answer entry ──
data class StudentForTest(
    val userId: String,
    val name: String?,
    val orgId: String?,
    val orgName: String?,
    val classIds: List<String>,
    val classNames: List<String>,
    val hasSubmitted: Boolean,
    val score: Int?
)

// ── Admin: 시험지 통계 요약 ──
data class TestPaperStatistics(
    val paperId: String,
    val submissionCount: Int,
    val avgScore: Double?,
    val maxScore: Int?,
    val minScore: Int?,
    val stdDev: Double?,
    val totalPoints: Int,
    val gradeStats: Map<String, GradeStat>,
    val updatedAt: LocalDateTime?
)

data class GradeStat(
    val count: Int,
    val avg: Double,
    val max: Int,
    val min: Int,
    val stdDev: Double
)

// ── Admin: 학생별 응시 상세 (통계 페이지) ──
data class StudentSubmissionDetail(
    val userId: String,
    val userName: String?,
    val school: String?,
    val grade: String?,
    val orgName: String?,
    val score: Int,
    val totalPoints: Int,
    val accuracy: Double,
    val submittedAt: LocalDateTime,
    val domainScores: Map<String, DomainScore>,
    val wrongQuestionNumbers: List<Int>,
    // 학생명 클릭 → 실제 성적표 페이지 navigation 용 (2026-05-16 추가)
    val kind: String = "misc",                 // "diagnostic" / "chapter" / "misc"
    val sessionId: String? = null,             // 진단: diag_sessions.id / 챕터: pro_test_sessions.id
    val submissionId: String? = null,          // 챕터·기타: test_submissions.id
    val tier: String? = null,                  // 진단: sohssure/frege/russell/wittgenstein
    val tci: Double? = null,                   // 진단: adjusted_tci (없으면 raw_tci)
    val recommendedLevel: String? = null,      // 진단 판정 레벨
)

// ── Admin: 문항별 분석 ──
data class QuestionAnalysis(
    val number: Int,
    val type: String,
    val domain: String?,
    val subDomain: String?,
    val points: Int,
    val correctAnswer: String?,
    val wrongRate: Double,                    // 오답률 (0.0~1.0)
    val correctRate: Double,                  // 정답률
    val attempts: Int,                        // 전체 응시자 수
    val correctCount: Int,                    // 정답자 수
    val choiceDistribution: Map<String, Int>, // 객관식: 선택지별 응답자 수 {"1": N, ...}
    val choiceStudents: Map<String, List<String>>, // 객관식: 선택지별 응답 학생 이름
    val wrongStudentNames: List<String>,      // 틀린 학생 이름 (전체)
    val competencyVector: Map<String, Double>, // 10대 역량 가중치
    // 서술형 전용
    val essayDistribution: Map<String, Int> = emptyMap(), // {"full": N, "partial": N, "zero": N}
    val essayBuckets: Map<String, List<EssayAnswerEntry>> = emptyMap(), // 점수 버킷별 학생/답안
    // 객관식 선지 ID 목록 — 진단(A/B/C/D 등) vs 일반(1/2/3/4/5) 구분 위해 동적 전달
    val choiceIds: List<String> = emptyList()
)

data class EssayAnswerEntry(
    val userId: String,
    val name: String,
    val answer: String,
    val earned: Int
)

// ── 시험지 비주얼 에디터 payload ──
// payload_json 컬럼에 직렬화되는 형식. 자유로운 구조 허용 (Map<String, Any>)
// 권장 구조:
//   { "passages": [...], "questions": [...], "metadata": {...} }
data class TestPaperPayload(
    val payload: Any?  // Map<String, Any> 형태로 자유 구조
)

