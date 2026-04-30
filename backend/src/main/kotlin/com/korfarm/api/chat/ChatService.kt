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
    private val emoticonRepo: ChatEmoticonRepository,
    private val likeRepo: ChatMessageLikeRepository,
    private val userRepo: UserRepository
) {
    private val isoFmt: DateTimeFormatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME

    @Transactional
    fun sendMessage(userId: String, isAdmin: Boolean, req: SendMessageRequest): ChatMessageView {
        val roomId = req.roomId
        if (roomId.isBlank()) throw ApiException("INVALID_ROOM", "roomId is required", HttpStatus.BAD_REQUEST)
        val type = req.messageType
        if (type !in listOf("text", "image", "file", "voice", "notice", "emoticon")) {
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
            "emoticon" -> {
                if (req.content.isNullOrBlank()) {
                    throw ApiException("EMPTY_EMOTICON", "이모티콘 ID가 필요합니다", HttpStatus.BAD_REQUEST)
                }
                // 존재하는 이모티콘인지 확인
                val emoticon = emoticonRepo.findById(req.content).orElse(null)
                    ?: throw ApiException("EMOTICON_NOT_FOUND", "이모티콘을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
                if (emoticon.status != "active") {
                    throw ApiException("EMOTICON_INACTIVE", "사용할 수 없는 이모티콘입니다", HttpStatus.GONE)
                }
            }
        }

        val user = userRepo.findById(userId).orElseThrow {
            ApiException("USER_NOT_FOUND", "사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        val displayName = user.name?.takeIf { it.isNotBlank() } ?: user.email
        // 아바타는 chat_messages에 저장하지 않음 — view 시점에 user 테이블에서 실시간 조회
        // (base64 데이터 URL이 컬럼 크기를 초과하고, 프로필 변경 시 일관된 표시를 위해)
        val avatarUrl = user.profileImageUrl?.takeIf { it.isNotBlank() }

        val entity = ChatMessageEntity(
            id = IdGenerator.newId("cmsg"),
            roomId = roomId,
            userId = userId,
            userName = displayName,
            userAvatarUrl = null,  // 컬럼 크기 제한으로 저장 안 함
            messageType = type,
            content = req.content,
            fileId = req.fileId,
            attachmentState = "live",
            isAdmin = isAdmin,
            createdAt = LocalDateTime.now()
        )
        messageRepo.save(entity)
        return entity.toView(avatarOverride = avatarUrl)
    }

    @Transactional(readOnly = true)
    fun getHistory(roomId: String, beforeId: String?, limit: Int, currentUserId: String): MessageHistoryResponse {
        val pageSize = limit.coerceIn(1, 100)
        val before: LocalDateTime? = beforeId?.let {
            messageRepo.findById(it).orElse(null)?.createdAt
        }
        val rows = messageRepo.findRecent(roomId, before, PageRequest.of(0, pageSize + 1))
        val hasMore = rows.size > pageSize
        val limited = rows.take(pageSize)
        // 사용자 ID들을 모아 한 번에 fetch (N+1 방지)
        val userIds = limited.map { it.userId }.toSet()
        val userMap = userRepo.findAllById(userIds).associateBy { it.id }

        // 좋아요 카운트 + 내가 좋아요 누른 메시지 ID 일괄 조회
        val msgIds = limited.map { it.id }.toSet()
        val likeCountMap: Map<String, Int> = if (msgIds.isNotEmpty()) {
            likeRepo.countByMessageIds(msgIds).associate { row ->
                (row[0] as String) to (row[1] as Number).toInt()
            }
        } else emptyMap()
        val myLikedSet: Set<String> = if (msgIds.isNotEmpty()) {
            likeRepo.findLikedMessageIdsByUser(msgIds, currentUserId).toSet()
        } else emptySet()

        // 응답은 ASC (오래된→최신)
        return MessageHistoryResponse(
            messages = limited.reversed().map { msg ->
                val avatar = userMap[msg.userId]?.profileImageUrl?.takeIf { it.isNotBlank() }
                msg.toView(
                    avatarOverride = avatar,
                    likeCountOverride = likeCountMap[msg.id] ?: 0,
                    likedByMeOverride = msg.id in myLikedSet
                )
            },
            hasMore = hasMore
        )
    }

    // ── 좋아요 ──

    @Transactional
    fun toggleLike(messageId: String, userId: String): LikeToggleResponse {
        val msg = messageRepo.findById(messageId).orElseThrow {
            ApiException("NOT_FOUND", "메시지를 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        if (msg.status == "deleted") {
            throw ApiException("DELETED", "삭제된 메시지에는 좋아요를 누를 수 없습니다", HttpStatus.GONE)
        }
        val user = userRepo.findById(userId).orElseThrow {
            ApiException("USER_NOT_FOUND", "사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        val displayName = user.name?.takeIf { it.isNotBlank() } ?: user.email

        val existing = likeRepo.findByMessageIdAndUserId(messageId, userId)
        val nowLiked: Boolean
        if (existing != null) {
            likeRepo.delete(existing)
            nowLiked = false
        } else {
            likeRepo.save(
                ChatMessageLikeEntity(
                    id = IdGenerator.newId("clike"),
                    messageId = messageId,
                    userId = userId,
                    userName = displayName
                )
            )
            nowLiked = true
        }
        val count = likeRepo.findByMessageIdOrderByCreatedAtAsc(messageId).size
        return LikeToggleResponse(
            messageId = messageId,
            likeCount = count,
            liked = nowLiked,
            byUserId = userId,
            byUserName = displayName
        )
    }

    @Transactional(readOnly = true)
    fun getLikes(messageId: String): List<LikeUserView> {
        return likeRepo.findByMessageIdOrderByCreatedAtAsc(messageId)
            .sortedByDescending { it.createdAt }
            .map {
                LikeUserView(
                    userId = it.userId,
                    userName = it.userName,
                    createdAt = it.createdAt.format(isoFmt)
                )
            }
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

    // ── 이모티콘 ──

    @Transactional(readOnly = true)
    fun listEmoticons(): List<EmoticonView> {
        return emoticonRepo.findByStatusOrderBySortOrderAscCreatedAtAsc("active")
            .map { it.toView() }
    }

    @Transactional
    fun createEmoticon(adminId: String, req: CreateEmoticonRequest): EmoticonView {
        if (req.name.isBlank()) {
            throw ApiException("INVALID_NAME", "이모티콘 이름이 필요합니다", HttpStatus.BAD_REQUEST)
        }
        if (req.fileId.isBlank()) {
            throw ApiException("INVALID_FILE", "이모티콘 이미지 파일이 필요합니다", HttpStatus.BAD_REQUEST)
        }
        // 다음 sort_order: 가장 큰 값 + 1
        val maxOrder = emoticonRepo.findByStatusOrderBySortOrderAscCreatedAtAsc("active")
            .maxOfOrNull { it.sortOrder } ?: -1
        val entity = ChatEmoticonEntity(
            id = IdGenerator.newId("cemo"),
            name = req.name.trim(),
            series = req.series?.trim()?.takeIf { it.isNotEmpty() },
            fileId = req.fileId,
            sortOrder = req.sortOrder ?: (maxOrder + 1),
            status = "active",
            createdBy = adminId
        )
        emoticonRepo.save(entity)
        return entity.toView()
    }

    @Transactional
    fun updateEmoticon(emoticonId: String, req: UpdateEmoticonRequest): EmoticonView {
        val entity = emoticonRepo.findById(emoticonId).orElseThrow {
            ApiException("NOT_FOUND", "이모티콘을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        req.name?.let { if (it.isNotBlank()) entity.name = it.trim() }
        req.series?.let { entity.series = it.trim().takeIf { v -> v.isNotEmpty() } }
        req.sortOrder?.let { entity.sortOrder = it }
        emoticonRepo.save(entity)
        return entity.toView()
    }

    @Transactional
    fun deleteEmoticon(emoticonId: String) {
        val entity = emoticonRepo.findById(emoticonId).orElseThrow {
            ApiException("NOT_FOUND", "이모티콘을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        entity.status = "deleted"
        emoticonRepo.save(entity)
    }

    private fun ChatEmoticonEntity.toView(): EmoticonView = EmoticonView(
        id = id,
        name = name,
        series = series,
        fileId = fileId,
        sortOrder = sortOrder,
        createdAt = createdAt.format(isoFmt)
    )

    // ── 변환 헬퍼 ──

    private fun ChatMessageEntity.toView(
        avatarOverride: String? = null,
        likeCountOverride: Int = 0,
        likedByMeOverride: Boolean = false
    ): ChatMessageView {
        // archived/purged 상태에서는 fileId 노출 X (다운로드 차단)
        val safeFileId = if (attachmentState == "live") fileId else null
        val thumbUrl = thumbnailPath?.let { "/v1/chat/thumbs/$id" }
        return ChatMessageView(
            id = id,
            roomId = roomId,
            userId = userId,
            userName = userName,
            // 우선 override(view-time 조회), 그 다음 entity 컬럼(레거시), 그 다음 null
            userAvatarUrl = avatarOverride ?: userAvatarUrl,
            messageType = messageType,
            content = if (status == "deleted") null else content,
            fileId = if (status == "deleted") null else safeFileId,
            thumbnailUrl = if (status == "deleted") null else thumbUrl,
            attachmentState = attachmentState,
            isAdmin = isAdmin,
            status = status,
            createdAt = createdAt.format(isoFmt),
            likeCount = likeCountOverride,
            likedByMe = likedByMeOverride
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
