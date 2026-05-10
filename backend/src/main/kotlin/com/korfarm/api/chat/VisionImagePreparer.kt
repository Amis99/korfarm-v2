package com.korfarm.api.chat

import com.korfarm.api.common.ApiException
import com.korfarm.api.files.FileRepository
import com.korfarm.api.files.FileService
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import java.awt.Color
import java.awt.RenderingHints
import java.awt.image.BufferedImage
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.util.Base64
import javax.imageio.IIOImage
import javax.imageio.ImageIO
import javax.imageio.ImageWriteParam

data class PreparedImage(
    val bytes: ByteArray,
    val mime: String,
    val sourceFileId: String,
)

@Component
class VisionImagePreparer(
    private val fileRepository: FileRepository,
    private val fileService: FileService,
) {
    companion object {
        private val ALLOWED_MIME = setOf("image/jpeg", "image/png", "image/webp", "image/gif")
        private const val MAX_DIM = 1568
        private const val MAX_RAW_BYTES = 10 * 1024 * 1024
        private const val JPEG_QUALITY = 0.85f
    }

    fun prepareFromFileId(fileId: String, expectedOwnerId: String): PreparedImage {
        val file = fileRepository.findById(fileId).orElseThrow {
            ApiException("NOT_FOUND", "파일을 찾을 수 없습니다.", HttpStatus.NOT_FOUND)
        }
        if (file.ownerId != expectedOwnerId) {
            throw ApiException("FORBIDDEN", "본인이 올린 이미지만 사용할 수 있습니다.", HttpStatus.FORBIDDEN)
        }
        if (file.mime !in ALLOWED_MIME) {
            throw ApiException("INVALID_IMAGE_MIME", "지원하지 않는 이미지 형식입니다.", HttpStatus.BAD_REQUEST)
        }

        val raw = fileService.readBytes(fileId)
            ?: throw ApiException("FILE_NOT_FOUND", "이미지 파일을 읽을 수 없습니다.", HttpStatus.NOT_FOUND)
        if (raw.size > MAX_RAW_BYTES) {
            throw ApiException("IMAGE_TOO_LARGE", "이미지는 10MB 이하만 첨부할 수 있습니다.", HttpStatus.BAD_REQUEST)
        }

        val source = ImageIO.read(ByteArrayInputStream(raw))
            ?: throw ApiException("INVALID_IMAGE", "이미지를 해석할 수 없습니다.", HttpStatus.BAD_REQUEST)
        val resized = downscale(source, MAX_DIM)
        val jpeg = writeJpeg(resized, JPEG_QUALITY)
        return PreparedImage(jpeg, "image/jpeg", fileId)
    }

    fun toClaudeImageBlock(prepared: PreparedImage): Map<String, Any> = mapOf(
        "type" to "image",
        "source" to mapOf(
            "type" to "base64",
            "media_type" to prepared.mime,
            "data" to Base64.getEncoder().encodeToString(prepared.bytes),
        ),
    )

    private fun downscale(source: BufferedImage, maxDim: Int): BufferedImage {
        val ratio = minOf(
            1.0,
            maxDim.toDouble() / source.width.coerceAtLeast(1),
            maxDim.toDouble() / source.height.coerceAtLeast(1),
        )
        val width = (source.width * ratio).toInt().coerceAtLeast(1)
        val height = (source.height * ratio).toInt().coerceAtLeast(1)
        val target = BufferedImage(width, height, BufferedImage.TYPE_INT_RGB)
        val g = target.createGraphics()
        g.color = Color.WHITE
        g.fillRect(0, 0, width, height)
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR)
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY)
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON)
        g.drawImage(source, 0, 0, width, height, null)
        g.dispose()
        return target
    }

    private fun writeJpeg(image: BufferedImage, quality: Float): ByteArray {
        val output = ByteArrayOutputStream()
        val writer = ImageIO.getImageWritersByFormatName("jpeg").asSequence().firstOrNull()
            ?: throw ApiException("IMAGE_ENCODE_FAILED", "이미지 변환에 실패했습니다.", HttpStatus.BAD_REQUEST)
        val ios = ImageIO.createImageOutputStream(output)
        writer.output = ios
        val params = writer.defaultWriteParam
        if (params.canWriteCompressed()) {
            params.compressionMode = ImageWriteParam.MODE_EXPLICIT
            params.compressionQuality = quality
        }
        writer.write(null, IIOImage(image, null, null), params)
        writer.dispose()
        ios.close()
        return output.toByteArray()
    }
}
