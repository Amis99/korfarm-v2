package com.korfarm.api.tutor

import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.grapefruit.GrapefruitService
import com.korfarm.api.learning.LearningCompetencyLogRepository
import com.korfarm.api.learning.RecommendationService
import com.korfarm.api.learning.UserCompetencySummaryRepository
import com.korfarm.api.user.UserRepository
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
    private val recommendationServiceRef: RecommendationService,
    private val userRepo: UserRepository,
    private val competencySummaryRepo: UserCompetencySummaryRepository,
    private val competencyLogRepo: LearningCompetencyLogRepository,
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

    data class RecommendForStudentResult(
        val text: String,
        val candidateIds: List<String>,
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

    /**
     * 운영자(본사·기관 관리자) 가 학생 튜터를 소환해 특정 학생용 추천을 받는 진입점.
     *
     * 토큰 효율을 위한 하네스:
     *  - 후보 30개 메타정보(제목·역량·영역·주제·이유) 만 전달, 본문 X
     *  - 학생 약점·최근 학습 이력·진단 결과를 압축 컨텍스트로 system 에 주입
     *  - 모델은 단일 turn 으로 카테고리별 1~2개 + 이유 작성
     *  - tool_use 강제 X — 자연어 답변 (운영자가 그대로 학생에게 전달 가능)
     *
     * 자몽 차감 정책: 호출자(운영자) 측에서 별도 차감 (운영자 turn 1회 카운트로 흡수).
     * Tutor 쪽 자몽 차감 없음.
     *
     * @return 자연어 추천 텍스트 + 후보 ID 목록(트레이싱용)
     */
    fun recommendForStudent(
        studentUserId: String,
        operatorRequestText: String,
    ): RecommendForStudentResult {
        if (apiKey.isBlank()) throw ApiException("AI_DISABLED", "AI API 키 미설정", HttpStatus.SERVICE_UNAVAILABLE)

        val all = recommendationServiceRef.recommendCandidatesAll(studentUserId, levelId = null, perCategory = 10)
        val competencyList = all.competency
        val areaList = all.area
        val themeList = all.theme

        // 학생 컨텍스트 압축
        val studentSummary = buildStudentContextSummary(studentUserId)

        // 모델 system 프롬프트 — 하네스
        val sys = """
            당신은 국어농장v2 의 학생 전용 AI 튜터입니다. 본 호출은 운영자(관리자)의 요청으로
            특정 학생을 위한 정밀 학습 추천을 작성하는 임무입니다.

            ## 절차 (반드시 지킬 것)
            1. 아래 학생 컨텍스트(약점 역량·최근 학습 이력·진단 결과·테스트 결과)를 정독한다.
            2. 후보 30개(역량 보강 10 + 영역 매칭 10 + 주제 매칭 10) 중에서 진정으로
               이 학생에게 도움이 될 학습을 카테고리별 1~2개씩 선별한다.
            3. 각 추천에 "이 학생의 약점/최근 경향에서 왜 필요한지" 이유를 한 문장씩 적는다.
            4. 운영자의 추가 요청(예: "고전 시 위주", "최근 어려워한 영역")이 있으면 그에 맞춰 우선순위 조정.

            ## 출력 형식 (마크다운)
            ### 추천 학습
            **역량 보강**
            - [콘텐츠ID] 제목 — 이유
            **영역 매칭**
            - [콘텐츠ID] 제목 — 이유
            **주제 매칭**
            - [콘텐츠ID] 제목 — 이유

            (필요 시) **추가 메모**
            - 학생의 학습 추세에 대한 간단 코멘트

            ## 토큰 절약
            - 후보 콘텐츠 본문은 제공되지 않습니다. 메타데이터(제목·역량·영역·주제·이유)만으로 판단.
            - 응답은 400자 이내로 압축.
        """.trimIndent()

        val userPayload = """
            ## 학생 컨텍스트
            $studentSummary

            ## 운영자 요청
            $operatorRequestText

            ## 후보 — 역량 보강 (top 10)
            ${formatCandidates(competencyList)}

            ## 후보 — 영역 매칭 (top 10)
            ${formatCandidates(areaList)}

            ## 후보 — 주제 매칭 (top 10)
            ${formatCandidates(themeList)}
        """.trimIndent()

        val response = callClaude(
            sys,
            tools = emptyList(),
            messages = listOf(mapOf("role" to "user", "content" to userPayload)),
        )
        val text = response.contentBlocks
            .filter { it["type"] == "text" }
            .joinToString("\n") { it["text"] as? String ?: "" }
            .trim()

        return RecommendForStudentResult(
            text = text,
            candidateIds = (competencyList + areaList + themeList).map { it.contentId }.distinct(),
            inputTokens = response.inputTokens ?: 0,
            outputTokens = response.outputTokens ?: 0,
        )
    }

    /** 학생 컨텍스트(약점/최근 학습/진단/테스트) 압축 요약. 토큰 절약을 위해 100자 내외 */
    private fun buildStudentContextSummary(userId: String): String {
        val user = try { userRepo.findById(userId).orElse(null) } catch (_: Exception) { null }
        val name = user?.name ?: userId
        val level = user?.levelId ?: "-"

        val summaries = competencySummaryRepo.findByUserId(userId)
        val weakest = summaries
            .filter { it.sampleCount > 0 }
            .sortedBy { it.ratioScore }
            .take(3)
            .joinToString(", ") { "${it.competency}(${it.ratioScore.toInt()}점·${it.sampleCount}회)" }
            .ifBlank { "측정 부족" }

        val recent = competencyLogRepo.findInWindowDesc(userId).take(8)
        val recentSummary = if (recent.isEmpty()) "최근 학습 없음" else
            recent.joinToString(", ") { "${it.contentId}(${it.source})" }

        return """
            - 이름: $name (레벨 $level)
            - 약점 역량 top3: $weakest
            - 최근 학습 8건: $recentSummary
        """.trimIndent()
    }

    private fun formatCandidates(list: List<RecommendationService.RecommendedContent>): String {
        if (list.isEmpty()) return "(없음)"
        return list.joinToString("\n") {
            "- [${it.contentId}] ${it.title} | ${it.contentType} | 레벨=${it.levelId ?: "-"} | 영역=${it.area ?: "-"}/${it.subArea ?: "-"} | 점수=${"%.2f".format(it.score)} | ${it.reason}"
        }
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

    @Suppress("UNUSED_PARAMETER")
    private fun buildSystemPrompt(userId: String): String {
        return """
            당신은 국어농장v2 의 학생 전용 AI 튜터입니다.
            학생을 1:1 로 밀착 지도하는 과외 선생님이 되어 주세요.

            ## 핵심 원칙 (밀착 과외 선생님)
            1. 정답을 바로 알려주지 마세요. 단계별 힌트 → 점진적 구체화.
            2. 학생의 수준(레벨)에 맞춰 친근한 말투(~해 / ~할까)를 쓰세요.
            3. 답변은 짧고 명료하게. 200자 안팎.
            4. 모르는 건 "모르겠어" 라고 솔직히. 추측하지 마세요.

            ## 학습 추천 절차 (반드시 지킬 것 — 하네스)
            학생이 "추천해줘" 또는 비슷한 요청을 하면:
            1. 먼저 get_my_competency 로 약점 역량을 확인.
            2. get_my_recent_history 로 최근 어떤 학습을 했는지 확인.
            3. get_recommendation_candidates 를 호출해 후보 30개(역량10+영역10+주제10) 수집.
            4. 후보 30개의 메타데이터와 학생의 약점·최근 경향을 종합 판단해
               각 카테고리에서 1~2개씩만 골라 추천. 절대 30개 그대로 보여주지 말 것.
            5. 각 추천에 "이 학습이 너에게 왜 필요한지" 이유를 한 문장으로 적어 줄 것.
            6. 학생이 "이런 종류 학습 있어?" 식으로 특정 주제를 요청하면
               search_content 로 후보를 받아 적합도 순으로 정리해 제시.

            ## 사용 가능한 함수
            - explain_concept: 개념 설명
            - get_my_competency: 내 약점 역량
            - get_my_recent_history: 최근 학습 이력
            - get_recommendation_candidates: 추천 후보 30개 (역량+영역+주제)
            - recommend_my_study: 단순 추천 (특정 영역/주제 명시 시)
            - search_content: 키워드로 학습 검색
            - explain_question_solution: 특정 문제 풀이 단계별 설명

            ## 토큰 효율
            - 후보 메타데이터로 판단. 본문 풀텍스트 요청 X.
            - 추천 결과는 5~7개 이내로 압축.

            ## 출력 형식
            - 마크다운(표·목록)은 적극 사용.
            - 다른 학생 데이터 절대 X. 본인 정보만.

            ## 페이지 이동 링크 (반드시 포함)
            추천이나 안내를 할 때 학생이 곧바로 이동할 수 있는 마크다운 링크를 포함해 줘.
            형식: `[이름](경로)`

            자주 쓰이는 경로:
            - 학습하기 (홈): /start
            - 농장 학습: /farm-mode
            - 프로 모드: /pro-mode
            - 글쓰기: /writing
            - 테스트: /tests
            - 학습 계획표 (내 일정): /study-plan
            - 진단 테스트: /diagnostic/v2
            - 자몽 충전: /my/grapefruit
            - AI 학습 만들기: /my/ai-study
            - 통합 성적표: /report
            - 콘텐츠 풀이: /learning/{contentId} (예: dq-russell1-d12)
            - 학습 콘텐츠 풀이: /study-learning/{contentId}

            예시: "어휘력 약하니까 이 학습 한번 해봐 → [(콘텐츠 제목)](/learning/dq-saussure3-001)"

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
            val body = response.body()
            val friendly = when {
                body.contains("credit balance is too low", ignoreCase = true) ->
                    "AI 크레딧이 부족해. 본사에 알려 줘. 곧 해결될 거야."
                response.statusCode() == 429 ->
                    "지금 AI 가 너무 바빠. 잠시 후 다시 물어봐 줘."
                response.statusCode() in 500..599 ->
                    "AI 서버가 잠깐 답을 못 하고 있어. 잠시 후 다시 시도!"
                else ->
                    "AI 호출이 실패했어 (HTTP ${response.statusCode()}). 다시 시도해 줘."
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
