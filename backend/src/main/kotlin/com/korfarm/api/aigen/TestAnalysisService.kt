package com.korfarm.api.aigen

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.classification.ClassificationService
import com.korfarm.api.common.ApiException
import org.slf4j.LoggerFactory
import org.springframework.core.io.ClassPathResource
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import java.nio.charset.StandardCharsets

/**
 * 시험지 비주얼 에디터의 "AI 시험 정보 분석" 기능. 지문·문항 단위 또는 배치 단위로 Claude 호출.
 *
 * 모델 분기:
 *   - HQ_ADMIN → Opus (claude-opus-4-7), 무과금
 *   - ORG_ADMIN → Sonnet (claude-sonnet-4-6), 자몹 1자몹 (시험지 1건당, charge 단계에서 차감)
 *
 * 호출 단위:
 *   - 단일: analyzePassage / analyzeQuestion (기존 유지)
 *   - 배치: analyzeBatch — 지문 1편 + 문항 N개 묶음 또는 독립 문항 4~5개 묶음 (토큰 절약)
 *
 * 출력 필드 (단일·배치 동일):
 *   - 지문: areaCode·subAreaCode·themeCode·domain·subDomain·theme·rationale
 *   - 문항: areaCode·subAreaCode·themeCode·domain·subDomain·questionType
 *          + competencyVector·intent·explanation·modelAnswer
 *          + choiceExplanations·wrongPattern·choiceWrongVectors
 *
 * 분류 코드는 classification_master 의 코드 안에서만 선택하도록 시스템 프롬프트에 동적 주입.
 */
