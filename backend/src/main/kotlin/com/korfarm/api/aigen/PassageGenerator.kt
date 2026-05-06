package com.korfarm.api.aigen

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.corpus.LearningCorpusService
import org.springframework.stereotype.Service

@Service
class PassageGenerator(
    private val helper: AiCallHelper,
    private val promptBuilder: PromptBuilder,
    private val grammarRagService: GrammarRagService,
    private val corpusService: LearningCorpusService,
    private val objectMapper: ObjectMapper,
) {
    fun generate(req: PassageGenRequest): PassageGenResponse {
        val effectiveArea = req.area ?: "READ"
        // 문법 영역이면 grammar_corpus 자료 첨부
        val grammarRefs = if (effectiveArea == "GRAM" && !req.grammarTopic.isNullOrBlank())
            grammarRagService.fetchByTopic(req.grammarTopic, limit = 2)
        else emptyList()
        // learning_corpus 자료 첨부 (corpusId 지정 시)
        val corpusRef = corpusService.buildExamReferenceText(req.corpusId)
        val refs = grammarRefs + listOfNotNull(corpusRef.takeIf { it.isNotBlank() })

        // 시스템 프롬프트는 100% 정적 (캐시 hit 보장). 참고 자료는 user 메시지에.
        val systemBlocks = promptBuilder.passageSystemBlocks(helper)
        val userPrompt = buildUserPrompt(req) + promptBuilder.buildReferenceText(refs)
        val result = helper.call(AiCallHelper.MODEL_SONNET, systemBlocks, userPrompt, maxTokens = 2048)

        // 응답 JSON 파싱 (관대하게)
        val parsed = parseJsonObject(result.text)
        val text = (parsed["text"] as? String) ?: result.text

        return PassageGenResponse(
            text = text,
            title = parsed["title"] as? String,
            author = parsed["author"] as? String,
            summary = parsed["summary"] as? String,
            area = effectiveArea,
            subArea = req.subArea,
            model = AiCallHelper.MODEL_SONNET,
            durationMs = result.durationMs,
        )
    }

    private fun buildUserPrompt(req: PassageGenRequest): String {
        val sb = StringBuilder()
        sb.appendLine("아래 옵션에 따라 시험지 지문 1편을 작성해 주세요.")
        sb.appendLine()
        sb.appendLine("- 영역(area): ${req.area}")
        sb.appendLine("- 세부영역(subArea): ${req.subArea ?: "-"}")
        sb.appendLine("- 학년·레벨(levelLabel): ${req.levelId?.let { LEVEL_TO_KOREAN[it] ?: it } ?: "-"}")
        sb.appendLine("- 목표 글자 수(targetLength): ${req.targetLength}")
        sb.appendLine("- 문단 수(paragraphs): ${req.paragraphs}")
        if (req.concepts.isNotEmpty()) {
            sb.appendLine("- 강조 학습 개념(concepts): ${req.concepts.joinToString(", ")}")
        }
        if (!req.moodPrompt.isNullOrBlank()) {
            sb.appendLine("- 분위기·주제(moodPrompt): ${req.moodPrompt}")
        }
        sb.appendLine()
        sb.appendLine("응답은 JSON 한 객체만, 다른 텍스트(설명·인사·``` 펜스 등) 없이.")
        return sb.toString()
    }

    private fun parseJsonObject(raw: String): Map<String, Any?> {
        val s = raw.trim()
        // 마크다운 ``` 펜스 제거
        val unfenced = s.replace(Regex("^```(?:json)?\\s*"), "").replace(Regex("\\s*```$"), "")
        val firstBrace = unfenced.indexOf('{')
        val lastBrace = unfenced.lastIndexOf('}')
        if (firstBrace < 0 || lastBrace < 0) return mapOf("text" to raw)
        return try {
            objectMapper.readValue(
                unfenced.substring(firstBrace, lastBrace + 1),
                object : TypeReference<Map<String, Any?>>() {}
            )
        } catch (_: Exception) {
            mapOf("text" to raw)
        }
    }

    companion object {
        private val LEVEL_TO_KOREAN = mapOf(
            "saussure1" to "초1 (소쉬르 1)",
            "saussure2" to "초2 (소쉬르 2)",
            "saussure3" to "초3 (소쉬르 3)",
            "frege1" to "초4 (프레게 1)",
            "frege2" to "초5 (프레게 2)",
            "frege3" to "초6 (프레게 3)",
            "russell1" to "중1 (러셀 1)",
            "russell2" to "중2 (러셀 2)",
            "russell3" to "중3 (러셀 3)",
            "wittgenstein1" to "고1 (비트겐슈타인 1)",
            "wittgenstein2" to "고2 (비트겐슈타인 2)",
            "wittgenstein3" to "고3 (비트겐슈타인 3)",
        )
    }
}
