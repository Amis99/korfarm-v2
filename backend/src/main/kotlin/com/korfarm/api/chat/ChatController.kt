package com.korfarm.api.chat

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.SecurityUtils
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/v1/chat")
class ChatController(
    private val chatService: ChatService,
    private val chatWsHandler: ChatWebSocketHandler
) {
    private fun currentUserId(): String =
        SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "인증이 필요합니다", HttpStatus.UNAUTHORIZED)

    private fun isAdmin(): Boolean = SecurityUtils.hasAnyRole("HQ_ADMIN", "ORG_ADMIN")

    @GetMapping("/rooms/{roomId}/messages")
    fun getMessages(
        @PathVariable roomId: String,
        @RequestParam(required = false) before: String?,
        @RequestParam(required = false, defaultValue = "50") limit: Int
    ): ApiResponse<MessageHistoryResponse> {
        val userId = currentUserId()
        return ApiResponse(success = true, data = chatService.getHistory(roomId, before, limit, userId))
    }

    @PostMapping("/rooms/{roomId}/messages")
    fun sendMessage(
        @PathVariable roomId: String,
        @RequestBody request: SendMessageRequest
    ): ApiResponse<ChatMessageView> {
        val userId = currentUserId()
        val req = request.copy(roomId = roomId)
        return ApiResponse(success = true, data = chatService.sendMessage(userId, isAdmin(), req))
    }

    @DeleteMapping("/messages/{messageId}")
    fun deleteMessage(@PathVariable messageId: String): ApiResponse<Map<String, Any>> {
        val userId = currentUserId()
        chatService.deleteMessage(messageId, userId, isAdmin())
        return ApiResponse(success = true, data = mapOf("messageId" to messageId, "status" to "deleted"))
    }

    /** 사용 가능한 이모티콘 목록 (모든 인증 사용자) */
    @GetMapping("/emoticons")
    fun listEmoticons(): ApiResponse<List<EmoticonView>> {
        currentUserId()  // 인증 검증
        return ApiResponse(success = true, data = chatService.listEmoticons())
    }

    /** 메시지 좋아요 토글 */
    @PostMapping("/messages/{messageId}/like")
    fun toggleLike(@PathVariable messageId: String): ApiResponse<LikeToggleResponse> {
        val userId = currentUserId()
        val result = chatService.toggleLike(messageId, userId)
        // WebSocket 브로드캐스트로 모든 클라이언트에게 알림
        chatWsHandler.broadcastLike(result)
        return ApiResponse(success = true, data = result)
    }

    /** 메시지 좋아요 누른 사용자 목록 */
    @GetMapping("/messages/{messageId}/likes")
    fun getLikes(@PathVariable messageId: String): ApiResponse<List<LikeUserView>> {
        currentUserId()
        return ApiResponse(success = true, data = chatService.getLikes(messageId))
    }
}
