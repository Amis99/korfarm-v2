package com.korfarm.api.chat

import com.korfarm.api.common.IdGenerator
import com.korfarm.api.files.FileRepository
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.io.BufferedOutputStream
import java.io.FileOutputStream
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.temporal.WeekFields
import java.util.Locale
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

/**
 * 채팅 첨부 파일 라이프사이클 스케줄러.
 *
 *   D+0~6일: live (정상 표시)
 *   D+7일:   archived (썸네일만 노출 + 주차 ZIP 생성, 원본 삭제)
 *   D+37일:  purged (ZIP 삭제, 디스크 회수)
 */
@Component
class ChatAttachmentLifecycleScheduler(
    private val messageRepo: ChatMessageRepository,
    private val archiveRepo: ChatAttachmentArchiveRepository,
    private val fileRepo: FileRepository,
    private val thumbnailService: ChatThumbnailService,
    @Value("\${app.upload.dir:./uploads}") private val uploadDir: String
) {
    private val log = LoggerFactory.getLogger(ChatAttachmentLifecycleScheduler::class.java)

    private fun uploadPath(): Path = Paths.get(uploadDir).also {
        if (!Files.exists(it)) Files.createDirectories(it)
    }

    private fun archiveDir(): Path {
        val p = uploadPath().resolve("chat-archives")
        if (!Files.exists(p)) Files.createDirectories(p)
        return p
    }

    /**
     * 매일 00:30 KST: 7일 이상 지난 live 첨부 메시지를 주차별로 묶어 ZIP으로 보관.
     */
    @Scheduled(cron = "0 30 0 * * *", zone = "Asia/Seoul")
    @Transactional
    fun archiveLiveAttachments() {
        val cutoff = LocalDateTime.now().minusDays(7)
        val targets = messageRepo.findByAttachmentStateAndCreatedAtBefore("live", cutoff)
            .filter { it.fileId != null }
        if (targets.isEmpty()) {
            log.info("[ChatLifecycle] no archive candidates")
            return
        }
        log.info("[ChatLifecycle] archive candidates: {}", targets.size)

        // (roomId, periodStart) 단위로 그룹핑
        val groups = targets.groupBy { msg ->
            val date = msg.createdAt.toLocalDate()
            val monday = date.with(DayOfWeek.MONDAY)
            msg.roomId to monday
        }

        for ((key, msgs) in groups) {
            val (roomId, periodStart) = key
            val periodEnd = periodStart.plusDays(6)
            val zipFilename = makeZipFilename(roomId, periodStart)
            val zipPath = archiveDir().resolve(zipFilename)

            try {
                // 기존 archive가 있으면 추가 모드(레이지: 기존 zip 풀고 다시 압축) — 단순화: 기존이 있으면 메시지에 대해서만 처리하고 zip은 새로 만듦
                val existingArchive = archiveRepo.findByRoomIdAndPeriodStart(roomId, periodStart)
                val collected = mutableListOf<Triple<String, String, Path>>() // (entryName, fileId, srcPath)
                for (msg in msgs) {
                    val fileId = msg.fileId ?: continue
                    val src = uploadPath().resolve(fileId)
                    if (Files.exists(src)) {
                        val origName = fileRepo.findById(fileId).orElse(null)
                        val ext = guessExt(origName?.mime)
                        val entryName = "${msg.id}_${msg.userName}_${msg.messageType}$ext"
                        collected.add(Triple(entryName, fileId, src))
                    }
                    // 썸네일 생성 (이미지만)
                    val mime = fileRepo.findById(fileId).orElse(null)?.mime
                    if (mime != null && Files.exists(src)) {
                        val thumb = thumbnailService.createImageThumbnail(msg.id, src, mime)
                        if (thumb != null) msg.thumbnailPath = thumb
                    }
                }

                if (collected.isNotEmpty()) {
                    // ZIP 생성 (기존 파일이 있으면 덮어씀)
                    Files.deleteIfExists(zipPath)
                    ZipOutputStream(BufferedOutputStream(FileOutputStream(zipPath.toFile()))).use { zos ->
                        for ((entryName, _, src) in collected) {
                            val entry = ZipEntry(entryName)
                            zos.putNextEntry(entry)
                            Files.copy(src, zos)
                            zos.closeEntry()
                        }
                    }
                    val zipSize = Files.size(zipPath)

                    // archive row upsert
                    if (existingArchive == null) {
                        archiveRepo.save(
                            ChatAttachmentArchiveEntity(
                                id = IdGenerator.newId("carc"),
                                roomId = roomId,
                                periodStart = periodStart,
                                periodEnd = periodEnd,
                                zipPath = zipPath.toString(),
                                zipSize = zipSize,
                                fileCount = collected.size,
                                expiresAt = LocalDateTime.now().plusDays(30),
                                status = "available"
                            )
                        )
                    } else {
                        existingArchive.zipPath = zipPath.toString()
                        existingArchive.zipSize = zipSize
                        existingArchive.fileCount = (existingArchive.fileCount + collected.size)
                        existingArchive.status = "available"
                        archiveRepo.save(existingArchive)
                    }
                }

                // 메시지 상태 갱신 + 원본 파일 삭제
                val now = LocalDateTime.now()
                for (msg in msgs) {
                    val fileId = msg.fileId
                    if (fileId != null) {
                        val src = uploadPath().resolve(fileId)
                        try {
                            Files.deleteIfExists(src)
                        } catch (e: Exception) {
                            log.warn("[ChatLifecycle] failed to delete $src", e)
                        }
                        // 파일 메타도 status 변경 (원본 fileId는 보존, 다운로드 차단은 ChatService에서 처리)
                        fileRepo.findById(fileId).ifPresent {
                            it.status = "archived"
                            fileRepo.save(it)
                        }
                    }
                    msg.attachmentState = "archived"
                    msg.archivedAt = now
                    msg.fileId = null
                    messageRepo.save(msg)
                }
            } catch (e: Exception) {
                log.error("[ChatLifecycle] archive failed for room=$roomId period=$periodStart", e)
            }
        }
    }

    /**
     * 매일 01:00 KST: 만료된 archive를 purge.
     */
    @Scheduled(cron = "0 0 1 * * *", zone = "Asia/Seoul")
    @Transactional
    fun purgeExpiredArchives() {
        val now = LocalDateTime.now()
        val expired = archiveRepo.findByExpiresAtBeforeAndStatus(now, "available")
        if (expired.isEmpty()) return
        log.info("[ChatLifecycle] purge candidates: {}", expired.size)
        for (a in expired) {
            try {
                val p = Paths.get(a.zipPath)
                Files.deleteIfExists(p)
                a.status = "purged"
                archiveRepo.save(a)
            } catch (e: Exception) {
                log.error("[ChatLifecycle] purge failed for archive=${a.id}", e)
            }
        }
    }

    // ── 헬퍼 ──

    private fun makeZipFilename(roomId: String, periodStart: LocalDate): String {
        val weekFields = WeekFields.of(Locale.KOREA)
        val year = periodStart.year
        val week = periodStart.get(weekFields.weekOfWeekBasedYear())
        return "${roomId}_${year}-W%02d.zip".format(week)
    }

    private fun guessExt(mime: String?): String = when (mime) {
        "image/jpeg" -> ".jpg"
        "image/png" -> ".png"
        "image/gif" -> ".gif"
        "image/webp" -> ".webp"
        "audio/webm" -> ".webm"
        "audio/mpeg" -> ".mp3"
        "audio/wav" -> ".wav"
        "audio/ogg" -> ".ogg"
        "application/pdf" -> ".pdf"
        else -> ""
    }
}
