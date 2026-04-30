package com.korfarm.api.aigen

import com.korfarm.api.common.ApiException
import org.apache.pdfbox.Loader
import org.apache.pdfbox.pdmodel.PDDocument
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import java.io.ByteArrayOutputStream
import java.security.MessageDigest
import java.util.Base64

/**
 * PDF/이미지 → 마크다운 변환 (Claude Sonnet 4.6 vision).
 *
 * - 이미지: base64 image block
 * - PDF: base64 document block (Claude PDF native, anthropic-beta: pdfs-2024-09-25)
 *
 * 추가 과금 서비스 — 호출 시 ai_gen_logs 에 기록.
 */
@Service
class FileToMarkdownService(
    private val aiCall: AiCallHelper,
    private val logService: AiGenLogService,
) {
    private val logger = LoggerFactory.getLogger(FileToMarkdownService::class.java)

    companion object {
        private const val MAX_FILE_SIZE_BYTES: Long = 30 * 1024 * 1024 // 30MB
        private const val MAX_PDF_PAGES: Int = 10                       // PDF 최대 페이지 수
        private val SYSTEM_PROMPT = """
당신은 시험·교재 자료를 한국어 학습 콘텐츠용 깔끔한 마크다운(Markdown)으로 변환하는 전문가입니다.

지침:
1. 파일에 담긴 모든 본문 텍스트를 빠짐없이 추출하되, AI 자체 의견·요약·설명은 절대 추가하지 마세요.
2. 시·소설 등 문학은 행과 연 구분, 들여쓰기를 보존합니다.
3. 비문학·설명문은 단락 구조를 보존하고 문단 사이 빈 줄로 구분합니다.
4. 표는 마크다운 표(`| ... |`) 로 변환합니다.
5. 강조(굵게/기울임)·인용·목록은 적절한 마크다운 문법으로 표기합니다.
6. 페이지 번호·머리글·바닥글·저작권 표시 등 메타 정보는 제거합니다.
7. 그림·사진 등 추출 불가 요소는 `[그림: 간단한 설명]` 형태로 표기합니다 (학습 대상 본문이 아니라면 생략 가능).
8. 출력은 오직 마크다운 본문만. 설명·인사말·"변환 결과:" 같은 wrapper 금지.
""".trimIndent()
    }

    data class ConversionResult(
        val pages: List<PageMarkdown>,        // 페이지별 마크다운 (이미지=1, PDF=N)
        val sourceHash: String,
        val sourceSizeBytes: Long,
        val totalInputTokens: Int,
        val totalOutputTokens: Int,
        val totalDurationMs: Int,
    ) {
        /** 호환용 — 모든 페이지 마크다운을 합친 문자열 */
        val markdown: String get() = pages.joinToString("\n\n---\n\n") { it.markdown }
    }

    data class PageMarkdown(
        val pageNo: Int,
        val markdown: String,
    )

    /**
     * @param fileBytes  원본 바이트
     * @param mediaType  image/jpeg, image/png, image/webp, image/gif, application/pdf
     * @param userId     호출자 (로그용)
     */
    fun convert(fileBytes: ByteArray, mediaType: String, userId: String): ConversionResult {
        if (fileBytes.size > MAX_FILE_SIZE_BYTES) {
            throw ApiException(
                "FILE_TOO_LARGE",
                "파일이 너무 큽니다 (최대 ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB)",
                HttpStatus.PAYLOAD_TOO_LARGE
            )
        }
        if (!aiCall.isConfigured()) {
            throw ApiException("AI_NOT_CONFIGURED", "Claude API 키 미설정", HttpStatus.SERVICE_UNAVAILABLE)
        }

        val isPdf = mediaType == "application/pdf"
        val isImage = mediaType.startsWith("image/")
        if (!isPdf && !isImage) {
            throw ApiException("UNSUPPORTED_MEDIA", "지원하지 않는 형식: $mediaType", HttpStatus.UNSUPPORTED_MEDIA_TYPE)
        }

        val hash = sha256(fileBytes)
        val started = System.currentTimeMillis()

        // 이미지 = 1페이지
        if (isImage) {
            val md = callOnePage(fileBytes, mediaType, userId)
            return ConversionResult(
                pages = listOf(PageMarkdown(1, md.text.trim())),
                sourceHash = hash,
                sourceSizeBytes = fileBytes.size.toLong(),
                totalInputTokens = md.inputTokens ?: 0,
                totalOutputTokens = md.outputTokens ?: 0,
                totalDurationMs = (System.currentTimeMillis() - started).toInt(),
            )
        }

        // PDF = 페이지별 분할 호출
        val pageBytesList = splitPdfByPage(fileBytes)
        if (pageBytesList.size > MAX_PDF_PAGES) {
            throw ApiException(
                "PDF_TOO_MANY_PAGES",
                "PDF 페이지가 너무 많습니다 (현재 ${pageBytesList.size}장 / 최대 ${MAX_PDF_PAGES}장). 분할 후 업로드하세요.",
                HttpStatus.PAYLOAD_TOO_LARGE
            )
        }
        val pages = mutableListOf<PageMarkdown>()
        var totalIn = 0
        var totalOut = 0
        for ((idx, pageBytes) in pageBytesList.withIndex()) {
            val res = callOnePage(pageBytes, "application/pdf", userId)
            pages.add(PageMarkdown(idx + 1, res.text.trim()))
            totalIn += (res.inputTokens ?: 0)
            totalOut += (res.outputTokens ?: 0)
        }
        return ConversionResult(
            pages = pages,
            sourceHash = hash,
            sourceSizeBytes = fileBytes.size.toLong(),
            totalInputTokens = totalIn,
            totalOutputTokens = totalOut,
            totalDurationMs = (System.currentTimeMillis() - started).toInt(),
        )
    }

    /** 단일 이미지/PDF 페이지를 Claude Vision 으로 변환. 실패 시 ApiException. */
    private fun callOnePage(fileBytes: ByteArray, mediaType: String, userId: String): AiCallHelper.CallResult {
        val base64 = Base64.getEncoder().encodeToString(fileBytes)
        val mediaBlock = if (mediaType == "application/pdf") aiCall.pdfBlock(base64) else aiCall.imageBlock(base64, mediaType)
        val instructionBlock = aiCall.textBlock(
            "위 파일의 본문을 한국어 학습 콘텐츠용 마크다운으로 변환해주세요. " +
            "원문을 그대로 보존하되 마크다운 문법으로 구조화만 해주세요. " +
            "결과만 출력 (다른 설명·인사말 금지)."
        )
        try {
            val result = aiCall.callMultimodal(
                model = AiCallHelper.MODEL_SONNET,
                systemBlocks = listOf(aiCall.systemBlock(SYSTEM_PROMPT, ephemeralCache = true)),
                userContent = listOf(mediaBlock, instructionBlock),
                maxTokens = 8192,
            )
            logService.log(
                userId = userId,
                testId = null,
                kind = "file-to-markdown",
                model = AiCallHelper.MODEL_SONNET,
                inputTokens = result.inputTokens,
                outputTokens = result.outputTokens,
                durationMs = result.durationMs,
                status = "success",
            )
            return result
        } catch (ex: Exception) {
            logger.error("파일→마크다운 변환 실패", ex)
            logService.log(
                userId = userId, testId = null, kind = "file-to-markdown",
                model = AiCallHelper.MODEL_SONNET, status = "error",
                errorMessage = ex.message?.take(500),
            )
            throw ApiException("AI_CALL_FAILED", "변환 실패: ${ex.message}", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    /** PDF 를 페이지별 단일 페이지 PDF byte array 로 분할. */
    private fun splitPdfByPage(bytes: ByteArray): List<ByteArray> {
        val srcDoc = Loader.loadPDF(bytes)
        try {
            val list = mutableListOf<ByteArray>()
            for (i in 0 until srcDoc.numberOfPages) {
                PDDocument().use { pageDoc ->
                    pageDoc.addPage(srcDoc.getPage(i))
                    val baos = ByteArrayOutputStream()
                    pageDoc.save(baos)
                    list.add(baos.toByteArray())
                }
            }
            return list
        } finally {
            srcDoc.close()
        }
    }

    private fun sha256(bytes: ByteArray): String {
        val md = MessageDigest.getInstance("SHA-256")
        return md.digest(bytes).joinToString("") { "%02x".format(it) }
    }

    /** PDF 페이지 수 카운트 (PDFBox). 파싱 실패 시 0 반환 (검증 통과). */
    private fun countPdfPages(bytes: ByteArray): Int {
        return try {
            Loader.loadPDF(bytes).use { doc -> doc.numberOfPages }
        } catch (ex: Exception) {
            logger.warn("PDF 페이지 수 카운트 실패: {}", ex.message)
            0
        }
    }
}
