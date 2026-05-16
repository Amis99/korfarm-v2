package com.korfarm.api.report

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.korfarm.api.aigen.AiCallHelper
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

/**
 * 통합 분석표 AI 보강 — Claude Sonnet 으로 코멘트·추천 사유 재작성 (2026-05-17).
 *
 * 호출 시점: 학생/관리자가 새로고침 아이콘 클릭 (일 1회 제한).
 *
 * 보강 항목:
 *   1. aiComments — 룰 기반 템플릿 대신 학생 상태 종합 분석 코멘트 N개 생성
 *   2. recommendationBundle.competency / area / items[].reason — 추천 사유를 학생 맞춤 자연어로 재작성
 *      (콘텐츠 후보 자체는 DB 알고리즘이 추출 — Claude 는 선별·이유만 담당)
 */
@Service
class UnifiedReportAiService(
    private val aiHelper: AiCallHelper,
    private val objectMapper: ObjectMapper,
) {
    private val log = LoggerFactory.getLogger(UnifiedReportAiService::class.java)
    private val dtFmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")

    fun enhance(studentId: String, base: UnifiedReportResponse): UnifiedReportResponse {
        if (!aiHelper.isConfigured()) {
            log.warn("Claude API 키 미설정 — AI 보강 skip studentId={}", studentId)
            return base
        }

        // Claude 입력용 요약 텍스트
        val analysisInput = buildAnalysisInput(base)
        val systemPrompt = """
            당신은 국어 학습 데이터 분석 전문가다.
            학생 한 명의 학습 활동 요약을 받아 다음을 작성한다:
              1. 학생 맞춤 코멘트 4~6개 — 강점·약점·계획표·글쓰기·추세 등 데이터 기반 인사이트
              2. 추천 학습 사유 — 주어진 추천 콘텐츠 N개 각각에 대해 '왜 이 학생에게 이게 좋은지' 1문장
            응답은 반드시 JSON 한 객체 — 다른 설명·markdown·코드펜스 금지.
            형식:
            {
              "comments": [
                { "section": "역량|영역|계획표|글쓰기|추세|추천", "title": "...", "content": "...", "severity": "good|warn|info" }
              ],
              "competencyReasons": { "<contentId>": "사유 1문장", ... },
              "areaReasons": { "<contentId>": "사유 1문장", ... }
            }
            content/사유는 한국어 존댓말. 1~3문장. 학생 데이터에 없는 사실 만들지 말 것.
        """.trimIndent()

        val systemBlocks = listOf(
            aiHelper.systemBlock(systemPrompt, ephemeralCache = true),
        )
        val result = try {
            aiHelper.call(
                model = AiCallHelper.MODEL_SONNET,
                systemBlocks = systemBlocks,
                userText = analysisInput,
                maxTokens = 3500,
            )
        } catch (e: Exception) {
            log.warn("통합 분석표 Claude 호출 실패 studentId={} err={}", studentId, e.message)
            return base
        }

        val parsed = try {
            parseAiResponse(result.text)
        } catch (e: Exception) {
            log.warn("통합 분석표 AI 응답 파싱 실패 studentId={} err={}", studentId, e.message)
            return base
        }

        val now = LocalDateTime.now().format(dtFmt)
        val mappedComments = parsed.comments.map {
            AiComment(
                section = it.section,
                title = it.title,
                content = it.content,
                severity = it.severity.ifBlank { "info" },
                generatedAt = now,
            )
        }
        val newBundle = applyReasons(base.recommendationBundle, parsed.competencyReasons, parsed.areaReasons)
        return base.copy(
            aiComments = mappedComments,
            recommendationBundle = newBundle,
        )
    }

    /** AI 입력용 학생 분석 텍스트 — 콘텐츠 후보 ID 포함 */
    private fun buildAnalysisInput(r: UnifiedReportResponse): String {
        val sb = StringBuilder()
        sb.appendLine("학생: ${r.studentName} (id=${r.studentId}, 레벨=${r.studentLevelId ?: "-"})")
        sb.appendLine("기간: ${r.period.startDate} ~ ${r.period.endDate}")
        sb.appendLine()

        sb.appendLine("[10대 역량 누적]")
        r.learningCompetency?.items?.forEach {
            sb.appendLine("  - ${it.competency}: ratio=${"%.1f".format(it.ratioScore)} (sample=${it.sampleCount})")
        }
        sb.appendLine()

        sb.appendLine("[진단 측정]")
        r.diagnosticCompetency?.items?.forEach {
            sb.appendLine("  - ${it.competency}: ${it.score.toInt()}점")
        }
        sb.appendLine()

        sb.appendLine("[영역별 (상위 10)]")
        r.areaStats.take(10).forEach {
            sb.appendLine("  - ${it.areaLabel}: ${"%.1f".format(it.weightedScore)}점 (${it.activityCount}회)")
        }
        sb.appendLine()

        if (r.themeStats.isNotEmpty()) {
            sb.appendLine("[주제별 (상위 8)]")
            r.themeStats.take(8).forEach {
                sb.appendLine("  - ${it.themeLabel} (${it.areaLabel}): ${"%.1f".format(it.weightedScore)}점 (${it.activityCount}회)")
            }
            sb.appendLine()
        }

        r.sections.let { s ->
            sb.appendLine("[활동량]")
            sb.appendLine("  - 지필시험 ${s.examOmr.count}회 평균${s.examOmr.averageScore}")
            sb.appendLine("  - 농장모드 ${s.farmMode.count}회 정답률${s.farmMode.averageAccuracy ?: "-"}")
            sb.appendLine("  - 일일퀴즈 ${s.dailyQuiz.count}회 평균${s.dailyQuiz.averageScore}")
            sb.appendLine("  - 일일독해 ${s.dailyReading.count}회 평균${s.dailyReading.averageScore}")
            s.proMode?.let { sb.appendLine("  - 프로모드 학습${it.completedItems}·테스트${it.testCount}회") }
            s.studyPlan?.let { sb.appendLine("  - 학습계획표 완료율 ${"%.0f".format(it.completionRate)}% (대기 ${it.pendingCells})") }
            sb.appendLine()
        }

        r.writingStats?.let {
            sb.appendLine("[글쓰기]")
            sb.appendLine("  - 작성 ${it.totalPostCount}편 / AI첨삭 ${it.feedbackReceivedCount}회 / 좋아요 ${it.totalLikes} / 댓글 ${it.totalComments}")
            sb.appendLine()
        }

        r.recommendationBundle?.let { b ->
            sb.appendLine("[추천 학습 후보 — 역량 fallback (${b.competency.strategyLabel})]")
            b.competency.items.forEach {
                sb.appendLine("  - id=${it.contentId} / ${it.contentTypeLabel} / ${it.title}")
            }
            sb.appendLine()
            sb.appendLine("[추천 학습 후보 — 영역 fallback (${b.area.strategyLabel})]")
            b.area.items.forEach {
                sb.appendLine("  - id=${it.contentId} / ${it.contentTypeLabel} / ${it.title}")
            }
        }
        sb.appendLine()
        sb.appendLine("위 자료를 바탕으로 시스템 프롬프트의 JSON 형식대로 응답하라.")
        return sb.toString()
    }

    private fun parseAiResponse(text: String): ParsedAi {
        // Claude 응답이 ```json 코드펜스 포함할 가능성 대비
        val cleaned = text.trim()
            .removePrefix("```json").removePrefix("```").removeSuffix("```").trim()
        val map: Map<String, Any?> = objectMapper.readValue(cleaned)
        val commentsRaw = (map["comments"] as? List<*>) ?: emptyList<Any?>()
        val comments = commentsRaw.mapNotNull { c ->
            val m = c as? Map<*, *> ?: return@mapNotNull null
            ParsedComment(
                section = (m["section"] as? String) ?: "역량",
                title = (m["title"] as? String) ?: "",
                content = (m["content"] as? String) ?: "",
                severity = (m["severity"] as? String) ?: "info",
            )
        }.filter { it.title.isNotBlank() && it.content.isNotBlank() }
        val compR = (map["competencyReasons"] as? Map<*, *>)?.entries
            ?.associate { (it.key as? String).orEmpty() to (it.value as? String).orEmpty() }
            ?.filter { it.key.isNotBlank() && it.value.isNotBlank() }
            ?: emptyMap()
        val areaR = (map["areaReasons"] as? Map<*, *>)?.entries
            ?.associate { (it.key as? String).orEmpty() to (it.value as? String).orEmpty() }
            ?.filter { it.key.isNotBlank() && it.value.isNotBlank() }
            ?: emptyMap()
        return ParsedAi(comments, compR, areaR)
    }

    private fun applyReasons(
        bundle: RecommendationBundleDto?,
        competencyReasons: Map<String, String>,
        areaReasons: Map<String, String>,
    ): RecommendationBundleDto? {
        if (bundle == null) return null
        val newCompetencyItems = bundle.competency.items.map {
            val r = competencyReasons[it.contentId]
            if (r.isNullOrBlank()) it else it.copy(reason = r)
        }
        val newAreaItems = bundle.area.items.map {
            val r = areaReasons[it.contentId]
            if (r.isNullOrBlank()) it else it.copy(reason = r)
        }
        return bundle.copy(
            competency = bundle.competency.copy(items = newCompetencyItems),
            area = bundle.area.copy(items = newAreaItems),
        )
    }

    private data class ParsedAi(
        val comments: List<ParsedComment>,
        val competencyReasons: Map<String, String>,
        val areaReasons: Map<String, String>,
    )

    private data class ParsedComment(
        val section: String,
        val title: String,
        val content: String,
        val severity: String,
    )
}
