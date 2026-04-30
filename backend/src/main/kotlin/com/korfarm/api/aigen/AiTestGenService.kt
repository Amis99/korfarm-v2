package com.korfarm.api.aigen

import org.springframework.stereotype.Service

@Service
class AiTestGenService(
    private val passageGenerator: PassageGenerator,
    private val questionGenerator: QuestionGenerator,
    private val aiGenLogService: AiGenLogService,
) {
    fun generatePassage(req: PassageGenRequest, userId: String): PassageGenResponse {
        return try {
            val resp = passageGenerator.generate(req)
            aiGenLogService.log(
                userId = userId, testId = req.testId, kind = "passage",
                model = resp.model, durationMs = resp.durationMs,
                status = "success",
            )
            resp
        } catch (e: Exception) {
            aiGenLogService.log(
                userId = userId, testId = req.testId, kind = "passage",
                model = AiCallHelper.MODEL_SONNET,
                status = "error", errorMessage = e.message,
            )
            throw e
        }
    }

    fun generateQuestion(req: QuestionGenRequest, userId: String): QuestionGenResponse {
        // 티어에 따른 모델 (로그·응답에 정확히 반영)
        val tier = (req.tier ?: "BASIC").uppercase()
        val model = if (tier == "ADVANCED") AiCallHelper.MODEL_OPUS else AiCallHelper.MODEL_SONNET
        return try {
            val gen = questionGenerator.generate(req)
            aiGenLogService.log(
                userId = userId, testId = req.testId, kind = "question",
                model = model,
                inputTokens = gen.inputTokens, outputTokens = gen.outputTokens,
                durationMs = gen.durationMs,
                passed = gen.review.passed, retryCount = gen.retryCount,
                status = "success",
            )
            QuestionGenResponse(
                question = gen.question,
                passed = gen.review.passed,
                reviewScore = gen.review.score,
                reviewIssues = gen.review.issues,
                suggestedFixes = gen.review.suggestedFixes,
                retryCount = gen.retryCount,
                model = model,
                durationMs = gen.durationMs,
            )
        } catch (e: Exception) {
            aiGenLogService.log(
                userId = userId, testId = req.testId, kind = "question",
                model = model,
                status = "error", errorMessage = e.message,
            )
            throw e
        }
    }
}
