package com.korfarm.api.test

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.nio.file.Files
import java.nio.file.Path
import java.util.concurrent.TimeUnit

/**
 * Typst 컴파일 서비스 — typst CLI 호출하여 PDF 생성.
 * EC2 의 typst 바이너리 (/usr/local/bin/typst) 와 한글 폰트 (Noto Sans CJK KR) 사전 설치 필요.
 *
 * 출력: byte[] PDF
 */
@Service
class TypstCompileService(
    @Value("\${typst.binary:/usr/local/bin/typst}") private val typstBinary: String,
    @Value("\${typst.timeout-seconds:30}") private val timeoutSeconds: Long
) {
    private val log = LoggerFactory.getLogger(TypstCompileService::class.java)

    fun compileToPdf(typstSource: String): ByteArray {
        if (typstSource.isBlank()) {
            throw IllegalArgumentException("typst 소스가 비어 있습니다")
        }
        val tmpDir = Files.createTempDirectory("typst_")
        try {
            val srcFile = tmpDir.resolve("main.typ")
            val pdfFile = tmpDir.resolve("main.pdf")
            Files.writeString(srcFile, typstSource)

            val pb = ProcessBuilder(
                typstBinary,
                "compile",
                srcFile.toAbsolutePath().toString(),
                pdfFile.toAbsolutePath().toString()
            ).redirectErrorStream(true)

            val proc = pb.start()
            val finished = proc.waitFor(timeoutSeconds, TimeUnit.SECONDS)
            if (!finished) {
                proc.destroyForcibly()
                throw RuntimeException("typst 컴파일 타임아웃 (${timeoutSeconds}s)")
            }
            val output = proc.inputStream.bufferedReader().readText()
            val exit = proc.exitValue()
            if (exit != 0) {
                log.error("typst 컴파일 실패: exit={}, output={}", exit, output)
                throw RuntimeException("typst 컴파일 오류: $output")
            }

            return Files.readAllBytes(pdfFile)
        } finally {
            // tmpDir 청소
            try {
                Files.walk(tmpDir).sorted(Comparator.reverseOrder()).forEach { Files.deleteIfExists(it) }
            } catch (e: Exception) {
                log.warn("tmpDir 청소 실패: {}", tmpDir, e)
            }
        }
    }
}
