package com.korfarm.api.chat

import com.korfarm.api.common.IdGenerator
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@Service
class AiChatService(
    private val messageRepo: ChatMessageRepository,
    private val podoHarness: PodoHarness
) {
    private val log = LoggerFactory.getLogger(AiChatService::class.java)
    private val isoFmt = DateTimeFormatter.ISO_LOCAL_DATE_TIME

    companion object {
        const val PODO_USER_ID = "u_ai_podo"
        const val PODO_NAME = "포도"
        private val TRIGGER_PATTERN = Regex("포도야|포도[아야]?[,\\s]|@포도", RegexOption.IGNORE_CASE)
    }

    fun shouldRespond(message: ChatMessageEntity): Boolean {
        if (message.userId == PODO_USER_ID) return false
        if (message.messageType != "text") return false
        if (message.status != "active") return false
        val content = message.content ?: return false
        return TRIGGER_PATTERN.containsMatchIn(content)
    }

    @Async
    fun respondAsync(triggerMessage: ChatMessageEntity, broadcastFn: (String, String, Any) -> Unit) {
        try {
            val response = podoHarness.generate(triggerMessage)
            if (response.isBlank()) return

            val entity = ChatMessageEntity(
                id = IdGenerator.newId("cmsg"),
                roomId = triggerMessage.roomId,
                userId = PODO_USER_ID,
                userName = PODO_NAME,
                userAvatarUrl = null,
                messageType = "text",
                content = response,
                attachmentState = "live",
                isAdmin = false,
                createdAt = LocalDateTime.now()
            )
            messageRepo.save(entity)

            val view = ChatMessageView(
                id = entity.id,
                roomId = entity.roomId,
                userId = entity.userId,
                userName = entity.userName,
                userAvatarUrl = null,
                messageType = entity.messageType,
                content = entity.content,
                fileId = null,
                thumbnailUrl = null,
                attachmentState = entity.attachmentState,
                isAdmin = entity.isAdmin,
                status = entity.status,
                createdAt = entity.createdAt.format(isoFmt),
                likeCount = 0,
                likedByMe = false
            )
            broadcastFn(triggerMessage.roomId, "message.new", view)
        } catch (e: Exception) {
            log.error("포도 응답 실패", e)
        }
    }
}
