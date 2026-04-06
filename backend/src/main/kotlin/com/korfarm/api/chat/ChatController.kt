package com.korfarm.api.chat

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.SecurityUtils
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/v1/chat")
class ChatController(
    private val chatService: ChatService
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
        currentUserId()  // 인증만 검증
        return ApiResponse(success = true, data = chatService.getHistory(roomId, before, limit))
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
}
