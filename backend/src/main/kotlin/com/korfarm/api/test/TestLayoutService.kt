package com.korfarm.api.test

import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.stereotype.Service

/**
 * 시험지/정답·해설 자동 레이아웃 생성기.
 * test.payload (passages, questions) → 페이지 단위 layout 객체 변환.
 *
 * 정책 (자동 채우기):
 * - 페이지 1: 헤더(제목·문항수·시간) + 응시 정보 입력란
 * - 다음 페이지: 지문 그룹마다 새 페이지 (지문 + 그에 속한 문제들)
 * - 지문 없는 문제는 마지막 페이지에 모음
 * - 모든 페이지 columns=1 로 시작 (어드민이 2단으로 토글 가능)
 *
 * 정답·해설:
 * - 페이지 1 헤더 + 문제별 정답·점수·해설을 답안 카드로 차례대로 렌더
 * - columns=2 로 시작 (정답표는 2단이 자연스러움)
 */
@Service
class TestLayoutService(
    private val testService: TestService,
    private val objectMapper: ObjectMapper
) {

    fun buildPaperLayout(paper: TestPaperEntity): Map<String, Any?> {
        val payload = loadPayload(paper) ?: return emptyLayout("미배정")
        @Suppress("UNCHECKED_CAST")
        val passages = (payload["passages"] as? List<Map<String, Any?>>) ?: emptyList()
        @Suppress("UNCHECKED_CAST")
        val questions = (payload["questions"] as? List<Map<String, Any?>>) ?: emptyList()

        val pages = mutableListOf<Map<String, Any?>>()
        var blockId = 1
        fun nextBlockId() = "b${blockId++}"

        // ── 페이지 1: 표지/헤더 ──
        pages.add(mapOf(
            "id" to "p1",
            "header" to mapOf(
                "title" to paper.title,
                "meta" to "${paper.totalQuestions}문항 · ${paper.totalPoints}점 · ${paper.timeLimitMinutes ?: "-"}분"
            ),
            "columns" to 1,
            "blocks" to mutableListOf(
                mapOf(
                    "id" to nextBlockId(),
                    "type" to "info",
                    "html" to "학교 _________________  학년/반 ________  이름 _______________  응시일 ________"
                ),
                mapOf(
                    "id" to nextBlockId(),
                    "type" to "text",
                    "html" to "<p>다음 문제를 잘 읽고 답하시오.</p>"
                )
            )
        ))

        // ── 지문 그룹별 페이지 ──
        val passageMap = passages.associateBy { (it["id"] as? String) ?: "" }
        val byPassage = questions.groupBy { it["passageId"] as? String }
        // 지문 있는 그룹 먼저, 그 다음 지문 없는 그룹
        val orderedKeys = byPassage.keys.sortedWith(compareBy({ it == null }, { it ?: "" }))

        var pageIdx = 2
        for (key in orderedKeys) {
            val qs = byPassage[key]?.sortedBy { numberOf(it) } ?: continue
            if (qs.isEmpty()) continue
            val blocks = mutableListOf<Map<String, Any?>>()
            val passage = if (key != null) passageMap[key] else null
            if (passage != null) {
                val firstNo = qs.minOf { numberOf(it) }
                val lastNo = qs.maxOf { numberOf(it) }
                val rangeLabel = if (firstNo == lastNo) "[$firstNo]" else "[$firstNo~$lastNo]"
                val passageText = (passage["text"] as? String) ?: ""
                blocks.add(mapOf(
                    "id" to nextBlockId(),
                    "type" to "passage",
                    "label" to rangeLabel,
                    "html" to escapeHtml(passageText)
                ))
            }
            qs.forEach { q ->
                blocks.add(buildQuestionBlock(q, nextBlockId()))
            }
            pages.add(mapOf(
                "id" to "p$pageIdx",
                "columns" to 1,
                "blocks" to blocks
            ))
            pageIdx++
        }

        return mapOf(
            "version" to "1.0",
            "type" to "paper",
            "title" to paper.title,
            "pages" to pages
        )
    }

    fun buildAnswerLayout(paper: TestPaperEntity): Map<String, Any?> {
        val payload = loadPayload(paper) ?: return emptyLayout("미배정")
        @Suppress("UNCHECKED_CAST")
        val questions = (payload["questions"] as? List<Map<String, Any?>>) ?: emptyList()

        val blocks = mutableListOf<Map<String, Any?>>()
        var bid = 1
        // 정답표 (간단 격자) 우선
        val answerRows = questions.sortedBy { numberOf(it) }.map { q ->
            val answerId = q["answerId"] as? String
            @Suppress("UNCHECKED_CAST")
            val choices = (q["choices"] as? List<Map<String, Any?>>) ?: emptyList()
            val answerLabel = choices.indexOfFirst { it["id"] == answerId }
                .let { idx -> if (idx >= 0) "①②③④⑤".getOrNull(idx)?.toString() ?: "${idx + 1}" else "-" }
            mapOf(
                "no" to numberOf(q),
                "answer" to answerLabel,
                "answerId" to (answerId ?: ""),
                "points" to (q["points"] ?: 4)
            )
        }
        blocks.add(mapOf(
            "id" to "b${bid++}",
            "type" to "answer-table",
            "rows" to answerRows
        ))

        // 문제별 해설
        questions.sortedBy { numberOf(it) }.forEach { q ->
            blocks.add(buildExplanationBlock(q, "b${bid++}"))
        }

        val pages = mutableListOf(
            mapOf(
                "id" to "ap1",
                "header" to mapOf(
                    "title" to "${paper.title} — 정답·해설",
                    "meta" to "총 ${paper.totalQuestions}문항"
                ),
                "columns" to 2,
                "blocks" to blocks
            )
        )

        return mapOf(
            "version" to "1.0",
            "type" to "answer",
            "title" to "${paper.title} — 정답·해설",
            "pages" to pages
        )
    }

    private fun buildQuestionBlock(q: Map<String, Any?>, id: String): Map<String, Any?> {
        @Suppress("UNCHECKED_CAST")
        val choices = (q["choices"] as? List<Map<String, Any?>>) ?: emptyList()
        return mapOf(
            "id" to id,
            "type" to "question",
            "no" to numberOf(q),
            "questionType" to (q["type"] ?: "MULTI_CHOICE"),
            "stem" to (q["stem"] ?: ""),
            "choices" to choices.mapIndexed { idx, c ->
                mapOf(
                    "id" to (c["id"] ?: "c${idx + 1}"),
                    "text" to (c["text"] ?: ""),
                    "marker" to "①②③④⑤".getOrNull(idx)?.toString().orEmpty()
                )
            },
            "points" to (q["points"] ?: 4)
        )
    }

    private fun buildExplanationBlock(q: Map<String, Any?>, id: String): Map<String, Any?> {
        @Suppress("UNCHECKED_CAST")
        val choices = (q["choices"] as? List<Map<String, Any?>>) ?: emptyList()
        val answerId = q["answerId"] as? String
        val answerIdx = choices.indexOfFirst { it["id"] == answerId }
        val answerLabel = if (answerIdx >= 0) "①②③④⑤".getOrNull(answerIdx)?.toString() ?: "${answerIdx + 1}" else "-"
        return mapOf(
            "id" to id,
            "type" to "answer-explanation",
            "no" to numberOf(q),
            "answer" to answerLabel,
            "points" to (q["points"] ?: 4),
            "stem" to (q["stem"] ?: ""),
            "explanation" to (q["explanation"] ?: ""),
            "modelAnswer" to (q["modelAnswer"] ?: ""),
            "choiceExplanations" to (q["choiceExplanations"] ?: emptyMap<String, String>())
        )
    }

    private fun loadPayload(paper: TestPaperEntity): Map<String, Any?>? {
        val raw = paper.payloadJson?.takeIf { it.isNotBlank() } ?: testService.getPayload(paper.id)
        if (raw.isNullOrBlank()) return null
        return try {
            @Suppress("UNCHECKED_CAST")
            objectMapper.readValue(raw, Map::class.java) as Map<String, Any?>
        } catch (e: Exception) {
            null
        }
    }

    private fun numberOf(q: Map<String, Any?>): Int = (q["number"] as? Number)?.toInt() ?: 0

    private fun escapeHtml(s: String): String = s
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .let { it.replace("\n", "</p><p>") }
        .let { "<p>$it</p>" }

    private fun emptyLayout(label: String): Map<String, Any?> = mapOf(
        "version" to "1.0",
        "pages" to listOf(
            mapOf(
                "id" to "p1",
                "header" to mapOf("title" to label),
                "columns" to 1,
                "blocks" to listOf(
                    mapOf(
                        "id" to "b1",
                        "type" to "text",
                        "html" to "<p>시험지에 문항이 등록되지 않았습니다. 시험지 비주얼 에디터에서 문항을 먼저 등록해주세요.</p>"
                    )
                )
            )
        )
    )
}
