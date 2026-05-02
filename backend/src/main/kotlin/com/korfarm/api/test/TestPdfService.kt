package com.korfarm.api.test

import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.io.InputStream
import java.nio.charset.StandardCharsets
import java.nio.file.Files
import java.nio.file.Path
import java.util.concurrent.TimeUnit

/**
 * 시험지 + 정답·해설을 한 PDF 로 자동 생성. typst CLI 호출.
 *
 *  Resources:
 *   - /assets/korfarm-logo.png — 헤더 로고 (필수, 클래스패스에 포함)
 *   - /fonts/HCR_Batang.ttf    — 함초롬바탕 (옛한글 100%, 선택). 없으면 시스템 fallback.
 *
 *  레벨별 글자 크기:
 *   - SAUSSURE_*    → 12pt
 *   - FREGE_*       → 11pt
 *   - RUSSELL_*     → 10pt
 *   - WITTGENSTEIN_*→ 9pt
 *   - 기본          → 10.5pt
 */
@Service
class TestPdfService(
    @Value("\${typst.binary:/usr/local/bin/typst}") private val typstBinary: String,
    @Value("\${typst.timeout-seconds:60}") private val timeoutSeconds: Long,
    private val testService: TestService,
    private val objectMapper: ObjectMapper
) {
    private val log = LoggerFactory.getLogger(TestPdfService::class.java)

    fun generate(paper: TestPaperEntity): ByteArray {
        val payload = loadPayload(paper) ?: throw IllegalStateException("payload 가 비어 있습니다 — 문항을 먼저 등록하세요")

        val tmpDir = Files.createTempDirectory("test_pdf_")
        try {
            // 클래스패스 자원 추출
            extractResource("/assets/korfarm-logo.png", tmpDir.resolve("logo.png"))
            val hasHcr = extractResourceIfExists("/fonts/HCR_Batang.ttf", tmpDir.resolve("HCR_Batang.ttf"))
            extractResourceIfExists("/fonts/HCR_Batang_Bold.ttf", tmpDir.resolve("HCR_Batang_Bold.ttf"))

            val source = TypstBuilder(paper, payload, hasHcr).build()
            val typFile = tmpDir.resolve("paper.typ")
            Files.writeString(typFile, source, StandardCharsets.UTF_8)
            val pdfFile = tmpDir.resolve("paper.pdf")

            val pb = ProcessBuilder(
                typstBinary, "compile",
                "--font-path", tmpDir.toAbsolutePath().toString(),
                "paper.typ", "paper.pdf"
            ).directory(tmpDir.toFile())
                .redirectErrorStream(true)

            val proc = try {
                pb.start()
            } catch (e: Exception) {
                throw RuntimeException(
                    "typst CLI 실행 실패 — EC2 에 typst 가 설치돼 있는지 확인 (scripts/install-typst-on-ec2.sh): ${e.message}"
                )
            }
            val finished = proc.waitFor(timeoutSeconds, TimeUnit.SECONDS)
            if (!finished) {
                proc.destroyForcibly()
                throw RuntimeException("typst 컴파일 타임아웃 (${timeoutSeconds}s)")
            }
            val output = proc.inputStream.bufferedReader().readText()
            val exit = proc.exitValue()
            if (exit != 0 || !Files.exists(pdfFile)) {
                log.error("typst 실패: exit={}, output={}", exit, output)
                throw RuntimeException("typst 컴파일 오류:\n$output")
            }
            return Files.readAllBytes(pdfFile)
        } finally {
            try {
                Files.walk(tmpDir).sorted(Comparator.reverseOrder()).forEach { Files.deleteIfExists(it) }
            } catch (_: Exception) { /* ignore */ }
        }
    }

    private fun loadPayload(paper: TestPaperEntity): Map<String, Any?>? {
        val raw = paper.payloadJson?.takeIf { it.isNotBlank() } ?: testService.getPayload(paper.id)
        if (raw.isNullOrBlank()) return null
        return try {
            @Suppress("UNCHECKED_CAST")
            objectMapper.readValue(raw, Map::class.java) as Map<String, Any?>
        } catch (e: Exception) {
            log.warn("payload 파싱 실패: ${e.message}")
            null
        }
    }

    private fun extractResource(resourcePath: String, dest: Path) {
        val stream: InputStream = javaClass.getResourceAsStream(resourcePath)
            ?: throw IllegalStateException("클래스패스 자원 누락: $resourcePath")
        stream.use { Files.copy(it, dest) }
    }

    private fun extractResourceIfExists(resourcePath: String, dest: Path): Boolean {
        val stream = javaClass.getResourceAsStream(resourcePath) ?: return false
        stream.use { Files.copy(it, dest) }
        return true
    }
}
