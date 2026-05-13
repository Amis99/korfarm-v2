package com.korfarm.api.test

/**
 * Typst 안전 escape — 특수문자만 처리.
 * Typst markup 의 특수문자: # * _ [ ] @ ` < > $ \
 */
object TypstEscape {
    fun escape(s: String): String {
        val sb = StringBuilder(s.length + 16)
        for (c in s) {
            when (c) {
                '\\', '#', '*', '_', '[', ']', '@', '`', '<', '>', '$' -> {
                    sb.append('\\').append(c)
                }
                '"' -> sb.append("\\\"")
                // typst 의 `~` 는 non-breaking space — 일반 물결표 출력하려면 escape 필요
                '~' -> sb.append("\\~")
                else -> sb.append(c)
            }
        }
        return sb.toString()
    }
}

/**
 * payload 의 stem / boxContent / conditionContent / explanation / modelAnswer 텍스트를
 * Typst 마크업으로 변환.
 *
 * 입력 마크업:
 *   - HTML: <u>...</u>, <div style="text-align: right;">...</div>, <br>, <p>...</p>
 *   - 마크다운: **bold**, *italic* (또는 _italic_), `code`, ![alt](url)
 *   - HTML entity: &lt; &gt; &amp; &quot; &nbsp;
 *
 * 출력:
 *   - <u> → #underline[…]
 *   - **bold** → *bold* (typst)
 *   - *italic* → _italic_ (typst)
 *   - `code` → `code` (typst raw)
 *   - 이미지 → imageMap[url] 가 있으면 #image("path", width: 80%), 없으면 "[이미지]" placeholder
 *   - 줄바꿈: \n\n → 단락 / \n → \ (typst hard break)
 */
object MarkupToTypst {

    /** 블록 텍스트 — 단락·줄바꿈 처리 포함. indent 는 출력 각 줄 앞 공백. */
    fun toTypst(raw: String, indent: String = "", imageMap: Map<String, String> = emptyMap()): String {
        if (raw.isBlank()) return ""
        val decoded = decodeHtml(raw)
        // 정책 (2026-05-13): 원본 `\n` 는 사람용 줄바꿈이라 무시. <br> 만 의미 있음.
        //   - <br>  1번 = 행 구분 (한 줄 줄바꿈, hard break)
        //   - <br>  2번 = 연 구분 (단락 분리, 한 줄 공백)
        val pre = decoded
            .replace("\r\n", "\n")
            .replace("\n", "")  // 원본 \n 제거 (사람용 줄바꿈)
            .replace(Regex("<br\\s*/?>", RegexOption.IGNORE_CASE), "\n")
            .replace(Regex("<p[^>]*>", RegexOption.IGNORE_CASE), "")
            .replace(Regex("</p\\s*>", RegexOption.IGNORE_CASE), "\n\n")

        // <div align="right"> 또는 style="text-align:right" → ALIGN_TOKEN_n (토큰화).
        val alignBlocks = mutableListOf<String>()
        val divHandled = handleAlignDivs(pre, imageMap, alignBlocks)

        // 단락 분리 (\n\n)
        val paragraphs = divHandled.split(Regex("\n{2,}"))

        val joined = paragraphs
            .map { it.trim() }
            .filter { it.isNotEmpty() }
            .joinToString("\n\n") { para ->
                // 단락 전체를 한 번에 inline 처리 — multiline <u>...</u> 가 줄 사이에 걸치지 않게.
                val processed = inline(para, imageMap)
                // inline 결과 안의 \n 은 typst hard break " \ " 로 변환 (행 구분).
                processed.split('\n').joinToString(" \\ \n") { "$indent$it" }
            }
        // 토큰 복원
        return Regex("ALIGNTOK(\\d+)").replace(joined) { m ->
            val idx = m.groupValues[1].toInt()
            alignBlocks.getOrNull(idx) ?: ""
        }
    }

    /** 인라인 텍스트 (한 줄) — Typst markup 으로 변환. 단락 분리 X. */
    fun inline(raw: String, imageMap: Map<String, String> = emptyMap()): String {
        val decoded = decodeHtml(raw)
        return convertInlineMarkup(decoded, imageMap)
    }

