package com.korfarm.api.wisdom

import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.aigen.AiGenLogService
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import org.slf4j.LoggerFactory
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.time.Duration
import java.util.Base64

data class AiFeedbackResult(
    val comment: String,
    val correction: String?,
    val model: String
)

data class OcrResult(
    val text: String,
    val model: String
)

@Component
class AiWisdomClient(
    @Value("\${claude.api.key:}") private val apiKey: String,
    @Value("\${claude.api.url:https://api.anthropic.com/v1/messages}") private val apiUrl: String,
    private val objectMapper: ObjectMapper,
    private val aiPromptRepository: AiPromptRepository,
    private val aiGenLogService: AiGenLogService
) {
    private val logger = LoggerFactory.getLogger(AiWisdomClient::class.java)
    // 비동기 job 내부에서 호출되지만 백엔드가 영원히 대기하지 않도록 안전장치
    private val httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(20))
        .build()
    private val requestTimeout: Duration = Duration.ofMinutes(5)
    private val modelId = "claude-sonnet-4-6"

    // ─── OCR ────────────────────────────────────────────

    fun ocrManuscript(imageDataList: List<Pair<ByteArray, String>>, userId: String): OcrResult {
        if (apiKey.isBlank()) return OcrResult("", "none")
        if (imageDataList.isEmpty()) return OcrResult("", modelId)

        val ocrPrompt = aiPromptRepository.findByPromptKeyAndLevelGroup("wisdom_ocr", "_common")
            ?.promptText ?: "이 원고지 이미지의 손글씨를 텍스트로 변환해주세요. 텍스트만 출력하세요."

        val contentBlocks = mutableListOf<Map<String, Any>>()
        for ((bytes, mime) in imageDataList) {
            val mediaType = if (mime == "application/pdf") "application/pdf" else mime
            val sourceType = if (mime == "application/pdf") "document" else "image"
            contentBlocks.add(mapOf(
                "type" to sourceType,
                "source" to mapOf(
                    "type" to "base64",
                    "media_type" to mediaType,
                    "data" to Base64.getEncoder().encodeToString(bytes)
                )
            ))
        }
        contentBlocks.add(mapOf("type" to "text", "text" to ocrPrompt))

        val requestBody = objectMapper.writeValueAsString(mapOf(
            "model" to modelId,
            "max_tokens" to 4096,
            "messages" to listOf(mapOf("role" to "user", "content" to contentBlocks))
        ))

        return try {
            val resp = callApiWithMeta(requestBody)
            val text = extractFirstText(resp.rawJson)
            // --- 구분선을 \f(form feed)로 변환
            val normalized = text.replace(Regex("-{3,}"), "").trim()
            logUsage(userId, "wisdom-ocr", resp, status = "success")
            OcrResult(normalized, modelId)
        } catch (e: Exception) {
            logger.error("OCR 실패", e)
            logFailure(userId, "wisdom-ocr", e.message)
            OcrResult("", modelId)
        }
    }

    // ─── 첨삭 ───────────────────────────────────────────

    fun generateFeedback(text: String, levelId: String, topicLabel: String, userId: String): AiFeedbackResult {
        if (apiKey.isBlank()) return AiFeedbackResult("AI API 키가 설정되지 않았습니다.", null, "none")
        if (text.isBlank()) return AiFeedbackResult("학생 글이 비어 있습니다.", null, modelId)

        val levelGroup = levelId.replace(Regex("[0-9]"), "")

        // 시스템 프롬프트: 공통 규칙 + 레벨별 지침 (2블록, 각각 cache_control)
        val commonPrompt = aiPromptRepository.findByPromptKeyAndLevelGroup("wisdom_feedback", "_common")
            ?.promptText ?: ""
        val levelPrompt = aiPromptRepository.findByPromptKeyAndLevelGroup("wisdom_feedback", levelGroup)
            ?.promptText ?: ""

        val systemBlocks = mutableListOf<Map<String, Any>>()
        if (commonPrompt.isNotBlank()) {
            systemBlocks.add(mapOf(
                "type" to "text",
                "text" to commonPrompt,
                "cache_control" to mapOf("type" to "ephemeral")
            ))
        }
        if (levelPrompt.isNotBlank()) {
            systemBlocks.add(mapOf(
                "type" to "text",
                "text" to levelPrompt,
                "cache_control" to mapOf("type" to "ephemeral")
            ))
        }

        // tool 정의 (출력 스키마 강제)
        val tool = mapOf(
            "name" to "submit_feedback",
            "description" to "첨삭 결과를 제출합니다",
            "input_schema" to mapOf(
                "type" to "object",
                "required" to listOf("comment", "corrections"),
                "properties" to mapOf(
                    "comment" to mapOf(
                        "type" to "string",
                        "description" to "전체 총평 (3~5문장)"
                    ),
                    "corrections" to mapOf(
                        "type" to "array",
                        "description" to "부분 첨삭 목록 (최대 8개)",
                        "items" to mapOf(
                            "type" to "object",
                            "required" to listOf("text", "suggestion", "reason"),
                            "properties" to mapOf(
                                "text" to mapOf("type" to "string", "description" to "학생 글의 원문 그대로 (2~30글자)"),
                                "suggestion" to mapOf("type" to "string", "description" to "수정 제안 또는 질문"),
                                "reason" to mapOf("type" to "string", "description" to "이유 (1문장)")
                            )
                        )
                    )
                )
            )
        )

        val userMessage = "[주제: $topicLabel]\n\n$text"

        val requestBody = objectMapper.writeValueAsString(mapOf(
            "model" to modelId,
            "max_tokens" to 4096,
            "system" to systemBlocks,
            "tools" to listOf(tool),
            "tool_choice" to mapOf("type" to "tool", "name" to "submit_feedback"),
            "messages" to listOf(mapOf("role" to "user", "content" to userMessage))
        ))

        return try {
            val resp = callApiWithMeta(requestBody)
            val parsed = parseToolResponse(resp.rawJson, text)
            logUsage(userId, "wisdom-feedback", resp, status = "success")
            parsed
        } catch (e: Exception) {
            logger.error("AI 첨삭 실패", e)
            logFailure(userId, "wisdom-feedback", e.message)
            AiFeedbackResult("AI 첨삭 실패: ${e.message}", null, modelId)
        }
    }

    // ─── 내부 ───────────────────────────────────────────

    private fun parseToolResponse(responseBody: String, originalText: String): AiFeedbackResult {
        val responseMap = objectMapper.readValue(responseBody, Map::class.java)

        // tool_use 응답에서 input 추출
        val content = responseMap["content"] as? List<*> ?: return fallbackParse(responseBody, originalText)
        val toolBlock = content.firstOrNull { (it as? Map<*, *>)?.get("type") == "tool_use" } as? Map<*, *>
            ?: return fallbackParse(responseBody, originalText)
        val input = toolBlock["input"] as? Map<*, *>
            ?: return fallbackParse(responseBody, originalText)

        val comment = input["comment"] as? String ?: ""
        val corrections = input["corrections"] as? List<*> ?: emptyList<Any>()

        // corrections → annotation 형식 변환
        val pages = originalText.split("")
        val annotations = mutableListOf<Map<String, Any>>()
        var annotationId = 1
        val usedRanges = mutableSetOf<String>()

        for (corr in corrections) {
            val corrMap = corr as? Map<*, *> ?: continue
            val errorText = corrMap["text"] as? String ?: continue
            val suggestion = corrMap["suggestion"] as? String ?: ""
            val reason = corrMap["reason"] as? String ?: ""

            // 원문에서 위치 검색
            for ((pageIdx, pageText) in pages.withIndex()) {
                var searchFrom = 0
                while (true) {
                    val startIdx = pageText.indexOf(errorText, searchFrom)
                    if (startIdx < 0) break
                    val rangeKey = "$pageIdx:$startIdx"
                    if (rangeKey !in usedRanges) {
                        usedRanges.add(rangeKey)
                        val annComment = buildAnnotationComment(suggestion, reason)
                        annotations.add(mapOf(
                            "id" to annotationId,
                            "page" to pageIdx,
                            "startIdx" to startIdx,
                            "endIdx" to startIdx + errorText.length - 1,
                            "comment" to annComment
                        ))
                        annotationId++
                        break
                    }
                    searchFrom = startIdx + 1
                }
                if (annotations.size >= annotationId - 1 && annotations.lastOrNull()?.get("page") == pageIdx) break
            }
        }

        val correctionJson = if (annotations.isNotEmpty()) objectMapper.writeValueAsString(annotations) else null
        return AiFeedbackResult(comment, correctionJson, modelId)
    }

    @Suppress("UNUSED_PARAMETER")
    private fun fallbackParse(responseBody: String, originalText: String): AiFeedbackResult {
        // tool_use가 아닌 일반 텍스트 응답인 경우
        val responseMap = objectMapper.readValue(responseBody, Map::class.java)
        val content = (responseMap["content"] as? List<*>)?.firstOrNull() as? Map<*, *>
        val text = content?.get("text") as? String ?: "응답 파싱 실패"
        return AiFeedbackResult(text, null, modelId)
    }

    private fun buildAnnotationComment(suggestion: String, reason: String): String {
        return when {
            suggestion.isNotBlank() && reason.isNotBlank() -> "$reason → $suggestion"
            suggestion.isNotBlank() -> "→ $suggestion"
            reason.isNotBlank() -> reason
            else -> ""
        }
    }

    private fun extractFirstText(rawJson: String): String {
        val responseMap = objectMapper.readValue(rawJson, Map::class.java)
        val content = (responseMap["content"] as? List<*>)?.firstOrNull() as? Map<*, *>
        return content?.get("text") as? String ?: ""
    }

    private data class CallMeta(
        val rawJson: String,
        val durationMs: Int,
        val inputTokens: Int?,
        val outputTokens: Int?
    )

    private fun callApiWithMeta(requestBody: String): CallMeta {
        val started = System.currentTimeMillis()
        val request = HttpRequest.newBuilder()
            .uri(URI.create(apiUrl))
            .timeout(requestTimeout)
            .header("Content-Type", "application/json")
            .header("x-api-key", apiKey)
            .header("anthropic-version", "2023-06-01")
            .POST(HttpRequest.BodyPublishers.ofString(requestBody))
            .build()
        val response = httpClient.send(request, HttpResponse.BodyHandlers.ofString())
        val duration = (System.currentTimeMillis() - started).toInt()
        if (response.statusCode() !in 200..299) {
            logger.error("Claude API 오류: status={}, body={}", response.statusCode(), response.body())
            throw RuntimeException("Claude API 오류: HTTP ${response.statusCode()}")
        }
        val raw = response.body()
        val parsed = try {
            objectMapper.readValue(raw, Map::class.java)
        } catch (e: Exception) {
            null
        }
        val usage = parsed?.get("usage") as? Map<*, *>
        val inTok = (usage?.get("input_tokens") as? Number)?.toInt()
        val outTok = (usage?.get("output_tokens") as? Number)?.toInt()
        return CallMeta(rawJson = raw, durationMs = duration, inputTokens = inTok, outputTokens = outTok)
    }

    private fun logUsage(userId: String, kind: String, meta: CallMeta, status: String) {
        try {
            aiGenLogService.log(
                userId = userId,
                testId = null,
                kind = kind,
                model = modelId,
                inputTokens = meta.inputTokens,
                outputTokens = meta.outputTokens,
                durationMs = meta.durationMs,
                status = status
            )
        } catch (e: Exception) {
            logger.warn("AI 사용 로그 저장 실패: kind={} err={}", kind, e.message)
        }
    }

    private fun logFailure(userId: String, kind: String, errorMessage: String?) {
        try {
            aiGenLogService.log(
                userId = userId,
                testId = null,
                kind = kind,
                model = modelId,
                status = "error",
                errorMessage = errorMessage
            )
        } catch (e: Exception) {
            logger.warn("AI 사용 로그 저장 실패(error): kind={} err={}", kind, e.message)
        }
    }
}
