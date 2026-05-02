package com.korfarm.api.test

import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.stereotype.Service

/**
 * test.payload (passages, questions) → Typst 소스코드 자동 생성.
 *
 * 출력 정책:
 *  - A4, 18mm 마진, 본문 11pt
 *  - 한글 폰트: "Noto Sans CJK KR" (EC2 fontconfig 등록됨)
 *  - 페이지 1: 헤더 + 응시 정보 칸
 *  - 본문: 2단 (#columns(2)) — 지문 → 그 지문의 문제들 → 다음 지문...
 *  - 박스, 정렬, 밑줄 등은 사용자가 추가 편집 가능
 *
 * 정답·해설:
 *  - 헤더 + 정답표 (#table) + 문제별 해설 카드 (2단)
 */
@Service
class TypstBuilder(
    private val testService: TestService,
    private val objectMapper: ObjectMapper
) {

    fun buildPaper(paper: TestPaperEntity): String {
        val payload = loadPayload(paper) ?: return placeholderPaper(paper.title)
        @Suppress("UNCHECKED_CAST")
        val passages = (payload["passages"] as? List<Map<String, Any?>>) ?: emptyList()
        @Suppress("UNCHECKED_CAST")
        val questions = (payload["questions"] as? List<Map<String, Any?>>) ?: emptyList()

        val sb = StringBuilder()
        sb.append(commonHeader())
        sb.appendLine()

        // 표지/헤더
        sb.appendLine("// ─── 표지 ───")
        sb.appendLine("#align(center)[")
        sb.appendLine("  #text(size: 18pt, weight: \"bold\")[${escape(paper.title)}]")
        val meta = buildList {
            add("${paper.totalQuestions}문항")
            add("${paper.totalPoints}점")
            paper.timeLimitMinutes?.let { add("${it}분") }
        }.joinToString(" · ")
        sb.appendLine("  #v(6pt)")
        sb.appendLine("  #text(size: 10pt, fill: gray)[${escape(meta)}]")
        sb.appendLine("]")
        sb.appendLine("#v(12pt)")
        sb.appendLine("#box(stroke: 0.5pt + gray, inset: 8pt, radius: 4pt, width: 100%)[")
        sb.appendLine("  학교 #h(0.5em) #box(width: 7em, stroke: (bottom: 0.5pt))[#h(1em)] #h(1.5em) 학년/반 #h(0.5em) #box(width: 4em, stroke: (bottom: 0.5pt))[#h(1em)] #h(1.5em) 이름 #h(0.5em) #box(width: 7em, stroke: (bottom: 0.5pt))[#h(1em)] #h(1.5em) 응시일 #h(0.5em) #box(width: 5em, stroke: (bottom: 0.5pt))[#h(1em)]")
        sb.appendLine("]")
        sb.appendLine("#v(8pt)")
        sb.appendLine()

        // 본문 — 2단
        sb.appendLine("// ─── 본문 (2단 구성) ───")
        sb.appendLine("#columns(2, gutter: 12pt)[")

        val passageMap = passages.associateBy { (it["id"] as? String) ?: "" }
        val byPassage = questions.groupBy { it["passageId"] as? String }
        // 지문 있는 그룹 우선 (id 정렬), 지문 없는 마지막
        val orderedKeys = byPassage.keys.sortedWith(compareBy({ it == null }, { it ?: "" }))

        for ((groupIdx, key) in orderedKeys.withIndex()) {
            val qs = byPassage[key]?.sortedBy { numberOf(it) } ?: continue
            if (qs.isEmpty()) continue
            val passage = if (key != null) passageMap[key] else null

            if (passage != null) {
                val firstNo = qs.minOf { numberOf(it) }
                val lastNo = qs.maxOf { numberOf(it) }
                val rangeLabel = if (firstNo == lastNo) "[$firstNo]" else "[$firstNo~$lastNo]"
                sb.appendLine("  // 지문 $rangeLabel")
                sb.appendLine("  #block(below: 8pt, above: 6pt)[")
                sb.appendLine("    #text(weight: \"bold\")[$rangeLabel] 다음 글을 읽고 물음에 답하시오.")
                sb.appendLine("  ]")
                val passageText = (passage["text"] as? String) ?: ""
                sb.appendLine("  #par(justify: true)[")
                sb.appendLine("    ${formatParagraph(passageText)}")
                sb.appendLine("  ]")
                sb.appendLine("  #v(6pt)")
            }

            qs.forEach { q ->
                sb.appendLine(buildQuestionTypst(q))
            }

            // 그룹 사이 간격
            if (groupIdx < orderedKeys.size - 1) {
                sb.appendLine("  #v(8pt)")
            }
        }
        sb.appendLine("]")  // columns 끝

        return sb.toString()
    }

    fun buildAnswer(paper: TestPaperEntity): String {
        val payload = loadPayload(paper) ?: return placeholderAnswer(paper.title)
        @Suppress("UNCHECKED_CAST")
        val questions = (payload["questions"] as? List<Map<String, Any?>>) ?: emptyList()

        val sb = StringBuilder()
        sb.append(commonHeader())
        sb.appendLine()

        // 헤더
        sb.appendLine("#align(center)[")
        sb.appendLine("  #text(size: 16pt, weight: \"bold\")[${escape(paper.title)} — 정답·해설]")
        sb.appendLine("]")
        sb.appendLine("#v(12pt)")
        sb.appendLine()

        // 정답표
        sb.appendLine("// ─── 정답표 ───")
        sb.appendLine("== 정답표")
        sb.appendLine("#table(")
        sb.appendLine("  columns: (auto, auto, auto, auto, auto),")
        sb.appendLine("  align: center + horizon,")
        sb.appendLine("  stroke: 0.5pt,")
        sb.appendLine("  fill: (col, row) => if row == 0 { rgb(\"#f0eae5\") } else { white },")
        sb.appendLine("  table.header([*번호*], [*정답*], [*배점*], [*번호*], [*정답*]),")
        val sorted = questions.sortedBy { numberOf(it) }
        val pairs = sorted.chunked((sorted.size + 1) / 2)
        // 정답표 2열 짝지어 출력
        val maxLen = if (pairs.size == 2) pairs[0].size else sorted.size
        for (i in 0 until maxLen) {
            val q1 = pairs.getOrNull(0)?.getOrNull(i)
            val q2 = pairs.getOrNull(1)?.getOrNull(i)
            sb.append("  ")
            sb.append(answerCell(q1))
            sb.append(", ")
            sb.append(answerCellNoPoints(q2))
            sb.appendLine(",")
        }
        sb.appendLine(")")
        sb.appendLine("#v(12pt)")
        sb.appendLine()

        // 해설 (2단)
        sb.appendLine("== 해설")
        sb.appendLine("#columns(2, gutter: 12pt)[")
        questions.sortedBy { numberOf(it) }.forEach { q ->
            sb.appendLine(buildExplanationTypst(q))
        }
        sb.appendLine("]")

        return sb.toString()
    }

    // ─────────────────────────────────────────────────────────

    private fun commonHeader(): String = """
        // ─── 시험지 공통 설정 ───
        #set page(paper: "a4", margin: (x: 16mm, y: 18mm))
        #set text(font: "Noto Sans CJK KR", size: 11pt, lang: "ko")
        #set par(leading: 0.7em)
        #show heading.where(level: 1): it => block(below: 8pt)[
          #text(size: 14pt, weight: "bold")[#it.body]
        ]
        #show heading.where(level: 2): it => block(below: 6pt)[
          #text(size: 12pt, weight: "bold", fill: rgb("#2d6a4f"))[#it.body]
        ]
    """.trimIndent()

    private fun buildQuestionTypst(q: Map<String, Any?>): String {
        val no = numberOf(q)
        val stem = (q["stem"] as? String) ?: ""
        val points = (q["points"] as? Number)?.toInt() ?: 4
        val type = (q["type"] as? String) ?: "MULTI_CHOICE"
        @Suppress("UNCHECKED_CAST")
        val choices = (q["choices"] as? List<Map<String, Any?>>) ?: emptyList()

        val sb = StringBuilder()
        sb.appendLine("  #block(above: 8pt, below: 6pt)[")
        sb.appendLine("    *${no}.* ${formatInline(stem)} #h(0.5em) #text(size: 9pt, fill: gray)[(${points}점)]")
        sb.appendLine("  ]")
        if (type == "ESSAY") {
            sb.appendLine("  #box(stroke: 0.5pt + gray, inset: 4pt, width: 100%, height: 60pt)[]")
        } else if (choices.isNotEmpty()) {
            choices.forEachIndexed { idx, c ->
                val marker = "①②③④⑤".getOrNull(idx)?.toString() ?: "${idx + 1})"
                val text = (c["text"] as? String) ?: ""
                sb.appendLine("  #h(1em) $marker  ${formatInline(text)} \\")
            }
        }
        sb.appendLine("  #v(4pt)")
        return sb.toString()
    }

    private fun buildExplanationTypst(q: Map<String, Any?>): String {
        val no = numberOf(q)
        val explanation = (q["explanation"] as? String) ?: ""
        val modelAnswer = (q["modelAnswer"] as? String) ?: ""
        val answerId = q["answerId"] as? String
        @Suppress("UNCHECKED_CAST")
        val choices = (q["choices"] as? List<Map<String, Any?>>) ?: emptyList()
        val ansIdx = choices.indexOfFirst { it["id"] == answerId }
        val ansLabel = if (ansIdx >= 0) "①②③④⑤".getOrNull(ansIdx)?.toString() ?: "${ansIdx + 1}" else "-"

        val sb = StringBuilder()
        sb.appendLine("  #block(above: 6pt, below: 4pt, breakable: false)[")
        sb.appendLine("    #box(fill: rgb(\"#faf3f1\"), inset: 6pt, radius: 3pt, width: 100%)[")
        sb.appendLine("      *${no}.* 정답 #text(fill: rgb(\"#c0392b\"))[*$ansLabel*]")
        if (explanation.isNotBlank()) {
            sb.appendLine("      #v(4pt)")
            sb.appendLine("      ${formatInline(explanation)}")
        }
        if (modelAnswer.isNotBlank()) {
            sb.appendLine("      #v(4pt)")
            sb.appendLine("      *모범답안:* ${formatInline(modelAnswer)}")
        }
        sb.appendLine("    ]")
        sb.appendLine("  ]")
        return sb.toString()
    }

    private fun answerCell(q: Map<String, Any?>?): String {
        if (q == null) return "[], [], []"
        val no = numberOf(q)
        @Suppress("UNCHECKED_CAST")
        val choices = (q["choices"] as? List<Map<String, Any?>>) ?: emptyList()
        val ansIdx = choices.indexOfFirst { it["id"] == q["answerId"] }
        val ansLabel = if (ansIdx >= 0) "①②③④⑤".getOrNull(ansIdx)?.toString() ?: "${ansIdx + 1}" else "-"
        val pts = (q["points"] as? Number)?.toInt() ?: 4
        return "[$no], [$ansLabel], [$pts]"
    }

    private fun answerCellNoPoints(q: Map<String, Any?>?): String {
        if (q == null) return "[], []"
        val no = numberOf(q)
        @Suppress("UNCHECKED_CAST")
        val choices = (q["choices"] as? List<Map<String, Any?>>) ?: emptyList()
        val ansIdx = choices.indexOfFirst { it["id"] == q["answerId"] }
        val ansLabel = if (ansIdx >= 0) "①②③④⑤".getOrNull(ansIdx)?.toString() ?: "${ansIdx + 1}" else "-"
        return "[$no], [$ansLabel]"
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

    /**
     * Typst 의 문단 텍스트로 변환. 단순 escape — # / @ / [ / ] / * / _ 등.
     * 줄바꿈은 빈 줄로 (Typst 의 paragraph break).
     */
    private fun formatParagraph(s: String): String {
        return s.replace("\r\n", "\n")
            .split(Regex("\n\\s*\n"))
            .joinToString("\n\n") { escape(it.replace("\n", " ")) }
    }

    private fun formatInline(s: String): String {
        // 단순 escape
        return escape(s.replace("\r\n", " ").replace("\n", " "))
    }

    /** Typst 특수문자 escape */
    private fun escape(s: String): String {
        if (s.isEmpty()) return s
        val sb = StringBuilder(s.length)
        for (c in s) {
            when (c) {
                '\\', '#', '$', '@', '*', '_', '`', '[', ']', '<', '>', '~', '"' -> {
                    sb.append('\\').append(c)
                }
                else -> sb.append(c)
            }
        }
        return sb.toString()
    }

    private fun placeholderPaper(title: String): String =
        commonHeader() + "\n\n#align(center)[\n  #text(size: 16pt, weight: \"bold\")[${escape(title)}]\n]\n\n시험지에 문항이 등록되지 않았습니다. 시험지 비주얼 에디터에서 먼저 문항을 등록해주세요.\n"

    private fun placeholderAnswer(title: String): String =
        commonHeader() + "\n\n#align(center)[\n  #text(size: 16pt, weight: \"bold\")[${escape(title)} — 정답·해설]\n]\n\n시험지에 문항이 등록되지 않았습니다.\n"
}
