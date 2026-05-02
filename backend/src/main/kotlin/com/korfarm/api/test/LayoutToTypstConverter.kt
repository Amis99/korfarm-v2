package com.korfarm.api.test

import org.springframework.stereotype.Service

/**
 * 시험지 layout JSON → Typst 코드 변환.
 * 비주얼 편집기 결과를 typst 로 컴파일하기 위해 사용.
 *
 * Layout schema (v2):
 * {
 *   "version": "2.0",
 *   "type": "paper" | "answer",
 *   "title": "...",
 *   "header": { "title": "...", "meta": "..." } | null,
 *   "columns": 1 | 2,                 // 본문 다단
 *   "blocks": [ Block, ... ]          // 페이지 자동 분할 (typst 가 처리)
 * }
 *
 * Block types: info / text / image / passage / question / box / page-break /
 *   answer-table / answer-explanation / heading / spacer
 */
@Service
class LayoutToTypstConverter {

    fun convert(layout: Map<String, Any?>): String {
        val sb = StringBuilder()
        sb.append(commonHeader())
        sb.appendLine()

        @Suppress("UNCHECKED_CAST")
        val header = layout["header"] as? Map<String, Any?>
        if (header != null) {
            val title = (header["title"] as? String).orEmpty()
            val meta = (header["meta"] as? String).orEmpty()
            if (title.isNotBlank() || meta.isNotBlank()) {
                sb.appendLine("#align(center)[")
                if (title.isNotBlank())
                    sb.appendLine("  #text(size: 16pt, weight: \"bold\")[${escape(title)}]")
                if (meta.isNotBlank()) {
                    sb.appendLine("  #v(4pt)")
                    sb.appendLine("  #text(size: 10pt, fill: gray)[${escape(meta)}]")
                }
                sb.appendLine("]")
                sb.appendLine("#v(8pt)")
            }
        }

        val columns = (layout["columns"] as? Number)?.toInt() ?: 1
        @Suppress("UNCHECKED_CAST")
        val blocks = (layout["blocks"] as? List<Map<String, Any?>>) ?: emptyList()

        if (columns == 2) {
            sb.appendLine("#columns(2, gutter: 12pt)[")
            blocks.forEach { sb.appendLine(renderBlock(it, indent = "  ")) }
            sb.appendLine("]")
        } else {
            blocks.forEach { sb.appendLine(renderBlock(it, indent = "")) }
        }

        return sb.toString()
    }

    private fun renderBlock(block: Map<String, Any?>, indent: String): String {
        val type = block["type"] as? String ?: return ""
        return when (type) {
            "info" -> renderInfo(block, indent)
            "text" -> renderText(block, indent)
            "image" -> renderImage(block, indent)
            "passage" -> renderPassage(block, indent)
            "question" -> renderQuestion(block, indent)
            "box" -> renderBox(block, indent)
            "page-break" -> "${indent}#pagebreak()"
            "spacer" -> {
                val h = (block["height"] as? Number)?.toInt() ?: 8
                "${indent}#v(${h}pt)"
            }
            "heading" -> {
                val level = (block["level"] as? Number)?.toInt() ?: 2
                val text = (block["text"] as? String).orEmpty()
                val prefix = "=".repeat(level.coerceIn(1, 4))
                "${indent}$prefix ${escape(text)}"
            }
            "answer-table" -> renderAnswerTable(block, indent)
            "answer-explanation" -> renderAnswerExplanation(block, indent)
            else -> ""
        }
    }

    private fun renderInfo(b: Map<String, Any?>, indent: String): String {
        val text = (b["text"] as? String) ?: (b["html"] as? String) ?: ""
        return """${indent}#box(stroke: 0.5pt + gray, inset: 8pt, radius: 4pt, width: 100%)[${escape(text)}]"""
    }

