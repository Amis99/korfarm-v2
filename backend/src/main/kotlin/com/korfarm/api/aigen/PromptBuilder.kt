package com.korfarm.api.aigen

import org.springframework.core.io.ClassPathResource
import org.springframework.stereotype.Component
import java.nio.charset.StandardCharsets

/**
 * 시스템 프롬프트는 100% 정적 — Anthropic Prompt Caching 100% hit 보장.
 * 동적 컨텍스트(RAG 결과·옵션)는 user 메시지로 옮긴다.
 */
@Component
class PromptBuilder {
    private val cache = mutableMapOf<String, String>()

    private fun loadResource(name: String): String {
        return cache.getOrPut(name) {
            ClassPathResource("ai-prompts/" + name).inputStream.use {
                String(it.readAllBytes(), StandardCharsets.UTF_8)
            }
        }
    }

    fun passageSystemBlocks(helper: AiCallHelper): List<Map<String, Any?>> {
        val systemPrompt = loadResource("passage-system.md")
        return listOf(helper.systemBlock(systemPrompt, ephemeralCache = true))
    }

    fun objectiveQuestionSystemBlocks(helper: AiCallHelper): List<Map<String, Any?>> {
        val guidelines = loadResource("objective-question-guidelines.md")
        val intro = "당신은 대한민국 학교 국어 시험지의 객관식 문항을 출제하는 전문가입니다.\n" +
                "아래 지침서를 100% 준수하며 출제합니다. 응답은 반드시 JSON 한 객체 형태로만.\n\n"
        return listOf(helper.systemBlock(intro + guidelines, ephemeralCache = true))
    }

    fun essayQuestionSystemBlocks(helper: AiCallHelper): List<Map<String, Any?>> {
        val guidelines = loadResource("essay-question-guidelines.md")
        val intro = "당신은 대한민국 학교 국어 시험지의 서술형 문항을 출제하는 전문가입니다.\n" +
                "아래 지침서를 100% 준수하며 출제합니다. 응답은 반드시 JSON 한 객체 형태로만.\n\n"
        return listOf(helper.systemBlock(intro + guidelines, ephemeralCache = true))
    }

    fun studentPersonaSystemBlocks(helper: AiCallHelper): List<Map<String, Any?>> {
        val text = loadResource("student-persona.md")
        return listOf(helper.systemBlock(text, ephemeralCache = true))
    }

    /** 참고 자료를 user 메시지로 붙이기 위한 helper. system 블록에는 사용하지 않음. */
    fun buildReferenceText(refs: List<String>): String {
        if (refs.isEmpty()) return ""
        val sb = StringBuilder()
        sb.append("\n\n## 참고 자료 (자연스럽게 참고만, 그대로 베끼지 말 것)\n\n")
        refs.forEachIndexed { i, t ->
            if (i > 0) sb.append("\n\n---\n\n")
            sb.append("### 참고 ").append(i + 1).append("\n").append(t)
        }
        return sb.toString()
    }
}
