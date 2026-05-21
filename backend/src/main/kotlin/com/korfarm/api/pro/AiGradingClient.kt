package com.korfarm.api.pro

import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.aigen.AiGenLogService
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse

data class AiGradeResult(
    val score: Int,
    val feedback: String,
    val model: String
)

@Component
class AiGradingClient(
    @Value("\${claude.api.key:}") private val apiKey: String,
    @Value("\${claude.api.url:https://api.anthropic.com/v1/messages}") private val apiUrl: String,
    private val objectMapper: ObjectMapper,
    private val aiGenLogService: AiGenLogService
) {
    private val log = LoggerFactory.getLogger(AiGradingClient::class.java)
    private val httpClient = HttpClient.newHttpClient()
    // N-26 (2026-05-21) — Sonnet 4.6 으로 갱신
    private val modelId = "claude-sonnet-4-6"

    fun grade(
        studentAnswer: String,
        modelAnswer: String,
        rubric: String,
        maxPoints: Int,
        userId: String
    ): AiGradeResult {
        if (apiKey.isBlank()) {
            return AiGradeResult(0, "AI 채점 API 키가 설정되지 않았습니다.", "none")
        }

        val prompt = buildPrompt(studentAnswer, modelAnswer, rubric, maxPoints)

        val requestBody = objectMapper.writeValueAsString(mapOf(
            "model" to modelId,
            "max_tokens" to 1024,
            "messages" to listOf(
                mapOf("role" to "user", "content" to prompt)
            )
        ))

        val request = HttpRequest.newBuilder()
            .uri(URI.create(apiUrl))
            .header("Content-Type", "application/json")
            .header("x-api-key", apiKey)
            .header("anthropic-version", "2023-06-01")
            .POST(HttpRequest.BodyPublishers.ofString(requestBody))
            .build()

        val started = System.currentTimeMillis()
        return try {
            val response = httpClient.send(request, HttpResponse.BodyHandlers.ofString())
            val duration = (System.currentTimeMillis() - started).toInt()
            val raw = response.body()
            val (inTok, outTok) = extractUsage(raw)
            logUsage(userId, duration, inTok, outTok, status = "success")
            parseResponse(raw)
        } catch (e: Exception) {
            val duration = (System.currentTimeMillis() - started).toInt()
            logUsage(userId, duration, null, null, status = "error", errorMessage = e.message)
            AiGradeResult(0, "AI 채점 실패: ${e.message}", modelId)
        }
    }

    private fun extractUsage(raw: String): Pair<Int?, Int?> {
        return try {
            val parsed = objectMapper.readValue(raw, Map::class.java)
            val usage = parsed["usage"] as? Map<*, *>
            Pair(
                (usage?.get("input_tokens") as? Number)?.toInt(),
                (usage?.get("output_tokens") as? Number)?.toInt()
            )
        } catch (e: Exception) {
            Pair(null, null)
        }
    }

    private fun logUsage(
        userId: String,
        durationMs: Int,
        inputTokens: Int?,
        outputTokens: Int?,
        status: String,
        errorMessage: String? = null
    ) {
        try {
            aiGenLogService.log(
                userId = userId,
                testId = null,
                kind = "pro-grading",
                model = modelId,
                inputTokens = inputTokens,
                outputTokens = outputTokens,
                durationMs = durationMs,
                status = status,
                errorMessage = errorMessage
            )
        } catch (e: Exception) {
            log.warn("AI 사용 로그 저장 실패: kind=pro-grading err={}", e.message)
        }
    }

    private fun buildPrompt(studentAnswer: String, modelAnswer: String, rubric: String, maxPoints: Int): String {
        return """
            당신은 한국어 서술형 시험 채점 전문가입니다.

            [모범답안]
            $modelAnswer

            [채점 기준 (${maxPoints}점 만점)]
            $rubric

            [학생 답안]
            $studentAnswer

            위 학생 답안을 채점해주세요.

            반드시 아래 JSON 형식으로만 응답하세요:
            {"score": 점수(정수), "feedback": "구체적인 피드백"}
        """.trimIndent()
    }

    private fun parseResponse(responseBody: String): AiGradeResult {
        return try {
            val responseMap = objectMapper.readValue(responseBody, Map::class.java)
            val content = (responseMap["content"] as? List<*>)?.firstOrNull() as? Map<*, *>
            val text = content?.get("text") as? String ?: return AiGradeResult(0, "응답 파싱 실패", modelId)

            // JSON 부분 추출
            val jsonMatch = Regex("""\{[^}]*"score"\s*:\s*\d+[^}]*\}""").find(text)
            if (jsonMatch != null) {
                val resultMap = objectMapper.readValue(jsonMatch.value, Map::class.java)
                val score = (resultMap["score"] as? Number)?.toInt() ?: 0
                val feedback = resultMap["feedback"] as? String ?: ""
                AiGradeResult(score, feedback, modelId)
            } else {
                AiGradeResult(0, text, modelId)
            }
        } catch (e: Exception) {
            AiGradeResult(0, "응답 파싱 실패: ${e.message}", modelId)
        }
    }
}