    private fun renderText(b: Map<String, Any?>, indent: String): String {
        val text = (b["text"] as? String) ?: ""
        val align = (b["align"] as? String)
        val body = if (text.isBlank()) "" else paragraphs(text)
        return when (align) {
            "left" -> "${indent}#align(left)[${body}]"
            "right" -> "${indent}#align(right)[${body}]"
            "center" -> "${indent}#align(center)[${body}]"
            "justify" -> "${indent}#par(justify: true)[${body}]"
            else -> "${indent}${body}"
        }
    }

    private fun renderImage(b: Map<String, Any?>, indent: String): String {
        val fileId = b["fileId"] as? String
        if (fileId.isNullOrBlank()) return "${indent}// (이미지 미설정)"
        val width = (b["width"] as? String) ?: "60%"
        val align = (b["align"] as? String) ?: "center"
        val caption = (b["caption"] as? String).orEmpty()
        // TODO: 이미지 파일 경로는 컴파일 시 임시 디렉토리에 다운로드 후 참조 (현 구현은 placeholder)
        // 우선 자리 표시자로 빈 박스
        val sb = StringBuilder()
        sb.append("${indent}#align($align)[")
        sb.append("#box(stroke: 0.5pt + gray, inset: 12pt, width: $width)[")
        sb.append("#text(fill: gray)[(이미지: $fileId)]")
        sb.append("]")
        if (caption.isNotBlank()) {
            sb.append("#v(2pt) #text(size: 9pt, fill: gray)[${escape(caption)}]")
        }
        sb.append("]")
        return sb.toString()
    }

    private fun renderPassage(b: Map<String, Any?>, indent: String): String {
        val label = (b["label"] as? String).orEmpty()
        val text = (b["text"] as? String) ?: (b["html"] as? String) ?: ""
        val sb = StringBuilder()
        if (label.isNotBlank()) {
            sb.appendLine("${indent}#text(weight: \"bold\")[${escape(label)}] 다음 글을 읽고 답하시오.")
            sb.appendLine("${indent}#v(2pt)")
        }
        sb.append("${indent}#par(justify: true)[${paragraphs(text)}]")
        sb.appendLine()
        sb.append("${indent}#v(6pt)")
        return sb.toString()
    }

    private fun renderQuestion(b: Map<String, Any?>, indent: String): String {
        val no = (b["no"] as? Number)?.toInt() ?: 0
        val stem = (b["stem"] as? String).orEmpty()
        val points = (b["points"] as? Number)?.toInt()
        val qType = (b["questionType"] as? String) ?: "MULTI_CHOICE"
        @Suppress("UNCHECKED_CAST")
        val choices = (b["choices"] as? List<Map<String, Any?>>) ?: emptyList()

        val sb = StringBuilder()
        val pointsTxt = if (points != null) " #h(0.5em) #text(size: 9pt, fill: gray)[(${points}점)]" else ""
        sb.appendLine("${indent}*${no}.* ${escape(stem)}$pointsTxt")
        if (qType == "ESSAY") {
            sb.appendLine("${indent}#v(4pt)")
            sb.appendLine("${indent}#box(stroke: 0.5pt + gray, inset: 4pt, width: 100%, height: 60pt)[]")
        } else if (choices.isNotEmpty()) {
            choices.forEachIndexed { idx, c ->
                val marker = (c["marker"] as? String)?.takeIf { it.isNotBlank() }
                    ?: "①②③④⑤".getOrNull(idx)?.toString() ?: "${idx + 1})"
                val text = (c["text"] as? String).orEmpty()
                sb.appendLine("${indent}#h(1em) ${escape(marker)}  ${escape(text)} \\")
            }
        }
        sb.append("${indent}#v(4pt)")
        return sb.toString()
    }

    private fun renderBox(b: Map<String, Any?>, indent: String): String {
        val label = (b["label"] as? String).orEmpty()
        val text = (b["text"] as? String) ?: (b["html"] as? String) ?: ""
        val sb = StringBuilder()
        sb.appendLine("${indent}#box(stroke: 1pt + black, inset: 8pt, radius: 4pt, width: 100%)[")
        if (label.isNotBlank()) {
            sb.appendLine("${indent}  #text(weight: \"bold\")[${escape(label)}]")
            sb.appendLine("${indent}  #v(2pt)")
        }
        sb.appendLine("${indent}  ${paragraphs(text)}")
        sb.append("${indent}]")
        return sb.toString()
    }

