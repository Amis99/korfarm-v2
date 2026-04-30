package com.korfarm.api.aigen

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.stereotype.Service

/**
 * 문항 생성 — Opus 4.7.
 * 학생 페르소나 검증 결과 통과 못하면 자동 재시도 (최대 2회).
 */
@Service
class QuestionGenerator(
    private val helper: AiCallHelper,
    private val promptBuilder: PromptBuilder,
    private val grammarRagService: GrammarRagService,
    private val reviewer: StudentPersonaReviewer,
    private val objectMapper: ObjectMapper,
) {
    fun generate(req: QuestionGenRequest): GenWithReview {
        // 문법 영역이면 자료 첨부 (user 메시지로 — 시스템 정적 유지)
        val effectiveArea = req.area ?: "READ"
        val refs = if (effectiveArea == "GRAM" && !req.grammarTopic.isNullOrBlank())
            grammarRagService.fetchByTopic(req.grammarTopic, limit = 2)
        else emptyList()

        val isEssay = req.type == "ESSAY" || req.type == "서술형"
        // 시스템 프롬프트는 100% 정적 (캐시 hit 보장)
        val systemBlocks = if (isEssay)
            promptBuilder.essayQuestionSystemBlocks(helper)
        else
            promptBuilder.objectiveQuestionSystemBlocks(helper)
        val refText = promptBuilder.buildReferenceText(refs)

        // 최대 1회 초기 + 1회 재시도 = 총 2 시도 (속도 우선; 재시도 더 필요하면 사용자가 모달에서 다시 누름)
        val maxAttempts = 2
        var lastResult: Map<String, Any?> = emptyMap()
        var lastReview: StudentPersonaReviewResult? = null
        var totalDuration = 0
        var totalIn = 0; var totalOut = 0

        for (attempt in 1..maxAttempts) {
            val userPrompt = buildUserPrompt(req, isEssay, prevIssues = lastReview?.issues ?: emptyList(), prevSuggested = lastReview?.suggestedFixes ?: emptyList()) + refText
            val r = helper.call(AiCallHelper.MODEL_OPUS, systemBlocks, userPrompt, maxTokens = 2048)
            totalDuration += r.durationMs
            r.inputTokens?.let { totalIn += it }
            r.outputTokens?.let { totalOut += it }
            val parsed = parseJsonObject(r.text)
            // 비주얼 에디터 스키마로 정규화
            lastResult = normalizeQuestion(parsed, req)
            // 검증
            lastReview = reviewer.review(lastResult)
            if (lastReview.passed) {
                return GenWithReview(
                    question = lastResult,
                    review = lastReview,
                    retryCount = attempt - 1,
                    durationMs = totalDuration,
                    inputTokens = totalIn,
                    outputTokens = totalOut,
                )
            }
        }
        // 3 시도 모두 실패 — 마지막 결과 + 검증 issues 같이 반환
        return GenWithReview(
            question = lastResult,
            review = lastReview ?: StudentPersonaReviewResult(false, 0, emptyList(), emptyList()),
            retryCount = maxAttempts - 1,
            durationMs = totalDuration,
            inputTokens = totalIn,
            outputTokens = totalOut,
        )
    }

    private fun buildUserPrompt(
        req: QuestionGenRequest,
        isEssay: Boolean,
        prevIssues: List<String>,
        prevSuggested: List<String>,
    ): String {
        val sb = StringBuilder()
        sb.appendLine("아래 옵션과 지문을 바탕으로 시험 문항 1개를 출제하세요.")
        sb.appendLine()
        sb.appendLine("## 옵션")
        sb.appendLine("- 영역: ${req.area ?: "(미지정)"}")
        sb.appendLine("- 세부영역: ${req.subArea ?: "-"}")
        sb.appendLine("- 학년·레벨: ${req.levelId ?: "-"}")
        sb.appendLine("- 문제 유형(questionType): ${req.questionType ?: "-"}")
        if (!isEssay) {
            sb.appendLine("- <보기> 양식: ${req.boxType ?: "없음"}")
        } else {
            sb.appendLine("- 조건 사용: ${req.needsCondition}")
            if (!req.conditionText.isNullOrBlank()) sb.appendLine("- 조건 본문: ${req.conditionText}")
        }
        if (!req.attachment.isNullOrBlank()) {
            sb.appendLine("- 첨부 자료(해설/모범답안 등):")
            sb.appendLine(req.attachment)
        }
        if (!req.stemHint.isNullOrBlank()) sb.appendLine("- 발문 가이드: ${req.stemHint}")
        sb.appendLine()
        sb.appendLine("## 지문")
        sb.appendLine(req.passageText.ifBlank { "(지문 없음 — 단독 문항)" })
        sb.appendLine()
        if (prevIssues.isNotEmpty()) {
            sb.appendLine("## 이전 시도의 검수 이슈 (반드시 수정)")
            prevIssues.forEach { sb.appendLine("- $it") }
            if (prevSuggested.isNotEmpty()) {
                sb.appendLine("## 검수자 수정 제안")
                prevSuggested.forEach { sb.appendLine("- $it") }
            }
            sb.appendLine()
        }
        sb.appendLine("## 응답 형식 (JSON 한 객체)")
        sb.appendLine("객관식이면 다음 형식:")
        sb.appendLine("""{
  "type": "MULTI_CHOICE",
  "stem": "...",
  "boxContent": "(선택) <보기> 본문 — 보기 양식이 있을 때만",
  "conditionContent": "(선택) <조건> 본문 — 거의 사용 X (서술형 전용)",
  "choices": [
    {"id": "1", "text": "...", "wrongPattern": "MIXING|NEGATION|...|null"},
    {"id": "2", "text": "...", "wrongPattern": null},
    {"id": "3", "text": "...", "wrongPattern": null},
    {"id": "4", "text": "...", "wrongPattern": null},
    {"id": "5", "text": "...", "wrongPattern": null}
  ],
  "answerId": "3",
  "choiceExplanations": {"1": "...", "2": "...", "3": "(정답) ...", "4": "...", "5": "..."},
  "explanation": "출제 의도·해설",
  "points": 5,
  "questionType": "${req.questionType ?: ""}",
  "competencyVector": {"문장 독해력": 0.6, "구조 독해력": 0.4}
}""")
        sb.appendLine()
        sb.appendLine("서술형이면 다음 형식:")
        sb.appendLine("""{
  "type": "ESSAY",
  "stem": "...",
  "conditionContent": "(선택) 조건 본문",
  "modelAnswer": "모범 답안",
  "essayKeywords": [{"keyword": "...", "weight": 5}, ...],
  "essayRubric": "채점 기준 — 만점/부분점수/0점",
  "explanation": "출제 의도·해설",
  "points": 10,
  "questionType": "${req.questionType ?: ""}",
  "competencyVector": {"논리 사고력": 0.5}
}""")
        sb.appendLine()
        sb.appendLine("응답은 JSON 한 객체만, 다른 텍스트(설명·인사·``` 펜스 등) 금지.")
        return sb.toString()
    }

    /** AI 응답을 비주얼 에디터 스키마로 안전하게 정규화. 누락 필드 채움. */
    private fun normalizeQuestion(parsed: Map<String, Any?>, req: QuestionGenRequest): Map<String, Any?> {
        val map = parsed.toMutableMap()
        // 필수 필드 default
        map.putIfAbsent("type", req.type)
        map.putIfAbsent("stem", "")
        map.putIfAbsent("explanation", "")
        map.putIfAbsent("points", 5)
        map.putIfAbsent("questionType", req.questionType)
        map.putIfAbsent("competencyVector", emptyMap<String, Double>())
        if ((map["type"] as? String) == "MULTI_CHOICE") {
            // choices 정규화 — 5개 보장, 각 choice 에 id/text/wrongPattern
            @Suppress("UNCHECKED_CAST")
            val choices = (map["choices"] as? List<Map<String, Any?>>) ?: emptyList()
            val normalized = (1..5).map { i ->
                val c = choices.getOrNull(i - 1) ?: emptyMap()
                mapOf(
                    "id" to ((c["id"] as? String) ?: i.toString()),
                    "text" to ((c["text"] as? String) ?: ""),
                    "wrongPattern" to (c["wrongPattern"] as? String),
                    "wrongVector" to (c["wrongVector"] ?: emptyMap<String, Double>()),
                )
            }
            map["choices"] = normalized
            map.putIfAbsent("answerId", "1")
            map.putIfAbsent("choiceExplanations", emptyMap<String, String>())
            map.putIfAbsent("boxContent", "")
            map.putIfAbsent("conditionContent", "")
        } else {
            // 서술형
            map.putIfAbsent("modelAnswer", "")
            map.putIfAbsent("essayKeywords", emptyList<Map<String, Any?>>())
            map.putIfAbsent("essayRubric", "")
            map.putIfAbsent("conditionContent", req.conditionText ?: "")
            map.putIfAbsent("choices", emptyList<Map<String, Any?>>())
            map.putIfAbsent("answerId", "")
        }
        // passageId 자동
        if (!req.passageId.isNullOrBlank()) map["passageId"] = req.passageId
        return map
    }

    private fun parseJsonObject(raw: String): Map<String, Any?> {
        val s = raw.trim().replace(Regex("^```(?:json)?\\s*"), "").replace(Regex("\\s*```$"), "")
        val first = s.indexOf('{')
        val last = s.lastIndexOf('}')
        if (first < 0 || last < 0) return emptyMap()
        return try {
            objectMapper.readValue(s.substring(first, last + 1), object : TypeReference<Map<String, Any?>>() {})
        } catch (_: Exception) { emptyMap() }
    }

    data class GenWithReview(
        val question: Map<String, Any?>,
        val review: StudentPersonaReviewResult,
        val retryCount: Int,
        val durationMs: Int,
        val inputTokens: Int,
        val outputTokens: Int,
    )
}
