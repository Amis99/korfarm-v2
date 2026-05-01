package com.korfarm.api.chat

import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.aigen.AiGenLogRepository
import com.korfarm.api.aigen.AiGenLogService
import com.korfarm.api.wisdom.AiPromptRepository
import org.slf4j.LoggerFactory
import java.time.LocalDate
import org.springframework.beans.factory.annotation.Value
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Component
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.time.Duration
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

/**
 * 포도 AI 하네스: 도구 기반 다단계 파이프라인.
 *
 * 1. Claude가 어떤 도구를 쓸지 스스로 판단
 * 2. 도구 실행 결과를 피드백
 * 3. 최종 응답 생성 (500자 제한)
 *
 * 도구:
 * - search_knowledge: 프로그램 문서 + 조쌤 카톡 검색
 * - search_chat_history: 커뮤니티 과거 대화 검색
 * - web_search: 웹 검색 (DuckDuckGo)
 */
@Component
class PodoHarness(
    private val messageRepo: ChatMessageRepository,
    private val referenceRepo: AiChatReferenceRepository,
    private val aiPromptRepository: AiPromptRepository,
    private val objectMapper: ObjectMapper,
    private val aiGenLogService: AiGenLogService,
    private val aiGenLogRepository: AiGenLogRepository,
    @Value("\${claude.api.key:}") private val apiKey: String,
    @Value("\${claude.api.url:https://api.anthropic.com/v1/messages}") private val apiUrl: String,
    @Value("\${podo.daily.limit:100}") private val dailyLimit: Int
) {
    private val log = LoggerFactory.getLogger(PodoHarness::class.java)
    private val httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(10))
        .build()
    private val modelId = "claude-sonnet-4-6"
    private val isoFmt = DateTimeFormatter.ISO_LOCAL_DATE_TIME
    private val maxResponseChars = 500

    companion object {
        const val PODO_USER_ID = "u_ai_podo"
        private val TRIGGER_PATTERN = Regex("포도야|포도[아야]?[,\\s]|@포도", RegexOption.IGNORE_CASE)
        // 일일 한도 카운트에 포함시킬 kind (모든 포도 호출)
        private val PODO_KINDS = listOf("podo-chat", "podo-board")
    }

    // ─── 일일 한도 ──────────────────────────────────────

    /**
     * 사용자별 오늘 사용량 (성공 row 수). 한도 초과 시 true 반환.
     * row 단위 카운트라 한 번의 generate() 가 callClaude 여러 번 = 여러 row 임.
     * → "callClaude 100회" 가 한도. 평균 generate 1회 = 2~3 callClaude 이므로 실질 30~50 회 호출.
     */
    private fun isDailyLimitReached(userId: String): Boolean {
        if (dailyLimit <= 0) return false
        return try {
            val from = LocalDate.now().atStartOfDay()
            val to = from.plusDays(1)
            val count = aiGenLogRepository.countByUserAndKindsInRange(userId, PODO_KINDS, from, to)
            count >= dailyLimit
        } catch (e: Exception) {
            log.warn("일일 한도 조회 실패: userId={} err={}", userId, e.message)
            false
        }
    }

    // ─── 도구 정의 ──────────────────────────────────────

    private val tools = listOf(
        mapOf(
            "name" to "search_knowledge",
            "description" to "국어농장 프로그램 정보, 10대 역량, 학습 모드, 레벨 체계, 국어 문법 개념, 수업 노트(고전소설/독해전략 등), 조쌤 과거 대화(Q&A 맥락 포함)를 검색합니다. 학습 조언, 국어농장, 문법, 독해 관련 질문에 반드시 먼저 호출하세요.",
            "input_schema" to mapOf(
                "type" to "object",
                "required" to listOf("query"),
                "properties" to mapOf(
                    "query" to mapOf("type" to "string", "description" to "검색 키워드 (한국어)")
                )
            )
        ),
        mapOf(
            "name" to "search_chat_history",
            "description" to "커뮤니티 채팅방의 과거 대화를 검색합니다. 이전에 논의된 주제나 맥락을 파악할 때 사용하세요.",
            "input_schema" to mapOf(
                "type" to "object",
                "required" to listOf("query"),
                "properties" to mapOf(
                    "query" to mapOf("type" to "string", "description" to "검색 키워드 (한국어)")
                )
            )
        ),
        mapOf(
            "name" to "web_search",
            "description" to "최신 뉴스, 시사, 수능/입시 정보 등 실시간 정보가 필요할 때 웹 검색을 합니다. 국어농장 내부 정보가 아닌 외부 정보가 필요할 때만 사용하세요.",
            "input_schema" to mapOf(
                "type" to "object",
                "required" to listOf("query"),
                "properties" to mapOf(
                    "query" to mapOf("type" to "string", "description" to "검색 쿼리 (한국어)")
                )
            )
        )
    )

    // ─── 메인 파이프라인 ─────────────────────────────────

    fun generate(triggerMessage: ChatMessageEntity): String {
        if (apiKey.isBlank()) return ""
        if (isDailyLimitReached(triggerMessage.userId)) {
            return "오늘 포도가 너무 많이 일했어! 하루 ${dailyLimit}번 한도에 도달해서 더 답할 수 없어 ㅠㅠ 내일 다시 만나자~"
        }

        val systemPrompt = aiPromptRepository.findByPromptKeyAndLevelGroup("community_chat", "_common")
            ?.promptText ?: return ""

        // 최근 대화 30건
        val recentMessages = messageRepo.findRecent(
            triggerMessage.roomId, null, PageRequest.of(0, 30)
        ).reversed()

        val chatContext = recentMessages.joinToString("\n") { msg ->
            val name = if (msg.userId == PODO_USER_ID) "포도" else msg.userName
            val text = msg.content ?: "[${msg.messageType}]"
            "$name: $text"
        }

        val userContent = """[최근 대화]
$chatContext

위 대화에서 "포도"가 호출되었습니다.
필요하면 도구를 사용해 정보를 검색한 뒤, 자연스럽게 응답하세요.
응답은 반드시 500자 이내로 작성하세요."""

        val systemBlocks = listOf(
            mapOf(
                "type" to "text",
                "text" to systemPrompt,
                "cache_control" to mapOf("type" to "ephemeral")
            )
        )

        // Step 1: 첫 번째 호출 (도구 사용 가능)
        val messages = mutableListOf<Map<String, Any>>(
            mapOf("role" to "user", "content" to userContent)
        )

        var response = callClaude(systemBlocks, messages, triggerMessage.userId, "podo-chat")
        var iterations = 0
        val maxIterations = 3

        // Step 2: 도구 호출 루프 (최대 3회)
        while (iterations < maxIterations) {
            val contentBlocks = extractContentBlocks(response)
            val toolUseBlocks = contentBlocks.filter { (it as? Map<*, *>)?.get("type") == "tool_use" }

            if (toolUseBlocks.isEmpty()) break

            // 어시스턴트 응답 저장
            messages.add(mapOf("role" to "assistant", "content" to contentBlocks))

            // 도구 실행 + 결과 피드백
            val toolResults = toolUseBlocks.map { block ->
                val toolBlock = block as Map<*, *>
                val toolId = toolBlock["id"] as String
                val toolName = toolBlock["name"] as String
                val input = toolBlock["input"] as? Map<*, *> ?: emptyMap<Any, Any>()
                val query = input["query"]?.toString() ?: ""

                val result = executeTool(toolName, query, triggerMessage)
                mapOf(
                    "type" to "tool_result",
                    "tool_use_id" to toolId,
                    "content" to result
                )
            }

            messages.add(mapOf("role" to "user", "content" to toolResults))

            // 다음 호출
            response = callClaude(systemBlocks, messages, triggerMessage.userId, "podo-chat")
            iterations++
        }

        // Step 3: 최종 텍스트 추출 + 500자 제한
        val text = extractText(response).trim()
        return if (text.length > maxResponseChars) {
            text.substring(0, maxResponseChars - 3) + "..."
        } else {
            text
        }
    }

    // ─── 게시판 댓글용 ─────────────────────────────────

    fun generateForBoard(title: String, content: String, authorId: String): String {
        if (apiKey.isBlank()) return ""
        if (isDailyLimitReached(authorId)) return ""

        val systemPrompt = aiPromptRepository.findByPromptKeyAndLevelGroup("community_chat", "_common")
            ?.promptText ?: return ""

        val systemBlocks = listOf(
            mapOf(
                "type" to "text",
                "text" to systemPrompt,
                "cache_control" to mapOf("type" to "ephemeral")
            )
        )

        val userContent = """[학습 질문 게시판에 새 글이 올라왔습니다]
제목: $title
내용: $content

위 게시글이 국어 학습과 관련된 질문인지 먼저 판단하세요.
- 국어 학습 질문이 맞다면: 도구를 활용해 정확한 정보를 검색한 뒤 500자 이내로 친절하게 답변하세요.
- 국어 학습과 무관한 글이라면: 빈 문자열("")만 출력하세요. 다른 말은 하지 마세요.

국어 학습 관련 판단 기준: 문법, 어휘, 독해, 글쓰기, 시험/수능/내신, 국어농장 사용법, 학습 방법 등"""

        val messages = mutableListOf<Map<String, Any>>(
            mapOf("role" to "user", "content" to userContent)
        )

        var response = callClaude(systemBlocks, messages, authorId, "podo-board")
        var iterations = 0
        val maxIterations = 3

        while (iterations < maxIterations) {
            val contentBlocks = extractContentBlocks(response)
            val toolUseBlocks = contentBlocks.filter { (it as? Map<*, *>)?.get("type") == "tool_use" }
            if (toolUseBlocks.isEmpty()) break

            messages.add(mapOf("role" to "assistant", "content" to contentBlocks))
            val toolResults = toolUseBlocks.map { block ->
                val toolBlock = block as Map<*, *>
                val toolId = toolBlock["id"] as String
                val toolName = toolBlock["name"] as String
                val input = toolBlock["input"] as? Map<*, *> ?: emptyMap<Any, Any>()
                val query = input["query"]?.toString() ?: ""
                mapOf(
                    "type" to "tool_result",
                    "tool_use_id" to toolId,
                    "content" to executeTool(toolName, query, null)
                )
            }
            messages.add(mapOf("role" to "user", "content" to toolResults))
            response = callClaude(systemBlocks, messages, authorId, "podo-board")
            iterations++
        }

        val text = extractText(response).trim()
        // 빈 문자열이면 비학습 질문으로 판단 → 댓글 안 달기
        if (text.isBlank() || text == "\"\"" || text == "''") return ""
        return if (text.length > maxResponseChars) text.substring(0, maxResponseChars - 3) + "..." else text
    }

    // ─── 게시판 댓글 (이미지 포함) ───────────────────────

    fun generateForBoardWithImages(title: String, content: String, images: List<Pair<ByteArray, String>>, authorId: String): String {
        if (apiKey.isBlank()) return ""
        if (isDailyLimitReached(authorId)) return ""

        val systemPrompt = aiPromptRepository.findByPromptKeyAndLevelGroup("community_chat", "_common")
            ?.promptText ?: return ""

        val systemBlocks = listOf(
            mapOf(
                "type" to "text",
                "text" to systemPrompt,
                "cache_control" to mapOf("type" to "ephemeral")
            )
        )

        // 이미지 + 텍스트를 content 배열로 구성
        val userContentBlocks = mutableListOf<Map<String, Any>>()
        for ((bytes, mime) in images) {
            userContentBlocks.add(mapOf(
                "type" to "image",
                "source" to mapOf(
                    "type" to "base64",
                    "media_type" to mime,
                    "data" to java.util.Base64.getEncoder().encodeToString(bytes)
                )
            ))
        }
        userContentBlocks.add(mapOf(
            "type" to "text",
            "text" to """[학습 질문 게시판에 새 글이 올라왔습니다]
제목: $title
내용: $content

위에 첨부된 이미지는 학생이 올린 문제/지문 사진입니다. 이미지 내용을 반드시 읽고 참고하여 답변하세요.

위 게시글이 국어 학습과 관련된 질문인지 먼저 판단하세요.
- 국어 학습 질문이 맞다면: 이미지의 문제/지문을 분석하고, 도구를 활용해 정확한 정보를 검색한 뒤 500자 이내로 친절하게 답변하세요.
- 국어 학습과 무관한 글이라면: 빈 문자열("")만 출력하세요."""
        ))

        val messages = mutableListOf<Map<String, Any>>(
            mapOf("role" to "user", "content" to userContentBlocks)
        )

        var response = callClaude(systemBlocks, messages, authorId, "podo-board")
        var iterations = 0
        val maxIterations = 3

        while (iterations < maxIterations) {
            val contentBlocks = extractContentBlocks(response)
            val toolUseBlocks = contentBlocks.filter { (it as? Map<*, *>)?.get("type") == "tool_use" }
            if (toolUseBlocks.isEmpty()) break

            messages.add(mapOf("role" to "assistant", "content" to contentBlocks))
            val toolResults = toolUseBlocks.map { block ->
                val toolBlock = block as Map<*, *>
                val toolId = toolBlock["id"] as String
                val toolName = toolBlock["name"] as String
                val input = toolBlock["input"] as? Map<*, *> ?: emptyMap<Any, Any>()
                val query = input["query"]?.toString() ?: ""
                mapOf(
                    "type" to "tool_result",
                    "tool_use_id" to toolId,
                    "content" to executeTool(toolName, query, null)
                )
            }
            messages.add(mapOf("role" to "user", "content" to toolResults))
            response = callClaude(systemBlocks, messages, authorId, "podo-board")
            iterations++
        }

        val text = extractText(response).trim()
        if (text.isBlank() || text == "\"\"" || text == "''") return ""
        return if (text.length > maxResponseChars) text.substring(0, maxResponseChars - 3) + "..." else text
    }

    // ─── 도구 실행 ──────────────────────────────────────

    private fun executeTool(name: String, query: String, trigger: ChatMessageEntity?): String {
        return try {
            when (name) {
                "search_knowledge" -> executeSearchKnowledge(query)
                "search_chat_history" -> if (trigger != null) executeSearchChatHistory(query, trigger) else "게시판 컨텍스트에서는 채팅 히스토리를 검색할 수 없습니다."
                "web_search" -> executeWebSearch(query)
                else -> "알 수 없는 도구입니다."
            }
        } catch (e: Exception) {
            log.warn("도구 실행 실패: name={}, query={}", name, query, e)
            "검색에 실패했습니다."
        }
    }

    private fun executeSearchKnowledge(query: String): String {
        if (query.isBlank()) return "검색어가 비어있습니다."

        val parts = mutableListOf<String>()

        // 프로그램 문서 항상 포함
        val programDocs = referenceRepo.findBySource("program_doc")
        if (programDocs.isNotEmpty()) {
            parts.add(programDocs.joinToString("\n") { "[프로그램] ${it.content}" })
        }

        // 문법 문서 검색
        val grammarResults = try {
            referenceRepo.searchGrammar(query, 3)
        } catch (e: Exception) { emptyList() }
        if (grammarResults.isNotEmpty()) {
            parts.add(grammarResults.joinToString("\n\n") { "[문법] ${it.content}" })
        }

        // 수업 노트 검색
        val lessonResults = try {
            referenceRepo.searchLessonNote(query, 3)
        } catch (e: Exception) { emptyList() }
        if (lessonResults.isNotEmpty()) {
            parts.add(lessonResults.joinToString("\n\n") { "[수업노트] ${it.content}" })
        }

        // 카톡 대화 검색 (Q&A 맥락 포함)
        val kakaoResults = try {
            referenceRepo.searchKakao(query, 8)
        } catch (e: Exception) { emptyList() }
        if (kakaoResults.isNotEmpty()) {
            parts.add(kakaoResults.joinToString("\n\n") { "[조쌤대화] ${it.content}" })
        }

        return if (parts.isEmpty()) "관련 정보를 찾지 못했습니다." else parts.joinToString("\n\n")
    }

    private fun executeSearchChatHistory(query: String, trigger: ChatMessageEntity): String {
        if (query.isBlank()) return "검색어가 비어있습니다."

        val cutoff = trigger.createdAt.minusMinutes(5)
        val results = try {
            messageRepo.searchRelevant(trigger.roomId, query, cutoff, 8)
        } catch (e: Exception) {
            emptyList()
        }

        if (results.isEmpty()) return "관련 과거 대화를 찾지 못했습니다."

        val now = LocalDateTime.now()
        return results.joinToString("\n") { msg ->
            val daysAgo = Duration.between(msg.createdAt, now).toDays()
            val timeLabel = when {
                daysAgo < 1 -> "(오늘)"
                daysAgo < 7 -> "(${daysAgo}일 전)"
                daysAgo < 30 -> "(${daysAgo / 7}주 전)"
                else -> "(${daysAgo / 30}개월 전)"
            }
            val name = if (msg.userId == PODO_USER_ID) "포도" else msg.userName
            "$timeLabel $name: ${msg.content}"
        }
    }

    private fun executeWebSearch(query: String): String {
        if (query.isBlank()) return "검색어가 비어있습니다."

        return try {
            val encoded = java.net.URLEncoder.encode(query, "UTF-8")
            val url = "https://api.duckduckgo.com/?q=$encoded&format=json&no_html=1&skip_disambig=1&kl=kr-kr"

            val request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(5))
                .GET()
                .build()

            val response = httpClient.send(request, HttpResponse.BodyHandlers.ofString())
            if (response.statusCode() != 200) return "웹 검색에 실패했습니다."

            val data = objectMapper.readValue(response.body(), Map::class.java)

            val parts = mutableListOf<String>()

            // AbstractText (간략 답변)
            val abstractText = data["AbstractText"]?.toString()
            if (!abstractText.isNullOrBlank()) {
                val source = data["AbstractSource"]?.toString() ?: ""
                parts.add("$abstractText (출처: $source)")
            }

            // RelatedTopics (관련 주제)
            val topics = data["RelatedTopics"] as? List<*> ?: emptyList<Any>()
            for (topic in topics.take(3)) {
                val topicMap = topic as? Map<*, *> ?: continue
                val text = topicMap["Text"]?.toString() ?: continue
                if (text.isNotBlank()) parts.add(text)
            }

            if (parts.isEmpty()) {
                // Instant Answer가 없으면 HTML 검색 시도
                fetchDuckDuckGoHtml(query)
            } else {
                parts.joinToString("\n")
            }
        } catch (e: Exception) {
            log.warn("웹 검색 실패: query={}", query, e)
            "웹 검색에 실패했습니다."
        }
    }

    private fun fetchDuckDuckGoHtml(query: String): String {
        return try {
            val encoded = java.net.URLEncoder.encode(query, "UTF-8")
            val url = "https://lite.duckduckgo.com/lite/?q=$encoded&kl=kr-kr"

            val request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(5))
                .header("User-Agent", "Mozilla/5.0 (compatible; KorfarmBot/1.0)")
                .GET()
                .build()

            val response = httpClient.send(request, HttpResponse.BodyHandlers.ofString())
            if (response.statusCode() != 200) return "웹 검색에 실패했습니다."

            // 간단한 HTML 파싱: 검색 결과 스니펫 추출
            val snippetPattern = Regex("""<td[^>]*class="result-snippet"[^>]*>(.*?)</td>""", RegexOption.DOT_MATCHES_ALL)
            val snippets = snippetPattern.findAll(response.body())
                .map { it.groupValues[1].replace(Regex("<[^>]+>"), "").trim() }
                .filter { it.isNotBlank() }
                .take(3)
                .toList()

            if (snippets.isEmpty()) "관련 검색 결과를 찾지 못했습니다."
            else snippets.joinToString("\n")
        } catch (e: Exception) {
            "웹 검색에 실패했습니다."
        }
    }

    // ─── Claude API ─────────────────────────────────────

    private fun callClaude(
        system: List<Map<String, Any>>,
        messages: List<Map<String, Any>>,
        userId: String,
        kind: String = "podo-chat"
    ): String {
        val body = mutableMapOf<String, Any>(
            "model" to modelId,
            "max_tokens" to 1024,
            "temperature" to 0.9,
            "system" to system,
            "tools" to tools,
            "messages" to messages
        )

        val requestBody = objectMapper.writeValueAsString(body)
        val started = System.currentTimeMillis()

        val request = HttpRequest.newBuilder()
            .uri(URI.create(apiUrl))
            .header("Content-Type", "application/json")
            .header("x-api-key", apiKey)
            .header("anthropic-version", "2023-06-01")
            .timeout(Duration.ofSeconds(30))
            .POST(HttpRequest.BodyPublishers.ofString(requestBody))
            .build()

        val response = try {
            httpClient.send(request, HttpResponse.BodyHandlers.ofString())
        } catch (e: Exception) {
            val duration = (System.currentTimeMillis() - started).toInt()
            logUsage(userId, kind, duration, null, null, status = "error", errorMessage = e.message)
            throw e
        }
        val duration = (System.currentTimeMillis() - started).toInt()
        if (response.statusCode() !in 200..299) {
            log.error("Claude API 오류: status={}, body={}", response.statusCode(), response.body().take(500))
            logUsage(userId, kind, duration, null, null, status = "error", errorMessage = "HTTP ${response.statusCode()}")
            throw RuntimeException("Claude API HTTP ${response.statusCode()}")
        }

        // 토큰 추출 + 로깅
        val raw = response.body()
        val (inTok, outTok) = try {
            val parsed = objectMapper.readValue(raw, Map::class.java)
            val usage = parsed["usage"] as? Map<*, *>
            Pair((usage?.get("input_tokens") as? Number)?.toInt(), (usage?.get("output_tokens") as? Number)?.toInt())
        } catch (e: Exception) {
            Pair(null, null)
        }
        logUsage(userId, kind, duration, inTok, outTok, status = "success")
        return raw
    }

    private fun logUsage(
        userId: String,
        kind: String,
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
                kind = kind,
                model = modelId,
                inputTokens = inputTokens,
                outputTokens = outputTokens,
                durationMs = durationMs,
                status = status,
                errorMessage = errorMessage
            )
        } catch (e: Exception) {
            log.warn("AI 사용 로그 저장 실패: kind={} err={}", kind, e.message)
        }
    }

    @Suppress("UNCHECKED_CAST")
    private fun extractContentBlocks(responseBody: String): List<Any> {
        val map = objectMapper.readValue(responseBody, Map::class.java)
        return (map["content"] as? List<*>)?.filterNotNull() ?: emptyList()
    }

    private fun extractText(responseBody: String): String {
        val blocks = extractContentBlocks(responseBody)
        return blocks.filterIsInstance<Map<*, *>>()
            .filter { it["type"] == "text" }
            .joinToString("") { it["text"]?.toString() ?: "" }
    }
}
