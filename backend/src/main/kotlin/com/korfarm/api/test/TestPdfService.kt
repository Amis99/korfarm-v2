package com.korfarm.api.test

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
    private val objectMapper: ObjectMapper,
    private val fileService: FileService,
    private val fileRepository: FileRepository,
) {
    private val log = LoggerFactory.getLogger(TestPdfService::class.java)

    /** 기존 호환 — 시험지 + 정답·해설 통합 PDF (챕터 테스트 등에서 사용). */
    fun generate(paper: TestPaperEntity): ByteArray = compileSource(paper) { it.build() }

    /** 학생용 시험지 PDF (지문·문제만, 정답·해설 없음). */
    fun generateExam(paper: TestPaperEntity): ByteArray = compileSource(paper) { it.buildExamSource() }

    /** 관리자·OMR 제출자용 정답·해설 PDF. */
    fun generateAnswer(paper: TestPaperEntity): ByteArray = compileSource(paper) { it.buildAnswerSource() }

    private fun compileSource(paper: TestPaperEntity, sourceFn: (TypstBuilder) -> String): ByteArray {
        val payload = loadPayload(paper) ?: throw IllegalStateException("payload 가 비어 있습니다 — 문항을 먼저 등록하세요")
        val payloadJson = paper.payloadJson ?: objectMapper.writeValueAsString(payload)

        val tmpDir = Files.createTempDirectory("test_pdf_")
        try {
            // 클래스패스 자원 추출
            extractResource("/assets/korfarm-logo.png", tmpDir.resolve("logo.png"))
            val hasHcr = extractResourceIfExists("/fonts/HCR_Batang.ttf", tmpDir.resolve("HCR_Batang.ttf"))
            extractResourceIfExists("/fonts/HCR_Batang_Bold.ttf", tmpDir.resolve("HCR_Batang_Bold.ttf"))

            // payload 안 이미지 markdown 의 file URL 들을 사전 다운로드해 tmpDir 에 저장.
            // markdown ![alt](url) → typst #image("localFilename") 로 변환할 수 있게 URL→파일명 map 반환.
            val imageMap = extractImagesToTmpDir(payloadJson, tmpDir)

            val source = sourceFn(TypstBuilder(paper, payload, hasHcr, imageMap))
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

    /**
     * payload JSON 텍스트에서 `/v1/files/{fileId}/download` 형식 URL 을 모두 찾아
     * fileService.readBytes 로 다운로드 → tmpDir 에 저장. mime 에 따라 확장자 자동 결정.
     * 반환: URL → 로컬 파일명 매핑 (TypstBuilder 가 markdown 이미지를 #image() 로 변환할 때 사용).
     */
    private fun extractImagesToTmpDir(payloadJson: String, tmpDir: Path): Map<String, String> {
        val urlRegex = Regex("/v1/files/([A-Za-z0-9_-]+)/download")
        val matches = urlRegex.findAll(payloadJson)
            .map { it.value to it.groupValues[1] }
            .toMap()  // 중복 URL 제거
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
                log.warn("PDF 이미지 다운로드 실패 fileId={}: {}", fileId, e.message)
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