    private fun convertInlineMarkup(text: String, imageMap: Map<String, String>): String {
        // 1) <u>...</u> → 임시 토큰
        val uTokenRegex = Regex("<u\\b[^>]*>(.*?)</u\\s*>", setOf(RegexOption.IGNORE_CASE, RegexOption.DOT_MATCHES_ALL))
        val uMatches = mutableListOf<String>()
        var phase1 = uTokenRegex.replace(text) { m ->
            uMatches.add(m.groupValues[1])
            " U${uMatches.size - 1} "
        }

        // 2) ![alt](url) → typst #image (사전 다운로드된 imageMap 사용). 없으면 [이미지] placeholder.
        val imgTokens = mutableListOf<String>()
        phase1 = Regex("!\\[([^\\]]*)\\]\\(([^)]*)\\)").replace(phase1) { m ->
            val url = m.groupValues[2].trim()
            val localPath = imageMap[url]
            val out = if (localPath != null) {
                // 부모 컨테이너(보기 박스·지문 박스) 폭에 맞춰 100% — 보기 박스에 그림만 있을 때 자연스럽게 꽉 참
                "#image(\"$localPath\", width: 100%)"
            } else {
                "[이미지]"
            }
            imgTokens.add(out)
            " M${imgTokens.size - 1} "
        }

        // 3) **bold** → 임시 토큰. paragraph 내 줄바꿈(hard break)을 포함한 multiline bold 도
        // 매칭되도록 `[^*]+?` (\n 포함). 매칭 실패 시 `**` 가 escape 되어 PDF 에 그대로 출력되던
        // 회귀 방지 (예: `**[앞부분]\n...적혀 있다.**` 가 paragraph 내 hard break 로 끊기는 경우).
        val boldRegex = Regex("\\*\\*([^*]+?)\\*\\*", RegexOption.DOT_MATCHES_ALL)
        val boldMatches = mutableListOf<String>()
        phase1 = boldRegex.replace(phase1) { m ->
            boldMatches.add(m.groupValues[1])
            " B${boldMatches.size - 1} "
        }

        // 4) *italic* / _italic_ → 임시 토큰 (multiline 허용)
        val italRegex = Regex("(?<![*_])([*_])([^*_]+?)\\1(?![*_])", RegexOption.DOT_MATCHES_ALL)
        val italMatches = mutableListOf<String>()
        phase1 = italRegex.replace(phase1) { m ->
            italMatches.add(m.groupValues[2])
            " I${italMatches.size - 1} "
        }

        // 5) `code` → 임시 토큰
        val codeRegex = Regex("`([^`\\n]+?)`")
        val codeMatches = mutableListOf<String>()
        phase1 = codeRegex.replace(phase1) { m ->
            codeMatches.add(m.groupValues[1])
            " C${codeMatches.size - 1} "
        }

        // 6) 남은 HTML 태그 제거 — 영문 알파벳으로 시작하는 태그만.
        // `<보기>` `<조건>` 같은 한글 angle bracket 텍스트는 보존되어야 함.
        phase1 = phase1.replace(Regex("</?[a-zA-Z][a-zA-Z0-9]*\\b[^>]*>"), "")

        // 7) Typst escape
        var escaped = TypstEscape.escape(phase1)

        // 8) 토큰 복원 → typst 문법
        escaped = Regex(" U(\\d+) ").replace(escaped) { m ->
            val idx = m.groupValues[1].toInt()
            val inner = TypstEscape.escape(uMatches[idx])
            // typst 의 underline — offset, stroke 명시. 일부 typst 버전이 offset 만 단독으로
            // 인식 못 해 underline 자체가 안 그려지는 케이스를 방지.
            // 끝에 zero-width space(U+200B) 추가 — typst 가 인접 한글을 dot field access
            // (예: `#underline[...].전자`) 로 잘못 해석하는 것을 차단. 한글도 Unicode letter 라
            // 식별자로 인식되므로 명시적 chain 차단이 필요하다.
            "#underline(stroke: 0.6pt, offset: 1.5pt)[$inner]​"
        }
        escaped = Regex(" B(\\d+) ").replace(escaped) { m ->
            val idx = m.groupValues[1].toInt()
            val inner = TypstEscape.escape(boldMatches[idx])
            "*$inner*"
        }
        escaped = Regex(" I(\\d+) ").replace(escaped) { m ->
            val idx = m.groupValues[1].toInt()
            val inner = TypstEscape.escape(italMatches[idx])
            "_${inner}_"
        }
        escaped = Regex(" C(\\d+) ").replace(escaped) { m ->
            val idx = m.groupValues[1].toInt()
            "`${codeMatches[idx]}`"
        }
        // 이미지 토큰 복원 — typst #image(...) markup 그대로 (escape 처리 안 거침).
        escaped = Regex(" M(\\d+) ").replace(escaped) { m ->
            imgTokens[m.groupValues[1].toInt()]
        }
        return escaped
    }

    private fun handleAlignDivs(text: String, imageMap: Map<String, String>, alignBlocks: MutableList<String>): String {
        // <div style="text-align: right;">…</div> → ALIGNTOKn (토큰), alignBlocks 에 typst markup 저장
        val rightRegex = Regex(
            """<div[^>]*(?:style="[^"]*text-align:\s*right[^"]*"|align="right")[^>]*>(.*?)</div>""",
            setOf(RegexOption.IGNORE_CASE, RegexOption.DOT_MATCHES_ALL)
        )
        return rightRegex.replace(text) { m ->
            val inner = inline(m.groupValues[1], imageMap)
            alignBlocks.add("#align(right)[$inner]")
            "\n\nALIGNTOK${alignBlocks.size - 1}\n\n"
        }
    }

    private fun decodeHtml(s: String): String {
        return s.replace("&nbsp;", " ")
            .replace("&amp;", "&")
            .replace("&lt;", "<")
            .replace("&gt;", ">")
            .replace("&quot;", "\"")
            .replace("&#39;", "'")
            .replace("&apos;", "'")
    }
}
