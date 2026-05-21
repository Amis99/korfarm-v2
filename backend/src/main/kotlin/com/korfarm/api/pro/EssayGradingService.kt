package com.korfarm.api.pro

import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.test.TestService
import com.korfarm.api.user.UserRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class EssayGradingService(
    private val essayGradingRepo: EssayGradingRepo,
    private val testService: TestService,
    private val aiGradingClient: AiGradingClient,
    private val userRepository: UserRepository,
    private val objectMapper: ObjectMapper
) {

    /**
     * N-26 (2026-05-21) — 제출 직후 모든 서술형 문항을 AI(Sonnet 4.6) 로 일괄 자동 채점.
     * 병렬 호출(8 thread pool) 로 응답 시간 단축. AI 실패 시 키워드 채점 결과 그대로 사용.
     * createGradingsForSubmission 직후 호출 권장.
     */
    fun aiGradeAllEssaysOfSubmission(submissionId: String) {
        val gradings = essayGradingRepo.findBySubmissionIdOrderByQuestionNumberAsc(submissionId)
            .filter { it.status != "ai_graded" && it.status != "human_overridden" }
        if (gradings.isEmpty()) return
        val log = org.slf4j.LoggerFactory.getLogger(EssayGradingService::class.java)
        val pool = java.util.concurrent.Executors.newFixedThreadPool(
            minOf(8, gradings.size).coerceAtLeast(1)
        )
        try {
            gradings.map { g ->
                pool.submit {
                    try {
                        aiGrade(AiGradeRequest(submissionId = g.submissionId, questionNumber = g.questionNumber))
                    } catch (e: Exception) {
                        log.warn("AI 자동 채점 실패 (submission=$submissionId q=${g.questionNumber}): ${e.message}")
                    }
                }
            }.forEach { it.get(90, java.util.concurrent.TimeUnit.SECONDS) }
        } finally {
            pool.shutdown()
        }
    }

    // 서술형 채점 레코드 생성 (제출 시 호출)
    @Transactional
    fun createGradingsForSubmission(submissionId: String, testId: String, userId: String, answers: Map<String, String>) {
        val questions = testService.getQuestions(testId)
        val essayQuestions = questions.filter { it.type == "서술형" }
        for (q in essayQuestions) {
            val studentAnswer = answers[q.number.toString()] ?: ""
            val existing = essayGradingRepo.findBySubmissionIdAndQuestionNumber(submissionId, q.number)
            if (existing != null) continue

            // 키워드 매칭 즉시 채점
            var keywordScore: Int? = null
            var keywordDetail: String? = null
            var status = "pending"
            if (q.essayKeywords != null && q.essayKeywords.isNotEmpty() && studentAnswer.isNotBlank()) {
                val result = testService.gradeByKeywords(studentAnswer, q.essayKeywords, q.points)
                keywordScore = result.score
                keywordDetail = objectMapper.writeValueAsString(
                    mapOf("matched" to result.matched, "missed" to result.missed)
                )
                status = "keyword_graded"
            }

            essayGradingRepo.save(
                EssayGradingEntity(
                    id = IdGenerator.newId("eg"),
                    submissionId = submissionId,
                    testId = testId,
                    questionNumber = q.number,
                    userId = userId,
                    studentAnswer = studentAnswer,
                    keywordScore = keywordScore,
                    keywordDetail = keywordDetail,
                    status = status
                )
            )
        }
    }

    // 키워드 재채점
    @Transactional
    fun keywordGrade(request: KeywordGradeRequest): EssayGradingView {
        val grading = essayGradingRepo.findBySubmissionIdAndQuestionNumber(request.submissionId, request.questionNumber)
            ?: throw ApiException("NOT_FOUND", "채점 레코드를 찾을 수 없습니다.", HttpStatus.NOT_FOUND)

        val question = testService.getQuestion(grading.testId, grading.questionNumber)
            ?: throw ApiException("NOT_FOUND", "문항을 찾을 수 없습니다.", HttpStatus.NOT_FOUND)

        val keywords = testService.parseEssayKeywords(question.essayKeywordsJson)
        if (keywords.isNullOrEmpty()) {
            throw ApiException("NO_KEYWORDS", "키워드가 설정되지 않았습니다.", HttpStatus.BAD_REQUEST)
        }

        val studentAnswer = grading.studentAnswer ?: ""
        val result = testService.gradeByKeywords(studentAnswer, keywords, question.points)
        grading.keywordScore = result.score
        grading.keywordDetail = objectMapper.writeValueAsString(
            mapOf("matched" to result.matched, "missed" to result.missed)
        )
        grading.status = "keyword_graded"
        essayGradingRepo.save(grading)

        return toView(grading, question.points, question.modelAnswer)
    }

    // AI 채점
    @Transactional
    fun aiGrade(request: AiGradeRequest): EssayGradingView {
        val grading = essayGradingRepo.findBySubmissionIdAndQuestionNumber(request.submissionId, request.questionNumber)
            ?: throw ApiException("NOT_FOUND", "채점 레코드를 찾을 수 없습니다.", HttpStatus.NOT_FOUND)

        val question = testService.getQuestion(grading.testId, grading.questionNumber)
            ?: throw ApiException("NOT_FOUND", "문항을 찾을 수 없습니다.", HttpStatus.NOT_FOUND)

        val studentAnswer = grading.studentAnswer ?: ""
        val rubric = question.essayRubricJson ?: ""
        val modelAnswer = question.modelAnswer ?: ""

        val aiResult = aiGradingClient.grade(
            studentAnswer = studentAnswer,
            modelAnswer = modelAnswer,
            rubric = rubric,
            maxPoints = question.points,
            userId = grading.userId
        )

        grading.aiScore = aiResult.score
        grading.aiFeedback = aiResult.feedback
        grading.aiGradedAt = LocalDateTime.now()
        grading.aiModel = aiResult.model
        grading.status = "ai_graded"
        essayGradingRepo.save(grading)

        return toView(grading, question.points, question.modelAnswer)
    }

    // AI 일괄 채점
    @Transactional
    fun aiGradeBatch(request: AiGradeBatchRequest): List<EssayGradingView> {
        val gradings = essayGradingRepo.findBySubmissionId(request.submissionId)
        return gradings.map { grading ->
            try {
                aiGrade(AiGradeRequest(grading.submissionId, grading.questionNumber))
            } catch (e: Exception) {
                val question = testService.getQuestion(grading.testId, grading.questionNumber)
                toView(grading, question?.points ?: 0, question?.modelAnswer)
            }
        }
    }

    // 최종 점수 확정
    @Transactional
    fun confirmGrade(request: ConfirmGradeRequest, gradedBy: String): EssayGradingView {
        val grading = essayGradingRepo.findById(request.gradingId).orElseThrow {
            ApiException("NOT_FOUND", "채점 레코드를 찾을 수 없습니다.", HttpStatus.NOT_FOUND)
        }

        val question = testService.getQuestion(grading.testId, grading.questionNumber)
            ?: throw ApiException("NOT_FOUND", "문항을 찾을 수 없습니다.", HttpStatus.NOT_FOUND)

        // 이전 최종 점수 또는 키워드 자동채점 점수 기준으로 차이 계산
        // (초기 제출 시 키워드 점수가 submission.score에 이미 포함되어 있음)
        val previousFinal = grading.finalScore ?: grading.keywordScore ?: 0
        val scoreDiff = request.finalScore - previousFinal

        grading.finalScore = request.finalScore
        grading.gradedBy = gradedBy
        grading.gradedAt = LocalDateTime.now()
        grading.status = "confirmed"
        essayGradingRepo.save(grading)

        // submission 점수 업데이트
        if (scoreDiff != 0) {
            testService.updateSubmissionScore(grading.submissionId, scoreDiff)
        }

        return toView(grading, question.points, question.modelAnswer)
    }

    // 채점 목록 조회
    @Transactional(readOnly = true)
    fun getGradings(testId: String?, userId: String?): List<EssayGradingView> {
        val gradings = when {
            testId != null && userId != null -> essayGradingRepo.findByTestIdAndUserId(testId, userId)
            testId != null -> essayGradingRepo.findByTestId(testId)
            else -> emptyList()
        }

        return gradings.map { grading ->
            val question = testService.getQuestion(grading.testId, grading.questionNumber)
            toView(grading, question?.points ?: 0, question?.modelAnswer)
        }
    }

    private fun toView(grading: EssayGradingEntity, maxPoints: Int, modelAnswer: String?): EssayGradingView {
        val keywordDetailView = if (grading.keywordDetail != null) {
            try {
                val map = objectMapper.readValue(grading.keywordDetail, Map::class.java) as Map<String, Any>
                val matched = (map["matched"] as? List<*>)?.map { it.toString() } ?: emptyList()
                val missed = (map["missed"] as? List<*>)?.map { it.toString() } ?: emptyList()
                KeywordDetailView(matched, missed, matched.size + missed.size)
            } catch (e: Exception) {
                null
            }
        } else null

        return EssayGradingView(
            gradingId = grading.id,
            submissionId = grading.submissionId,
            testId = grading.testId,
            questionNumber = grading.questionNumber,
            userId = grading.userId,
            studentAnswer = grading.studentAnswer,
            keywordScore = grading.keywordScore,
            keywordDetail = keywordDetailView,
            aiScore = grading.aiScore,
            aiFeedback = grading.aiFeedback,
            finalScore = grading.finalScore,
            maxPoints = maxPoints,
            modelAnswer = modelAnswer,
            status = grading.status,
            createdAt = grading.createdAt
        )
    }
}
