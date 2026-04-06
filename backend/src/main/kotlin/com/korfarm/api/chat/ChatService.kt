package com.korfarm.api.chat

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.user.UserRepository
import org.springframework.data.domain.PageRequest
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@Service
class ChatService(
    private val messageRepo: ChatMessageRepository,
    private val muteRepo: ChatUserMuteRepository,
    private val archiveRepo: ChatAttachmentArchiveRepository,
    private val userRepo: UserRepository
) {
    private val isoFmt: DateTimeFormatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME

    @Transactional
    fun sendMessage(userId: String, isAdmin: Boolean, req: SendMessageRequest): ChatMessageView {
        val roomId = req.roomId
        if (roomId.isBlank()) throw ApiException("INVALID_ROOM", "roomId is required", HttpStatus.BAD_REQUEST)
        val type = req.messageType
        if (type !in listOf("text", "image", "file", "voice", "notice")) {
            throw ApiException("INVALID_TYPE", "invalid messageType", HttpStatus.BAD_REQUEST)
        }
        if (type == "notice" && !isAdmin) {
            throw ApiException("FORBIDDEN", "공지 메시지는 관리자만 전송 가능", HttpStatus.FORBIDDEN)
        }

        // 뮤트 상태 확인 (관리자는 우회)
        if (!isAdmin) {
            val mute = muteRepo.findByRoomIdAndUserId(roomId, userId)
            if (mute != null && (mute.mutedUntil == null || mute.mutedUntil!!.isAfter(LocalDateTime.now()))) {
                throw ApiException("MUTED", mute.reason ?: "채팅이 차단된 상태입니다", HttpStatus.FORBIDDEN)
            }
        }

        // 본문 검증
        when (type) {
            "text", "notice" -> {
                if (req.content.isNullOrBlank()) {
                    throw ApiException("EMPTY_CONTENT", "메시지 본문이 비어있습니다", HttpStatus.BAD_REQUEST)
                }
            }
            "image", "file", "voice" -> {
                if (req.fileId.isNullOrBlank()) {
                    throw ApiException("EMPTY_FILE", "첨부 파일이 필요합니다", HttpStatus.BAD_REQUEST)
                }
            }
        }

        val user = userRepo.findById(userId).orElseThrow {
            ApiException("USER_NOT_FOUND", "사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        val displayName = user.name?.takeIf { it.isNotBlank() } ?: user.email

        val entity = ChatMessageEntity(
            id = IdGenerator.newId("cmsg"),
            roomId = roomId,
            userId = userId,
            userName = displayName,
            messageType = type,
            content = req.content,
            fileId = req.fileId,
            attachmentState = if (req.fileId != null) "live" else "live",
            isAdmin = isAdmin,
            createdAt = LocalDateTime.now()
        )
        messageRepo.save(entity)
        return entity.toView()
    }

    @Transactional(readOnly = true)
    fun getHistory(roomId: String, beforeId: String?, limit: Int): MessageHistoryResponse {
        val pageSize = limit.coerceIn(1, 100)
        val before: LocalDateTime? = beforeId?.let {
            messageRepo.findById(it).orElse(null)?.createdAt
        }
        val rows = messageRepo.findRecent(roomId, before, PageRequest.of(0, pageSize + 1))
        val hasMore = rows.size > pageSize
        val limited = rows.take(pageSize)
        // 응답은 ASC (오래된→최신)
        return MessageHistoryResponse(
            messages = limited.reversed().map { it.toView() },
            hasMore = hasMore
        )
    }

    @Transactional
    fun deleteMessage(messageId: String, userId: String, isAdmin: Boolean) {
        val msg = messageRepo.findById(messageId).orElseThrow {
            ApiException("NOT_FOUND", "메시지를 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        if (!isAdmin && msg.userId != userId) {
            throw ApiException("FORBIDDEN", "본인 메시지만 삭제할 수 있습니다", HttpStatus.FORBIDDEN)
        }
        msg.status = "deleted"
        msg.deletedBy = userId
        messageRepo.save(msg)
    }

    @Transactional
    fun muteUser(roomId: String, adminId: String, req: MuteUserRequest): MutedUserView {
        val existing = muteRepo.findByRoomIdAndUserId(roomId, req.userId)
        val mutedUntil = req.durationMinutes?.let { LocalDateTime.now().plusMinutes(it.toLong()) }
        val entity = existing ?: ChatUserMuteEntity(
            id = IdGenerator.newId("cmute"),
            roomId = roomId,
            userId = req.userId,
            mutedUntil = mutedUntil,
            reason = req.reason,
            mutedBy = adminId
        )
        entity.mutedUntil = mutedUntil
        entity.reason = req.reason
        entity.mutedBy = adminId
        muteRepo.save(entity)
        return entity.toView()
    }

    @Transactional
    fun unmuteUser(roomId: String, userId: String) {
        val existing = muteRepo.findByRoomIdAndUserId(roomId, userId) ?: return
        muteRepo.delete(existing)
    }

    @Transactional(readOnly = true)
    fun listMutes(roomId: String): List<MutedUserView> {
        return muteRepo.findByRoomId(roomId).map { it.toView() }
    }

    @Transactional(readOnly = true)
    fun listArchives(roomId: String): List<ArchiveListItem> {
        return archiveRepo.findByRoomIdOrderByPeriodStartDesc(roomId).map { it.toListItem() }
    }

    @Transactional(readOnly = true)
    fun getArchiveForDownload(archiveId: String): ChatAttachmentArchiveEntity {
        val a = archiveRepo.findById(archiveId).orElseThrow {
            ApiException("NOT_FOUND", "보관 파일을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        if (a.status != "available") {
            throw ApiException("EXPIRED", "보관 기한이 지나 삭제됐습니다", HttpStatus.GONE)
        }
        if (a.expiresAt.isBefore(LocalDateTime.now())) {
            throw ApiException("EXPIRED", "보관 기한이 만료됐습니다", HttpStatus.GONE)
        }
        return a
    }

    // ── 변환 헬퍼 ──

    private fun ChatMessageEntity.toView(): ChatMessageView {
        // archived/purged 상태에서는 fileId 노출 X (다운로드 차단)
        val safeFileId = if (attachmentState == "live") fileId else null
        val thumbUrl = thumbnailPath?.let { "/v1/chat/thumbs/$id" }
        return ChatMessageView(
            id = id,
            roomId = roomId,
            userId = userId,
            userName = userName,
            messageType = messageType,
            content = if (status == "deleted") null else content,
            fileId = if (status == "deleted") null else safeFileId,
            thumbnailUrl = if (status == "deleted") null else thumbUrl,
            attachmentState = attachmentState,
            isAdmin = isAdmin,
            status = status,
            createdAt = createdAt.format(isoFmt)
        )
    }

    private fun ChatUserMuteEntity.toView(): MutedUserView = MutedUserView(
        userId = userId,
        mutedUntil = mutedUntil?.format(isoFmt),
        reason = reason,
        mutedBy = mutedBy,
        createdAt = createdAt.format(isoFmt)
    )

    private fun ChatAttachmentArchiveEntity.toListItem(): ArchiveListItem = ArchiveListItem(
        archiveId = id,
        roomId = roomId,
        periodStart = periodStart.toString(),
        periodEnd = periodEnd.toString(),
        zipSize = zipSize,
        fileCount = fileCount,
        createdAt = createdAt.format(isoFmt),
        expiresAt = expiresAt.format(isoFmt),
        status = status
    )
}
