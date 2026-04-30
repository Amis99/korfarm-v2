package com.korfarm.api.aigen

import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse

/**
 * 공용 Claude API 호출 helper.
 * - AiWisdomClient 의 기존 호출 패턴을 추출. 모델 ID 매개변수화.
 * - Prompt Caching: 시스템 프롬프트 블록에 cache_control: ephemeral 자동 추가 가능.
 */
@Component
class AiCallHelper(
    @Value("\${claude.api.key:}") private val apiKey: String,
    @Value("\${claude.api.url:https://api.anthropic.com/v1/messages}") private val apiUrl: String,
    private val objectMapper: ObjectMapper,
) {
    private val logger = LoggerFactory.getLogger(AiCallHelper::class.java)
    private val httpClient = HttpClient.newHttpClient()

    companion object {
        const val MODEL_SONNET = "claude-sonnet-4-6"
        const val MODEL_OPUS = "claude-opus-4-7"
    }

    fun isConfigured(): Boolean = apiKey.isNotBlank()

    /**
     * 단일 호출. system 블록(들) + user 텍스트 메시지 1개로 단순화.
     *
     * @param model            모델 ID
     * @param systemBlocks     system 콘텐츠 블록 리스트 (각 블록은 cache_control 적용 가능)
     * @param userText         user 메시지 본문
     * @param maxTokens        최대 토큰
     * @return                 응답 raw JSON 문자열 (호출자가 파싱)
     */
    fun call(
        model: String,
        systemBlocks: List<Map<String, Any?>>,
        userText: String,
        maxTokens: Int = 4096,
    ): CallResult {
        if (!isConfigured()) throw IllegalStateException("Claude API 키 미설정")
        val started = System.currentTimeMillis()
        val body = mapOf(
            "model" to model,
            "max_tokens" to maxTokens,
            "system" to systemBlocks,
            "messages" to listOf(mapOf("role" to "user", "content" to userText)),
        )
        val raw = postRaw(objectMapper.writeValueAsString(body))
        val duration = (System.currentTimeMillis() - started).toInt()
        @Suppress("UNCHECKED_CAST")
        val resp = objectMapper.readValue(raw, Map::class.java) as Map<String, Any?>
        val text = ((resp["content"] as? List<*>)?.firstOrNull() as? Map<*, *>)?.get("text") as? String ?: ""
        val usage = resp["usage"] as? Map<*, *>
        val inTokens = (usage?.get("input_tokens") as? Number)?.toInt()
        val outTokens = (usage?.get("output_tokens") as? Number)?.toInt()
        val stopReason = resp["stop_reason"] as? String
        return CallResult(text = text, durationMs = duration, inputTokens = inTokens, outputTokens = outTokens, stopReason = stopReason)
    }

    /**
     * 시스템 블록 helper — 텍스트를 block 으로 변환. ephemeral 캐시는 토글 가능.
     */
    fun systemBlock(text: String, ephemeralCache: Boolean = false): Map<String, Any?> {
        val block = mutableMapOf<String, Any?>("type" to "text", "text" to text)
        if (ephemeralCache) block["cache_control"] = mapOf("type" to "ephemeral")
        return block
    }

    /**
     * Multimodal 호출 — user content 에 이미지(들) 또는 PDF + 텍스트 지시문.
     * @param userContent  user content 배열 (이미지/PDF block + text block 혼합)
     */
    fun callMultimodal(
        model: String,
        systemBlocks: List<Map<String, Any?>>,
        userContent: List<Map<String, Any?>>,
        maxTokens: Int = 8192,
    ): CallResult {
        if (!isConfigured()) throw IllegalStateException("Claude API 키 미설정")
        val started = System.currentTimeMillis()
        val body = mapOf(
            "model" to model,
            "max_tokens" to maxTokens,
            "system" to systemBlocks,
            "messages" to listOf(mapOf("role" to "user", "content" to userContent)),
        )
        val raw = postRaw(objectMapper.writeValueAsString(body), pdfBeta = userContent.any { it["type"] == "document" })
        val duration = (System.currentTimeMillis() - started).toInt()
        @Suppress("UNCHECKED_CAST")
        val resp = objectMapper.readValue(raw, Map::class.java) as Map<String, Any?>
        val text = ((resp["content"] as? List<*>)?.firstOrNull() as? Map<*, *>)?.get("text") as? String ?: ""
        val usage = resp["usage"] as? Map<*, *>
        val inTokens = (usage?.get("input_tokens") as? Number)?.toInt()
        val outTokens = (usage?.get("output_tokens") as? Number)?.toInt()
        val stopReason = resp["stop_reason"] as? String
        return CallResult(text = text, durationMs = duration, inputTokens = inTokens, outputTokens = outTokens, stopReason = stopReason)
    }

    /** base64 image content block */
    fun imageBlock(base64Data: String, mediaType: String): Map<String, Any?> = mapOf(
        "type" to "image",
        "source" to mapOf("type" to "base64", "media_type" to mediaType, "data" to base64Data)
    )

    /** base64 PDF document content block */
    fun pdfBlock(base64Data: String): Map<String, Any?> = mapOf(
        "type" to "document",
        "source" to mapOf("type" to "base64", "media_type" to "application/pdf", "data" to base64Data)
    )

    /** plain text content block */
    fun textBlock(text: String): Map<String, Any?> = mapOf("type" to "text", "text" to text)

    private fun postRaw(jsonBody: String, pdfBeta: Boolean = false): String {
        val betas = mutableListOf("prompt-caching-2024-07-31")
        if (pdfBeta) betas.add("pdfs-2024-09-25")
        val req = HttpRequest.newBuilder()
            .uri(URI.create(apiUrl))
            .header("Content-Type", "application/json")
            .header("x-api-key", apiKey)
            .header("anthropic-version", "2023-06-01")
            .header("anthropic-beta", betas.joinToString(","))
            .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
            .build()
        val res = httpClient.send(req, HttpResponse.BodyHandlers.ofString())
        if (res.statusCode() !in 200..299) {
            logger.error("Claude API 오류: status={}, body={}", res.statusCode(), res.body())
            throw RuntimeException("Claude API 오류: HTTP ${res.statusCode()}: ${res.body()}")
        }
        return res.body()
    }

    data class CallResult(
        val text: String,
        val durationMs: Int,
        val inputTokens: Int?,
        val outputTokens: Int?,
        val stopReason: String? = null,   // "end_turn" | "max_tokens" | "stop_sequence" | "tool_use"
    )
}
