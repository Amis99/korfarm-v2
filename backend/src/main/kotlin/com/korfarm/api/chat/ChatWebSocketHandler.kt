package com.korfarm.api.chat

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import org.springframework.web.socket.CloseStatus
import org.springframework.web.socket.TextMessage
import org.springframework.web.socket.WebSocketSession
import org.springframework.web.socket.handler.TextWebSocketHandler
import java.util.concurrent.ConcurrentHashMap

@Component
class ChatWebSocketHandler(
    private val chatService: ChatService,
    private val objectMapper: ObjectMapper
) : TextWebSocketHandler() {
    private val log = LoggerFactory.getLogger(ChatWebSocketHandler::class.java)

    /** roomId → 세션 집합 */
    private val sessionsByRoom: MutableMap<String, MutableSet<WebSocketSession>> = ConcurrentHashMap()

    override fun handleTextMessage(session: WebSocketSession, message: TextMessage) {
        val payload: Map<String, Any> = try {
            objectMapper.readValue(message.payload, object : TypeReference<Map<String, Any>>() {})
        } catch (e: Exception) {
            send(session, "error", mapOf("message" to "잘못된 메시지 형식"))
            return
        }
        val type = payload["type"]?.toString() ?: return
        val body = payload["payload"] as? Map<*, *> ?: emptyMap<Any, Any>()

        try {
            when (type) {
                "room.join" -> handleRoomJoin(session, body)
                "room.leave" -> handleRoomLeave(session)
                "message.send" -> handleMessageSend(session, body)
                "message.delete" -> handleMessageDelete(session, body)
                else -> send(session, "error", mapOf("message" to "unknown type: $type"))
            }
        } catch (e: com.korfarm.api.common.ApiException) {
            send(session, "error", mapOf("code" to e.code, "message" to e.message))
        } catch (e: Exception) {
            log.error("WebSocket message error: $type", e)
            send(session, "error", mapOf("message" to (e.message ?: "internal error")))
        }
    }

    override fun afterConnectionClosed(session: WebSocketSession, status: CloseStatus) {
        sessionsByRoom.values.forEach { it.remove(session) }
        sessionsByRoom.entries.removeIf { it.value.isEmpty() }
    }

    // ── 핸들러 ──

    private fun handleRoomJoin(session: WebSocketSession, body: Map<*, *>) {
        val roomId = body["roomId"]?.toString() ?: return
        session.attributes["roomId"] = roomId
        sessionsByRoom.computeIfAbsent(roomId) { ConcurrentHashMap.newKeySet() }.add(session)
        send(session, "room.joined", mapOf("roomId" to roomId))
    }

    private fun handleRoomLeave(session: WebSocketSession) {
        val roomId = session.attributes["roomId"]?.toString() ?: return
        sessionsByRoom[roomId]?.remove(session)
    }

    private fun handleMessageSend(session: WebSocketSession, body: Map<*, *>) {
        val userId = session.attributes["userId"]?.toString() ?: run {
            send(session, "error", mapOf("message" to "unauthenticated"))
            return
        }
        @Suppress("UNCHECKED_CAST")
        val roles = (session.attributes["roles"] as? List<String>) ?: emptyList()
        val isAdmin = roles.contains("HQ_ADMIN") || roles.contains("ORG_ADMIN")

        val req = SendMessageRequest(
            roomId = body["roomId"]?.toString() ?: session.attributes["roomId"]?.toString() ?: "community",
            messageType = body["messageType"]?.toString() ?: "text",
            content = body["content"]?.toString(),
            fileId = body["fileId"]?.toString()
        )
        val view = chatService.sendMessage(userId, isAdmin, req)
        broadcastToRoom(req.roomId, "message.new", view)
    }

    private fun handleMessageDelete(session: WebSocketSession, body: Map<*, *>) {
        val userId = session.attributes["userId"]?.toString() ?: return
        @Suppress("UNCHECKED_CAST")
        val roles = (session.attributes["roles"] as? List<String>) ?: emptyList()
        val isAdmin = roles.contains("HQ_ADMIN") || roles.contains("ORG_ADMIN")
        val messageId = body["messageId"]?.toString() ?: return
        val roomId = session.attributes["roomId"]?.toString() ?: "community"
        chatService.deleteMessage(messageId, userId, isAdmin)
        broadcastToRoom(roomId, "message.deleted", mapOf("messageId" to messageId))
    }

    // ── 헬퍼 ──

    private fun send(session: WebSocketSession, type: String, payload: Any) {
        if (!session.isOpen) return
        val msg = mapOf("type" to type, "payload" to payload)
        synchronized(session) {
            session.sendMessage(TextMessage(objectMapper.writeValueAsString(msg)))
        }
    }

    private fun broadcastToRoom(roomId: String, type: String, payload: Any) {
        val sessions = sessionsByRoom[roomId] ?: return
        val text = objectMapper.writeValueAsString(mapOf("type" to type, "payload" to payload))
        for (s in sessions.toList()) {
            if (!s.isOpen) continue
            try {
                synchronized(s) { s.sendMessage(TextMessage(text)) }
            } catch (e: Exception) {
                log.warn("broadcast failed for session ${s.id}", e)
            }
        }
    }
}
