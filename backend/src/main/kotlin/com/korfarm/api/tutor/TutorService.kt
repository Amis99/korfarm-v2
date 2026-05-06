package com.korfarm.api.tutor

import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.grapefruit.GrapefruitService
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.time.Duration
import java.time.LocalDate
import java.time.LocalDateTime

/**
 * 학생 AI 튜터 서비스.
 *
 * - 1턴 = 자몽 1개 또는 작물 1개. currency 인자로 학생이 선택.
 * - 무료 한도 없음 — 매 턴 차감.
 * - tool_use loop, history 복원, 트랜잭션 분리는 OperatorAgentService 와 동일 패턴.
 */
@Service
class TutorService(
    @Value("\${claude.api.key:}") private val apiKey: String,
    @Value("\${claude.api.url:https://api.anthropic.com/v1/messages}") private val apiUrl: String,
    private val objectMapper: ObjectMapper,
    private val sessionRepo: TutorChatSessionRepository,
    private val messageRepo: TutorChatMessageRepository,
    private val usageRepo: TutorUsageLogRepository,
    private val toolRegistry: TutorToolRegistry,
    private val toolExecutor: TutorToolExecutor,
    private val grapefruitService: GrapefruitService,
) {
    private val log = LoggerFactory.getLogger(TutorService::class.java)
    private val httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(20)).build()
    private val requestTimeout: Duration = Duration.ofMinutes(3)
    private val modelId = "claude-sonnet-4-6"
    private val maxToolLoops = 6

    companion object {
        const val PRICING_KIND = "tutor-call"
    }

    data class TurnResult(
        val sessionId: String,
        val assistantMessageId: String,
        val assistantText: String,
        val toolCallsExecuted: Int,
        val currency: String,
        val amountSpent: Int,
        val inputTokens: Int,
        val outputTokens: Int,
    )

    data class TutorStatus(
        val grapefruits: Int,
        val crops: Map<String, Int>,
        val pricePerTurn: Int,
        val totalTurns: Long,
    )

    @Transactional(readOnly = true)
    fun listSessions(userId: String): List<TutorChatSessionEntity> =
        sessionRepo.findByUserIdAndStatusOrderByUpdatedAtDesc(userId, "active")

    @Transactional(readOnly = true)
    fun getMessages(sessionId: String): List<TutorChatMessageEntity> =
        messageRepo.findBySessionIdOrderByCreatedAtAsc(sessionId)

    @Transactional
    fun createSession(userId: String, title: String?): TutorChatSessionEntity {
        val now = LocalDateTime.now()
        return sessionRepo.save(
            TutorChatSessionEntity(
                id = IdGenerator.newId("tcs"),
                userId = userId,
                title = title,
                status = "active",
                createdAt = now,
                updatedAt = now,
            )
        )
    }

    @Transactional
    fun renameSession(sessionId: String, userId: String, title: String) {
        val s = sessionRepo.findById(sessionId).orElseThrow {
            ApiException("NOT_FOUND", "세션 없음", HttpStatus.NOT_FOUND)
        }
        if (s.userId != userId) throw ApiException("FORBIDDEN", "본인 세션만", HttpStatus.FORBIDDEN)
        s.title = title
        s.updatedAt = LocalDateTime.now()
        sessionRepo.save(s)
    }

    @Transactional
    fun archiveSession(sessionId: String, userId: String) {
        val s = sessionRepo.findById(sessionId).orElseThrow {
            ApiException("NOT_FOUND", "세션 없음", HttpStatus.NOT_FOUND)
        }
        if (s.userId != userId) throw ApiException("FORBIDDEN", "본인 세션만", HttpStatus.FORBIDDEN)
        s.status = "archived"
        s.updatedAt = LocalDateTime.now()
        sessionRepo.save(s)
    }

    @Transactional(readOnly = true)
    fun getStatus(userId: String): TutorStatus {
        val balance = grapefruitService.getUserAiBalance(userId)
        val price = grapefruitService.getPrice(PRICING_KIND)
        val total = usageRepo.countByUserId(userId)
        return TutorStatus(
            grapefruits = balance.grapefruits,
            crops = balance.crops,
            pricePerTurn = price,
            totalTurns = total,
        )
    }

    @Transactional
    fun saveMessageTx(
        sessionId: String,
        role: String,
        content: String?,
        toolUseJson: String? = null,
        functionName: String? = null,
        status: String? = null,
    ): TutorChatMessageEntity {
        return messageRepo.save(
            TutorChatMessageEntity(
                id = IdGenerator.newId("tcm"),
                sessionId = sessionId,
                role = role,
                content = content,
                toolUseJson = toolUseJson,
                functionName = functionName,
                status = status,
                createdAt = LocalDateTime.now(),
            )
        )
    }

    @Transactional
    fun saveUsageAndTouchSession(
        userId: String,
        sessionId: String,
        currency: String,
        amountSpent: Int,
        totalInputTokens: Int,
        totalOutputTokens: Int,
        userText: String,
    ) {
        usageRepo.save(
            TutorUsageLogEntity(
                id = IdGenerator.newId("tulg"),
                userId = userId,
                sessionId = sessionId,
                currency = currency,
                amountSpent = amountSpent,
                totalInputTokens = totalInputTokens,
                totalOutputTokens = totalOutputTokens,
                createdAt = LocalDateTime.now(),
            )
        )
        sessionRepo.findById(sessionId).ifPresent { s ->
            s.updatedAt = LocalDateTime.now()
            if (s.title.isNullOrBlank()) s.title = userText.take(40)
            sessionRepo.save(s)
        }
    }

    /**
     * 한 turn 실행. currency 는 'grapefruit' 또는 'crop_<type>'.
     * 호출 직전 자몽/작물 차감. 잔액 부족 시 INSUFFICIENT_GRAPEFRUIT (402).
     */
    fun processTurn(
        sessionIdInput: String?,
        userId: String,
        userText: String,
        currency: String,
    ): TurnResult {
        if (apiKey.isBlank()) throw ApiException("AI_DISABLED", "AI API 키 미설정", HttpStatus.SERVICE_UNAVAILABLE)
        if (userText.isBlank()) throw ApiException("INVALID", "메시지가 비어 있음", HttpStatus.BAD_REQUEST)

        val session = if (sessionIdInput.isNullOrBlank()) {
            createSession(userId, userText.take(40))
        } else {
            sessionRepo.findById(sessionIdInput).orElseThrow {
                ApiException("NOT_FOUND", "세션 없음", HttpStatus.NOT_FOUND)
            }.also {
                if (it.userId != userId) throw ApiException("FORBIDDEN", "본인 세션만", HttpStatus.FORBIDDEN)
            }
        }

        // 차감 (자몽 또는 작물)
        val price = grapefruitService.getPrice(PRICING_KIND)
        grapefruitService.spendForUser(userId, PRICING_KIND, currency, null, "AI 튜터 1회")

        saveMessageTx(sessionId = session.id, role = "user", content = userText)

        val systemPrompt = buildSystemPrompt(userId)
        val tools = toolRegistry.toolsForApi()
        val historyMessages = buildApiHistory(session.id)

        var totalInputTokens = 0
        var totalOutputTokens = 0
        var toolCallsExecuted = 0
        var assistantText = ""
        var assistantMessageId = ""

        val loopMessages = historyMessages.toMutableList()
        loopMessages.add(mapOf("role" to "user", "content" to userText))

        for (loop in 0 until maxToolLoops) {
            val response = callClaude(systemPrompt, tools, loopMessages)
            totalInputTokens += response.inputTokens ?: 0
            totalOutputTokens += response.outputTokens ?: 0
            val stopReason = response.stopReason
            val contentBlocks = response.contentBlocks

            loopMessages.add(mapOf("role" to "assistant", "content" to contentBlocks))

            if (stopReason == "tool_use") {
                val toolResultBlocks = mutableListOf<Map<String, Any>>()
                val toolUseBlocks = contentBlocks.filter { it["type"] == "tool_use" }
                if (toolUseBlocks.isNotEmpty()) {
                    saveMessageTx(
                        sessionId = session.id,
                        role = "assistant_tool_use",
                        content = null,
                        toolUseJson = objectMapper.writeValueAsString(toolUseBlocks),
                        status = "tool_use",
                    )
                }
                for (block in contentBlocks) {
                    if (block["type"] != "tool_use") continue
                    val toolUseId = block["id"] as? String ?: continue
                    val funcName = block["name"] as? String ?: continue
                    @Suppress("UNCHECKED_CAST")
                    val input = (block["input"] as? Map<String, Any?>) ?: emptyMap()

                    val result = toolExecutor.execute(funcName, input, userId)

                    saveMessageTx(
                        sessionId = session.id,
                        role = "tool",
                        content = null,
                        toolUseJson = objectMapper.writeValueAsString(
                            mapOf("tool_use_id" to toolUseId, "input" to input, "result" to result)
                        ),
                        functionName = funcName,
                        status = if (result.success) "success" else "error",
                    )
                    toolCallsExecuted += 1
                    toolResultBlocks.add(
                        mapOf(
                            "type" to "tool_result",
                            "tool_use_id" to toolUseId,
                            "content" to objectMapper.writeValueAsString(result),
                            "is_error" to (!result.success),
                        )
                    )
                }
                loopMessages.add(mapOf("role" to "user", "content" to toolResultBlocks))
                continue
            }

            assistantText = contentBlocks
                .filter { it["type"] == "text" }
                .joinToString("\n") { it["text"] as? String ?: "" }
                .trim()
            val saved = saveMessageTx(
                sessionId = session.id,
                role = "assistant",
                content = assistantText,
            )
            assistantMessageId = saved.id
            break
        }

        if (assistantMessageId.isBlank()) {
            assistantText = "(최대 호출 횟수 초과 — 더 짧은 질문으로 다시 시도해 주세요.)"
            val saved = saveMessageTx(
                sessionId = session.id,
                role = "assistant",
                content = assistantText,
                status = "error",
            )
            assistantMessageId = saved.id
        }

        saveUsageAndTouchSession(
            userId = userId,
            sessionId = session.id,
            currency = currency,
            amountSpent = price,
            totalInputTokens = totalInputTokens,
            totalOutputTokens = totalOutputTokens,
            userText = userText,
        )

        return TurnResult(
            sessionId = session.id,
            assistantMessageId = assistantMessageId,
            assistantText = assistantText,
            toolCallsExecuted = toolCallsExecuted,
            currency = currency,
            amountSpent = price,
            inputTokens = totalInputTokens,
            outputTokens = totalOutputTokens,
        )
    }

    @Transactional(readOnly = true)
    fun buildApiHistory(sessionId: String): List<Map<String, Any>> {
        val msgs = messageRepo.findBySessionIdOrderByCreatedAtAsc(sessionId)
        val out = mutableListOf<Map<String, Any>>()
        var pendingToolResults: MutableList<Map<String, Any>>? = null

        fun flushPending() {
            pendingToolResults?.let {
                if (it.isNotEmpty()) out.add(mapOf("role" to "user", "content" to it))
                pendingToolResults = null
            }
        }

        for (m in msgs) {
            when (m.role) {
                "user" -> {
                    flushPending()
                    if (!m.content.isNullOrBlank()) out.add(mapOf("role" to "user", "content" to m.content!!))
                }
                "assistant" -> {
                    flushPending()
                    if (!m.content.isNullOrBlank()) out.add(mapOf("role" to "assistant", "content" to m.content!!))
                }
                "assistant_tool_use" -> {
                    flushPending()
                    val json = m.toolUseJson ?: continue
                    @Suppress("UNCHECKED_CAST")
                    val blocks = objectMapper.readValue(json, List::class.java) as List<Map<String, Any>>
                    if (blocks.isNotEmpty()) out.add(mapOf("role" to "assistant", "content" to blocks))
                }
                "tool" -> {
                    val json = m.toolUseJson ?: continue
                    @Suppress("UNCHECKED_CAST")
                    val parsed = objectMapper.readValue(json, Map::class.java) as Map<String, Any>
                    val tid = parsed["tool_use_id"] as? String ?: continue
                    val result = parsed["result"]
                    if (pendingToolResults == null) pendingToolResults = mutableListOf()
                    pendingToolResults!!.add(
                        mapOf(
                            "type" to "tool_result",
                            "tool_use_id" to tid,
                            "content" to objectMapper.writeValueAsString(result),
                            "is_error" to (m.status == "error"),
                        )
                    )
                }
            }
        }
        flushPending()
        return out
    }

    private fun buildSystemPrompt(userId: String): String {
        return """
            당신은 국어농장v2 의 학생 전용 AI 튜터입니다.
            학생이 국어 학습을 잘 할 수 있도록 도와주세요.

            ## 핵심 원칙
            1. 정답을 바로 알려주지 마세요. 단계별 힌트 → 점진적 구체화.
            2. 학생의 수준(레벨)에 맞춰 친근한 말투(~해 / ~할까)를 쓰세요.
            3. 답변은 짧고 명료하게. 200자 안팎.
            4. 모르는 건 "모르겠어" 라고 솔직히. 추측하지 마세요.

            ## 사용 가능한 함수
            - explain_concept: 개념 설명용
            - get_my_competency: 학생 약점 파악
            - recommend_my_study: 추천 학습
            - get_my_recent_history: 최근 학습 이력
            - search_content: 학습 콘텐츠 검색
            - explain_question_solution: 특정 문제 풀이 설명

            ## 출력 형식
            - 마크다운 사용 OK (목록/표).
            - 다른 학생 데이터를 절대 다루지 마세요. 본인 정보만.

            오늘 날짜: ${LocalDate.now()}
        """.trimIndent()
    }

    private data class ClaudeResponse(
        val stopReason: String?,
        val contentBlocks: List<Map<String, Any>>,
        val inputTokens: Int?,
        val outputTokens: Int?,
    )

    private fun callClaude(
        systemPrompt: String,
        tools: List<Map<String, Any>>,
        messages: List<Map<String, Any>>,
    ): ClaudeResponse {
        val requestBody = objectMapper.writeValueAsString(
            mapOf(
                "model" to modelId,
                "max_tokens" to 2048,
                "system" to systemPrompt,
                "tools" to tools,
                "messages" to messages,
            )
        )
        val request = HttpRequest.newBuilder()
            .uri(URI.create(apiUrl))
            .timeout(requestTimeout)
            .header("Content-Type", "application/json")
            .header("x-api-key", apiKey)
            .header("anthropic-version", "2023-06-01")
            .POST(HttpRequest.BodyPublishers.ofString(requestBody))
            .build()
        val response = httpClient.send(request, HttpResponse.BodyHandlers.ofString())
        if (response.statusCode() !in 200..299) {
            log.error("Claude API 오류 — status={}, body={}", response.statusCode(), response.body())
            throw ApiException("AI_API_ERROR", "AI 호출 실패: HTTP ${response.statusCode()}", HttpStatus.BAD_GATEWAY)
        }
        val parsed = objectMapper.readValue(response.body(), Map::class.java)
        @Suppress("UNCHECKED_CAST")
        val content = (parsed["content"] as? List<Map<String, Any>>) ?: emptyList()
        val stopReason = parsed["stop_reason"] as? String
        val usage = parsed["usage"] as? Map<*, *>
        val inTok = (usage?.get("input_tokens") as? Number)?.toInt()
        val outTok = (usage?.get("output_tokens") as? Number)?.toInt()
        return ClaudeResponse(stopReason, content, inTok, outTok)
    }
}
