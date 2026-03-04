package com.korfarm.api.pro

import com.fasterxml.jackson.databind.ObjectMapper
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
    private val objectMapper: ObjectMapper
) {
    private val httpClient = HttpClient.newHttpClient()
    private val modelId = "claude-sonnet-4-20250514"

    fun grade(studentAnswer: String, modelAnswer: String, rubric: String, maxPoints: Int): AiGradeResult {
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

        return try {
            val response = httpClient.send(request, HttpResponse.BodyHandlers.ofString())
            parseResponse(response.body())
        } catch (e: Exception) {
            AiGradeResult(0, "AI 채점 실패: ${e.message}", modelId)
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
