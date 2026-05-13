package com.korfarm.api.test

/**
 * payload (passages, questions) → Typst 소스.
 *
 * v2 (2026-05-12 분리): 진단·기타 테스트는 시험지 PDF 와 정답·해설 PDF 가 별도 파일.
 *   - buildExamSource()    : 헤더 + 지문·문제 (정답·해설 없음)
 *   - buildAnswerSource()  : 헤더(요약형) + 정답표 + 해설
 *   - build()              : 호환 유지(시험지 + 정답·해설 통합 PDF)
 *
 * 배점 표시: points 가 null·0 이하면 표시하지 않음. fallback 4점 사용 안 함.
 * 정답표 배점 열은 모든 문항이 points<=0 이면 컬럼 자체를 생략.
 *
 * 출판 품질 (편집 X) — Typst 가 알아서:
 *   - 2단 column-fill: auto
 *   - 문제 단위 block(breakable: false) — 단/페이지 중간 안 끊김
 *   - 옛한글 (HCR Batang fallback Noto Sans CJK KR)
 */
class TypstBuilder(
    private val paper: TestPaperEntity,
    private val payload: Map<String, Any?>,
    private val hasHcrFont: Boolean,
    private val imageMap: Map<String, String> = emptyMap(),
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

    // 배점 표시 정책: 양수일 때만 표시. null·0·음수는 표시 X (4점 fallback 제거).
    private fun displayPoints(q: Map<String, Any?>): Int? {
        val n = (q["points"] as? Number)?.toInt() ?: return null
        return if (n > 0) n else null
    }

    // 정답표 배점 열을 띄울지 — 한 문항이라도 양수 배점이면 표시.
    private val anyPositivePoints: Boolean = questions.any { displayPoints(it) != null }

    /** 호환용 — 시험지 + 정답·해설 통합 (챕터 테스트 등 분리 대상 외에서 사용). */
    fun build(): String {
        val sb = StringBuilder()
        appendPreamble(sb)
        buildHeader(sb)
        sb.appendLine()
        sb.appendLine("""#columns(2, gutter: 8mm)[""")
        buildBody(sb)
        sb.appendLine("""]""")
        sb.appendLine()
        sb.appendLine("""#pagebreak()""")
        buildAnswerSection(sb, includeTitle = true)
        return sb.toString()
    }

    /** 학생용 시험지 PDF — 헤더 + 지문·문제 (정답·해설 없음). */
    fun buildExamSource(): String {
        val sb = StringBuilder()
        appendPreamble(sb)
        buildHeader(sb)
        sb.appendLine()
        sb.appendLine("""#columns(2, gutter: 8mm)[""")
        buildBody(sb)
        sb.appendLine("""]""")
        return sb.toString()
    }

    /** 관리자·OMR 제출자용 정답·해설 PDF — 표지 헤더 + 정답표 + 해설. */
    fun buildAnswerSource(): String {
        val sb = StringBuilder()
        appendPreamble(sb)
        buildAnswerCoverHeader(sb)
        sb.appendLine()
        buildAnswerSection(sb, includeTitle = false)
        return sb.toString()
    }

    // ─── 공통 preamble ───
    private fun appendPreamble(sb: StringBuilder) {
        val fontSize = fontSizeForLevel(paper.levelId)
        val fontStack = if (hasHcrFont) {
            "(\"HCR Batang\", \"Noto Serif CJK KR\", \"Noto Sans CJK KR\")"
        } else {
            "(\"Noto Serif CJK KR\", \"Noto Sans CJK KR\")"
        }
        sb.appendLine("""#set page(paper: "a4", margin: (x: 16mm, y: 18mm))""")
        sb.appendLine("""#set text(font: $fontStack, size: ${fontSize}pt, lang: "ko")""")
        sb.appendLine("""#set par(leading: 0.75em, justify: true)""")
        // 단락(연 구분) 간격 — 한 줄 분량의 공백이 명확히 보이도록.
        // 새 typst 버전: `show par: set block(spacing)` 은 deprecated → `set par(spacing)` 사용.
        sb.appendLine("""#set par(spacing: 1.4em)""")
        sb.appendLine("""#show heading.where(level: 1): it => { v(4pt); text(size: 1.4em, weight: "bold")[#it.body]; v(6pt) }""")
        sb.appendLine()
        sb.appendLine("""#let passage-box(body) = block(stroke: (left: 3pt + rgb("#2d6a4f")), fill: rgb("#f5f9f3"), inset: (x: 12pt, y: 10pt), width: 100%, spacing: 8pt, radius: 2pt, body)""")
        // <보기> 박스 — 각진 하늘색 박스 + 라벨이 상단 테두리를 가로지르는 형태.
        // place() 가 block content 영역 기준이라 dy 음수 처리가 어색했음. 대신
        // 라벨을 박스 밖 위로 먼저 그리고 v(음수) 로 박스를 끌어올려 겹침. 더 안정적.
        sb.appendLine("""#let bogi-box(body) = block(width: 100%, {""")
        sb.appendLine("""  pad(left: 12pt,""")
        sb.appendLine("""    box(fill: rgb("#3f7ba6"), inset: (x: 10pt, y: 3pt),""")
        sb.appendLine("""      text(fill: white, weight: "bold", size: 0.78em)[보기]""")
        sb.appendLine("""    )""")
        sb.appendLine("""  )""")
        sb.appendLine("""  v(-9pt, weak: false)""")
        sb.appendLine("""  block(""")
        sb.appendLine("""    stroke: 0.8pt + rgb("#7da7c8"),""")
        sb.appendLine("""    fill: rgb("#eaf4fc"),""")
        sb.appendLine("""    inset: (x: 14pt, top: 14pt, bottom: 12pt),""")
        sb.appendLine("""    width: 100%, spacing: 8pt, radius: 0pt,""")
        sb.appendLine("""    body""")
        sb.appendLine("""  )""")
        sb.appendLine("""})""")
        sb.appendLine("""#let condition-box(body) = block(stroke: (left: 2pt + rgb("#444"), rest: 0.4pt + rgb("#aaa")), fill: rgb("#fafafa"), inset: (x: 10pt, y: 8pt), width: 100%, spacing: 6pt, radius: 2pt, body)""")
        sb.appendLine()
    }

    // ─── 시험지 헤더 ───
    private fun buildHeader(sb: StringBuilder) {
        val title = TypstEscape.escape(paper.title)
        // totalPoints 가 0 이면 "점" 표시 안 함 (진단처럼 배점 미부여 시험)
        val meta = buildList {
            add("${paper.totalQuestions}문항")
            if (paper.totalPoints > 0) add("${paper.totalPoints}점")
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

    // ─── 정답·해설 표지 헤더 (별도 PDF 일 때) ───
    private fun buildAnswerCoverHeader(sb: StringBuilder) {
        val title = TypstEscape.escape(paper.title)
        sb.appendLine("""#grid(""")
        sb.appendLine("""  columns: (auto, 1fr),""")
        sb.appendLine("""  gutter: 12pt,""")
        sb.appendLine("""  align: horizon,""")
        sb.appendLine("""  image("logo.png", height: 30pt),""")
        sb.appendLine("""  align(right + horizon)[#text(size: 16pt, weight: "bold")[$title · 정답·해설]]""")
        sb.appendLine(""")""")
        sb.appendLine("""#v(4pt)""")
        sb.appendLine("""#line(length: 100%, stroke: 0.5pt + rgb("#888"))""")
        sb.appendLine("""#v(6pt)""")
    }

    // ─── 본문: 지문 + 문제 ───
    private fun buildBody(sb: StringBuilder) {
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
                // 물결표는 typst escape 로 \~ 가 되어야 일반 ~ 로 표시됨 (typst 의 ~ 는 nbsp).
                val rangeLabel = if (first == last) "[$first]" else "[$first\\~$last]"
                val passageText = (passage["text"] as? String) ?: ""
                // 지시문과 지문 박스를 하나의 컨테이너 block 으로 묶고 그 자체 breakable: false.
                // 지문이 한 단보다 크면 안 깨지므로 컨테이너 안에 박스만 breakable 하게 — 그래서
                // 지시문 한 줄을 sticky 로 처리해 다음 콘텐츠(passage-box)와 같은 단·페이지에 머무름.
                sb.appendLine("""#block(sticky: true)[*${rangeLabel}* 다음 글을 읽고 답하시오.]""")
                sb.appendLine("""#v(4pt, weak: true)""")
                sb.appendLine("""#passage-box[""")
                sb.appendLine(MarkupToTypst.toTypst(passageText, indent = "  ", imageMap = imageMap))
                sb.appendLine("""]""")
                sb.appendLine("""#v(8pt)""")
            }

            qs.forEach { q ->
                buildQuestionBlock(sb, q)
                sb.appendLine("""#v(14pt)""")
            }
        }
    }

    private fun buildQuestionBlock(sb: StringBuilder, q: Map<String, Any?>) {
        val no = numberOf(q)
        val stem = (q["stem"] as? String) ?: ""
        val points = displayPoints(q)
        val type = (q["type"] as? String) ?: "MULTI_CHOICE"
        val boxContent = (q["boxContent"] as? String)?.takeIf { it.isNotBlank() }
        val conditionContent = (q["conditionContent"] as? String)?.takeIf { it.isNotBlank() }
        @Suppress("UNCHECKED_CAST")
        val choices = (q["choices"] as? List<Map<String, Any?>>) ?: emptyList()

        sb.appendLine("""#block(breakable: false, width: 100%)[""")
        // 발문 — hanging indent (둘째 줄부터 번호 너비만큼 들여쓰기) 로 번호 강조.
        // grid(columns: (auto, 1fr)) 로 번호 칸 + 본문 칸 분리. 본문 줄바꿈은 본문 칸 안에서만.
        val pointsSuffix = if (points != null) {
            " #h(0.4em) #text(size: 0.85em, fill: rgb(\"#888\"))[(${points}점)]"
        } else ""
        sb.appendLine("""  #grid(columns: (auto, 1fr), gutter: 0.45em,""")
        sb.appendLine("""    [*${no}.*],""")
        sb.appendLine("""    [${MarkupToTypst.inline(stem, imageMap)}$pointsSuffix]""")
        sb.appendLine("""  )""")
        sb.appendLine("""  #v(4pt)""")

        if (boxContent != null) {
            // 박스에 "보기" 라벨이 외곽에 자동으로 붙으므로 본문엔 라벨 텍스트 안 박음.
            sb.appendLine("""  #bogi-box[""")
            sb.appendLine(MarkupToTypst.toTypst(boxContent, indent = "    ", imageMap = imageMap))
            sb.appendLine("""  ]""")
        }

        if (conditionContent != null) {
            sb.appendLine("""  #condition-box[""")
            sb.appendLine("""    *\<조건\>*""")
            sb.appendLine()
            sb.appendLine(MarkupToTypst.toTypst(conditionContent, indent = "    ", imageMap = imageMap))
            sb.appendLine("""  ]""")
        }

        if (type == "ESSAY") {
            sb.appendLine("""  #v(4pt)""")
            sb.appendLine("""  #block(stroke: 0.4pt + rgb("#aaa"), inset: (x: 8pt, y: 16pt), width: 100%, height: 80pt)[]""")
        } else if (choices.isNotEmpty()) {
            sb.appendLine("""  #v(4pt)""")
            // 선택지 — 모든 선지를 한 grid 에 묶어 번호·본문 칸을 정렬.
            // 둘째 줄도 번호 너비만큼 들여쓰기 되어 번호가 눈에 띔.
            sb.appendLine("""  #grid(columns: (auto, 1fr), column-gutter: 0.45em, row-gutter: 0.9em,""")
            choices.forEachIndexed { idx, c ->
                val marker = "①②③④⑤".getOrNull(idx)?.toString() ?: "${idx + 1})"
                val text = (c["text"] as? String) ?: ""
                sb.appendLine("""    [$marker], [${MarkupToTypst.inline(text, imageMap)}],""")
            }
            sb.appendLine("""  )""")
        }

        sb.appendLine("""]""")
    }

    // ─── 정답·해설 ───
    /**
     * @param includeTitle build() 통합 PDF 에서는 "= 정답·해설" 헤딩을 함께 출력 (#pagebreak 다음).
     *                     buildAnswerSource() 는 표지 헤더가 따로 있어 false.
     */
    private fun buildAnswerSection(sb: StringBuilder, includeTitle: Boolean) {
        sb.appendLine("""#set text(size: 10pt)""")
        if (includeTitle) {
            sb.appendLine("""= 정답·해설""")
            sb.appendLine()
        }

        val sorted = questions.sortedBy(::numberOf)
        val mc = sorted.filter { (it["type"] as? String) != "ESSAY" }
        val essays = sorted.filter { (it["type"] as? String) == "ESSAY" }

        // 객관식 정답표 — 가로 10칸 (번호/정답 5쌍 = 한 줄에 5문제).
        if (mc.isNotEmpty()) {
            sb.appendLine("""#table(""")
            sb.appendLine("""  columns: (auto, 1fr, auto, 1fr, auto, 1fr, auto, 1fr, auto, 1fr),""")
            sb.appendLine("""  align: center + horizon,""")
            sb.appendLine("""  stroke: 0.5pt + rgb("#888"),""")
            sb.appendLine("""  inset: (x: 8pt, y: 6pt),""")
            mc.forEach { q ->
                @Suppress("UNCHECKED_CAST")
                val choices = (q["choices"] as? List<Map<String, Any?>>) ?: emptyList()
                val ansIdx = choices.indexOfFirst { it["id"] == q["answerId"] }
                val ansLabel = if (ansIdx >= 0) "①②③④⑤".getOrNull(ansIdx)?.toString() ?: "${ansIdx + 1}" else "-"
                val no = numberOf(q)
                sb.appendLine("""  [*${no}*], [${TypstEscape.escape(ansLabel)}],""")
            }
            // 한 줄이 5문제 = 10칸. 마지막 줄 부족하면 빈 칸으로 채워야 함.
            val remainder = mc.size % 5
            if (remainder != 0) {
                repeat((5 - remainder) * 2) { sb.appendLine("""  [],""") }
            }
            sb.appendLine(""")""")
            sb.appendLine("""#v(8pt)""")
        }

        // 서술형 — 객관식 정답표 아래 별도 리스트 (모범답안 한 줄 요약)
        if (essays.isNotEmpty()) {
            sb.appendLine("""*서술형 정답*""")
            sb.appendLine("""#v(3pt)""")
            essays.forEach { q ->
                val no = numberOf(q)
                val model = (q["modelAnswer"] as? String)?.takeIf { it.isNotBlank() } ?: "(모범답안 없음)"
                @Suppress("UNCHECKED_CAST")
                val qChoices = (q["choices"] as? List<Map<String, Any?>>) ?: emptyList()
                sb.appendLine("""- *${no}번*: ${MarkupToTypst.inline(replaceChoiceLetters(model, qChoices), imageMap)}""")
            }
            sb.appendLine("""#v(10pt)""")
        }

        // 해설 (2단)
        sb.appendLine("""#columns(2, gutter: 8mm)[""")
        sorted.forEach { q ->
            buildExplanationBlock(sb, q)
            sb.appendLine("""#v(10pt)""")
        }
        sb.appendLine("""]""")
    }

    /**
     * 해설 안 단독 대문자 A~E 를 choices 배열 위치 기반 ①②③④⑤ 로 치환.
     * AI 생성 해설이 c.id (A/B/C/D/E) 를 직접 언급하는 경우 인쇄용 표시 번호로 통일.
     * (단어·괄호 안 토큰은 보존: ABC·[A] 등 비대상)
     */
    private fun replaceChoiceLetters(text: String, choices: List<Map<String, Any?>>): String {
        if (text.isBlank()) return text
        val map = mutableMapOf<String, String>()
        choices.forEachIndexed { i, c ->
            val id = (c["id"] as? String)?.uppercase() ?: return@forEachIndexed
            if (id.length == 1 && id[0] in 'A'..'Z') {
                map[id] = "①②③④⑤".getOrNull(i)?.toString() ?: "${i + 1}"
            }
        }
        if (map.isEmpty()) return text
        return Regex("(?<![A-Za-z\\[])([A-E])(?![A-Za-z\\]])").replace(text) { m ->
            map[m.groupValues[1]] ?: m.value
        }
    }

    /**
     * 영역·세부영역·주제 태그 — 작은 회색 배경 pill.
     */
    private fun buildTagsLine(q: Map<String, Any?>): String {
        val tags = listOfNotNull(
            (q["domain"] as? String)?.takeIf { it.isNotBlank() },
            (q["subDomain"] as? String)?.takeIf { it.isNotBlank() },
            (q["theme"] as? String)?.takeIf { it.isNotBlank() },
        )
        if (tags.isEmpty()) return ""
        return tags.joinToString(" ") { tag ->
            "#box(fill: rgb(\"#eef2f7\"), inset: (x: 5pt, y: 2pt), radius: 3pt)[#text(size: 0.78em, fill: rgb(\"#4a5568\"))[${TypstEscape.escape(tag)}]]"
        }
    }

    private fun buildExplanationBlock(sb: StringBuilder, q: Map<String, Any?>) {
        val no = numberOf(q)
        val isEssay = (q["type"] as? String) == "ESSAY"
        @Suppress("UNCHECKED_CAST")
        val choices = (q["choices"] as? List<Map<String, Any?>>) ?: emptyList()
        val ansIdx = choices.indexOfFirst { it["id"] == q["answerId"] }
        val ansLabel = if (ansIdx >= 0) "①②③④⑤".getOrNull(ansIdx)?.toString() ?: "${ansIdx + 1}" else "-"
        val pts = displayPoints(q)
        val explanation = (q["explanation"] as? String)?.takeIf { it.isNotBlank() }
        val modelAnswer = (q["modelAnswer"] as? String)?.takeIf { it.isNotBlank() }
        @Suppress("UNCHECKED_CAST")
        val choiceExplanations = (q["choiceExplanations"] as? Map<String, Any?>) ?: emptyMap()
        val tagsLine = buildTagsLine(q)

        sb.appendLine("""#block(breakable: false, width: 100%)[""")
        val pointsSuffix = if (pts != null) {
            " #h(0.4em) #text(size: 0.85em, fill: rgb(\"#888\"))[(${pts}점)]"
        } else ""
        if (isEssay) {
            sb.appendLine("""  *${no}.* #text(fill: rgb("#666"), size: 0.85em)[서술형]$pointsSuffix""")
        } else {
            sb.appendLine("""  *${no}.* 정답 #text(fill: rgb("#c0392b"), weight: "bold")[${TypstEscape.escape(ansLabel)}]$pointsSuffix""")
        }
        if (tagsLine.isNotEmpty()) {
            sb.appendLine("""  #v(2pt)""")
            sb.appendLine("""  $tagsLine""")
        }
        if (explanation != null) {
            sb.appendLine("""  #v(3pt)""")
            // 인쇄용: 해설 안 단독 A~E → ①②③④⑤ (choices 배열 위치 기반)
            val explForPrint = replaceChoiceLetters(explanation, choices)
            sb.appendLine(MarkupToTypst.toTypst(explForPrint, indent = "  ", imageMap = imageMap))
        }
        if (isEssay && modelAnswer != null) {
            sb.appendLine("""  #v(3pt)""")
            sb.appendLine("""  *모범답안:* ${MarkupToTypst.inline(replaceChoiceLetters(modelAnswer, choices), imageMap)}""")
        }
        // 선지별 조언 (객관식만)
        if (!isEssay && choiceExplanations.isNotEmpty() && choices.isNotEmpty()) {
            sb.appendLine("""  #v(4pt)""")
            sb.appendLine("""  #text(size: 0.85em, fill: rgb("#555"))[*선지별 조언*]""")
            sb.appendLine("""  #v(2pt)""")
            choices.forEachIndexed { idx, c ->
                val cid = c["id"] as? String ?: return@forEachIndexed
                val advice = (choiceExplanations[cid] as? String)?.takeIf { it.isNotBlank() } ?: return@forEachIndexed
                val marker = "①②③④⑤".getOrNull(idx)?.toString() ?: "${idx + 1}"
                // 조언 안 다른 선지 언급(A/B/C) 도 번호로
                val adviceForPrint = replaceChoiceLetters(advice, choices)
                sb.appendLine("""  #text(size: 0.85em)[$marker ${MarkupToTypst.inline(adviceForPrint, imageMap)}] #linebreak()""")
            }
        }
        sb.appendLine("""]""")
    }

    private fun numberOf(q: Map<String, Any?>): Int = (q["number"] as? Number)?.toInt() ?: 0

    // 시험 대상 레벨에 따라 전체 폰트 크기. 사용자 정책 (2026-05-13):
    // 소쉬르 = 기존 + 2, 프레게 = 기존 + 1, 러셀/비트겐슈타인 = 기존 그대로.
    private fun fontSizeForLevel(levelId: String?): Double = when {
        levelId == null -> 10.5
        levelId.startsWith("SAUSSURE", ignoreCase = true) -> 14.0  // 12 + 2
        levelId.startsWith("FREGE", ignoreCase = true) -> 12.0     // 11 + 1
        levelId.startsWith("RUSSELL", ignoreCase = true) -> 10.0
        levelId.startsWith("WITTGENSTEIN", ignoreCase = true) -> 9.0
        else -> 10.5
    }
}
