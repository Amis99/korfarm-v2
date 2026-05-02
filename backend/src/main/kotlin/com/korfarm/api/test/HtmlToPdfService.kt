package com.korfarm.api.test

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.nio.charset.StandardCharsets
import java.nio.file.Files
import java.util.concurrent.TimeUnit

/**
 * Chrome headless --print-to-pdf 로 HTML → PDF 변환.
 * EC2 에 google-chrome 사전 설치 필요. 한글/옛한글 폰트는 시스템 fontconfig 기반.
 */
@Service
class HtmlToPdfService(
    @Value("\${chrome.binary:/usr/bin/google-chrome}") private val chromeBinary: String,
    @Value("\${chrome.timeout-seconds:60}") private val timeoutSeconds: Long
) {
    private val log = LoggerFactory.getLogger(HtmlToPdfService::class.java)

    fun convert(html: String): ByteArray {
        if (html.isBlank()) throw IllegalArgumentException("html 이 비어 있습니다")
        val tmpDir = Files.createTempDirectory("html_pdf_")
        try {
            val htmlFile = tmpDir.resolve("input.html")
            val pdfFile = tmpDir.resolve("output.pdf")
            Files.writeString(htmlFile, ensureFullDocument(html), StandardCharsets.UTF_8)

            val pb = ProcessBuilder(
                chromeBinary,
                "--headless=new",
                "--no-sandbox",
                "--disable-gpu",
                "--disable-dev-shm-usage",
                "--print-to-pdf=${pdfFile.toAbsolutePath()}",
                "--print-to-pdf-no-header",
                "--no-pdf-header-footer",
                "--virtual-time-budget=10000",  // Paged.js 등 JS 처리 대기
                "file://${htmlFile.toAbsolutePath()}"
            ).redirectErrorStream(true)

            val proc = pb.start()
            val finished = proc.waitFor(timeoutSeconds, TimeUnit.SECONDS)
            if (!finished) {
                proc.destroyForcibly()
                throw RuntimeException("Chrome PDF 변환 타임아웃 (${timeoutSeconds}s)")
            }
            val output = proc.inputStream.bufferedReader().readText()
            val exit = proc.exitValue()
            if (exit != 0 || !Files.exists(pdfFile)) {
                log.error("Chrome PDF 변환 실패: exit={}, output={}", exit, output)
                throw RuntimeException("Chrome PDF 변환 오류")
            }
            return Files.readAllBytes(pdfFile)
        } finally {
            try {
                Files.walk(tmpDir).sorted(Comparator.reverseOrder()).forEach { Files.deleteIfExists(it) }
            } catch (_: Exception) { /* ignore */ }
        }
    }

    /**
     * 사용자가 보낸 HTML 이 <html><head>...</head><body>...</body></html> 형식이 아닐 수도.
     * 표준 헤더(@page A4 + 폰트) 자동 보충.
     */
    private fun ensureFullDocument(html: String): String {
        if (html.contains("<html", ignoreCase = true)) return html
        return """
            <!DOCTYPE html>
            <html lang="ko">
            <head>
              <meta charset="UTF-8">
              <style>
                @page { size: A4; margin: 18mm 16mm; }
                html, body { font-family: "Noto Sans CJK KR", "Noto Sans KR", sans-serif; font-size: 11pt; line-height: 1.65; color: #1a1a1a; }
                body { margin: 0; padding: 0; }
                p { margin: 0 0 8pt; }
                .tp-passage { border-left: 4px solid #2d6a4f; padding: 8pt 14pt; background: #f5f9f3; margin: 12pt 0; }
                .tp-question { margin: 12pt 0; }
                .tp-question-no { font-weight: 700; }
                .tp-choices { list-style: none; padding-left: 18pt; }
                .tp-box { border: 2px solid #333; border-radius: 6px; padding: 8pt 12pt; margin: 12pt 0; }
                .tp-answer { color: #c0392b; font-weight: 700; }
                .tp-explanation { background: #faf3f1; padding: 8pt; border-left: 3px solid #c0392b; margin: 6pt 0; }
                .tp-cols-2 { column-count: 2; column-gap: 10mm; column-rule: 1px solid #ddd; }
              </style>
            </head>
            <body>
            $html
            </body>
            </html>
        """.trimIndent()
    }
}
