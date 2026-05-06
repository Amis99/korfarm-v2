package com.korfarm.api.chat

import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.awt.RenderingHints
import java.awt.image.BufferedImage
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import javax.imageio.ImageIO

/**
 * 채팅 첨부 썸네일 생성 서비스.
 *
 * S3 마이그레이션 후: byte[] 입력·byte[] 출력. EC2 디스크 안 거침.
 * 호출자(ChatAttachmentLifecycleScheduler) 가 결과 byte[] 를 S3 에 saveBinary.
 */
@Service
class ChatThumbnailService {
    private val log = LoggerFactory.getLogger(ChatThumbnailService::class.java)

    /**
     * 이미지 byte[] 를 200×200 max 로 리사이즈해 byte[] 반환.
     * 결과 mime: image/jpeg (PNG 입력은 PNG 유지), 실패 시 null.
     *
     * @return Pair(썸네일 bytes, mime) 또는 null
     */
    fun createImageThumbnailFromBytes(originalBytes: ByteArray, mime: String): Pair<ByteArray, String>? {
        if (!mime.startsWith("image/")) return null
        return try {
            val src: BufferedImage = ImageIO.read(ByteArrayInputStream(originalBytes)) ?: return null
            val (newW, newH) = fitInBox(src.width, src.height, 200, 200)
            val outType = if (mime == "image/png") BufferedImage.TYPE_INT_ARGB else BufferedImage.TYPE_INT_RGB
            val resized = BufferedImage(newW, newH, outType)
            val g = resized.createGraphics()
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR)
            g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY)
            g.drawImage(src, 0, 0, newW, newH, null)
            g.dispose()
            val (ext, outMime) = if (mime == "image/png") "png" to "image/png" else "jpg" to "image/jpeg"
            val out = ByteArrayOutputStream()
            ImageIO.write(resized, ext, out)
            out.toByteArray() to outMime
        } catch (e: Exception) {
            log.warn("createImageThumbnailFromBytes failed (mime=$mime)", e)
            null
        }
    }

    private fun fitInBox(srcW: Int, srcH: Int, boxW: Int, boxH: Int): Pair<Int, Int> {
        if (srcW <= boxW && srcH <= boxH) return srcW to srcH
        val ratio = minOf(boxW.toDouble() / srcW, boxH.toDouble() / srcH)
        return (srcW * ratio).toInt().coerceAtLeast(1) to (srcH * ratio).toInt().coerceAtLeast(1)
    }
}
