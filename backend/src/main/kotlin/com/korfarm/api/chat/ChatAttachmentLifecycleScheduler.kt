package com.korfarm.api.chat

import com.korfarm.api.common.IdGenerator
import com.korfarm.api.files.FileRepository
import com.korfarm.api.files.FileService
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.io.BufferedOutputStream
import java.io.FileOutputStream
import java.nio.file.Files
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.temporal.WeekFields
import java.util.Locale
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

/**
 * 채팅 첨부 파일 라이프사이클 스케줄러 (S3 마이그레이션 후).
 *
 *   D+0~6일: live  (S3 에 원본, 정상 표시)
 *   D+7일:    archived (썸네일 fileId 만 노출 + 주차 ZIP 을 S3 에 saveBinary, 원본 삭제)
 *   D+37일:   purged (ZIP 도 S3 에서 삭제, 디스크 회수)
 *
 * archive.zipPath 컬럼 — 의미 변경: file path 가 아니라 fileId (S3 key) 저장.
 * msg.thumbnailPath 컬럼 — 동일하게 fileId 저장.
 */
@Component
class ChatAttachmentLifecycleScheduler(
    private val messageRepo: ChatMessageRepository,
    private val archiveRepo: ChatAttachmentArchiveRepository,
    private val fileRepo: FileRepository,
    private val fileService: FileService,
    private val thumbnailService: ChatThumbnailService,
) {
    private val log = LoggerFactory.getLogger(ChatAttachmentLifecycleScheduler::class.java)

    /**
     * 매일 00:30 KST: 7일 이상 지난 live 첨부 메시지를 주차별로 묶어 ZIP 으로 보관.
     * S3 putObject 로 saveBinary, 임시 로컬 파일은 ZIP 만들 때만 사용 후 삭제.
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

        // (roomId, periodStart) 단위 그룹핑
        val groups = targets.groupBy { msg ->
            val date = msg.createdAt.toLocalDate()
            val monday = date.with(DayOfWeek.MONDAY)
            msg.roomId to monday
        }

        for ((key, msgs) in groups) {
            val (roomId, periodStart) = key
            val periodEnd = periodStart.plusDays(6)

            try {
                val existingArchive = archiveRepo.findByRoomIdAndPeriodStart(roomId, periodStart)

                // 1) 썸네일 생성 + 첨부 byte[] 수집
                data class CollectedAttachment(val entryName: String, val fileId: String, val bytes: ByteArray)
                val collected = mutableListOf<CollectedAttachment>()

                for (msg in msgs) {
                    val fileId = msg.fileId ?: continue
                    val origMeta = fileRepo.findById(fileId).orElse(null)
                    val mime = origMeta?.mime
                    val bytes = fileService.readBytes(fileId) ?: continue

                    // 썸네일 생성 → S3 saveBinary, fileId 저장
                    if (mime != null && mime.startsWith("image/")) {
                        val thumb = thumbnailService.createImageThumbnailFromBytes(bytes, mime)
                        if (thumb != null) {
                            val (thumbBytes, thumbMime) = thumb
                            val thumbExt = if (thumbMime == "image/png") "png" else "jpg"
                            val thumbFileId = fileService.saveBinary(
                                ownerUserId = msg.userId,
                                purpose = "chat-thumb",
                                filename = "${msg.id}.$thumbExt",
                                mime = thumbMime,
                                data = thumbBytes,
                            )
                            msg.thumbnailPath = thumbFileId  // 의미 변경: 파일경로 → fileId
                        }
                    }

                    val ext = guessExt(mime)
                    val entryName = "${msg.id}_${msg.userName}_${msg.messageType}$ext"
                    collected.add(CollectedAttachment(entryName, fileId, bytes))
                }

                // 2) ZIP 임시 로컬에 만들고 S3 saveBinary 후 임시 삭제
                if (collected.isNotEmpty()) {
                    val tmpZip = Files.createTempFile("korfarm-chat-archive-", ".zip")
                    try {
                        ZipOutputStream(BufferedOutputStream(FileOutputStream(tmpZip.toFile()))).use { zos ->
                            for (a in collected) {
                                zos.putNextEntry(ZipEntry(a.entryName))
                                zos.write(a.bytes)
                                zos.closeEntry()
                            }
                        }
                        val zipBytes = Files.readAllBytes(tmpZip)
                        val zipFilename = makeZipFilename(roomId, periodStart)
                        val zipFileId = fileService.saveBinary(
                            ownerUserId = "system",
                            purpose = "chat-archive",
                            filename = zipFilename,
                            mime = "application/zip",
                            data = zipBytes,
                        )

                        if (existingArchive == null) {
                            archiveRepo.save(
                                ChatAttachmentArchiveEntity(
                                    id = IdGenerator.newId("carc"),
                                    roomId = roomId,
                                    periodStart = periodStart,
                                    periodEnd = periodEnd,
                                    zipPath = zipFileId,  // 의미: fileId
                                    zipSize = zipBytes.size.toLong(),
                                    fileCount = collected.size,
                                    expiresAt = LocalDateTime.now().plusDays(30),
                                    status = "available"
                                )
                            )
                        } else {
                            existingArchive.zipPath = zipFileId
                            existingArchive.zipSize = zipBytes.size.toLong()
                            existingArchive.fileCount = (existingArchive.fileCount + collected.size)
                            existingArchive.status = "available"
                            archiveRepo.save(existingArchive)
                        }
                    } finally {
                        try { Files.deleteIfExists(tmpZip) } catch (_: Exception) { /* ignore */ }
                    }
                }

                // 3) 원본 파일 메타 status archived (S3 객체는 별도 cleanup job 에서 정리)
                val now = LocalDateTime.now()
                for (msg in msgs) {
                    val fileId = msg.fileId
                    if (fileId != null) {
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
     * 매일 01:00 KST: 만료된 archive 를 purge — archive.zipPath 가 fileId 면 status 만 변경.
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
                // S3 객체 삭제는 별도 cleanup job. 여기선 status 만 변경.
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
