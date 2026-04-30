package com.korfarm.api.aigen

import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.ApiException
import org.slf4j.LoggerFactory
import org.springframework.core.io.ClassPathResource
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service

/**
 * 내용 숙지 페이지 → 출제 포인트 추출 → 4유형 문제 생성 (2단계 파이프라인).
 *
 * 1단계: Sonnet 4.6 — 출제 포인트 추출 (페이지 마크다운만 보고 검증 가능한 핵심 포인트 리스트)
 * 2단계: Opus 4.7 — 출제 포인트 + 객관식 지침 + 서술형 지침 + 4유형 가이드 → 문제 생성
 *
 * 페이지별 최대 30문제 제한.
 */
@Service
class StudyQuestionGenerator(
    private val aiCall: AiCallHelper,
    private val logService: AiGenLogService,
    private val objectMapper: ObjectMapper,
) {
    private val logger = LoggerFactory.getLogger(StudyQuestionGenerator::class.java)

    companion object {
        const val MAX_QUESTIONS_PER_PAGE = 30
    }

    // 시스템 프롬프트 캐시
    private val checkpointsExtractPrompt: String by lazy { loadResource("/ai-prompts/study-checkpoints-extract.md") }
    private val studyQuestionGenPrompt: String by lazy { loadResource("/ai-prompts/study-question-gen.md") }
    private val mcqGuidelines: String by lazy { loadResource("/ai-prompts/objective-question-guidelines.md") }
    private val essayGuidelines: String by lazy { loadResource("/ai-prompts/essay-question-guidelines.md") }

    private fun loadResource(path: String): String {
        return try {
            ClassPathResource(path.removePrefix("/")).inputStream.bufferedReader(Charsets.UTF_8).use { it.readText() }
        } catch (ex: Exception) {
            logger.warn("리소스 로드 실패: {}", path, ex)
            ""
        }
    }

    data class Checkpoint(
        val id: String,
        val text: String,
        val kind: String,    // FACT|RELATION|INTENT|STRUCTURE|INFER
        val evidence: String?,
    )

    data class GenRequest(
        val pageMarkdown: String,
        val area: String?,         // LIT/READ/GRAM/...
        val subArea: String?,
        val levelId: String?,
        val mcqCount: Int,
        val oxCount: Int,
        val shortCount: Int,
        val essayCount: Int,
        val existingCheckpoints: List<Checkpoint>? = null,  // 이미 추출돼 있으면 재사용
    )

    data class GenResult(
        val checkpoints: List<Checkpoint>,
        val questionsJson: String,         // {"questions": [...]} 원문 (StudyContentService 가 그대로 파싱)
        val checkpointTokens: Int?,
        val questionTokens: Int?,
        val totalDurationMs: Int,
    )

    /** 1단계: 출제 포인트 추출 */
    fun extractCheckpoints(pageMarkdown: String, userId: String): Pair<List<Checkpoint>, AiCallHelper.CallResult> {
        val started = System.currentTimeMillis()
        val result = aiCall.call(
            model = AiCallHelper.MODEL_SONNET,
            systemBlocks = listOf(aiCall.systemBlock(checkpointsExtractPrompt, ephemeralCache = true)),
            userText = "다음 학습 자료에서 출제 포인트를 추출하세요.\n\n[자료]\n$pageMarkdown",
            maxTokens = 4096,
        )
        logService.log(
            userId = userId,
            testId = null,
            kind = "study-checkpoints",
            model = AiCallHelper.MODEL_SONNET,
            inputTokens = result.inputTokens,
            outputTokens = result.outputTokens,
            durationMs = result.durationMs,
            status = "success",
        )
        val cps = parseCheckpoints(result.text)
        logger.info("checkpoints 추출 완료: {}개 ({}ms)", cps.size, System.currentTimeMillis() - started)
        return cps to result
    }

    /** 2단계: 4유형 문제 생성 */
    fun generateQuestions(req: GenRequest, checkpoints: List<Checkpoint>, userId: String): Pair<String, AiCallHelper.CallResult> {
        val total = req.mcqCount + req.oxCount + req.shortCount + req.essayCount
        if (total <= 0) {
            throw ApiException("INVALID_COUNT", "출제할 문제 수가 0입니다", HttpStatus.BAD_REQUEST)
        }
        if (total > MAX_QUESTIONS_PER_PAGE) {
            throw ApiException(
                "TOO_MANY_QUESTIONS",
                "페이지당 최대 ${MAX_QUESTIONS_PER_PAGE}문제까지 생성 가능합니다 (요청: $total)",
                HttpStatus.BAD_REQUEST
            )
        }

        // 시스템 프롬프트 = 4유형 가이드 + 객관식 지침 + 서술형 지침 (캐시)
        val systemBlocks = listOf(
            aiCall.systemBlock(studyQuestionGenPrompt, ephemeralCache = true),
            aiCall.systemBlock("# 객관식 문제 생성 지침\n\n$mcqGuidelines", ephemeralCache = true),
            aiCall.systemBlock("# 서술형 문제 생성 지침\n\n$essayGuidelines", ephemeralCache = true),
        )

        val checkpointsBlock = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(
            mapOf("checkpoints" to checkpoints.map {
                mapOf("id" to it.id, "text" to it.text, "kind" to it.kind, "evidence" to it.evidence)
            })
        )

        val userText = buildString {
            appendLine("# 출제 요청")
            appendLine()
            appendLine("## 메타")
            appendLine("- 영역: ${req.area ?: "(미설정)"}")
            appendLine("- 세부영역: ${req.subArea ?: "(미설정)"}")
            appendLine("- 학년/레벨: ${req.levelId ?: "(미설정)"}")
            appendLine()
            appendLine("## 유형별 출제 개수 (합계 $total, 최대 $MAX_QUESTIONS_PER_PAGE)")
            appendLine("- MULTI_CHOICE: ${req.mcqCount}")
            appendLine("- OX: ${req.oxCount}")
            appendLine("- SHORT_ANSWER: ${req.shortCount}")
            appendLine("- ESSAY: ${req.essayCount}")
            appendLine()
            appendLine("## 출제 포인트 (${checkpoints.size}개) — 모두 커버 필수")
            appendLine(checkpointsBlock)
            appendLine()
            appendLine("## 학습 자료 본문")
            appendLine(req.pageMarkdown)
            appendLine()
            appendLine("위 자료·출제 포인트만 근거로 정확히 ${req.mcqCount + req.oxCount + req.shortCount + req.essayCount}문제 생성. JSON 만 출력.")
        }

        val result = aiCall.callMultimodal(
            model = AiCallHelper.MODEL_OPUS,
            systemBlocks = systemBlocks,
            userContent = listOf(aiCall.textBlock(userText)),
            maxTokens = 8192,
        )
        logService.log(
            userId = userId,
            testId = null,
            kind = "study-questions",
            model = AiCallHelper.MODEL_OPUS,
            inputTokens = result.inputTokens,
            outputTokens = result.outputTokens,
            durationMs = result.durationMs,
            status = "success",
        )
        return result.text to result
    }

    /** 1+2단계 통합 호출 */
    fun generate(req: GenRequest, userId: String): GenResult {
        val started = System.currentTimeMillis()
        val (checkpoints, cpResult) = if (req.existingCheckpoints != null && req.existingCheckpoints.isNotEmpty()) {
            req.existingCheckpoints to AiCallHelper.CallResult("", 0, 0, 0)
        } else {
            extractCheckpoints(req.pageMarkdown, userId)
        }
        if (checkpoints.isEmpty()) {
            throw ApiException("NO_CHECKPOINTS", "출제 포인트를 추출하지 못했습니다", HttpStatus.UNPROCESSABLE_ENTITY)
        }
        val (questionsJson, qResult) = generateQuestions(req, checkpoints, userId)
        return GenResult(
            checkpoints = checkpoints,
            questionsJson = questionsJson,
            checkpointTokens = (cpResult.inputTokens ?: 0) + (cpResult.outputTokens ?: 0),
            questionTokens = (qResult.inputTokens ?: 0) + (qResult.outputTokens ?: 0),
            totalDurationMs = (System.currentTimeMillis() - started).toInt(),
        )
    }

    private fun parseCheckpoints(rawText: String): List<Checkpoint> {
        val cleaned = rawText.trim()
            .removePrefix("```json").removePrefix("```")
            .removeSuffix("```")
            .trim()
        return try {
            @Suppress("UNCHECKED_CAST")
            val obj = objectMapper.readValue(cleaned, Map::class.java) as Map<String, Any?>
            val list = obj["checkpoints"] as? List<*> ?: return emptyList()
            list.mapIndexedNotNull { i, item ->
                val m = item as? Map<*, *> ?: return@mapIndexedNotNull null
                Checkpoint(
                    id = (m["id"] as? String) ?: "cp${i + 1}",
                    text = (m["text"] as? String) ?: return@mapIndexedNotNull null,
                    kind = (m["kind"] as? String) ?: "FACT",
                    evidence = m["evidence"] as? String,
                )
            }
        } catch (ex: Exception) {
            logger.warn("checkpoints JSON 파싱 실패. raw 200자: {}", cleaned.take(200))
            emptyList()
        }
    }
}
