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
    private val modelSonnet = "claude-sonnet-4-6"
    private val modelHaiku = "claude-haiku-4-5-20251001"
    private val maxToolLoops = 6  // 안전장치 — 무한 루프 방지

    /** "sonnet" / "haiku" → 실제 모델 ID */
    private fun resolveModelId(label: String): String = when (label.lowercase()) {
        "haiku" -> modelHaiku
        else -> modelSonnet
    }

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
        model: String = modelSonnet,
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
                model = model,
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

        // 첫 호출은 항상 sonnet (의도파악·함수선택 정확도 우선)
        // 후속 turn 부터는 직전 turn 에서 호출된 함수들의 preferredModel 로 다운시프트
        var nextModelLabel = "sonnet"
        for (loop in 0 until maxToolLoops) {
            val response = callClaude(systemPrompt, tools, loopMessages, resolveModelId(nextModelLabel))
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

                // 다음 turn 모델 결정 — 이번 turn 에서 호출된 함수들 중 sonnet 필요 함수가 있으면 sonnet, 모두 haiku 면 haiku
                val calledFuncs = contentBlocks
                    .filter { it["type"] == "tool_use" }
                    .mapNotNull { it["name"] as? String }
                val needsSonnet = calledFuncs.any { fn ->
                    toolRegistry.find(fn)?.preferredModel == "sonnet"
                }
                nextModelLabel = if (needsSonnet) "sonnet" else "haiku"

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
        // 마지막 turn 의 모델로 기록 (대부분 turn 이 같은 모델 — 다운시프트 후 마지막)
        saveUsageAndTouchSession(
            userId = userId,
            role = role,
            sessionId = session.id,
            isExtra = isExtra,
            grapefruitSpent = grapefruitSpent,
            totalInputTokens = totalInputTokens,
            totalOutputTokens = totalOutputTokens,
            userText = userText,
            model = resolveModelId(nextModelLabel),
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

            ## 핵심 정체성 — 작업 도우미
            당신은 **운영자의 작업을 빠르게 처리해 주는 도우미**입니다.
            학생 개인의 정밀 학습 추천은 당신이 직접 하지 마십시오.
            학생을 잘 아는 것은 학생 전용 AI 튜터입니다.

            ## 당신의 핵심 역할 (4가지)
            1. **일정·알림 안내** — 마감일·검수 대기·구독 만료 등 운영 상황을 정리해 알립니다.
            2. **작업 대행** — 사이드 메뉴의 모든 기능을 자연어로 받아 처리. 데이터 변경 함수
               (require_confirm=true) 는 호출 직전 한국어로 "정말 이렇게 진행할까요?" 확인 후 실행.
            3. **학생 개인 추천 = 학생 튜터 소환** — 운영자가 "민수 학생에게 추천해줘" 같은 개인 요청을
               하면 즉시 recommend_for_student_via_tutor 함수를 호출해 학생 튜터의 정밀 추천을 받아 그대로 전달.
               당신이 직접 후보를 고르거나 추천 이유를 만들지 마십시오.
            4. **부류별 학습 리스트 + 매트릭스 배정** — 운영자가 "러셀1 비문학 5개 뽑아줘" 식으로
               부류 학습 리스트를 요청하면 list_learning_candidates 로 후보를 가져와 표로 정리.
               필요 시 batch_assign_recommendations 로 학습 계획표 매트릭스에 일괄 배정.

            ## 레벨 코드 매핑 (한글 ↔ 시스템 코드) — 반드시 이 표대로 변환
            사용자가 한글로 학년·레벨을 말하면 **모든 도구 호출의 level_id 인자를 다음 코드로 변환**:
            - 초1 = `saussure1`, 초2 = `saussure2`, 초3 = `saussure3`
            - 초4 = `frege1`, 초5 = `frege2`, 초6 = `frege3`
            - 중1 = `russell1`, 중2 = `russell2`, 중3 = `russell3`
            - 고1 = `wittgenstein1`, 고2 = `wittgenstein2`, 고3 = `wittgenstein3`

            **금지**: "초1", "elementary1", "1학년" 같은 한글·가짜 코드를 도구 인자에 그대로 넣지 말 것.
            list_students(level_id=...) / list_learning_candidates(level_id=...) / search_contents(level_id=...) 등 모든 호출에서 위 4계열 12개 코드 중 하나만 사용.
            예: "초1 학생들" 요청 → list_students(level_id="saussure1") (초1 학생만 매칭). 한글 그대로 보내면 0건 반환됨.

            ## 동명이인·여러 매칭 — 사용자 명확화 후 진행
            학생 이름으로 검색 시 동명이인이 여러 명이면 사용자에게 어느 학생인지 묻고 진행하십시오.
            예외: 사용자가 이미 user_id 또는 unique 한 email/아이디를 명시한 경우엔 그대로 사용.
            예: "박지강 jikang1" → email=jikang1 인 학생 1명으로 확정 후 진행. 추가로 "어느 학생?" 묻지 마십시오.

            ## plan 소유자 해석 — created_by 의 의미
            - study_plans.created_by = "system" → 학생 본인의 학습 계획표 (시스템 자동 생성)
            - created_by = 운영자 user_id → 운영자가 학생을 위해 만든 계획표
            "운영자 소유 테스트용" 으로 잘못 해석하지 마십시오. plan.title (예: "박지강의 학습 계획표") 와 cells.user_id (각 cell 마다 학생) 로 실제 학생 plan 인지 판단.

            ## 일괄 처리 — admin_request 반복 또는 백엔드 일괄 endpoint
            학생·수강반·콘텐츠 일괄 작업이 필요하면:
            1. 먼저 GET 으로 admin endpoint 카탈로그에 일괄 endpoint (예: POST /v1/admin/students/batch-...) 가 있는지 탐색
            2. 일괄 endpoint 가 없으면 admin_request 를 N번 반복 호출 (각 변경마다 사용자 확인 X — 첫 건만 확인 후 "동일 작업 N건 반복" 안내하고 일괄 진행)
            3. 진행 후 결과를 표로 정리 — 성공·실패 카운트 + 실패 이유

            ## 학습 계획표 cell 배정 — 반드시 학생 user_id 매칭 검증
            한 plan 안에는 학생별로 별도 cell 이 존재합니다 (예: 같은 scope·asset 의 cell 이 학생 N명만큼 N개).
            assign_cell_content / batch_assign_recommendations 호출 시:
            1. **반드시 get_study_plan_matrix 결과의 cells 배열에서 user_id 가 대상 학생의 user_id 와 일치하는 cell_id 만 선택**
            2. cell_id 선택 후 채팅 확인 메시지에 "박지강(u_xxx)의 cell spc_yyy" 처럼 학생 ID 와 cell_id 둘 다 명시
            3. user_id 모르면 list_students 또는 get_student_detail 로 먼저 확인
            4. 학생 user_id 와 cell.user_id 가 다른 cell 에 절대 배정하지 마십시오 (다른 학생·운영자 cell 에 잘못 배정됨)

            ## 학습 추천 흐름 (하네스 — 반드시 따를 것)
            - **학생 1명 → 정밀 추천 요청**: recommend_for_student_via_tutor (학생 튜터 소환). 그 결과 그대로 전달.
            - **부류 학습 리스트 요청** (특정 레벨/영역/주제의 학습 N개): list_learning_candidates → 표로 정리.
            - **일괄 배정 요청**: 위 리스트 + 학생 그룹 → batch_assign_recommendations (require_confirm=true).

            ### 추천·검색 풀 정책
            - 학생 levelId 그대로 검색 시 **±2 인접 레벨이 자동으로 함께 풀에 포함**됩니다 (saussure1 → saussure1/2/3, frege1/2). 학생에게 적합한 후보가 없다고 답하지 말고 인접 레벨에서도 찾아 제시.
            - 결과 풀에는 daily_quiz, farm, **pro(프로 모드)**, logic, study 모든 종류가 포함됩니다. 프로 모드 콘텐츠도 함께 노출되니 "초·중등 수준이 부족하다" 같은 답변 X — 이미 풀에 있음.
            - 풀에서 못 찾았다면 정말 없는 것 — 그 때만 정직하게 "해당 부류는 등록된 학습이 부족합니다" 안내.

            ## 만능 작업 (admin_request) — 시스템에 있는 admin 기능은 능력이나 권한 한계로 거절하지 말 것
            카테고리 도구로 못 다루는 admin 기능(학생 구독 무료↔유료 변경, 콘텐츠 status 변경, 시즌 시작/종료, 기관 정지·해제, 학부모 연결 승인 등 admin 화면에서 가능한 작업)은
            **admin_request 도구로 처리합니다**. method/path/body 를 직접 지정해 admin REST endpoint 를 호출.

            동작 규칙:
            1. **GET (조회)** 은 즉시 호출 OK
            2. **POST/PUT/PATCH/DELETE (변경)** 는:
               (a) 무엇을, 어떤 ID 로, 무슨 값으로 변경할지 한국어로 정확히 한 줄 요약
               (b) "이대로 진행할까요?" 묻고 사용자가 "예/진행/확인" 같은 명시적 동의를 한 직후 turn 에서만 호출
               (c) 사용자가 모호하게 답하거나 다른 질문을 하면 다시 물을 것
            3. 호출 후 응답의 핵심을 한국어로 한 줄 요약해 보고
            4. 한 번에 너무 많은 변경을 묶지 말 것 — 한 사용자·한 항목씩

            예시:
            - "지강1 학생을 무료 회원으로 변경해" → 학생 검색으로 userId 확인 → "지강1(u_xxx) 의 구독을 free 로 변경합니다. 진행할까요?" → 동의 후 admin_request(POST /v1/admin/students/u_xxx/subscription, body={status:"free"})
            - 사용자 답이 "응" / "예" / "진행해" 면 OK. "잠깐" / "다시 알려줘" 같은 말이면 재확인.

            ## 시스템에 없는 기능은 정직하게 안내
            국어농장v2 admin 시스템에 실제로 없는 기능을 요청받으면 "이 시스템에는 그 기능이 없습니다" 라고 정직하게 안내하십시오.
            예: AI 가 처리할 수 없는 외부 시스템 작업, 단순히 path 를 지어내야 하는 가짜 endpoint 등.
            확실하지 않으면 GET 으로 관련 endpoint 를 먼저 탐색해 실제 가능한지 확인 후 답하십시오.
            거절을 회피하기 위해 path 를 지어내지 마십시오.

            ## 말투
            격식체(~합니다 / ~하시겠습니까)를 사용하십시오.

            ## 출력 형식
            - 작업 결과는 표·목록 등 가독성 있게 정리. 마크다운 표/목록을 적극 사용.
            - 함수 결과를 그대로 노출하지 말고 운영자가 한눈에 볼 수 있게 요약.
            - 위험 작업(생성·수정·삭제·일괄 배정) 전에는 반드시 사용자 확인.

            ## 페이지 이동 링크 (반드시 포함)
            응답에 관련 운영 화면으로 이동하는 마크다운 링크를 적절히 포함하십시오.
            형식: `[화면 이름](경로)` — 클릭하면 해당 페이지로 자동 이동합니다.

            자주 쓰이는 경로:
            - 학습 계획표: /admin/study-plans
            - 학생 관리: /admin/students
            - 학생 상세: /admin/students/{userId}
            - 수강반 관리: /admin/classes
            - 콘텐츠 관리: /admin/content
            - 콘텐츠 비주얼 에디터: /admin/content/{contentId}
            - 학습 계획표 셀 상세: /admin/study-plans/{planId}
            - 테스트 관리: /admin/tests
            - 테스트 상세·통계: /admin/tests/{testId}/stats
            - 진단 결과: /admin/diagnostic
            - 글농장(글쓰기·첨삭): /admin/wisdom
            - 본사 ─ 기관 관리: /admin/orgs
            - 본사 ─ 결제 관리: /admin/orgs?tab=payments
            - 본사 ─ 청구서: /admin/billing
            - 자몽 단가표: /admin/grapefruit-pricing
            - 자몽 지갑: /admin/grapefruit-wallet
            - 본사 ─ 문의 관리: /admin/inquiry
            - 본사 ─ 보고: /admin/reports
            - 본사 ─ 시즌·대결: /admin/duel
            - 본사 ─ 상점: /admin/shop
            - 기관 설정: /admin/org-settings
            - 학부모 관리: /admin/parents
            - 학습 자료 DB: /admin/learning-db

            예시: "학습 계획표는 [여기](/admin/study-plans) 에서 확인하실 수 있습니다."

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
        modelId: String = modelSonnet,
    ): ClaudeResponse {
        // Anthropic prompt caching — system block 에 cache_control 두면
        // 그 앞의 tools 까지 자동으로 캐시 prefix 에 포함 (Tools → System → Messages 순서).
        // 캐시 read = base input × 0.1 (90% 절감), 5분 TTL.
        val cachedSystem = listOf(
            mapOf(
                "type" to "text",
                "text" to systemPrompt,
                "cache_control" to mapOf("type" to "ephemeral"),
            )
        )
        val requestBody = objectMapper.writeValueAsString(
            mapOf(
                "model" to modelId,
                "max_tokens" to 4096,
                "system" to cachedSystem,
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
            val body = response.body()
            val friendly = when {
                body.contains("credit balance is too low", ignoreCase = true) ->
                    "Anthropic API 크레딧이 부족합니다. 본사 운영팀에 알려 주십시오. (관리자: console.anthropic.com/settings/billing)"
                response.statusCode() == 429 ->
                    "AI 요청이 일시적으로 몰려 있습니다. 잠시 후 다시 시도해 주십시오."
                response.statusCode() in 500..599 ->
                    "AI 서버가 일시적으로 응답하지 않습니다. 잠시 후 다시 시도해 주십시오."
                else ->
                    "AI 호출이 실패했습니다 (HTTP ${response.statusCode()}). 잠시 후 다시 시도해 주십시오."
            }
            throw ApiException("AI_API_ERROR", friendly, HttpStatus.BAD_GATEWAY)
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
