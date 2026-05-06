package com.korfarm.api.agent

import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.grapefruit.GrapefruitService
import com.korfarm.api.org.OrgMembershipRepository
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
 * 운영자 AI 비서 서비스.
 *
 * 한 turn = 사용자 메시지 1개 + 모델의 최종 assistant 응답 1개. 그 사이 tool_use 가 N회 발생할 수 있음.
 *
 * ## 한도
 * - 일 100회 / 월 2,000회 무료 (HQ_ADMIN 은 무료 — 자몽 차감 없음)
 * - 한도 초과 시 ORG_ADMIN 은 자몽 차감 (1자몽 = 10회) → kind="agent-call-extra"
 * - 잔액 부족 시 INSUFFICIENT_GRAPEFRUIT (402)
 *
 * ## tool_use loop
 * 1. user 메시지 저장
 * 2. Claude API 호출 (system + tools + 전체 message history)
 * 3. stop_reason="tool_use" 면 → tool 실행 → tool_result 메시지 추가 → 다시 호출
 * 4. stop_reason="end_turn" 면 → assistant 메시지 저장 → 종료
 * 5. usage_log 1 row INSERT
 *
 * ## 트랜잭션 분리 (B7)
 * - processTurn 자체는 비-트랜잭션 (Claude API 호출이 길어도 connection pool 점유 X)
 * - 짧은 DB 작업(세션 조회/생성, 메시지 저장, 한도 체크/차감, usage 로그)만 각자 @Transactional
 */
