package com.korfarm.api.aigen

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.stereotype.Service

/**
 * 학생 페르소나 검증 — Sonnet 4.6 사용 (검증은 Opus까지 필요 없고 비용 1/5).
 * 객관식 지침서 §10 체크리스트 기반.
 */
@Service
class StudentPersonaReviewer(
    private val helper: AiCallHelper,
    private val promptBuilder: PromptBuilder,
    private val objectMapper: ObjectMapper,
) {
    fun review(question: Map<String, Any?>): StudentPersonaReviewResult {
        if (!helper.isConfigured()) {
            return StudentPersonaReviewResult(passed = true, score = 100, issues = emptyList(), suggestedFixes = emptyList())
        }
        val systemBlocks = promptBuilder.studentPersonaSystemBlocks(helper)
        val userPrompt = buildString {
            appendLine("아래 문항을 객관식 지침서 §10 절대 체크리스트로 검토하고 JSON 으로 평가하세요.")
            appendLine()
            appendLine("```json")
            appendLine(objectMapper.writeValueAsString(question))
            appendLine("```")
            appendLine()
            appendLine("응답은 다음 형식의 JSON 한 객체만:")
            appendLine("""{"passed": <bool>, "score": <0-100>, "issues": [...], "suggestedFixes": [...]}""")
        }

        val res = helper.call(AiCallHelper.MODEL_SONNET, systemBlocks, userPrompt, maxTokens = 1024)
        val parsed = parseJsonObject(res.text)
        val passed = (parsed["passed"] as? Boolean) ?: false
        val score = (parsed["score"] as? Number)?.toInt() ?: 0
        @Suppress("UNCHECKED_CAST")
        val issues = (parsed["issues"] as? List<Any?>)?.mapNotNull { it as? String } ?: emptyList()
        @Suppress("UNCHECKED_CAST")
        val fixes = (parsed["suggestedFixes"] as? List<Any?>)?.mapNotNull { it as? String } ?: emptyList()
        return StudentPersonaReviewResult(passed = passed, score = score, issues = issues, suggestedFixes = fixes)
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
}
