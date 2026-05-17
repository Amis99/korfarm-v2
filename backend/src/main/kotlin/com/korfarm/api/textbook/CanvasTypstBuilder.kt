package com.korfarm.api.textbook

/**
 * 캔바 모드 (schemaVersion=2) → Typst 소스.
 *
 * 자유 캔버스 좌표(mm)를 Typst #place 로 1:1 매핑.
 *   element.x/y/w/h (mm) → #place(top: Y mm, left: X mm)[#box(width: W mm, height: H mm)[...]]
 *   element.rotation     → #rotate(R deg, origin: center + horizon)[...]
 *   element.opacity      → #box(fill: rgb(..., alpha))  (Typst 0.11+ 만 가능)
 *
 * 흐름 모드 빌더(TextbookTypstBuilder) 와 별도. PDF 출력 시 schemaVersion 으로 분기.
 *
 * 2026-05-17 신설 — Phase 8.
 */
class CanvasTypstBuilder(
    private val textbook: Map<String, Any?>,
    private val hasHcrFont: Boolean,
    private val imageMap: Map<String, String> = emptyMap(),
    private val mode: Mode = Mode.STUDENT,
) {
    enum class Mode { STUDENT, ANSWER }

    @Suppress("UNCHECKED_CAST")
    private val pages: List<Map<String, Any?>> =
        (textbook["pages"] as? List<Map<String, Any?>>) ?: emptyList()

    private val pageWidthMm: Double = (textbook["pageWidthMm"] as? Number)?.toDouble() ?: 210.0
    private val pageHeightMm: Double = (textbook["pageHeightMm"] as? Number)?.toDouble() ?: 297.0
    private val level: Int = (textbook["level"] as? Number)?.toInt() ?: 1

    fun build(): String {
        val sb = StringBuilder()
        appendPreamble(sb)
        appendPageSetup(sb)
        pages.forEachIndexed { idx, page ->
            if (idx > 0) sb.appendLine("#pagebreak()")
            renderPage(sb, page)
        }
        return sb.toString()
    }

    private fun appendPreamble(sb: StringBuilder) {
        val fontStack = if (hasHcrFont)
            "(\"HCR Batang\", \"Noto Serif CJK KR\", \"Noto Sans CJK KR\")"
        else
            "(\"Noto Serif CJK KR\", \"Noto Sans CJK KR\")"
        sb.appendLine("""#set text(font: $fontStack, lang: "ko")""")
        sb.appendLine()
    }

    private fun appendPageSetup(sb: StringBuilder) {
        // A4 고정. 마진 0 — #place 가 절대 좌표를 직접 사용하도록.
        sb.appendLine("""#set page(width: ${fmt(pageWidthMm)}mm, height: ${fmt(pageHeightMm)}mm, margin: 0mm)""")
        sb.appendLine()
    }

    @Suppress("UNCHECKED_CAST")
    private fun renderPage(sb: StringBuilder, page: Map<String, Any?>) {
        val elements = (page["elements"] as? List<Map<String, Any?>>) ?: emptyList()
        // zIndex 오름차순 → 나중 그려진 게 위. Typst 도 후행 #place 가 위 레이어로 깔리도록 순서 보장.
        val sorted = elements.sortedBy { (it["zIndex"] as? Number)?.toDouble() ?: 0.0 }

        // 배경 (선택)
        val background = page["background"] as? Map<*, *>
        renderBackground(sb, background)

        for (el in sorted) {
            val hidden = (el["hidden"] as? Boolean) == true
            if (hidden) continue
            renderElement(sb, el)
        }
    }

    private fun renderBackground(sb: StringBuilder, background: Map<*, *>?) {
        if (background == null) return
        val kind = background["kind"] as? String ?: return
        when (kind) {
            "color" -> {
                val color = (background["color"] as? String) ?: return
                sb.appendLine("""#place(top: 0mm, left: 0mm)[#rect(width: ${fmt(pageWidthMm)}mm, height: ${fmt(pageHeightMm)}mm, fill: ${typstColor(color)}, stroke: none)]""")
            }
            "image" -> {
                val url = (background["imageUrl"] as? String) ?: return
                val local = imageMap[url] ?: return
                sb.appendLine("""#place(top: 0mm, left: 0mm)[#image("$local", width: ${fmt(pageWidthMm)}mm, height: ${fmt(pageHeightMm)}mm)]""")
            }
            else -> { /* none */ }
        }
    }

    private fun renderElement(sb: StringBuilder, el: Map<String, Any?>) {
        val type = (el["type"] as? String) ?: return
        val x = (el["x"] as? Number)?.toDouble() ?: 0.0
        val y = (el["y"] as? Number)?.toDouble() ?: 0.0
        val w = (el["w"] as? Number)?.toDouble() ?: 30.0
        val h = (el["h"] as? Number)?.toDouble() ?: 20.0
        val rotation = (el["rotation"] as? Number)?.toDouble() ?: 0.0
        val opacity = (el["opacity"] as? Number)?.toDouble() ?: 1.0

        val inner = when (type) {
            "text" -> renderText(el, w, h)
            "image" -> renderImage(el, w, h)
            "shape" -> renderShape(el, w, h)
            "sticker" -> renderSticker(el, w, h)
            "domain" -> renderDomain(el, w, h)
            else -> "" // group, unknown — 무시 (group 자식은 직접 렌더)
        }
        if (inner.isBlank()) return

        // 회전 + 투명도. opacity<1 이면 fill alpha 로 처리하기 어려워 일단 무시 (Typst 한계).
        val rotated = if (rotation != 0.0) "#rotate(${fmt(rotation)}deg, origin: center + horizon)[$inner]" else inner
        sb.appendLine("""#place(top: ${fmt(y)}mm, left: ${fmt(x)}mm)[#box(width: ${fmt(w)}mm, height: ${fmt(h)}mm)[$rotated]]""")
        if (opacity in 0.0..0.99) {
            // 로그용 코멘트만. Typst 에는 요소 단위 opacity 직접 적용 어려움.
        }
    }

    private fun renderText(el: Map<String, Any?>, w: Double, h: Double): String {
        val content = (el["content"] as? String) ?: ""
        val fontSize = (el["fontSize"] as? Number)?.toDouble() ?: 14.0
        val color = (el["color"] as? String) ?: "#222222"
        val align = (el["align"] as? String) ?: "left"
        val weight = el["fontWeight"]
        val style = el["fontStyle"] as? String
        val padding = (el["padding"] as? Number)?.toDouble() ?: 0.0
        val bg = el["backgroundColor"] as? String

        val alignKw = when (align) {
            "center" -> "center"
            "right" -> "right"
            "justify" -> "left + horizon"   // justify 는 #par 로 별도 처리
            else -> "left"
        }
        val weightOpt = when (weight) {
            "bold", 700 -> ", weight: \"bold\""
            is Number -> ", weight: ${weight.toInt()}"
            else -> ""
        }
        val styleOpt = if (style == "italic") ", style: \"italic\"" else ""

        val escaped = escapeTypstText(content)
        val padInset = if (padding > 0) "inset: ${fmt(padding)}mm, " else ""
        val bgOpt = if (!bg.isNullOrBlank()) "fill: ${typstColor(bg)}, " else ""
        // 박스로 텍스트 영역 제한 + 가로 align 처리
        return "#box(width: 100%, height: 100%, ${bgOpt}${padInset}stroke: none)[#align($alignKw)[#text(size: ${fmt(fontSize)}pt, fill: ${typstColor(color)}$weightOpt$styleOpt)[$escaped]]]"
    }

    private fun renderImage(el: Map<String, Any?>, w: Double, h: Double): String {
        val url = (el["url"] as? String) ?: return ""
        val local = imageMap[url] ?: return ""
        val fit = (el["objectFit"] as? String) ?: "contain"
        val fitOpt = when (fit) {
            "cover" -> ", fit: \"cover\""
            "fill" -> ", fit: \"stretch\""
            else -> ", fit: \"contain\""
        }
        return "#image(\"$local\", width: ${fmt(w)}mm, height: ${fmt(h)}mm$fitOpt)"
    }

    private fun renderShape(el: Map<String, Any?>, w: Double, h: Double): String {
        val shape = (el["shape"] as? String) ?: "rect"
        val fill = (el["fill"] as? String) ?: "#e8f4ec"
        val stroke = (el["stroke"] as? String) ?: "#2d6a4f"
        val strokeWidth = (el["strokeWidth"] as? Number)?.toDouble() ?: 1.0
        val borderRadius = (el["borderRadius"] as? Number)?.toDouble() ?: 0.0
        val strokeSpec = if (strokeWidth > 0) "stroke: ${fmt(strokeWidth)}mm + ${typstColor(stroke)}" else "stroke: none"
        return when (shape) {
            "ellipse" -> "#ellipse(width: ${fmt(w)}mm, height: ${fmt(h)}mm, fill: ${typstColor(fill)}, $strokeSpec)"
            "line" -> "#line(start: (0mm, 0mm), end: (${fmt(w)}mm, ${fmt(h)}mm), stroke: ${fmt(strokeWidth)}mm + ${typstColor(stroke)})"
            "triangle" -> "#polygon(fill: ${typstColor(fill)}, $strokeSpec, (0mm, ${fmt(h)}mm), (${fmt(w / 2)}mm, 0mm), (${fmt(w)}mm, ${fmt(h)}mm))"
            "arrow" -> "#line(start: (0mm, ${fmt(h / 2)}mm), end: (${fmt(w)}mm, ${fmt(h / 2)}mm), stroke: ${fmt(strokeWidth)}mm + ${typstColor(stroke)})"
            else -> {
                val radius = if (borderRadius > 0) ", radius: ${fmt(borderRadius)}mm" else ""
                "#rect(width: ${fmt(w)}mm, height: ${fmt(h)}mm, fill: ${typstColor(fill)}, $strokeSpec$radius)"
            }
        }
    }

    private fun renderSticker(el: Map<String, Any?>, w: Double, h: Double): String {
        val source = (el["source"] as? String) ?: "emoji"
        val value = (el["value"] as? String) ?: return ""
        return if (source == "emoji") {
            val fontSize = minOf(w, h) * 2.5  // mm → 대략 pt
            "#align(center + horizon)[#text(size: ${fmt(fontSize)}pt)[${escapeTypstText(value)}]]"
        } else {
            val local = imageMap[value] ?: return ""
            "#image(\"$local\", width: ${fmt(w)}mm, height: ${fmt(h)}mm)"
        }
    }

    private fun renderDomain(el: Map<String, Any?>, w: Double, h: Double): String {
        // 1차: props.text 또는 props.title 만 단순 박스로 표시. 완성된 도메인 렌더는 후속.
        @Suppress("UNCHECKED_CAST")
        val props = (el["props"] as? Map<String, Any?>) ?: emptyMap()
        val kind = (el["domainKind"] as? String) ?: "domain"
        val text = (props["text"] as? String) ?: (props["title"] as? String) ?: "[$kind]"
        val escaped = escapeTypstText(text)
        return "#box(width: 100%, height: 100%, fill: rgb(\"#f5f7fa\"), stroke: 0.3mm + rgb(\"#cbd5e1\"), inset: 2mm)[#text(size: 10pt)[$escaped]]"
    }

    // ─── 헬퍼 ────────────────────────────────────────────────────

    private fun fmt(v: Double): String {
        // 소수점 2자리, trailing zero 제거
        val s = "%.2f".format(v)
        return s.trimEnd('0').trimEnd('.').ifEmpty { "0" }
    }

    private fun typstColor(hex: String): String {
        val cleaned = hex.trim().removePrefix("#")
        val full = when (cleaned.length) {
            3 -> cleaned.map { "$it$it" }.joinToString("")
            6, 8 -> cleaned
            else -> "222222"
        }
        return "rgb(\"#$full\")"
    }

    private fun escapeTypstText(s: String): String {
        // Typst content mode 에서 특수 문자 escape
        return s
            .replace("\\", "\\\\")
            .replace("#", "\\#")
            .replace("$", "\\$")
            .replace("*", "\\*")
            .replace("_", "\\_")
            .replace("[", "\\[")
            .replace("]", "\\]")
            .replace("@", "\\@")
            .replace("<", "\\<")
            .replace(">", "\\>")
    }
}