@Service
class TestAnalysisService(
    private val aiCallHelper: AiCallHelper,
    private val objectMapper: ObjectMapper,
    private val aiGenLogService: AiGenLogService,
    private val classificationService: ClassificationService,
) {
    private val log = LoggerFactory.getLogger(TestAnalysisService::class.java)

    private val passagePromptCache by lazy { loadResource("/ai-prompts/test-analysis-passage.md") }
    private val questionPromptCache by lazy { loadResource("/ai-prompts/test-analysis-question.md") }
    private val batchPromptCache by lazy { loadResource("/ai-prompts/test-analysis-batch.md") }

    private fun loadResource(path: String): String {
        return ClassPathResource(path).inputStream.use {
            it.readBytes().toString(StandardCharsets.UTF_8)
        }
    }

    /**
     * 분류 마스터 카탈로그를 system 블록 텍스트로 직렬화.
     * AI 가 영역·세부영역·주제 코드를 이 표 안에서만 선택하도록 강제.
     * classification_master 가 갱신되면 자동 반영.
     */
    fun buildClassificationCatalog(): String {
        val all = classificationService.listAll()
        val areas = all.filter { it.type == "area" }.sortedBy { it.sortOrder }
        val subAreasByParent = all.filter { it.type == "sub_area" }.groupBy { it.parentCode ?: "" }
        val themesByParent = all.filter { it.type == "theme" }.groupBy { it.parentCode ?: "" }
        return buildString {
            appendLine("# 분류 마스터 카탈로그")
            appendLine()
            appendLine("아래 코드 안에서만 선택할 것. 코드를 새로 만들거나 변형 금지.")
            appendLine()
            for (area in areas) {
                appendLine("## ${area.code} — ${area.labelKo} (영역)")
                val themesAtArea = themesByParent[area.code] ?: emptyList()
                if (themesAtArea.isNotEmpty()) {
                    appendLine("- 영역 직속 주제:")
                    themesAtArea.sortedBy { it.sortOrder }.forEach {
                        appendLine("  - `${it.code}` — ${it.labelKo}")
                    }
                }
                val subAreas = subAreasByParent[area.code] ?: emptyList()
                for (sub in subAreas.sortedBy { it.sortOrder }) {
                    appendLine("- 세부영역 `${sub.code}` — ${sub.labelKo}")
                    val themes = themesByParent[sub.code] ?: emptyList()
                    themes.sortedBy { it.sortOrder }.forEach {
                        appendLine("  - 주제 `${it.code}` — ${it.labelKo}")
                    }
                }
                appendLine()
            }
        }
    }

    fun pickModel(isHqAdmin: Boolean): String =
        if (isHqAdmin) AiCallHelper.MODEL_OPUS else AiCallHelper.MODEL_SONNET

    /**
     * 지문 1편 분석. 결과 Map (areaCode·subAreaCode·themeCode·domain·subDomain·theme·rationale).
     * 모델 분기 + JSON 파싱 + 1회 재시도.
     */
    fun analyzePassage(
        userId: String,
        testId: String,
        isHqAdmin: Boolean,
        passage: Map<String, Any?>,
        mode: String,
    ): Map<String, Any?> {
        val model = pickModel(isHqAdmin)
        val systemBlocks = listOf(
            aiCallHelper.systemBlock(passagePromptCache, ephemeralCache = true),
            aiCallHelper.systemBlock(buildClassificationCatalog(), ephemeralCache = true),
        )
        val userText = buildString {
            append("[채움 모드] ").append(mode).append("\n\n")
            append("[기존 분류 값]\n")
            append("areaCode: ").append(passage["areaCode"] ?: "(비어 있음)").append("\n")
            append("subAreaCode: ").append(passage["subAreaCode"] ?: "(비어 있음)").append("\n")
            append("themeCode: ").append(passage["themeCode"] ?: "(비어 있음)").append("\n")
            append("domain: ").append(passage["domain"] ?: "(비어 있음)").append("\n")
            append("subDomain: ").append(passage["subDomain"] ?: "(비어 있음)").append("\n")
            append("theme: ").append(passage["theme"] ?: "(비어 있음)").append("\n\n")
            append("[지문 본문]\n")
            append((passage["text"] as? String) ?: "")
        }
        return callAndParse(model, systemBlocks, userText, userId, testId, "test-analysis-passage")
    }

    /**
     * 단일 문항 분석. 결과 Map (모든 필드).
     */
    fun analyzeQuestion(
        userId: String,
        testId: String,
        isHqAdmin: Boolean,
        passageText: String?,
        question: Map<String, Any?>,
        mode: String,
    ): Map<String, Any?> {
        val model = pickModel(isHqAdmin)
        val systemBlocks = listOf(
            aiCallHelper.systemBlock(questionPromptCache, ephemeralCache = true),
            aiCallHelper.systemBlock(buildClassificationCatalog(), ephemeralCache = true),
        )
        val userText = buildString {
            append("[채움 모드] ").append(mode).append("\n\n")
            if (!passageText.isNullOrBlank()) {
                append("[연관 지문]\n").append(passageText).append("\n\n")
            }
            append("[문항]\n")
            append(objectMapper.writeValueAsString(question.filterKeys { it in QUESTION_INPUT_KEYS }))
            append("\n\n[기존 분석 값]\n")
            append(objectMapper.writeValueAsString(question.filterKeys { it in QUESTION_EXISTING_KEYS }))
        }
        return callAndParse(model, systemBlocks, userText, userId, testId, "test-analysis-question")
    }

    /**
     * 배치 분석. 지문 1편 + 문항 N개 묶음(passage_block) 또는 독립 문항 4~5개(questions_solo) 를 한 호출로 처리.
     *
     * 응답:
     *   { "passage": { ... } | null, "questions": [ { id, ... }, ... ] }
     *
     * 호출 비용: 묶음당 1회. 예: 48문항 시험지 → 6~10회 (1/5~1/8).
     */
    fun analyzeBatch(
        userId: String,
        testId: String,
        isHqAdmin: Boolean,
        scope: String,                   // "passage_block" | "questions_solo"
        passage: Map<String, Any?>?,
        questions: List<Map<String, Any?>>,
        mode: String,
    ): Map<String, Any?> {
        if (scope != "passage_block" && scope != "questions_solo") {
            throw ApiException("INVALID_SCOPE", "scope 는 passage_block 또는 questions_solo", HttpStatus.BAD_REQUEST)
        }
        if (questions.isEmpty()) {
            throw ApiException("EMPTY_BATCH", "분석할 문항이 비어 있습니다", HttpStatus.BAD_REQUEST)
        }
        val model = pickModel(isHqAdmin)
        val systemBlocks = listOf(
            aiCallHelper.systemBlock(batchPromptCache, ephemeralCache = true),
            aiCallHelper.systemBlock(passagePromptCache, ephemeralCache = true),
            aiCallHelper.systemBlock(questionPromptCache, ephemeralCache = true),
            aiCallHelper.systemBlock(buildClassificationCatalog(), ephemeralCache = true),
        )
        val userText = buildString {
            append("[채움 모드] ").append(mode).append("\n")
            append("[scope] ").append(scope).append("\n\n")
            if (scope == "passage_block" && passage != null) {
                append("[지문]\n")
                val passageView = mapOf(
                    "id" to passage["id"],
                    "text" to passage["text"],
                    "genre" to passage["genre"],
                    "level" to passage["level"],
                    "existing" to passage.filterKeys { it in PASSAGE_EXISTING_KEYS },
                )
                append(objectMapper.writeValueAsString(passageView))
                append("\n\n")
            }
            append("[문항 목록 — 총 ").append(questions.size).append("개]\n")
            val questionViews = questions.map { q ->
                mapOf(
                    "input" to q.filterKeys { it in QUESTION_INPUT_KEYS },
                    "existing" to q.filterKeys { it in QUESTION_EXISTING_KEYS },
                )
            }
            append(objectMapper.writeValueAsString(questionViews))
        }
        // 토큰 한도 — 묶음 크기에 비례해 늘림
        val maxTokens = (4096 + 1024 * questions.size).coerceAtMost(16384)
        return callAndParseBatch(model, systemBlocks, userText, userId, testId, maxTokens, expectedQuestionIds = questions.mapNotNull { it["id"] as? String })
    }

    private fun callAndParse(
        model: String,
        systemBlocks: List<Map<String, Any?>>,
        userText: String,
        userId: String,
        testId: String,
        kind: String,
    ): Map<String, Any?> {
        var lastErr: Exception? = null
        for (attempt in 0..1) {
            try {
                val result = aiCallHelper.call(model, systemBlocks, userText, maxTokens = 4096)
                aiGenLogService.log(
                    userId = userId, testId = testId, kind = kind, model = model,
                    inputTokens = result.inputTokens, outputTokens = result.outputTokens,
                    durationMs = result.durationMs, status = "success", retryCount = attempt,
                )
                val cleaned = extractJson(result.text)
                @Suppress("UNCHECKED_CAST")
                return objectMapper.readValue(cleaned, object : TypeReference<Map<String, Any?>>() {})
            } catch (e: Exception) {
                lastErr = e
                log.warn("AI 분석 실패 (attempt={}, kind={}): {}", attempt, kind, e.message)
            }
        }
        aiGenLogService.log(
            userId = userId, testId = testId, kind = kind, model = model,
            status = "error", errorMessage = lastErr?.message?.take(500), retryCount = 1,
        )
        throw ApiException("AI_ANALYSIS_FAILED", "AI 분석에 실패했습니다: ${lastErr?.message}", HttpStatus.UNPROCESSABLE_ENTITY)
    }

    /**
     * 배치 분석 호출·파싱. 응답 questions 배열에 expected id 가 모두 포함되었는지 검증.
     * 누락 발생 시 1회 재시도. 두 번째도 실패하면 에러.
     */
    private fun callAndParseBatch(
        model: String,
        systemBlocks: List<Map<String, Any?>>,
        userText: String,
        userId: String,
        testId: String,
        maxTokens: Int,
        expectedQuestionIds: List<String>,
    ): Map<String, Any?> {
        var lastErr: Exception? = null
        for (attempt in 0..1) {
            try {
                val result = aiCallHelper.call(model, systemBlocks, userText, maxTokens = maxTokens)
                val cleaned = extractJson(result.text)
                @Suppress("UNCHECKED_CAST")
                val parsed = objectMapper.readValue(cleaned, object : TypeReference<Map<String, Any?>>() {})
                // 검증 — questions 배열 + expected id 모두 포함
                @Suppress("UNCHECKED_CAST")
                val qs = (parsed["questions"] as? List<Map<String, Any?>>) ?: emptyList()
                val returnedIds = qs.mapNotNull { it["id"] as? String }.toSet()
                val missing = expectedQuestionIds.toSet() - returnedIds
                if (missing.isNotEmpty()) {
                    throw IllegalStateException("배치 응답에 누락된 문항 id: $missing")
                }
                aiGenLogService.log(
                    userId = userId, testId = testId, kind = "test-analysis-batch", model = model,
                    inputTokens = result.inputTokens, outputTokens = result.outputTokens,
                    durationMs = result.durationMs, status = "success", retryCount = attempt,
                )
                return parsed
            } catch (e: Exception) {
                lastErr = e
                log.warn("배치 분석 실패 (attempt={}): {}", attempt, e.message)
            }
        }
        aiGenLogService.log(
            userId = userId, testId = testId, kind = "test-analysis-batch", model = model,
            status = "error", errorMessage = lastErr?.message?.take(500), retryCount = 1,
        )
        throw ApiException("AI_BATCH_FAILED", "AI 배치 분석에 실패했습니다: ${lastErr?.message}", HttpStatus.UNPROCESSABLE_ENTITY)
    }

    /** Claude 응답이 마크다운 펜스 포함 시 JSON 본문만 추출. */
    private fun extractJson(raw: String): String {
        val trimmed = raw.trim()
        val fenceMatch = Regex("```(?:json)?\\s*(\\{[\\s\\S]*?\\})\\s*```").find(trimmed)
        if (fenceMatch != null) return fenceMatch.groupValues[1]
        val firstBrace = trimmed.indexOf('{')
        val lastBrace = trimmed.lastIndexOf('}')
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            return trimmed.substring(firstBrace, lastBrace + 1)
        }
        return trimmed
    }

    /**
     * 분석 결과를 question 객체에 merge. mode="empty" 이면 기존 값 보존.
     * mode="full" 이면 분석 값으로 모든 분석 필드 덮어쓰기.
     */
    fun mergeQuestion(question: MutableMap<String, Any?>, analysis: Map<String, Any?>, mode: String) {
        val isEmpty: (Any?) -> Boolean = { v ->
            v == null || (v is String && v.isBlank()) || (v is Map<*, *> && v.isEmpty()) || (v is List<*> && v.isEmpty())
        }
        QUESTION_ANALYSIS_FIELDS.forEach { key ->
            val incoming = analysis[key] ?: return@forEach
            val existing = question[key]
            if (mode == "full" || isEmpty(existing)) {
                question[key] = incoming
            }
        }
        // choices 안 wrongVector merge
        @Suppress("UNCHECKED_CAST")
        val choices = question["choices"] as? MutableList<MutableMap<String, Any?>> ?: return
        @Suppress("UNCHECKED_CAST")
        val choiceWrongVectors = analysis["choiceWrongVectors"] as? Map<String, Map<String, Any?>> ?: return
        choices.forEach { ch ->
            val id = ch["id"] as? String ?: return@forEach
            val vec = choiceWrongVectors[id]
            if (vec != null && (mode == "full" || isEmpty(ch["wrongVector"]))) {
                ch["wrongVector"] = vec
            }
        }
    }

    /** 지문 분석 결과 merge. */
    fun mergePassage(passage: MutableMap<String, Any?>, analysis: Map<String, Any?>, mode: String) {
        val isEmpty: (Any?) -> Boolean = { v -> v == null || (v is String && v.isBlank()) }
        PASSAGE_ANALYSIS_FIELDS.forEach { key ->
            val incoming = analysis[key] ?: return@forEach
            val existing = passage[key]
            if (mode == "full" || isEmpty(existing)) {
                passage[key] = incoming
            }
        }
    }

    // ─── 분류 자동 INSERT (비주얼 에디터의 ClassificationPicker 와 같은 테이블) ──
    // AI 가 반환한 areaCode·subAreaCode·themeCode 를 기존 사용자 입력과 union 으로 저장.
    // 사용자 직접 입력한 분류는 보존되며 분석 결과만 추가됨.

    /** classification_master 에 존재하는 코드만 추리기. AI 가 잘못 만든 코드 무시. */
    private fun filterValidCodes(codes: List<String>): List<String> {
        if (codes.isEmpty()) return emptyList()
        val all = classificationService.listAll().map { it.code }.toSet()
        return codes.distinct().filter { it in all }
    }

    /** 분석 결과에서 분류 코드 3개 추출. null 제거. */
    private fun extractCodes(analysis: Map<String, Any?>): List<String> = listOfNotNull(
        (analysis["areaCode"] as? String)?.takeIf { it.isNotBlank() },
        (analysis["subAreaCode"] as? String)?.takeIf { it.isNotBlank() },
        (analysis["themeCode"] as? String)?.takeIf { it.isNotBlank() },
    )

    /** 지문 분석 → content_classifications INSERT (union). */
    fun applyClassificationsForPassage(passageId: String, analysis: Map<String, Any?>) {
        val newCodes = filterValidCodes(extractCodes(analysis))
        if (newCodes.isEmpty()) return
        val existing = classificationService.getContentClassifications(passageId)
        val existingCodes = existing.map { it.code }.toSet()
        val items = existing.map {
            com.korfarm.api.classification.ClassificationItemRequest(it.code, it.isPrimary)
        } + newCodes.filter { it !in existingCodes }.map {
            com.korfarm.api.classification.ClassificationItemRequest(it, false)
        }
        classificationService.replaceContentClassifications(passageId, items)
    }

    /** 문항 분석 → test_question_classifications INSERT (union). */
    fun applyClassificationsForQuestion(questionId: String, analysis: Map<String, Any?>) {
        val newCodes = filterValidCodes(extractCodes(analysis))
        if (newCodes.isEmpty()) return
        val existing = classificationService.getTestQuestionClassifications(questionId)
        val existingCodes = existing.map { it.code }.toSet()
        val items = existing.map {
            com.korfarm.api.classification.ClassificationItemRequest(it.code, it.isPrimary)
        } + newCodes.filter { it !in existingCodes }.map {
            com.korfarm.api.classification.ClassificationItemRequest(it, false)
        }
        classificationService.replaceTestQuestionClassifications(questionId, items)
    }

    /** 시험지 전체 분류 합산 → content_classifications INSERT (contentId=testId, union). */
    fun applyClassificationsForTestPaper(
        testId: String,
        passageAnalyses: List<Map<String, Any?>>,
        questionAnalyses: List<Map<String, Any?>>,
    ) {
        val allCodes = (passageAnalyses + questionAnalyses)
            .flatMap { extractCodes(it) }
            .distinct()
        val newCodes = filterValidCodes(allCodes)
        if (newCodes.isEmpty()) return
        val existing = classificationService.getContentClassifications(testId)
        val existingCodes = existing.map { it.code }.toSet()
        val items = existing.map {
            com.korfarm.api.classification.ClassificationItemRequest(it.code, it.isPrimary)
        } + newCodes.filter { it !in existingCodes }.map {
            com.korfarm.api.classification.ClassificationItemRequest(it, false)
        }
        classificationService.replaceContentClassifications(testId, items)
    }

    companion object {
        // 분석 입력으로 쓰는 question 필드
        private val QUESTION_INPUT_KEYS = setOf(
            "id", "number", "type", "stem", "boxContent", "conditionContent",
            "choices", "answerId", "modelAnswer", "essayKeywords", "essayRubric",
        )
        // 분석 시 prompt 에 포함할 기존 분석 값 (mode=empty 일 때 유지 판단용)
        private val QUESTION_EXISTING_KEYS = setOf(
            "areaCode", "subAreaCode", "themeCode",
            "domain", "subDomain", "questionType", "competencyVector",
            "intent", "explanation", "choiceExplanations", "wrongPattern",
        )
        // 지문 기존 분류 값
        private val PASSAGE_EXISTING_KEYS = setOf(
            "areaCode", "subAreaCode", "themeCode",
            "domain", "subDomain", "theme",
        )
        // merge 대상 분석 필드 (analysis JSON 의 키)
        private val QUESTION_ANALYSIS_FIELDS = listOf(
            "areaCode", "subAreaCode", "themeCode",
            "domain", "subDomain", "questionType", "competencyVector",
            "intent", "explanation", "modelAnswer", "choiceExplanations", "wrongPattern",
        )
        private val PASSAGE_ANALYSIS_FIELDS = listOf(
            "areaCode", "subAreaCode", "themeCode",
            "domain", "subDomain", "theme",
        )
    }
}