@Service
class OperatorAgentService(
    @Value("\${claude.api.key:}") private val apiKey: String,
    @Value("\${claude.api.url:https://api.anthropic.com/v1/messages}") private val apiUrl: String,
    private val objectMapper: ObjectMapper,
    private val sessionRepo: AgentChatSessionRepository,
    private val messageRepo: AgentChatMessageRepository,
    private val usageRepo: AgentUsageLogRepository,
    private val toolRegistry: AgentToolRegistry,
    private val toolExecutor: AgentToolExecutor,
    private val grapefruitService: GrapefruitService,
    private val orgMembershipRepository: OrgMembershipRepository,
) {
    private val log = LoggerFactory.getLogger(OperatorAgentService::class.java)
    private val httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(20))
        .build()
    private val requestTimeout: Duration = Duration.ofMinutes(3)
    private val modelId = "claude-sonnet-4-6"
    private val maxToolLoops = 6  // 안전장치 — 무한 루프 방지

    companion object {
        const val DAILY_FREE_LIMIT = 100
        const val MONTHLY_FREE_LIMIT = 2000
        const val EXTRA_PRICING_KIND = "agent-call-extra"
        const val EXTRA_CALLS_PER_GRAPEFRUIT = 10
    }

    data class TurnResult(
        val sessionId: String,
        val assistantMessageId: String,
        val assistantText: String,
        val toolCallsExecuted: Int,
        val isExtra: Boolean,
        val grapefruitSpent: Int,
        val inputTokens: Int,
        val outputTokens: Int,
    )

    /** 한도/잔액 표시용 status 응답 — /v1/admin/agent/status 가 사용 */
    data class AgentStatus(
        val role: String,
        val orgId: String?,
        val dailyUsed: Long,
        val dailyLimit: Int,
        val monthlyUsed: Long,
        val monthlyLimit: Int,
        val orgGrapefruitBalance: Int?,
        val unlimited: Boolean,
    )

    // ─── 세션 관리 ───────────────────────────────────

    @Transactional(readOnly = true)
    fun listSessions(userId: String): List<AgentChatSessionEntity> =
        sessionRepo.findByUserIdAndStatusOrderByUpdatedAtDesc(userId, "active")

    @Transactional(readOnly = true)
    fun getMessages(sessionId: String): List<AgentChatMessageEntity> =
        messageRepo.findBySessionIdOrderByCreatedAtAsc(sessionId)

    @Transactional
    fun createSession(userId: String, role: String, orgId: String?, title: String?): AgentChatSessionEntity {
        val now = LocalDateTime.now()
        return sessionRepo.save(
            AgentChatSessionEntity(
                id = IdGenerator.newId("ags"),
                userId = userId,
                userRole = role,
                orgId = orgId,
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

    /** 호출자의 ORG_ADMIN orgId — 첫 active membership. 통일 헬퍼 (B7 #8). */
    fun resolveCallerOrgId(userId: String): String? =
        orgMembershipRepository.findByUserIdAndStatus(userId, "active")
            .firstOrNull { it.role == "ORG_ADMIN" }?.orgId

    /** /v1/admin/agent/status — 한도/잔액 카드 표시용 */
    @Transactional(readOnly = true)
    fun getStatus(userId: String, role: String, orgId: String?): AgentStatus {
        val today = LocalDate.now()
        val dayStart = today.atStartOfDay()
        val dayEnd = today.plusDays(1).atStartOfDay()
        val monthStart = today.withDayOfMonth(1).atStartOfDay()
        val monthEnd = today.withDayOfMonth(1).plusMonths(1).atStartOfDay()

        val dailyUsed = usageRepo.countAllTurnsInRange(userId, dayStart, dayEnd)
        val monthlyUsed = usageRepo.countAllTurnsInRange(userId, monthStart, monthEnd)
        val balance = if (role == "ORG_ADMIN" && orgId != null) grapefruitService.getOrgBalance(orgId) else null

        return AgentStatus(
            role = role,
            orgId = orgId,
            dailyUsed = dailyUsed,
            dailyLimit = DAILY_FREE_LIMIT,
            monthlyUsed = monthlyUsed,
            monthlyLimit = MONTHLY_FREE_LIMIT,
            orgGrapefruitBalance = balance,
            unlimited = (role == "HQ_ADMIN"),
        )
    }

    // ─── 한도·자몽 차감 ───────────────────────────────────

    /**
     * 한도 체크 + 필요 시 자몽 차감을 해서 (isExtra, grapefruitSpent) 반환.
     * HQ_ADMIN 은 항상 무료(0원).
     */
    @Transactional
    fun checkLimitAndCharge(userId: String, role: String, orgId: String?): Pair<Boolean, Int> {
        if (role == "HQ_ADMIN") return false to 0

        val today = LocalDate.now()
        val dayStart = today.atStartOfDay()
        val dayEnd = today.plusDays(1).atStartOfDay()
        val monthStart = today.withDayOfMonth(1).atStartOfDay()
        val monthEnd = today.withDayOfMonth(1).plusMonths(1).atStartOfDay()

        val freeToday = usageRepo.countTurnsInRange(userId, dayStart, dayEnd)
        val freeThisMonth = usageRepo.countTurnsInRange(userId, monthStart, monthEnd)

        val needsExtra = freeToday >= DAILY_FREE_LIMIT || freeThisMonth >= MONTHLY_FREE_LIMIT
        if (!needsExtra) return false to 0

        // 한도 초과 — 자몽 차감
        val extraCallsBefore = usageRepo.countAllTurnsInRange(userId, monthStart, monthEnd) - MONTHLY_FREE_LIMIT
        val needCharge = extraCallsBefore < 0 || extraCallsBefore % EXTRA_CALLS_PER_GRAPEFRUIT == 0L
        if (!needCharge) return true to 0

        // ORG_ADMIN 만 도달. orgId 가 명시 전달돼야 함.
        if (orgId == null) throw ApiException("FORBIDDEN", "기관 소속 없음", HttpStatus.FORBIDDEN)
        grapefruitService.spendOrg(orgId, EXTRA_PRICING_KIND, null, "AI 비서 한도 초과")
        return true to 1
    }

    @Transactional
    fun saveMessageTx(
        sessionId: String,
        role: String,
        content: String?,
        toolUseJson: String? = null,
        functionName: String? = null,
        status: String? = null,
    ): AgentChatMessageEntity {
        return messageRepo.save(
            AgentChatMessageEntity(
                id = IdGenerator.newId("agm"),
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
        role: String,
        sessionId: String,
        isExtra: Boolean,
        grapefruitSpent: Int,
        totalInputTokens: Int,
        totalOutputTokens: Int,
        userText: String,
    ) {
        usageRepo.save(
            AgentUsageLogEntity(
                id = IdGenerator.newId("aulg"),
                userId = userId,
                userRole = role,
                sessionId = sessionId,
                isExtra = isExtra,
                grapefruitSpent = grapefruitSpent,
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

    // ─── 한 turn 실행 ───────────────────────────────────

    /**
     * 사용자 메시지를 받아 한 turn 을 실행한다. 모델이 tool_use 를 요청하면 자동 실행 후 다시 호출.
     * 비-@Transactional — Claude API 호출 동안 DB connection 점유하지 않도록.
     */
    fun processTurn(
        sessionIdInput: String?,
        userId: String,
        role: String,
        orgId: String?,
        userText: String,
    ): TurnResult {
        if (apiKey.isBlank()) throw ApiException("AI_DISABLED", "AI API 키 미설정", HttpStatus.SERVICE_UNAVAILABLE)
        if (userText.isBlank()) throw ApiException("INVALID", "메시지가 비어 있음", HttpStatus.BAD_REQUEST)

        // 1) 세션 확보 (트랜잭션 1 — 짧음)
        val session = if (sessionIdInput.isNullOrBlank()) {
            createSession(userId, role, orgId, title = userText.take(40))
        } else {
            sessionRepo.findById(sessionIdInput).orElseThrow {
                ApiException("NOT_FOUND", "세션 없음", HttpStatus.NOT_FOUND)
            }.also {
                if (it.userId != userId) throw ApiException("FORBIDDEN", "본인 세션만", HttpStatus.FORBIDDEN)
            }
        }

        // 2) 한도 체크 + 자몽 차감 (트랜잭션 2 — 짧음)
        val (isExtra, grapefruitSpent) = checkLimitAndCharge(userId, role, orgId)

        // 3) 사용자 메시지 저장 (트랜잭션 3 — 짧음)
        saveMessageTx(sessionId = session.id, role = "user", content = userText)

        // 4) tool_use loop — 비-트랜잭션 (Claude API 호출이 오래 걸려도 OK)
        val systemPrompt = buildSystemPrompt(role, orgId)
        val tools = toolRegistry.toolsForRole(role)
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

            // assistant 응답을 다음 호출용 history 에 그대로 추가 (tool_use 블록 포함)
            loopMessages.add(mapOf("role" to "assistant", "content" to contentBlocks))

            if (stopReason == "tool_use") {
                val toolResultBlocks = mutableListOf<Map<String, Any>>()

                // assistant 의 tool_use 블록을 DB에 저장 (history 복원용)
                val toolUseBlocks = contentBlocks.filter { it["type"] == "tool_use" }
                if (toolUseBlocks.isNotEmpty()) {
                    saveMessageTx(
                        sessionId = session.id,
                        role = "assistant_tool_use",
                        content = null,
                        toolUseJson = objectMapper.writeValueAsString(toolUseBlocks),
                        functionName = null,
                        status = "tool_use",
                    )
                }

                for (block in contentBlocks) {
                    val type = block["type"] as? String ?: continue
                    if (type != "tool_use") continue
                    val toolUseId = block["id"] as? String ?: continue
                    val funcName = block["name"] as? String ?: continue
                    @Suppress("UNCHECKED_CAST")
                    val input = (block["input"] as? Map<String, Any?>) ?: emptyMap()

                    val def = toolRegistry.find(funcName)
                    val allowed = def != null && role in def.allowedRoles
                    val result: AgentToolResult = if (!allowed) {
                        AgentToolResult(success = false, errorCode = "UNAUTHORIZED_FUNCTION", errorMessage = "권한 없음: $funcName")
                    } else {
                        try {
                            toolExecutor.execute(funcName, input, userId, role, orgId)
                        } catch (e: ApiException) {
                            AgentToolResult(success = false, errorCode = e.code, errorMessage = e.message)
                        } catch (e: Exception) {
                            log.error("tool 실행 오류 — name={}", funcName, e)
                            AgentToolResult(success = false, errorCode = "TOOL_ERROR", errorMessage = e.message)
                        }
                    }

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
            assistantText = "(최대 호출 횟수 초과 — 더 짧은 요청으로 다시 시도해 주세요.)"
            val saved = saveMessageTx(
                sessionId = session.id,
                role = "assistant",
                content = assistantText,
                status = "error",
            )
            assistantMessageId = saved.id
        }

        // 5) usage 로그 + 세션 갱신 (트랜잭션 4 — 짧음)
        saveUsageAndTouchSession(
            userId = userId,
            role = role,
            sessionId = session.id,
            isExtra = isExtra,
            grapefruitSpent = grapefruitSpent,
            totalInputTokens = totalInputTokens,
            totalOutputTokens = totalOutputTokens,
            userText = userText,
        )

        return TurnResult(
            sessionId = session.id,
            assistantMessageId = assistantMessageId,
            assistantText = assistantText,
            toolCallsExecuted = toolCallsExecuted,
            isExtra = isExtra,
            grapefruitSpent = grapefruitSpent,
            inputTokens = totalInputTokens,
            outputTokens = totalOutputTokens,
        )
    }

    // ─── 헬퍼 ───────────────────────────────────

    /**
     * DB에 저장된 메시지를 Anthropic API messages 배열로 복원.
     *
     * tool history 복원 (B4 #4):
     * - "user" → user 텍스트
     * - "assistant" → assistant 텍스트
     * - "assistant_tool_use" → assistant 가 tool_use 블록 배열
     * - "tool" → user role 의 tool_result 블록 (Anthropic 규약상 tool_result 는 user 메시지 안에)
     *
     * 같은 turn 안에서 발생한 tool 블록들은 인접해 있어 하나의 user/assistant 메시지로 묶음.
     */
    @Transactional(readOnly = true)
    fun buildApiHistory(sessionId: String): List<Map<String, Any>> {
        val msgs = messageRepo.findBySessionIdOrderByCreatedAtAsc(sessionId)
        val out = mutableListOf<Map<String, Any>>()
        var pendingToolResults: MutableList<Map<String, Any>>? = null

        fun flushPendingToolResults() {
            pendingToolResults?.let {
                if (it.isNotEmpty()) out.add(mapOf("role" to "user", "content" to it))
                pendingToolResults = null
            }
        }

        for (m in msgs) {
            when (m.role) {
                "user" -> {
                    flushPendingToolResults()
                    if (!m.content.isNullOrBlank()) {
                        out.add(mapOf("role" to "user", "content" to m.content!!))
                    }
                }
                "assistant" -> {
                    flushPendingToolResults()
                    if (!m.content.isNullOrBlank()) {
                        out.add(mapOf("role" to "assistant", "content" to m.content!!))
                    }
                }
                "assistant_tool_use" -> {
                    flushPendingToolResults()
                    val json = m.toolUseJson ?: continue
                    @Suppress("UNCHECKED_CAST")
                    val blocks = objectMapper.readValue(json, List::class.java) as List<Map<String, Any>>
                    if (blocks.isNotEmpty()) {
                        out.add(mapOf("role" to "assistant", "content" to blocks))
                    }
                }
                "tool" -> {
                    val json = m.toolUseJson ?: continue
                    @Suppress("UNCHECKED_CAST")
                    val parsed = objectMapper.readValue(json, Map::class.java) as Map<String, Any>
                    val toolUseId = parsed["tool_use_id"] as? String ?: continue
                    val result = parsed["result"]
                    if (pendingToolResults == null) pendingToolResults = mutableListOf()
                    pendingToolResults!!.add(
                        mapOf(
                            "type" to "tool_result",
                            "tool_use_id" to toolUseId,
                            "content" to objectMapper.writeValueAsString(result),
                            "is_error" to (m.status == "error"),
                        )
                    )
                }
            }
        }
        flushPendingToolResults()
        return out
    }

    private fun buildSystemPrompt(role: String, orgId: String?): String {
        val roleLabel = if (role == "HQ_ADMIN") "본사 운영자" else "기관 운영자"
        val scope = if (role == "HQ_ADMIN") {
            "본사 권한으로 모든 기관·학생·콘텐츠를 다룰 수 있습니다."
        } else {
            "본 기관(${orgId ?: "?"}) 소속 학생·수강반·학습 계획표만 다룹니다. 다른 기관 데이터는 절대 다루지 마십시오."
        }
        return """
            당신은 국어농장v2 의 ${roleLabel} 전용 AI 비서입니다. ${scope}

            ## 당신의 역할
            1. 일정 안내 및 알림 — 마감일·검수 대기·구독 만료 등을 정리해 알립니다.
            2. 작업 대행 — 사이드 메뉴의 모든 기능과 동작을 자연어로 받아서 수행합니다.
               단, 데이터를 변경하는 함수(require_confirm=true)는 호출 직전 사용자에게 한국어로
               "정말 이렇게 진행할까요?" 라고 명확히 묻고, 사용자가 "예/응/그래/진행" 등 동의 표현을 한 후에만 호출하십시오.
            3. 학습 추천 — 10대 역량(약점 보강) 또는 영역/세부영역/주제 기준으로 학습 콘텐츠를 추천합니다.
               추천 후 곧바로 학습 계획표 매트릭스에 일괄 배정할 수 있도록 batch_assign_recommendations 함수를 사용하십시오.

            ## 말투
            격식체(~합니다 / ~하시겠습니까)를 사용하십시오.

            ## 출력 형식
            - 작업 결과는 표·목록 등 가독성 있게 정리합니다. 마크다운 표/목록을 적극 사용하십시오.
            - 함수 결과를 그대로 노출하지 말고, 운영자가 한눈에 볼 수 있게 요약합니다.
            - 위험 작업(생성·수정·삭제·일괄 배정) 전에는 반드시 사용자 확인을 받습니다.

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
                "max_tokens" to 4096,
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
