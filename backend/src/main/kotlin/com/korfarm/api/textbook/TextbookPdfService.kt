package com.korfarm.api.textbook

import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.files.FileRepository
import com.korfarm.api.files.FileService
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.io.InputStream
import java.nio.charset.StandardCharsets
import java.nio.file.Files
import java.nio.file.Path
import java.util.concurrent.TimeUnit

/**
 * 교재 payload → PDF (typst CLI). TestPdfService 패턴 차용.
 * 학생용/정답·해설 분리 출력. 큰 교재 대응 위해 typst.timeout-seconds 더 길게.
 */
@Service
class TextbookPdfService(
    @Value("\${typst.binary:/usr/local/bin/typst}") private val typstBinary: String,
    @Value("\${typst.textbook-timeout-seconds:180}") private val timeoutSeconds: Long,
    private val objectMapper: ObjectMapper,
    private val fileService: FileService,
    private val fileRepository: FileRepository,
) {
    private val log = LoggerFactory.getLogger(TextbookPdfService::class.java)

    fun generateStudent(textbook: TextbookEntity): ByteArray =
        compile(textbook, TextbookTypstBuilder.Mode.STUDENT)

    fun generateAnswer(textbook: TextbookEntity): ByteArray =
        compile(textbook, TextbookTypstBuilder.Mode.ANSWER)

    private fun compile(textbook: TextbookEntity, mode: TextbookTypstBuilder.Mode): ByteArray {
        val payload = parsePayload(textbook.payloadJson)
            ?: throw IllegalStateException("payload 가 비어 있습니다 — 교재 본문이 없습니다")

        val tmpDir = Files.createTempDirectory("textbook_pdf_")
        try {
            extractResource("/assets/korfarm-logo.png", tmpDir.resolve("logo.png"))
            val hasHcr = extractResourceIfExists("/fonts/HCR_Batang.ttf", tmpDir.resolve("HCR_Batang.ttf"))
            extractResourceIfExists("/fonts/HCR_Batang_Bold.ttf", tmpDir.resolve("HCR_Batang_Bold.ttf"))

            val imageMap = extractImages(textbook.payloadJson, tmpDir)

            val source = TextbookTypstBuilder(payload, hasHcr, imageMap, mode).build()
            val typFile = tmpDir.resolve("textbook.typ")
            Files.writeString(typFile, source, StandardCharsets.UTF_8)
            val pdfFile = tmpDir.resolve("textbook.pdf")

            val pb = ProcessBuilder(
                typstBinary, "compile",
                "--font-path", tmpDir.toAbsolutePath().toString(),
                "textbook.typ", "textbook.pdf"
            ).directory(tmpDir.toFile())
                .redirectErrorStream(true)

            val proc = try { pb.start() } catch (e: Exception) {
                throw RuntimeException("typst CLI 실행 실패: ${e.message}")
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

    @Suppress("UNCHECKED_CAST")
    private fun parsePayload(raw: String?): Map<String, Any?>? {
        if (raw.isNullOrBlank()) return null
        return try {
            objectMapper.readValue(raw, Map::class.java) as Map<String, Any?>
        } catch (e: Exception) {
            log.warn("textbook payload 파싱 실패: ${e.message}")
            null
        }
    }

    private fun extractImages(payloadJson: String?, tmpDir: Path): Map<String, String> {
        if (payloadJson.isNullOrBlank()) return emptyMap()
        val urlRegex = Regex("/v1/files/([A-Za-z0-9_-]+)/download")
        val matches = urlRegex.findAll(payloadJson)
            .map { it.value to it.groupValues[1] }
            .toMap()
        val result = mutableMapOf<String, String>()
        for ((url, fileId) in matches) {
            try {
                val bytes = fileService.readBytes(fileId) ?: continue
                val mime = fileRepository.findById(fileId).orElse(null)?.mime ?: "image/png"
                val ext = when (mime.lowercase()) {
                    "image/jpeg", "image/jpg" -> "jpg"
                    "image/webp" -> "webp"
                    "image/svg+xml" -> "svg"
                    "image/gif" -> "gif"
                    else -> "png"
                }
                val filename = "img_${fileId}.${ext}"
                Files.write(tmpDir.resolve(filename), bytes)
                result[url] = filename
            } catch (e: Exception) {
                log.warn("교재 PDF 이미지 다운로드 실패 fileId={}: {}", fileId, e.message)
            }
        }
        return result
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
