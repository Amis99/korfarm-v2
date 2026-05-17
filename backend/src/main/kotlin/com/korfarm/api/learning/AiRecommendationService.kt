package com.korfarm.api.learning

import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.io.ClassPathResource
import org.springframework.stereotype.Service
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.time.Duration

/**
 * AI 추천 학습 서비스 (2026-05-18) — Claude Sonnet 으로 후보 콘텐츠 중 N개 선택.
 *
 * 사용자 정책: 알고리즘(SQL 가중치) 추천 폐기 + AI 가 학생 맞춤 선택.
 *   - 진단 리포트: 최초 1회 호출 후 영구 캐시 (DiagnosticService 가 호출)
 *   - 통합 분석표: 최초 1회 + 하루 1회 갱신 (UnifiedReportService 가 호출)
 *
 * 후보 콘텐츠는 RecommendationService 의 SQL 추천 결과를 그대로 사용 (이미 "수정 내역 있는 콘텐츠만" 필터링됨).
 * AI 는 그 후보들 중에서 학생 약점·강점·레벨 컨텍스트로 의미 있는 N개를 골라낸다.
 */
@Service
class AiRecommendationService(
    private val objectMapper: ObjectMapper,
    @Value("\${claude.api.url:https://api.anthropic.com/v1/messages}") private val apiUrl: String,
    @Value("\${claude.api.key:}") private val apiKey: String,
) {
    private val log = LoggerFactory.getLogger(AiRecommendationService::class.java)
    private val httpClient: HttpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(8))
        .build()
    private val requestTimeout = Duration.ofSeconds(20)
    private val modelSonnet = "claude-sonnet-4-6"

    private val knowledgeBase: String by lazy {
        try {
            ClassPathResource("ai-prompts/korfarm-knowledge-base.md")
                .inputStream.bufferedReader(Charsets.UTF_8).use { it.readText() }
        } catch (e: Exception) {
            log.warn("지식 베이스 로드 실패: {}", e.message)
            ""
        }
    }

    data class Candidate(
        val contentId: String,
        val title: String,
        val contentType: String,
        val levelId: String?,
        val area: String?,
        val subArea: String?,
        val score: Double,
        val tag: String,   // "약점역량:어휘력" / "영역:비문학" / "주제:환경" 등 — AI 가 맥락 이해용
    )

    data class StudentContext(
        val gradeLabel: String?,
        val tierLabel: String,
        val recommendedLevel: String,
        val accuracyRate: Double,
        val strongCompetencies: List<String>,
        val weakCompetencies: List<String>,
    )

    data class Picked(
        val contentId: String,
        val title: String,
        val contentType: String,
        val levelId: String?,
        val area: String?,
        val subArea: String?,
        val reason: String,
    )

    /**
     * 후보 중에서 학생 맞춤 N개 선택. 후보가 비면 빈 리스트.
     * AI 호출 실패 시 후보를 그대로 첫 N개로 fallback.
     */
    fun pickRecommendations(
        candidates: List<Candidate>,
        student: StudentContext,
        targetCount: Int = 6,
    ): List<Picked> {
        if (candidates.isEmpty()) return emptyList()
        if (apiKey.isBlank()) {
            log.warn("Claude API key 없음 — fallback (첫 ${targetCount}개)")
            return candidates.take(targetCount).map { it.toFallbackPicked() }
        }
        return try {
            val systemPrompt = buildSystemPrompt()
            val userPrompt = buildUserPrompt(candidates, student, targetCount)
            val raw = callClaude(systemPrompt, userPrompt)
            parsePicked(raw, candidates).ifEmpty { candidates.take(targetCount).map { it.toFallbackPicked() } }
        } catch (e: Exception) {
            log.warn("AI 추천 실패 — fallback: {}", e.message)
            candidates.take(targetCount).map { it.toFallbackPicked() }
        }
    }

    private fun Candidate.toFallbackPicked() = Picked(
        contentId = contentId,
        title = title,
        contentType = contentType,
        levelId = levelId,
        area = area,
        subArea = subArea,
        reason = "후보 우선순위 기반 (AI 호출 미사용)",
    )

    private fun buildSystemPrompt(): String = buildString {
        if (knowledgeBase.isNotBlank()) {
            append("# 국어농장 학습 지식 베이스 (참고)\n\n")
            append(knowledgeBase)
            append("\n\n---\n\n")
        }
        append(SYSTEM_INSTRUCTIONS)
    }

    private fun buildUserPrompt(
        candidates: List<Candidate>,
        student: StudentContext,
        targetCount: Int,
    ): String {
        val candLines = candidates.mapIndexed { i, c ->
            "  ${i + 1}. id=${c.contentId} | ${c.title} | ${c.contentType} | level=${c.levelId ?: "-"} | area=${c.area ?: "-"}/${c.subArea ?: "-"} | tag=${c.tag} | score=${"%.2f".format(c.score)}"
        }.joinToString("\n")
        return """
            ## 학생 컨텍스트
            - 학년: ${student.gradeLabel ?: "미지정"}
            - 응시 단계: ${student.tierLabel}
            - 추천 레벨: ${student.recommendedLevel}
            - 정답률: ${"%.1f".format(student.accuracyRate)}%
            - 강점 역량: ${student.strongCompetencies.joinToString(", ").ifBlank { "없음" }}
            - 보강 역량: ${student.weakCompetencies.joinToString(", ").ifBlank { "없음" }}

            ## 후보 콘텐츠 (모두 어드민이 손본 검수 완료 콘텐츠)
            $candLines

            ## 임무
            위 후보 중에서 이 학생에게 가장 도움 되는 학습 **${targetCount}개**를 골라줘.
            응답은 반드시 아래 JSON 배열 한 줄만 출력 (다른 설명 금지):

            [{"contentId":"...","reason":"이 학생에게 추천하는 이유 한 줄 (40~80자, 경어체)"}, ...]

            선택 규칙:
              - 영역·역량·레벨이 다양하게 섞이도록 (편향 X)
              - 약점 역량 보강 1~2개 / 강점 심화 1개 / 다른 영역 1~2개 / 자유 1개 가량 균형
              - 후보에 없는 contentId 출력 금지
              - reason 은 학생 컨텍스트와 결부해 구체적으로 (왜 이 학생에게 필요한지)
        """.trimIndent()
    }

    private fun callClaude(systemPrompt: String, userPrompt: String): String {
        val cachedSystem = listOf(
            mapOf(
                "type" to "text",
                "text" to systemPrompt,
                "cache_control" to mapOf("type" to "ephemeral"),
            )
        )
        val body = objectMapper.writeValueAsString(
            mapOf(
                "model" to modelSonnet,
                "max_tokens" to 1600,
                "system" to cachedSystem,
                "messages" to listOf(mapOf("role" to "user", "content" to userPrompt)),
            )
        )
        val req = HttpRequest.newBuilder()
            .uri(URI.create(apiUrl))
            .timeout(requestTimeout)
            .header("Content-Type", "application/json")
            .header("x-api-key", apiKey)
            .header("anthropic-version", "2023-06-01")
            .POST(HttpRequest.BodyPublishers.ofString(body))
            .build()
        val resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString())
        if (resp.statusCode() !in 200..299) {
            log.warn("Claude 호출 실패 status={} body={}", resp.statusCode(), resp.body().take(200))
            return ""
        }
        val parsed = objectMapper.readValue(resp.body(), Map::class.java)
        @Suppress("UNCHECKED_CAST")
        val content = (parsed["content"] as? List<Map<String, Any>>) ?: emptyList()
        return content.firstOrNull { it["type"] == "text" }?.get("text")?.toString()?.trim() ?: ""
    }

    @Suppress("UNCHECKED_CAST")
    private fun parsePicked(raw: String, candidates: List<Candidate>): List<Picked> {
        if (raw.isBlank()) return emptyList()
        // ```json ... ``` fence 제거
        val cleaned = raw
            .removePrefix("```json").removePrefix("```")
            .removeSuffix("```")
            .trim()
        val items = try {
            objectMapper.readValue(cleaned, List::class.java) as? List<Map<String, Any?>> ?: return emptyList()
        } catch (e: Exception) {
            log.warn("AI 추천 JSON 파싱 실패: {} raw={}", e.message, cleaned.take(200))
            return emptyList()
        }
        val byId = candidates.associateBy { it.contentId }
        return items.mapNotNull { m ->
            val id = m["contentId"] as? String ?: return@mapNotNull null
            val c = byId[id] ?: return@mapNotNull null   // 후보에 없는 id 무시
            val reason = (m["reason"] as? String)?.trim().orEmpty().ifBlank { "AI 추천" }
            Picked(
                contentId = c.contentId,
                title = c.title,
                contentType = c.contentType,
                levelId = c.levelId,
                area = c.area,
                subArea = c.subArea,
                reason = reason,
            )
        }
    }

    companion object {
        private val SYSTEM_INSTRUCTIONS = """
            # 작성 임무

            당신은 국어농장 학습 큐레이터입니다. 한 학생의 진단 결과와 후보 콘텐츠 목록을 받고,
            그 학생에게 가장 도움되는 학습을 선별합니다.

            ## 규칙
            - 후보 목록 안에서만 선택 (목록 밖 contentId 절대 출력 금지)
            - 영역·역량·레벨이 한쪽으로 쏠리지 않게 균형
            - reason 은 학생 컨텍스트(약점·강점·레벨)와 직접 연결해 구체적으로
            - 출력은 JSON 배열 한 줄만, 다른 텍스트·마크다운 없음
        """.trimIndent()
    }
}
