package com.korfarm.api.test

import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.stereotype.Service

/**
 * test.payload (passages, questions) → HTML 자동 생성기.
 * TipTap 워드프로세서가 받아서 편집할 수 있는 HTML 조각 반환.
 *
 * 출력 정책:
 *  - 시험지: 제목 + 메타 + 응시 정보 칸 + 2단(div.tp-cols-2) 본문
 *    (지문 div.tp-passage + 그 지문의 문제 div.tp-question + 선택지)
 *  - 정답·해설: 제목 + 정답표(<table>) + 2단 해설 카드
 *  - CSS 클래스 (tp-passage / tp-question / tp-box / tp-answer / tp-explanation /
 *    tp-cols-2) 는 word-editor.css 와 PDF 변환 헤더 양쪽에서 인식
 */
@Service
class HtmlBuilder(
    private val testService: TestService,
    private val objectMapper: ObjectMapper
) {

    fun buildPaper(paper: TestPaperEntity): String {
        val payload = loadPayload(paper) ?: return placeholder(paper.title)
        @Suppress("UNCHECKED_CAST")
        val passages = (payload["passages"] as? List<Map<String, Any?>>) ?: emptyList()
        @Suppress("UNCHECKED_CAST")
        val questions = (payload["questions"] as? List<Map<String, Any?>>) ?: emptyList()

        val sb = StringBuilder()
        // 헤더
        sb.append("""<h1 style="text-align:center">${esc(paper.title)}</h1>""")
        val meta = buildList {
            add("${paper.totalQuestions}문항")
            add("${paper.totalPoints}점")
            paper.timeLimitMinutes?.let { add("${it}분") }
        }.joinToString(" · ")
        sb.append("""<p style="text-align:center"><span style="color: #666">${esc(meta)}</span></p>""")
        sb.append("""<p>학교 _________&nbsp;&nbsp; 학년/반 _____&nbsp;&nbsp; 이름 _________&nbsp;&nbsp; 응시일 ________</p>""")
        sb.append("<hr/>")

        // 본문 — 2단
        sb.append("""<div class="tp-cols-2">""")

        val passageMap = passages.associateBy { (it["id"] as? String) ?: "" }
        val byPassage = questions.groupBy { it["passageId"] as? String }
        val orderedKeys = byPassage.keys.sortedWith(compareBy({ it == null }, { it ?: "" }))

        for (key in orderedKeys) {
            val qs = byPassage[key]?.sortedBy { numberOf(it) } ?: continue
            if (qs.isEmpty()) continue
            val passage = if (key != null) passageMap[key] else null

            if (passage != null) {
                val firstNo = qs.minOf { numberOf(it) }
                val lastNo = qs.maxOf { numberOf(it) }
                val rangeLabel = if (firstNo == lastNo) "[$firstNo]" else "[$firstNo~$lastNo]"
                sb.append("""<div class="tp-passage">""")
                sb.append("<p><strong>${esc(rangeLabel)}</strong> 다음 글을 읽고 답하시오.</p>")
                val passageText = (passage["text"] as? String) ?: ""
                sb.append(paragraphsHtml(passageText))
                sb.append("</div>")
            }

            qs.forEach { q ->
                sb.append(buildQuestionHtml(q))
            }
        }
        sb.append("</div>")  // tp-cols-2
        return sb.toString()
    }

    fun buildAnswer(paper: TestPaperEntity): String {
        val payload = loadPayload(paper) ?: return placeholder(paper.title)
        @Suppress("UNCHECKED_CAST")
        val questions = (payload["questions"] as? List<Map<String, Any?>>) ?: emptyList()

        val sb = StringBuilder()
        sb.append("""<h1 style="text-align:center">${esc(paper.title)} — 정답·해설</h1>""")

        // 정답표
        sb.append("<h2>정답표</h2>")
        sb.append("<table><thead><tr><th>번호</th><th>정답</th><th>배점</th></tr></thead><tbody>")
        questions.sortedBy { numberOf(it) }.forEach { q ->
            @Suppress("UNCHECKED_CAST")
            val choices = (q["choices"] as? List<Map<String, Any?>>) ?: emptyList()
            val ansIdx = choices.indexOfFirst { it["id"] == q["answerId"] }
            val ansLabel = if (ansIdx >= 0) "①②③④⑤".getOrNull(ansIdx)?.toString() ?: "${ansIdx + 1}" else "-"
            val pts = (q["points"] as? Number)?.toInt() ?: 4
            sb.append("<tr><td>${numberOf(q)}</td><td>${esc(ansLabel)}</td><td>$pts</td></tr>")
        }
        sb.append("</tbody></table>")

        // 해설 (2단)
        sb.append("<h2>해설</h2>")
        sb.append("""<div class="tp-cols-2">""")
        questions.sortedBy { numberOf(it) }.forEach { q ->
            @Suppress("UNCHECKED_CAST")
            val choices = (q["choices"] as? List<Map<String, Any?>>) ?: emptyList()
            val ansIdx = choices.indexOfFirst { it["id"] == q["answerId"] }
            val ansLabel = if (ansIdx >= 0) "①②③④⑤".getOrNull(ansIdx)?.toString() ?: "${ansIdx + 1}" else "-"
            val pts = (q["points"] as? Number)?.toInt() ?: 4
            val explanation = (q["explanation"] as? String) ?: ""
            val modelAnswer = (q["modelAnswer"] as? String) ?: ""
            sb.append("""<div class="tp-explanation">""")
            sb.append("""<p><strong>${numberOf(q)}.</strong> 정답 <span class="tp-answer">$ansLabel</span> <span style="color:#666">(${pts}점)</span></p>""")
            if (explanation.isNotBlank()) sb.append(paragraphsHtml(explanation))
            if (modelAnswer.isNotBlank()) {
                sb.append("<p><strong>모범답안:</strong> ${esc(modelAnswer)}</p>")
            }
            sb.append("</div>")
        }
        sb.append("</div>")
        return sb.toString()
    }

    private fun buildQuestionHtml(q: Map<String, Any?>): String {
        val no = numberOf(q)
        val stem = (q["stem"] as? String) ?: ""
        val points = (q["points"] as? Number)?.toInt() ?: 4
        val type = (q["type"] as? String) ?: "MULTI_CHOICE"
        @Suppress("UNCHECKED_CAST")
        val choices = (q["choices"] as? List<Map<String, Any?>>) ?: emptyList()
        val sb = StringBuilder()
        sb.append("""<div class="tp-question">""")
        sb.append("""<p><strong>${no}.</strong> ${esc(stem)} <span style="color:#666;font-size:9pt">(${points}점)</span></p>""")
        if (type == "ESSAY") {
            sb.append("""<p style="border:1px solid #aaa; min-height:60pt"></p>""")
        } else if (choices.isNotEmpty()) {
            choices.forEachIndexed { idx, c ->
                val marker = "①②③④⑤".getOrNull(idx)?.toString() ?: "${idx + 1})"
                val text = (c["text"] as? String) ?: ""
                sb.append("<p>&nbsp;&nbsp;${esc(marker)} ${esc(text)}</p>")
            }
        }
        sb.append("</div>")
        return sb.toString()
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

    private fun paragraphsHtml(text: String): String {
        if (text.isBlank()) return ""
        return text.replace("\r\n", "\n")
            .split(Regex("\n\\s*\n"))
            .joinToString("") { "<p>${esc(it.replace("\n", "<br/>"))}</p>" }
    }

    private fun esc(s: String): String =
        s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;")

    private fun placeholder(title: String): String =
        """<h1 style="text-align:center">${esc(title)}</h1>
           <p>시험지에 문항이 등록되지 않았습니다. 시험지 비주얼 에디터에서 문항을 먼저 등록해주세요.</p>""".trimIndent()
}