    private fun renderAnswerTable(b: Map<String, Any?>, indent: String): String {
        @Suppress("UNCHECKED_CAST")
        val rows = (b["rows"] as? List<Map<String, Any?>>) ?: emptyList()
        if (rows.isEmpty()) return "${indent}// (정답 행 없음)"
        val sb = StringBuilder()
        sb.appendLine("${indent}#table(")
        sb.appendLine("${indent}  columns: (auto, auto, auto),")
        sb.appendLine("${indent}  align: center + horizon,")
        sb.appendLine("${indent}  stroke: 0.5pt,")
        sb.appendLine("${indent}  fill: (col, row) => if row == 0 { rgb(\"#f0eae5\") } else { white },")
        sb.appendLine("${indent}  table.header([*번호*], [*정답*], [*배점*]),")
        rows.forEach { r ->
            val no = (r["no"] as? Number)?.toInt() ?: 0
            val ans = (r["answer"] as? String) ?: ""
            val pts = (r["points"] as? Number)?.toInt() ?: 0
            sb.appendLine("${indent}  [$no], [${escape(ans)}], [$pts],")
        }
        sb.append("${indent})")
        return sb.toString()
    }

    private fun renderAnswerExplanation(b: Map<String, Any?>, indent: String): String {
        val no = (b["no"] as? Number)?.toInt() ?: 0
        val answer = (b["answer"] as? String).orEmpty()
        val points = (b["points"] as? Number)?.toInt()
        val explanation = (b["explanation"] as? String).orEmpty()
        val modelAnswer = (b["modelAnswer"] as? String).orEmpty()
        val sb = StringBuilder()
        sb.appendLine("${indent}#block(above: 6pt, below: 4pt, breakable: false)[")
        sb.appendLine("${indent}  #box(fill: rgb(\"#faf3f1\"), inset: 6pt, radius: 3pt, width: 100%)[")
        val ptsTxt = if (points != null) " #text(size: 9pt, fill: gray)[(${points}점)]" else ""
        sb.appendLine("${indent}    *${no}.* 정답 #text(fill: rgb(\"#c0392b\"))[*${escape(answer)}*]$ptsTxt")
        if (explanation.isNotBlank()) {
            sb.appendLine("${indent}    #v(4pt)")
            sb.appendLine("${indent}    ${paragraphs(explanation)}")
        }
        if (modelAnswer.isNotBlank()) {
            sb.appendLine("${indent}    #v(4pt)")
            sb.appendLine("${indent}    *모범답안:* ${escape(modelAnswer)}")
        }
        sb.appendLine("${indent}  ]")
        sb.append("${indent}]")
        return sb.toString()
    }

    private fun commonHeader(): String = """
        // ─── 자동 생성 (편집기 → typst) ───
        #set page(paper: "a4", margin: (x: 16mm, y: 18mm))
        #set text(font: "Noto Sans CJK KR", size: 11pt, lang: "ko")
        #set par(leading: 0.7em)
    """.trimIndent()

    private fun paragraphs(text: String): String {
        if (text.isBlank()) return ""
        return text.replace("\r\n", "\n")
            .split(Regex("\n\\s*\n"))
            .joinToString("\n\n") { escape(it.replace("\n", " ")) }
    }

    /** Typst 텍스트에 안전한 escape (italic·bold·heading·function 마커 모두 처리) */
    private fun escape(s: String): String {
        if (s.isEmpty()) return s
        val sb = StringBuilder(s.length)
        for (c in s) {
            when (c) {
                '\\', '#', '$', '*', '_', '`', '[', ']' -> sb.append('\\').append(c)
                else -> sb.append(c)
            }
        }
        return sb.toString()
    }
}
