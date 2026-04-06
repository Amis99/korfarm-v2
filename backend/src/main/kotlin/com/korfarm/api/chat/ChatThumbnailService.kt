package com.korfarm.api.chat

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.awt.RenderingHints
import java.awt.image.BufferedImage
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import javax.imageio.ImageIO

/**
 * 채팅 첨부 썸네일 생성 서비스.
 *
 * - 이미지: 200x200 max로 리사이즈하여 chat-thumbs 디렉토리에 저장
 * - 음성/일반 파일: 별도 썸네일 없음 (프론트엔드에서 MIME 아이콘 표시)
 */
@Service
class ChatThumbnailService(
    @Value("\${app.upload.dir:./uploads}") private val uploadDir: String
) {
    private val log = LoggerFactory.getLogger(ChatThumbnailService::class.java)

    private val thumbDir: Path
        get() {
            val p = Paths.get(uploadDir).resolve("chat-thumbs")
            if (!Files.exists(p)) Files.createDirectories(p)
            return p
        }

    /**
     * 이미지 파일을 200x200으로 리사이즈하여 messageId로 저장.
     * 결과 파일 경로 반환. 실패 시 null.
     */
    fun createImageThumbnail(messageId: String, originalPath: Path, mime: String): String? {
        if (!mime.startsWith("image/")) return null
        if (!Files.exists(originalPath)) return null
        return try {
            val src: BufferedImage = ImageIO.read(originalPath.toFile()) ?: return null
            val (newW, newH) = fitInBox(src.width, src.height, 200, 200)
            val resized = BufferedImage(newW, newH, BufferedImage.TYPE_INT_RGB)
            val g = resized.createGraphics()
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR)
            g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY)
            g.drawImage(src, 0, 0, newW, newH, null)
            g.dispose()
            val ext = if (mime == "image/png") "png" else "jpg"
            val dest = thumbDir.resolve("$messageId.$ext")
            ImageIO.write(resized, ext, dest.toFile())
            dest.toString()
        } catch (e: Exception) {
            log.warn("createImageThumbnail failed for $messageId", e)
            null
        }
    }

    private fun fitInBox(srcW: Int, srcH: Int, boxW: Int, boxH: Int): Pair<Int, Int> {
        if (srcW <= boxW && srcH <= boxH) return srcW to srcH
        val ratio = minOf(boxW.toDouble() / srcW, boxH.toDouble() / srcH)
        return (srcW * ratio).toInt().coerceAtLeast(1) to (srcH * ratio).toInt().coerceAtLeast(1)
    }
}
