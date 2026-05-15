package com.korfarm.api.textbook

/**
 * Textbook payload(JSON Map) → Typst 소스.
 *
 * 디자인 하네스 PAGE_BREAK_POLICY v45 의 핵심 규칙을 Typst 로 매핑:
 *  - A4 고정       → #set page(paper: "a4", margin: ...)
 *  - 다단 auto    → #columns(2, gutter: 8mm)[...]   (디폴트 auto)
 *  - 한 덩이 결속 → #block(breakable: false)[...]   (문제 블록은 항상)
 *  - 페이지/단 강제 분리 → #pagebreak() / #colbreak()
 *  - 정답·해설   → mode=student 면 출력 X
 *  - 좌우 페이지 헤더/푸터 → #set page(header: context { ... })
 *  - 알 수 없는 블록 → raw 박스 (PDF 에서도 누락 0 보장)
 */
class TextbookTypstBuilder(
    private val textbook: Map<String, Any?>,
    private val hasHcrFont: Boolean,
    private val imageMap: Map<String, String> = emptyMap(),
    private val mode: Mode = Mode.STUDENT,
) {
    enum class Mode { STUDENT, ANSWER }

    @Suppress("UNCHECKED_CAST")
    private val pages: List<Map<String, Any?>> =
        (textbook["pages"] as? List<Map<String, Any?>>) ?: emptyList()

    @Suppress("UNCHECKED_CAST")
    private val header: Map<String, Any?> =
        (textbook["header"] as? Map<String, Any?>) ?: emptyMap()

    @Suppress("UNCHECKED_CAST")
    private val footer: Map<String, Any?> =
        (textbook["footer"] as? Map<String, Any?>) ?: emptyMap()

    private val title: String = (textbook["title"] as? String) ?: ""
    private val series: String = (textbook["series"] as? String) ?: "custom"
    private val level: Int = (textbook["level"] as? Number)?.toInt() ?: 1

    fun build(): String {
        val sb = StringBuilder()
        appendPreamble(sb)
        appendPageSetup(sb)
        // 본문 — 페이지 단위 #pagebreak() 로 분리
        pages.forEachIndexed { idx, page ->
            if (idx > 0) sb.appendLine("#pagebreak()")
            renderPage(sb, page)
        }
        return sb.toString()
    }

    // ─── preamble ────────────────────────────────────────────────

    private fun appendPreamble(sb: StringBuilder) {
        val fontStack = if (hasHcrFont)
            "(\"HCR Batang\", \"Noto Serif CJK KR\", \"Noto Sans CJK KR\")"
        else
            "(\"Noto Serif CJK KR\", \"Noto Sans CJK KR\")"
        val fontSize = fontSizeForLevel(level)
        sb.appendLine("""#set text(font: $fontStack, size: ${fontSize}pt, lang: "ko")""")
        sb.appendLine("""#set par(leading: 0.75em, justify: true, spacing: 1.2em)""")
        sb.appendLine()
    }

    private fun fontSizeForLevel(level: Int): String = when {
        level <= 3 -> "12"     // 소쉬르
        level <= 6 -> "10.5"   // 프레게
        level <= 9 -> "10"     // 러셀
        else       -> "9.5"    // 비트
    }

    // ─── page setup (좌우 페이지 헤더/푸터 분기) ──────────────────

    private fun appendPageSetup(sb: StringBuilder) {
        val headerOuter = renderSlot(header["outer"])
        val headerInner = renderSlot(header["inner"])
        val footerOuter = renderSlot(footer["outer"])
        val footerInner = renderSlot(footer["inner"])

        // typst: 짝수 페이지(왼쪽)에서 outer=좌, inner=우 / 홀수에서 outer=우, inner=좌
        sb.appendLine("""#set page(""")
        sb.appendLine("""  paper: "a4", margin: (x: 16mm, y: 18mm),""")
        sb.appendLine("""  header: context {""")
        sb.appendLine("""    let p = here().page()""")
        sb.appendLine("""    if calc.even(p) {""")
        sb.appendLine("""      grid(columns: (1fr, 1fr), align(left)[$headerOuter], align(right)[$headerInner])""")
        sb.appendLine("""    } else {""")
        sb.appendLine("""      grid(columns: (1fr, 1fr), align(left)[$headerInner], align(right)[$headerOuter])""")
        sb.appendLine("""    }""")
        sb.appendLine("""  },""")
        sb.appendLine("""  footer: context {""")
        sb.appendLine("""    let p = here().page()""")
        sb.appendLine("""    if calc.even(p) {""")
        sb.appendLine("""      grid(columns: (1fr, 1fr), align(left)[$footerOuter], align(right)[$footerInner])""")
        sb.appendLine("""    } else {""")
        sb.appendLine("""      grid(columns: (1fr, 1fr), align(left)[$footerInner], align(right)[$footerOuter])""")
        sb.appendLine("""    }""")
        sb.appendLine("""  },""")
        sb.appendLine(""")""")
        sb.appendLine()
    }

    private fun renderSlot(slot: Any?): String {
        if (slot !is Map<*, *>) return ""
        return when (slot["kind"] as? String) {
            "logo"        -> "*국어농장*"
            "pageNumber"  -> "#text(weight: \"bold\")[#counter(page).display()]"
            "areaName"    -> escapeTypst(title)
            "chapterName" -> "" // 추후
            "text"        -> escapeTypst((slot["text"] as? String) ?: "")
            "none", null  -> ""
            else          -> ""
        }
    }

    // ─── 페이지 렌더 ─────────────────────────────────────────────

    private fun renderPage(sb: StringBuilder, page: Map<String, Any?>) {
        @Suppress("UNCHECKED_CAST")
        val blocks = (page["blocks"] as? List<Map<String, Any?>>) ?: emptyList()
        @Suppress("UNCHECKED_CAST")
        val ranges = (page["multicolRanges"] as? List<Map<String, Any?>>) ?: emptyList()

        if (ranges.isEmpty()) {
            // 전체 단일 단
            for (b in blocks) renderBlock(sb, b)
            return
        }

        // 일부 구간만 다단 — 사용자 정책: balance 아니라 auto
        val sortedRanges = ranges.sortedBy { (it["from"] as? Number)?.toInt() ?: 0 }
        var cursor = 0
        for (r in sortedRanges) {
            val from = (r["from"] as? Number)?.toInt() ?: 0
            val to = (r["to"] as? Number)?.toInt() ?: from
            val cols = (r["columns"] as? Number)?.toInt() ?: 2
            if (cursor < from) {
                for (i in cursor until from) blocks.getOrNull(i)?.let { renderBlock(sb, it) }
            }
            sb.appendLine("#columns($cols, gutter: 8mm)[")
            for (i in from..to) blocks.getOrNull(i)?.let { renderBlock(sb, it) }
            sb.appendLine("]")
            cursor = to + 1
        }
        if (cursor < blocks.size) {
            for (i in cursor until blocks.size) blocks.getOrNull(i)?.let { renderBlock(sb, it) }
        }
    }

    // ─── 블록 분기 ───────────────────────────────────────────────

    private fun renderBlock(sb: StringBuilder, block: Map<String, Any?>) {
        when (val type = block["type"] as? String) {
            // 1. 골격
            "book-cover"      -> renderBookCover(sb, block)
            "chapter-cover"   -> renderChapterCover(sb, block)
            "area-header"     -> renderAreaHeader(sb, block)
            "section-label"   -> renderSectionLabel(sb, block)
            "whitespace-art"  -> renderWhitespaceArt(sb, block)
            // 2. 본문
            "concept"         -> renderConcept(sb, block)
            "vocab-list"      -> renderVocabList(sb, block)
            "passage-note",
            "passage-note-nt",
            "passage-full",
            "passage-full-nt" -> renderPassage(sb, block, type)
            "passage-hint"    -> renderPassageHint(sb, block)
            "image"           -> renderImage(sb, block)
            // 4. 문제 (한 덩이 보장)
            "question"        -> renderQuestion(sb, block)
            // 6. 정답·해설 (학생용 빌드 제외)
            "answer-explain",
            "model-answer"    -> if (mode == Mode.ANSWER) renderAnswerOnly(sb, block, type)
            // 8. 흐름 제어
            "page-break"      -> sb.appendLine("#pagebreak()")
            "column-break"    -> sb.appendLine("#colbreak()")
            "spacer"          -> {
                val h = (block["heightMm"] as? Number)?.toDouble() ?: 8.0
                sb.appendLine("#v(${h}mm)")
            }
            "keep-together"   -> {
                @Suppress("UNCHECKED_CAST")
                val children = (block["blocks"] as? List<Map<String, Any?>>) ?: emptyList()
                sb.appendLine("#block(breakable: false)[")
                for (c in children) renderBlock(sb, c)
                sb.appendLine("]")
            }
            // 9. Unknown 및 미구현 — raw 박스로 보존 (절대 누락 X)
            "unknown" -> renderUnknown(sb, block)
            else      -> renderFallback(sb, block, type ?: "?")
        }
    }

    // ─── 골격 블록 ───────────────────────────────────────────────

    private fun renderBookCover(sb: StringBuilder, b: Map<String, Any?>) {
        val series = (b["series"] as? String) ?: this.series
        val lv = (b["level"] as? Number)?.toInt() ?: 1
        val vol = (b["volume"] as? Number)?.toInt() ?: 1
        val sub = (b["subtitle"] as? String) ?: ""
        sb.appendLine("""#align(center + horizon)[""")
        sb.appendLine("""  #text(size: 36pt, weight: "bold")[${escapeTypst(series.uppercase())}]""")
        sb.appendLine("""  #v(10mm)""")
        sb.appendLine("""  #text(size: 16pt)[Level $lv · ${vol}권]""")
        if (sub.isNotBlank()) {
            sb.appendLine("""  #v(6mm)""")
            sb.appendLine("""  #text(size: 12pt)[${escapeTypst(sub)}]""")
        }
        sb.appendLine("""]""")
        sb.appendLine()
    }

    private fun renderChapterCover(sb: StringBuilder, b: Map<String, Any?>) {
        val num = (b["chapterNumber"] as? Number)?.toInt() ?: 1
        val name = (b["chapterName"] as? String) ?: ""
        val intro = (b["intro"] as? String) ?: ""
        val label = (b["chapterLabel"] as? String) ?: "Chapter $num"
        sb.appendLine("""#align(center + horizon)[""")
        sb.appendLine("""  #circle(radius: 14mm, fill: rgb(44, 62, 112))[""")
        sb.appendLine("""    #align(center + horizon)[#text(size: 24pt, weight: "bold", fill: white)[${num.toString().padStart(2, '0')}]]""")
        sb.appendLine("""  ]""")
        sb.appendLine("""  #v(6mm)""")
        sb.appendLine("""  #text(size: 11pt, fill: gray)[${escapeTypst(label)}]""")
        sb.appendLine("""  #v(2mm)""")
        sb.appendLine("""  #text(size: 22pt, weight: "bold")[${escapeTypst(name)}]""")
        if (intro.isNotBlank()) {
            sb.appendLine("""  #v(6mm)""")
            sb.appendLine("""  #text(size: 11pt)[${escapeTypst(intro)}]""")
        }
        sb.appendLine("""]""")
        sb.appendLine()
    }

    private fun renderAreaHeader(sb: StringBuilder, b: Map<String, Any?>) {
        val area = (b["area"] as? String) ?: ""
        val sub = (b["subtitle"] as? String) ?: ""
        val label = areaLabel(area)
        sb.appendLine("""#block(stroke: (left: 3pt + rgb(44, 62, 112)), inset: (left: 6pt, y: 4pt))[""")
        sb.appendLine("""  #text(size: 14pt, weight: "bold")[${escapeTypst(label)}]""")
        if (sub.isNotBlank()) {
            sb.appendLine("""  \ #text(size: 10pt, fill: gray)[${escapeTypst(sub)}]""")
        }
        sb.appendLine("""]""")
        sb.appendLine("""#v(4pt)""")
    }

    private fun renderSectionLabel(sb: StringBuilder, b: Map<String, Any?>) {
        val kind = (b["kind"] as? String) ?: "passage"
        val sub = (b["subtitle"] as? String) ?: ""
        val lab = sectionLabel(kind)
        sb.appendLine("""#block(below: 4pt)[""")
        sb.appendLine("""  #text(size: 11pt, fill: rgb(44, 62, 112), weight: "bold")[\[ ${escapeTypst(lab)} \]]""")
        if (sub.isNotBlank()) sb.appendLine("""  #text(size: 10pt, fill: gray)[ ${escapeTypst(sub)}]""")
        sb.appendLine("""]""")
    }

    private fun renderWhitespaceArt(sb: StringBuilder, b: Map<String, Any?>) {
        val assetId = (b["assetId"] as? String) ?: return
        val local = imageMap.values.firstOrNull { it.contains(assetId) } ?: return
        sb.appendLine("""#align(center)[#image("$local", width: 60mm)]""")
    }

    // ─── 본문 블록 ───────────────────────────────────────────────

    private fun renderConcept(sb: StringBuilder, b: Map<String, Any?>) {
        val text = (b["text"] as? String) ?: ""
        sb.appendLine("""#block(stroke: 0.5pt + gray, inset: 8pt, radius: 3pt, fill: rgb("#fafafa"))[""")
        sb.appendLine(processMarkdown(text))
        @Suppress("UNCHECKED_CAST")
        val examples = (b["examples"] as? List<String>) ?: emptyList()
        if (examples.isNotEmpty()) {
            sb.appendLine()
            for (ex in examples) sb.appendLine("- ${processMarkdown(ex)}")
        }
        sb.appendLine("""]""")
        sb.appendLine()
    }

    private fun renderVocabList(sb: StringBuilder, b: Map<String, Any?>) {
        @Suppress("UNCHECKED_CAST")
        val items = (b["items"] as? List<Map<String, Any?>>) ?: emptyList()
        if (items.isEmpty()) return
        sb.appendLine("#table(columns: (auto, 1fr),")
        for (it in items) {
            val num = (it["number"] as? Number)?.toInt() ?: 0
            val word = (it["word"] as? String) ?: ""
            val hanja = (it["hanja"] as? String)?.takeIf { it.isNotBlank() }?.let { " ($it)" } ?: ""
            val meaning = (it["meaning"] as? String) ?: ""
            sb.appendLine("  [$num], [*${escapeTypst(word + hanja)}* \\ ${escapeTypst(meaning)}],")
        }
        sb.appendLine(")")
        sb.appendLine()
    }

    private fun renderPassage(sb: StringBuilder, b: Map<String, Any?>, type: String) {
        val title = (b["title"] as? String) ?: ""
        val text = passageText(b["text"])
        val hasTitle = type == "passage-note" || type == "passage-full"
        val hasMemo = type == "passage-note" || type == "passage-note-nt"

        if (hasMemo) {
            // 본문 + 메모란 (2-단 grid)
            sb.appendLine("""#grid(columns: (1fr, 34mm), column-gutter: 3mm, ["""")
            sb.appendLine("""  #block(stroke: 0.5pt + gray, inset: 8pt, radius: 3pt, fill: rgb("#FAF8F2"))[""")
            if (hasTitle && title.isNotBlank()) sb.appendLine("""    #text(weight: "bold")[${escapeTypst(title)}] \ """)
            sb.appendLine(text)
            sb.appendLine("""  ]""")
            sb.appendLine("""], [""")
            sb.appendLine("""  #text(size: 9pt, fill: gray)[메모]""")
            sb.appendLine("""])""")
        } else {
            sb.appendLine("""#block(stroke: 0.5pt + gray, inset: 8pt, radius: 3pt, fill: rgb("#fafafa"))[""")
            if (hasTitle && title.isNotBlank()) sb.appendLine("""  #text(weight: "bold")[${escapeTypst(title)}] \ """)
            sb.appendLine(text)
            sb.appendLine("""]""")
        }
        sb.appendLine()
    }

    private fun renderImage(sb: StringBuilder, b: Map<String, Any?>) {
        val assetId = (b["assetId"] as? String).orEmpty()
        val url = (b["url"] as? String) ?: if (assetId.isNotBlank()) "/v1/files/$assetId/download" else ""
        val local = imageMap[url] ?: imageMap.values.firstOrNull { it.contains(assetId) }
        if (local.isNullOrBlank()) return
        val widthMm = (b["widthMm"] as? Number)?.toDouble() ?: 60.0
        val heightMm = (b["heightMm"] as? Number)?.toDouble()
        val alignment = (b["alignment"] as? String) ?: "center"
        val alignTypst = when (alignment) { "left" -> "left"; "right" -> "right"; else -> "center" }
        val sizeArg = if (heightMm != null) "width: ${widthMm}mm, height: ${heightMm}mm"
                      else "width: ${widthMm}mm"
        sb.appendLine("""#align($alignTypst)[#image("$local", $sizeArg)]""")
        val caption = (b["caption"] as? String)?.takeIf { it.isNotBlank() }
        if (caption != null) {
            sb.appendLine("""#align($alignTypst)[#text(size: 9pt, fill: gray)[${escapeTypst(caption)}]]""")
        }
        sb.appendLine()
    }

    private fun renderPassageHint(sb: StringBuilder, b: Map<String, Any?>) {
        val title = (b["title"] as? String) ?: ""
        val body = (b["body"] as? String) ?: ""
        sb.appendLine("""#block(stroke: 0.5pt + rgb("#c9d6f5"), inset: 6pt, radius: 3pt, fill: rgb("#f0f4ff"))[""")
        if (title.isNotBlank()) sb.appendLine("""  *${escapeTypst(title)}* \ """)
        sb.appendLine(processMarkdown(body))
        sb.appendLine("""]""")
    }

    // ─── 문제 (한 덩이 보장) ─────────────────────────────────────

    private fun renderQuestion(sb: StringBuilder, b: Map<String, Any?>) {
        val num = (b["number"] as? Number)?.toInt() ?: 0
        val qType = (b["qType"] as? String) ?: "multipleChoice"
        val stem = (b["stem"] as? String) ?: ""
        val box = (b["box"] as? String)
        @Suppress("UNCHECKED_CAST")
        val conditions = (b["conditions"] as? List<String>) ?: emptyList()
        @Suppress("UNCHECKED_CAST")
        val choices = (b["choices"] as? List<Map<String, Any?>>) ?: emptyList()

        val badge = when (qType) {
            "shortAnswer" -> "rgb(\"#27ae60\")"
            "essay"       -> "rgb(\"#e67e22\")"
            else          -> "rgb(\"#3498db\")"
        }

        // 핵심: breakable: false — 발문~선택지~답안란이 한 덩이로
        sb.appendLine("""#block(breakable: false, above: 6pt, below: 6pt)[""")
        sb.appendLine("""  #text(size: 9pt, fill: white)[#box(fill: $badge, inset: (x: 4pt, y: 1pt), radius: 2pt)[${num.toString().padStart(2, '0')}]] """)
        sb.append("  ").appendLine(underlineNegation(processMarkdown(stem)))
        if (!box.isNullOrBlank()) {
            sb.appendLine("""  #block(stroke: 0.5pt + gray, inset: 4pt, radius: 2pt, above: 4pt, below: 4pt, fill: rgb("#fafafa"))[*<보기>* ${processMarkdown(box)}]""")
        }
        if (conditions.isNotEmpty()) {
            sb.appendLine("""  #block(stroke: 0.5pt + gray, inset: 4pt, radius: 2pt, above: 4pt, below: 4pt, fill: rgb("#fafafa"))[*<조건>*""")
            for ((i, c) in conditions.withIndex()) sb.appendLine("    ${i + 1}. ${processMarkdown(c)}")
            sb.appendLine("""  ]""")
        }
        if (qType == "multipleChoice" && choices.isNotEmpty()) {
            for (c in choices) {
                val id = (c["id"] as? String) ?: ""
                val text = (c["text"] as? String) ?: ""
                sb.appendLine("  $id ${processMarkdown(text)} \\")
            }
        }
        if (qType == "shortAnswer") {
            val lines = ((b["answerLines"] as? Map<*, *>)?.get("lines") as? Number)?.toInt() ?: 1
            repeat(lines) {
                sb.appendLine("""  #v(4pt) #line(length: 100%, stroke: 0.5pt)""")
            }
        }
        if (qType == "essay") {
            val note = (b["answerNote"] as? Map<*, *>)
            val label = (note?.get("label") as? String) ?: ""
            val lines = (note?.get("lines") as? Number)?.toInt() ?: 4
            sb.appendLine("""  #block(stroke: 0.5pt + gray, inset: 6pt, radius: 2pt, above: 4pt)[""")
            if (label.isNotBlank()) sb.appendLine("""    #text(size: 9pt, fill: gray)[${escapeTypst(label)}] \ """)
            repeat(lines) {
                sb.appendLine("""    #v(4pt) #line(length: 100%, stroke: 0.5pt)""")
            }
            sb.appendLine("""  ]""")
        }
        if (mode == Mode.ANSWER) {
            val ans = (b["answer"] as? String)?.takeIf { it.isNotBlank() }
            val exp = (b["explanation"] as? String)?.takeIf { it.isNotBlank() }
            if (ans != null || exp != null) {
                sb.appendLine("""  #block(stroke: 1pt + rgb("#f1c40f"), fill: rgb("#fffbe6"), inset: 6pt, radius: 2pt, above: 4pt)[""")
                if (ans != null) sb.appendLine("""    *정답.* ${escapeTypst(ans)} \ """)
                if (exp != null) sb.appendLine("""    *해설.* ${processMarkdown(exp)}""")
                sb.appendLine("""  ]""")
            }
        }
        sb.appendLine("""]""")
        sb.appendLine()
    }

    private fun renderAnswerOnly(sb: StringBuilder, b: Map<String, Any?>, type: String) {
        val body = (b["body"] as? String) ?: return
        val label = if (type == "answer-explain") "해설" else "모범 답안"
        sb.appendLine("""#block(stroke: 1pt + rgb("#f1c40f"), fill: rgb("#fffbe6"), inset: 6pt, radius: 2pt)[""")
        sb.appendLine("""  *$label.* ${processMarkdown(body)}""")
        sb.appendLine("""]""")
    }

    // ─── Unknown / Fallback ──────────────────────────────────────

    private fun renderUnknown(sb: StringBuilder, b: Map<String, Any?>) {
        val raw = (b["raw"] as? String) ?: b.toString()
        val note = (b["note"] as? String) ?: "알 수 없는 블록 (원본 보존)"
        sb.appendLine("""#block(stroke: (paint: rgb("#d68910"), thickness: 0.5pt, dash: "dashed"), fill: rgb("#fff5e6"), inset: 6pt, radius: 2pt)[""")
        sb.appendLine("""  #text(size: 8pt, fill: rgb("#7e5109"), weight: "bold")[⚠ ${escapeTypst(note)}] \ """)
        sb.appendLine("""  #text(size: 8pt, font: ("Noto Sans Mono CJK KR", "Consolas"))[${escapeTypst(raw.take(500))}]""")
        sb.appendLine("""]""")
    }

    private fun renderFallback(sb: StringBuilder, b: Map<String, Any?>, type: String) {
        renderUnknown(sb, mapOf("raw" to b.toString(), "note" to "'$type' 타입은 아직 정밀 변환 없음 — 원본 보존"))
    }

    // ─── 유틸 ────────────────────────────────────────────────────

    @Suppress("UNCHECKED_CAST")
    private fun passageText(value: Any?): String = when (value) {
        is String   -> processMarkdown(value)
        is List<*>  -> value.joinToString("\n\n") { processMarkdown(it?.toString() ?: "") }
        is Map<*, *> -> (value as Map<String, Any?>).values.joinToString("\n\n") {
            processMarkdown(it?.toString() ?: "")
        }
        null -> ""
        else -> processMarkdown(value.toString())
    }

    /**
     * markdown → typst 변환 (단순). 1차에서는:
     *  - escape typst 특수문자
     *  - 줄바꿈 보존
     *  - ![alt](url) → #image("local") (imageMap 활용)
     *  - **bold** → *bold*, *italic* → _italic_
     */
    private fun processMarkdown(input: String): String {
        if (input.isEmpty()) return ""
        // 이미지 먼저 분리 — escape 전에
        val imgRegex = Regex("""!\[[^\]]*\]\(([^)]+)\)""")
        val withImages = imgRegex.replace(input) { m ->
            val url = m.groupValues[1]
            val local = imageMap[url] ?: imageMap.values.firstOrNull { url.contains(it) }
            if (local != null) "IMG:$local" else ""
        }
        val escaped = escapeTypst(withImages)
            .replace("IMG:", """#image(""")
            .replace("", """")""")
        // bold/italic (markdown → typst)
        return escaped
            .replace(Regex("""\*\*([^*]+)\*\*"""), "*$1*")
    }

    private fun escapeTypst(text: String): String {
        // typst special chars
        return text
            .replace("\\", """\\""")
            .replace("$", """\$""")
            .replace("#", """\#""")
            .replace("@", """\@""")
            .replace("<", """\<""")
            .replace(">", """\>""")
            .replace("[", """\[""")
            .replace("]", """\]""")
            // typst 의 * 와 _ 는 emphasis 마커. 단순 escape.
            .replace("_", """\_""")
    }

    private fun underlineNegation(text: String): String {
        // typst 의 underline 은 #underline[..]. 우리는 markdown 처리 후라 \\\\_ 가 사라진 상태.
        // 1차에서는 단순 처리: 부정 표현을 강조 텍스트로.
        return text.replace(Regex("""(않은|없는|아닌|다른\s*하나)"""), """#underline[$1]""")
    }

    private fun areaLabel(area: String): String = when (area) {
        "vocab" -> "어휘"; "grammar" -> "문법"; "concept" -> "개념"
        "literature" -> "문학"; "nonfiction" -> "비문학"; "weekly" -> "실력 확인"
        else -> "기타"
    }

    private fun sectionLabel(kind: String): String = when (kind) {
        "passage" -> "지문"; "activity" -> "활동"; "question" -> "문제"
        "writing" -> "글쓰기"; "explain" -> "해설"; "structure" -> "구조"
        else -> kind
    }
}
