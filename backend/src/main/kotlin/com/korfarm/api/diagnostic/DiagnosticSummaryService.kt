package com.korfarm.api.diagnostic

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
 * 진단 결과 AI 총평 생성 — Claude Sonnet 호출 (무과금 정책).
 * 응답 약 500자 한국어 자연어. 실패 시 fallback 문자열 반환.
 */
@Service
class DiagnosticSummaryService(
    private val objectMapper: ObjectMapper,
    @Value("\${claude.api.url:https://api.anthropic.com/v1/messages}") private val apiUrl: String,
    @Value("\${claude.api.key:}") private val apiKey: String,
) {
    private val log = LoggerFactory.getLogger(DiagnosticSummaryService::class.java)
    private val httpClient: HttpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(8))
        .build()
    private val requestTimeout = Duration.ofSeconds(15)
    private val modelSonnet = "claude-sonnet-4-6"

    /** 지식 베이스 로드 (한 번만, lazy) — system prompt 에 항상 포함 (Anthropic prompt cache 90% 절감) */
    private val knowledgeBase: String by lazy {
        try {
            ClassPathResource("ai-prompts/korfarm-knowledge-base.md")
                .inputStream.bufferedReader(Charsets.UTF_8).use { it.readText() }
        } catch (e: Exception) {
            log.warn("지식 베이스 로드 실패 — 비워둠. err={}", e.message)
            ""
        }
    }

    fun generateSummary(input: SummaryInput): String {
        if (apiKey.isBlank()) {
            log.warn("Claude API key 없음 — fallback 사용")
            return input.fallback
        }
        return try {
            // system prompt = 지식 베이스 + 작성 지침
            val systemPrompt = buildString {
                if (knowledgeBase.isNotBlank()) {
                    append("# 국어농장 학습 지식 베이스 (참고)\n\n")
                    append(knowledgeBase)
                    append("\n\n---\n\n")
                }
                append(WRITING_INSTRUCTIONS)
            }
            val userPrompt = buildUserPrompt(input)
            val text = callClaudeSonnet(systemPrompt, userPrompt)
            text.ifBlank { input.fallback }
        } catch (e: Exception) {
            log.warn("AI 총평 생성 실패 — fallback. err={}", e.message)
            input.fallback
        }
    }

    private fun buildUserPrompt(input: SummaryInput): String {
        val competencyLines = input.competencyScores
            .entries
            .sortedByDescending { it.value }
            .joinToString("\n") { (k, v) -> "  - $k: ${"%.1f".format(v)}점 (${gradeOf(v)})" }
        val errorPaths = input.topErrorPaths.joinToString("\n") { "  - ${it.first}: ${it.second} 회" }
        return """
            ## 진단 결과 데이터

            - 단계: ${input.tierLabel}
            - 정답률: ${"%.1f".format(input.accuracyRate)}% (정답 ${input.correctCount}/${input.totalQuestions})
            - 추천 레벨: ${input.recommendedLevel}
            - 학년: ${input.gradeLabel ?: "미지정"}

            ## 10대 역량 점수 (0~100)
            $competencyLines

            ## 상위 강점 역량
            ${input.strongCompetencies.joinToString(", ").ifBlank { "없음" }}

            ## 우선 보강 역량
            ${input.weakCompetencies.joinToString(", ").ifBlank { "없음" }}

            ## 주요 오류 경로
            ${errorPaths.ifBlank { "  - 없음" }}

            위 데이터를 종합 분석한 학생 개별 맞춤 총평을 작성해 줘.
        """.trimIndent()
    }

    private fun gradeOf(score: Double) = when {
        score >= 70 -> "상"
        score >= 40 -> "중"
        else -> "하"
    }

    private fun callClaudeSonnet(systemPrompt: String, userPrompt: String): String {
        val cachedSystem = listOf(
            mapOf(
                "type" to "text",
                "text" to systemPrompt,
                "cache_control" to mapOf("type" to "ephemeral"),
            )
        )
        val requestBody = objectMapper.writeValueAsString(
            mapOf(
                "model" to modelSonnet,
                "max_tokens" to 1024,
                "system" to cachedSystem,
                "messages" to listOf(
                    mapOf("role" to "user", "content" to userPrompt)
                ),
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
            log.warn("Claude 호출 실패 status={} body={}", response.statusCode(), response.body().take(200))
            return ""
        }
        val parsed = objectMapper.readValue(response.body(), Map::class.java)
        @Suppress("UNCHECKED_CAST")
        val content = (parsed["content"] as? List<Map<String, Any>>) ?: emptyList()
        return content.firstOrNull { it["type"] == "text" }?.get("text")?.toString()?.trim() ?: ""
    }

    companion object {
        private val WRITING_INSTRUCTIONS = """
            # 작성 임무

            국어농장의 학습 진단 분석 전문가로서, 위 지식 베이스를 바탕으로
            학생 한 명의 역량 진단 결과를 종합 분석해 총평을 작성합니다.

            ## 작성 규칙
            - **경어체** (해요체 또는 합니다체) — 학생과 학부모께서 함께 보실 수 있습니다
            - **450~550자 한국어 자연어** (마크다운 단락 구분 OK)
            - 1~3개 단락. 첫 단락: 전체 인상·강점, 둘째: 약점·원인 진단, 셋째: 다음 학습 방향
            - 마크다운 강조(**bold**)는 핵심 키워드 1~3개만
            - 지식 베이스에 정의된 정확한 용어 사용 (10대 역량명·영역명·문제 유형 코드·국어농장 학습명 등)
            - 약점은 위 지식 베이스의 함정 패턴·문제 유형·세부영역과 연결지어 진단
            - 다음 학습 방향은 지식 베이스의 콘텐츠명 (예: 일일 퀴즈·농장별 모드·프로 모드·AI 튜터·글쓰기 첨삭) 으로 구체 제안
            - 점수·역량명·등급·정답률은 입력 데이터에서 정확히 인용
            - 데이터에 없는 칭찬·짐작 금지
            - 점수가 낮아도 위축되지 않게 격려 톤
            - 이모지·과한 느낌표 금지

            ## 출력 형식
            본문만 출력합니다 (제목·메타 없이). 마크다운 단락 구분만 사용합니다.
        """.trimIndent()
    }

    data class SummaryInput(
        val tierLabel: String,
        val accuracyRate: Double,
        val correctCount: Int,
        val totalQuestions: Int,
        val recommendedLevel: String,
        val gradeLabel: String?,
        val competencyScores: Map<String, Double>,
        val strongCompetencies: List<String>,
        val weakCompetencies: List<String>,
        val topErrorPaths: List<Pair<String, Double>>,
        val fallback: String,
    )
}
