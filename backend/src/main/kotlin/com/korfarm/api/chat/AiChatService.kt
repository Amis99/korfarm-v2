package com.korfarm.api.chat

import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.wisdom.AiPromptRepository
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.data.domain.PageRequest
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@Service
class AiChatService(
    private val messageRepo: ChatMessageRepository,
    private val referenceRepo: AiChatReferenceRepository,
    private val aiPromptRepository: AiPromptRepository,
    private val objectMapper: ObjectMapper,
    @Value("\${claude.api.key:}") private val apiKey: String,
    @Value("\${claude.api.url:https://api.anthropic.com/v1/messages}") private val apiUrl: String
) {
    private val log = LoggerFactory.getLogger(AiChatService::class.java)
    private val httpClient = HttpClient.newHttpClient()
    private val modelId = "claude-haiku-4-5-20251001"
    private val isoFmt = DateTimeFormatter.ISO_LOCAL_DATE_TIME

    companion object {
        const val PODO_USER_ID = "u_ai_podo"
        const val PODO_NAME = "포도"
        private val TRIGGER_PATTERN = Regex("포도야|포도[아야]?[,\\s]|@포도", RegexOption.IGNORE_CASE)
    }

    fun shouldRespond(message: ChatMessageEntity): Boolean {
        if (message.userId == PODO_USER_ID) return false
        if (message.messageType != "text") return false
        if (message.status != "active") return false
        val content = message.content ?: return false
        return TRIGGER_PATTERN.containsMatchIn(content)
    }

    @Async
    fun respondAsync(triggerMessage: ChatMessageEntity, broadcastFn: (String, String, Any) -> Unit) {
        try {
            val response = generateResponse(triggerMessage)
            if (response.isBlank()) return

            val entity = ChatMessageEntity(
                id = IdGenerator.newId("cmsg"),
                roomId = triggerMessage.roomId,
                userId = PODO_USER_ID,
                userName = PODO_NAME,
                userAvatarUrl = null,
                messageType = "text",
                content = response,
                attachmentState = "live",
                isAdmin = false,
                createdAt = LocalDateTime.now()
            )
            messageRepo.save(entity)

            val view = ChatMessageView(
                id = entity.id,
                roomId = entity.roomId,
                userId = entity.userId,
                userName = entity.userName,
                userAvatarUrl = null,
                messageType = entity.messageType,
                content = entity.content,
                fileId = null,
                thumbnailUrl = null,
                attachmentState = entity.attachmentState,
                isAdmin = entity.isAdmin,
                status = entity.status,
                createdAt = entity.createdAt.format(isoFmt),
                likeCount = 0,
                likedByMe = false
            )
            broadcastFn(triggerMessage.roomId, "message.new", view)
        } catch (e: Exception) {
            log.error("포도 응답 실패", e)
        }
    }

    private fun generateResponse(triggerMessage: ChatMessageEntity): String {
        if (apiKey.isBlank()) return ""

        // 1. 최근 대화 30건 (직접 컨텍스트)
        val recentMessages = messageRepo.findRecent(
            triggerMessage.roomId, null, PageRequest.of(0, 30)
        ).reversed()

        // 2. 과거 관련 대화 검색 (chat_messages FULLTEXT + ai_chat_references)
        val relevantPast = searchRelevantHistory(triggerMessage)
        val referenceKnowledge = searchReferences(triggerMessage)

        // 3. 시스템 프롬프트
        val systemPrompt = aiPromptRepository.findByPromptKeyAndLevelGroup("community_chat", "_common")
            ?.promptText ?: return ""

        // 4. 대화 컨텍스트 구성
        val chatHistory = recentMessages.joinToString("\n") { msg ->
            val name = if (msg.userId == PODO_USER_ID) "포도" else msg.userName
            val text = msg.content ?: "[${msg.messageType}]"
            "$name: $text"
        }

        val userMessage = buildString {
            if (referenceKnowledge.isNotBlank()) {
                append("[참고 자료 - 국어농장 프로그램/조쌤 발언]\n")
                append(referenceKnowledge)
                append("\n\n")
            }
            if (relevantPast.isNotBlank()) {
                append("[참고: 과거 커뮤니티 대화]\n")
                append(relevantPast)
                append("\n\n")
            }
            append("[최근 대화]\n")
            append(chatHistory)
            append("\n\n위 대화에서 \"포도\"가 호출되었습니다. 참고 자료를 우선 참고하여 자연스럽게 응답하세요. 텍스트만 출력하세요.")
        }

        val requestBody = objectMapper.writeValueAsString(mapOf(
            "model" to modelId,
            "max_tokens" to 512,
            "system" to listOf(
                mapOf(
                    "type" to "text",
                    "text" to systemPrompt,
                    "cache_control" to mapOf("type" to "ephemeral")
                )
            ),
            "messages" to listOf(mapOf("role" to "user", "content" to userMessage))
        ))

        val request = HttpRequest.newBuilder()
            .uri(URI.create(apiUrl))
            .header("Content-Type", "application/json")
            .header("x-api-key", apiKey)
            .header("anthropic-version", "2023-06-01")
            .POST(HttpRequest.BodyPublishers.ofString(requestBody))
            .build()

        val response = httpClient.send(request, HttpResponse.BodyHandlers.ofString())
        if (response.statusCode() !in 200..299) {
            log.error("Claude API 오류: {}", response.statusCode())
            return ""
        }

        val responseMap = objectMapper.readValue(response.body(), Map::class.java)
        val content = (responseMap["content"] as? List<*>)?.firstOrNull() as? Map<*, *>
        return (content?.get("text") as? String)?.trim() ?: ""
    }

    /**
     * ai_chat_references에서 관련 프로그램 지식/조쌤 발언 검색.
     */
    private fun searchReferences(triggerMessage: ChatMessageEntity): String {
        val question = triggerMessage.content ?: return ""
        val cleaned = question.replace(TRIGGER_PATTERN, "").trim()
        if (cleaned.length < 2) return ""

        return try {
            val results = referenceRepo.searchRelevant(cleaned, 8)
            if (results.isEmpty()) return ""

            results.joinToString("\n") { ref ->
                val label = when (ref.source) {
                    "program_doc" -> "[프로그램]"
                    "kakao_cho" -> "[조쌤]"
                    else -> "[참고]"
                }
                "$label ${ref.content}"
            }
        } catch (e: Exception) {
            log.warn("참고 자료 검색 실패", e)
            ""
        }
    }

    /**
     * 트리거 메시지에서 키워드를 추출하고, 과거 대화에서 관련 내용을 검색.
     * 최근 대화에 가중치를 두어 구성 (최근 7일 > 30일 > 그 이전).
     */
    private fun searchRelevantHistory(triggerMessage: ChatMessageEntity): String {
        val question = triggerMessage.content ?: return ""
        // "포도야" 트리거 제거 후 키워드 추출
        val cleaned = question.replace(TRIGGER_PATTERN, "").trim()
        if (cleaned.length < 2) return ""

        // 최근 30건 직전 시점 (중복 방지)
        val cutoff = triggerMessage.createdAt.minusMinutes(5)

        return try {
            val results = messageRepo.searchRelevant(
                triggerMessage.roomId, cleaned, cutoff, 10
            )
            if (results.isEmpty()) return ""

            val now = LocalDateTime.now()
            results.joinToString("\n") { msg ->
                val daysAgo = java.time.Duration.between(msg.createdAt, now).toDays()
                val timeLabel = when {
                    daysAgo < 1 -> "(오늘)"
                    daysAgo < 7 -> "(${daysAgo}일 전)"
                    daysAgo < 30 -> "(${daysAgo / 7}주 전)"
                    else -> "(${daysAgo / 30}개월 전)"
                }
                val name = if (msg.userId == PODO_USER_ID) "포도" else msg.userName
                "$timeLabel $name: ${msg.content}"
            }
        } catch (e: Exception) {
            log.warn("과거 대화 검색 실패", e)
            ""
        }
    }
}
