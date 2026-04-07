package com.korfarm.api.chat

data class SendMessageRequest(
    val roomId: String,
    val messageType: String,        // text|image|file|voice|notice
    val content: String? = null,    // text/notice 메시지 본문
    val fileId: String? = null      // image/file/voice 첨부 file_id
)

data class ChatMessageView(
    val id: String,
    val roomId: String,
    val userId: String,
    val userName: String,
    val userAvatarUrl: String?,     // 발화 시점 프로필 이미지 URL 스냅샷
    val messageType: String,
    val content: String?,
    val fileId: String?,            // live 상태에서만 set, archived/purged는 null
    val thumbnailUrl: String?,      // 영구 보관용 썸네일 URL (서버 경로 제공)
    val attachmentState: String,    // live|archived|purged
    val isAdmin: Boolean,
    val status: String,             // active|deleted
    val createdAt: String,          // ISO 8601
    val likeCount: Int = 0,         // 좋아요 수
    val likedByMe: Boolean = false  // 현재 사용자가 좋아요 눌렀는지
)

data class LikeToggleResponse(
    val messageId: String,
    val likeCount: Int,
    val liked: Boolean,             // 토글 후 상태 (눌려있으면 true)
    val byUserId: String,           // 토글한 사용자
    val byUserName: String
)

data class LikeUserView(
    val userId: String,
    val userName: String,
    val createdAt: String
)

data class MessageHistoryResponse(
    val messages: List<ChatMessageView>,  // ASC 정렬 (오래된→최신)
    val hasMore: Boolean
)

data class MuteUserRequest(
    val userId: String,
    val durationMinutes: Int? = null,  // null = 영구
    val reason: String? = null
)

data class MutedUserView(
    val userId: String,
    val mutedUntil: String?,
    val reason: String?,
    val mutedBy: String,
    val createdAt: String
)

data class ArchiveListItem(
    val archiveId: String,
    val roomId: String,
    val periodStart: String,    // YYYY-MM-DD
    val periodEnd: String,
    val zipSize: Long,
    val fileCount: Int,
    val createdAt: String,
    val expiresAt: String,
    val status: String          // available|purged
)

data class EmoticonView(
    val id: String,
    val name: String,
    val fileId: String,
    val sortOrder: Int,
    val createdAt: String
)

data class CreateEmoticonRequest(
    val name: String,
    val fileId: String,
    val sortOrder: Int? = null
)
