package com.korfarm.api.test

/**
 * payload (passages, questions) → Typst 소스.
 * 출판 품질 (편집 X) — Typst 가 알아서:
 *   - 2단 column-fill: auto
 *   - 문제 단위 block(breakable: false) — 단/페이지 중간 안 끊김
 *   - 정답·해설 새 페이지 (#pagebreak)
 *   - 옛한글 (HCR Batang fallback Noto Sans CJK KR)
 */
class TypstBuilder(
    private val paper: TestPaperEntity,
    private val payload: Map<String, Any?>,
    private val hasHcrFont: Boolean
) {
    @Suppress("UNCHECKED_CAST")
    private val passages: List<Map<String, Any?>> =
        (payload["passages"] as? List<Map<String, Any?>>) ?: emptyList()

    @Suppress("UNCHECKED_CAST")
    private val questions: List<Map<String, Any?>> =
        (payload["questions"] as? List<Map<String, Any?>>) ?: emptyList()

    private val passageById: Map<String, Map<String, Any?>> =
        passages.associateBy { (it["id"] as? String) ?: "" }

    private val questionsByPassage: Map<String?, List<Map<String, Any?>>> =
        questions.groupBy { it["passageId"] as? String }

    fun build(): String {
        val fontSize = fontSizeForLevel(paper.levelId)
        val fontStack = if (hasHcrFont) {
            "(\"HCR Batang\", \"Noto Serif CJK KR\", \"Noto Sans CJK KR\")"
        } else {
            "(\"Noto Serif CJK KR\", \"Noto Sans CJK KR\", \"Noto Sans KR\")"
        }

        val sb = StringBuilder()
        sb.appendLine("""#set page(paper: "a4", margin: (x: 16mm, y: 18mm))""")
        sb.appendLine("""#set text(font: $fontStack, size: ${fontSize}pt, lang: "ko")""")
        sb.appendLine("""#set par(leading: 0.75em, justify: true)""")
        sb.appendLine("""#show heading.where(level: 1): it => { v(4pt); text(size: 1.4em, weight: "bold")[#it.body]; v(6pt) }""")
        sb.appendLine()

        // 박스 헬퍼
        sb.appendLine("""#let passage-box(body) = block(stroke: (left: 3pt + rgb("#2d6a4f")), fill: rgb("#f5f9f3"), inset: (x: 12pt, y: 10pt), width: 100%, spacing: 8pt, radius: 2pt, body)""")
        sb.appendLine("""#let bogi-box(body) = block(stroke: 0.6pt + black, inset: (x: 10pt, y: 8pt), width: 100%, spacing: 6pt, radius: 2pt, body)""")
        sb.appendLine("""#let condition-box(body) = block(stroke: (left: 2pt + rgb("#444"), rest: 0.4pt + rgb("#aaa")), fill: rgb("#fafafa"), inset: (x: 10pt, y: 8pt), width: 100%, spacing: 6pt, radius: 2pt, body)""")
        sb.appendLine()

        // 헤더 (1단)
        buildHeader(sb)
        sb.appendLine()

        // 본문 — 2단 auto
        sb.appendLine("""#show: rest => columns(2, gutter: 8mm, rest)""")
        sb.appendLine()

        buildBody(sb)
        sb.appendLine()

        // 정답·해설 — 새 페이지
        sb.appendLine("""#pagebreak()""")
        // 새 페이지에서 columns 영향 끊고 1단으로 정답표
        buildAnswerSection(sb)

        return sb.toString()
    }

    // ─── 헤더 ───
    private fun buildHeader(sb: StringBuilder) {
        val title = TypstEscape.escape(paper.title)
        val meta = buildList {
            add("${paper.totalQuestions}문항")
            add("${paper.totalPoints}점")
            paper.timeLimitMinutes?.let { add("${it}분") }
        }.joinToString(" · ")

        sb.appendLine("""#grid(""")
        sb.appendLine("""  columns: (auto, 1fr),""")
        sb.appendLine("""  gutter: 12pt,""")
        sb.appendLine("""  align: horizon,""")
        sb.appendLine("""  image("logo.png", height: 30pt),""")
        sb.appendLine("""  align(right + horizon)[#text(size: 16pt, weight: "bold")[$title]]""")
        sb.appendLine(""")""")
        sb.appendLine("""#v(4pt)""")
        sb.appendLine("""#text(size: 9pt, fill: rgb("#666"))[${TypstEscape.escape(meta)}]""")
        sb.appendLine("""#v(2pt)""")
        sb.appendLine("""#align(right)[학교 #h(34pt) 학년/반 #h(28pt) 이름 #h(34pt)]""")
        sb.appendLine("""#v(3pt)""")
        sb.appendLine("""#line(length: 100%, stroke: 0.5pt + rgb("#888"))""")
        sb.appendLine("""#v(6pt)""")
    }

    // ─── 본문: 지문 + 문제 ───
    private fun buildBody(sb: StringBuilder) {
        // passageId → 지문 그룹 + 그 지문에 묶인 문제들
        val orderedKeys = questionsByPassage.keys.sortedWith(
            compareBy({ it == null }, { questionsByPassage[it]?.minOf(::numberOf) ?: Int.MAX_VALUE })
        )

        for (key in orderedKeys) {
            val qs = questionsByPassage[key]?.sortedBy(::numberOf) ?: continue
            if (qs.isEmpty()) continue
            val passage = if (key != null) passageById[key] else null

            if (passage != null) {
                val first = qs.minOf(::numberOf)
                val last = qs.maxOf(::numberOf)
                val rangeLabel = if (first == last) "[$first]" else "[$first~$last]"
                val passageText = (passage["text"] as? String) ?: ""
                sb.appendLine("""#passage-box[""")
                sb.appendLine("""  *${TypstEscape.escape(rangeLabel)}* 다음 글을 읽고 답하시오.""")
                sb.appendLine()
                sb.appendLine(MarkupToTypst.toTypst(passageText, indent = "  "))
                sb.appendLine("""]""")
                sb.appendLine("""#v(8pt)""")
            }

            qs.forEach { q ->
                buildQuestionBlock(sb, q)
                sb.appendLine("""#v(14pt)""")  // 문제 사이 적당한 호흡
            }
        }
    }

    private fun buildQuestionBlock(sb: StringBuilder, q: Map<String, Any?>) {
        val no = numberOf(q)
        val stem = (q["stem"] as? String) ?: ""
        val points = (q["points"] as? Number)?.toInt() ?: 4
        val type = (q["type"] as? String) ?: "MULTI_CHOICE"
        val boxContent = (q["boxContent"] as? String)?.takeIf { it.isNotBlank() }
        val conditionContent = (q["conditionContent"] as? String)?.takeIf { it.isNotBlank() }
        @Suppress("UNCHECKED_CAST")
        val choices = (q["choices"] as? List<Map<String, Any?>>) ?: emptyList()

        sb.appendLine("""#block(breakable: false, width: 100%)[""")
        // 발문
        sb.appendLine("""  *${no}.* ${MarkupToTypst.inline(stem)} #h(0.4em) #text(size: 0.85em, fill: rgb("#888"))[(${points}점)]""")
        sb.appendLine("""  #v(4pt)""")

        // 보기 박스
        if (boxContent != null) {
            sb.appendLine("""  #bogi-box[""")
            sb.appendLine("""    *<보기>*""")
            sb.appendLine()
            sb.appendLine(MarkupToTypst.toTypst(boxContent, indent = "    "))
            sb.appendLine("""  ]""")
        }

        // 조건 박스
        if (conditionContent != null) {
            sb.appendLine("""  #condition-box[""")
            sb.appendLine("""    *<조건>*""")
            sb.appendLine()
            sb.appendLine(MarkupToTypst.toTypst(conditionContent, indent = "    "))
            sb.appendLine("""  ]""")
        }

        // 선택지 또는 서답형 응답란
        if (type == "ESSAY") {
            sb.appendLine("""  #v(4pt)""")
            sb.appendLine("""  #block(stroke: 0.4pt + rgb("#aaa"), inset: (x: 8pt, y: 16pt), width: 100%, height: 80pt)[]""")
        } else if (choices.isNotEmpty()) {
            sb.appendLine("""  #v(4pt)""")
            choices.forEachIndexed { idx, c ->
                val marker = "①②③④⑤".getOrNull(idx)?.toString() ?: "${idx + 1})"
                val text = (c["text"] as? String) ?: ""
                sb.appendLine("""  $marker ${MarkupToTypst.inline(text)} #linebreak()""")
            }
        }

        sb.appendLine("""]""")
    }

    // ─── 정답·해설 (새 페이지) ───
    private fun buildAnswerSection(sb: StringBuilder) {
        sb.appendLine("""#set text(size: 10pt)""")
        sb.appendLine("""= 정답·해설""")
        sb.appendLine()

        // 정답표 (1단 — 2단 흐름 끝낸 후)
        sb.appendLine("""#table(""")
        sb.appendLine("""  columns: 4,""")
        sb.appendLine("""  align: center,""")
        sb.appendLine("""  stroke: 0.5pt + rgb("#888"),""")
        sb.appendLine("""  table.header(""")
        sb.appendLine("""    [*번호*], [*정답*], [*배점*], [*영역*]""")
        sb.appendLine("""  ),""")
        questions.sortedBy(::numberOf).forEach { q ->
            @Suppress("UNCHECKED_CAST")
            val choices = (q["choices"] as? List<Map<String, Any?>>) ?: emptyList()
            val ansIdx = choices.indexOfFirst { it["id"] == q["answerId"] }
            val ansLabel = if (ansIdx >= 0) "①②③④⑤".getOrNull(ansIdx)?.toString() ?: "${ansIdx + 1}" else "-"
            val pts = (q["points"] as? Number)?.toInt() ?: 4
            val domain = (q["domain"] as? String) ?: "-"
            val no = numberOf(q)
            sb.appendLine("""  [${no}], [${TypstEscape.escape(ansLabel)}], [${pts}], [${TypstEscape.escape(domain)}],""")
        }
        sb.appendLine(""")""")
        sb.appendLine("""#v(10pt)""")

        // 해설 (2단)
        sb.appendLine("""#show: rest => columns(2, gutter: 8mm, rest)""")
        questions.sortedBy(::numberOf).forEach { q ->
            buildExplanationBlock(sb, q)
            sb.appendLine("""#v(10pt)""")
        }
    }

    private fun buildExplanationBlock(sb: StringBuilder, q: Map<String, Any?>) {
        val no = numberOf(q)
        @Suppress("UNCHECKED_CAST")
        val choices = (q["choices"] as? List<Map<String, Any?>>) ?: emptyList()
        val ansIdx = choices.indexOfFirst { it["id"] == q["answerId"] }
        val ansLabel = if (ansIdx >= 0) "①②③④⑤".getOrNull(ansIdx)?.toString() ?: "${ansIdx + 1}" else "-"
        val pts = (q["points"] as? Number)?.toInt() ?: 4
        val explanation = (q["explanation"] as? String)?.takeIf { it.isNotBlank() }
        val modelAnswer = (q["modelAnswer"] as? String)?.takeIf { it.isNotBlank() }

        sb.appendLine("""#block(breakable: false, width: 100%)[""")
        sb.appendLine("""  *${no}.* 정답 #text(fill: rgb("#c0392b"), weight: "bold")[${TypstEscape.escape(ansLabel)}] #h(0.4em) #text(size: 0.85em, fill: rgb("#888"))[(${pts}점)]""")
        if (explanation != null) {
            sb.appendLine("""  #v(3pt)""")
            sb.appendLine(MarkupToTypst.toTypst(explanation, indent = "  "))
        }
        if (modelAnswer != null) {
            sb.appendLine("""  #v(3pt)""")
            sb.appendLine("""  *모범답안:* ${MarkupToTypst.inline(modelAnswer)}""")
        }
        sb.appendLine("""]""")
    }

    private fun numberOf(q: Map<String, Any?>): Int = (q["number"] as? Number)?.toInt() ?: 0

    private fun fontSizeForLevel(levelId: String?): Double = when {
        levelId == null -> 10.5
        levelId.startsWith("SAUSSURE", ignoreCase = true) -> 12.0
        levelId.startsWith("FREGE", ignoreCase = true) -> 11.0
        levelId.startsWith("RUSSELL", ignoreCase = true) -> 10.0
        levelId.startsWith("WITTGENSTEIN", ignoreCase = true) -> 9.0
        else -> 10.5
    }
}
