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
        val errorPaths = input.topErrorPaths.joinToString("\n") { "  - ${it.first}: ${"%.1f".format(it.second)} 점 누적" }
        val genreLines = input.genreAccuracy
            .entries
            .joinToString("\n") { (k, v) -> "  - $k: ${"%.1f".format(v)}%" }
            .ifBlank { "  - (데이터 없음)" }
        val typeLines = input.typeAccuracy
            .entries
            .sortedByDescending { it.value }
            .joinToString("\n") { (k, v) -> "  - $k: ${"%.1f".format(v)}%" }
            .ifBlank { "  - (데이터 없음)" }
        val speedLine = if (input.speedMinPerQuestion != null)
            "  - 보정 풀이속도: ${"%.2f".format(input.speedMinPerQuestion)} 분/문항 (상위 ${input.speedPercentile?.let { "%.0f".format(it) } ?: "?"}%)"
        else "  - 풀이속도 미측정 (인쇄 OMR 일괄 입력 등)"
        return """
            ## 진단 결과 데이터

            - 단계: ${input.tierLabel}
            - 정답률: ${"%.1f".format(input.accuracyRate)}% (정답 ${input.correctCount}/${input.totalQuestions})
            - 추천 레벨: ${input.recommendedLevel}
            - 학년: ${input.gradeLabel ?: "미지정"}
            - 점수(raw_tci): ${"%.1f".format(input.rawTci)}

            ## 10대 역량 점수 (0~100)
            $competencyLines

            ## 상위 강점 역량
            ${input.strongCompetencies.joinToString(", ").ifBlank { "없음" }}

            ## 우선 보강 역량
            ${input.weakCompetencies.joinToString(", ").ifBlank { "없음" }}

            ## 영역별 정답률 (비문학·문학·문법·화법작문)
            $genreLines

            ## 문제 유형별 정답률
            $typeLines

            ## 풀이 속도
            $speedLine

            ## 상위 오답 함정 패턴 (D1~D10 비문학 / L1~L8 문학)
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
                "max_tokens" to 2400,
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

            당신은 국어농장의 학습 진단 분석 전문가입니다. 위 지식 베이스의 10대 역량 정의·영역 구조·
            함정 패턴(D1~D10/L1~L8)·국어농장 학습 콘텐츠 체계를 정확히 적용해, 학생 한 명의 진단
            결과를 깊이 있게 종합 분석한 총평을 작성합니다.

            ## 작성 전 내부 분석 단계 (출력하지 말 것)
            먼저 머릿속에서 다음 4단계를 거치세요. 이 단계는 출력하지 말고 그 결론만 본문에 녹이세요.
              1) 정답률·점수·풀이속도·역량 분포를 합쳐 학생의 전반적 학습 상태를 한 줄로 진단.
              2) 강점 역량 1~2개를 지식 베이스 정의와 연결해 해석.
              3) 약점 역량 1~2개와 상위 오답 함정 패턴(D/L 코드)을 묶어 "왜 틀리는가"의 원인 가설을 세움.
                 (예: D5 인과 함정이 잦음 + 추론력 점수 하 → '원인-결과를 본문에서 직접 짚는 훈련이 부족하다')
              4) 약점-함정 패턴-영역(비문학·문학·문법·화법작문)을 잇는 다음 학습 동선을 1~3주 분량으로 구체화.

            ## 작성 규칙
            - **경어체** (해요체 또는 합니다체) — 학생과 학부모께서 함께 보십니다.
            - **분량: 800~1000자 한국어 자연어**. 마크다운 단락 구분과 핵심 키워드 **bold** 만 사용.
            - **4개 단락 구조**:
              ① 한눈에 보는 진단 — 단계·점수·정답률·풀이속도를 함께 묶은 한 문단 개관과 학년 대비 위치.
              ② 강점 분석 — 강점 역량 1~2개와 그 역량이 어떤 유형 문제에서 드러났는지 영역·문제유형과 연결.
              ③ 약점·오류 원인 진단 — 약점 역량 1~2개 + 상위 함정 패턴(코드와 풀이름) + 그 패턴이 자주
                 등장한 영역을 묶어 "왜 틀리는가" 해석. 단순 나열 금지, 원인-결과로 연결.
              ④ 다음 학습 동선 — 구체 콘텐츠명(일일 퀴즈·농장별 모드·프로 모드·AI 튜터·글쓰기 첨삭·테스트 등)
                 으로 1~3주 학습 방향. 가장 시급한 영역부터.
            - 함정 패턴은 코드만 쓰지 말고 "D5 인과 함정", "L3 후즈훔(주체·객체 자리바꿈)" 처럼 의미와 함께.
            - 강점·약점·점수·등급·정답률은 모두 입력 데이터에서 정확히 인용. 데이터에 없는 칭찬·짐작 금지.
            - 점수가 낮아도 위축되지 않게 격려 톤. 이모지·과한 느낌표 금지.
            - 단순 정보 나열 ❌, 데이터를 묶어 해석한 문장 ⭕.

            ## 출력 형식
            본문만 출력합니다. 제목·메타·"##" 헤더 금지. 단락 사이는 빈 줄 1개로 구분. 핵심 키워드 1~4개만 **bold**.
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
        // 2026-05-18 — AI 총평 상세화 위해 추가 (nullable, 호환)
        val rawTci: Double = 0.0,
        val speedMinPerQuestion: Double? = null,
        val speedPercentile: Double? = null,
        val genreAccuracy: Map<String, Double> = emptyMap(),
        val typeAccuracy: Map<String, Double> = emptyMap(),
    )
}
