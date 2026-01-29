package com.korfarm.api.duel

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.stereotype.Component
import org.springframework.web.socket.CloseStatus
import org.springframework.web.socket.TextMessage
import org.springframework.web.socket.WebSocketSession
import org.springframework.web.socket.handler.TextWebSocketHandler
import java.util.concurrent.ConcurrentHashMap

@Component
class DuelWebSocketHandler(
    private val duelService: DuelService,
    private val objectMapper: ObjectMapper
) : TextWebSocketHandler() {
    private val sessionsByMatch: MutableMap<String, MutableSet<WebSocketSession>> = ConcurrentHashMap()

    override fun handleTextMessage(session: WebSocketSession, message: TextMessage) {
        val payload: Map<String, Any> = objectMapper.readValue(message.payload, object : TypeReference<Map<String, Any>>() {})
        val type = payload["type"]?.toString() ?: return
        val body = payload["payload"] as? Map<*, *> ?: emptyMap<Any, Any>()
        when (type) {
            "match.join" -> handleJoin(session, body)
            "match.answer" -> handleAnswer(session, body)
            "match.reconnect" -> handleReconnect(session, body)
            else -> send(session, "error", mapOf("message" to "unknown type"))
        }
    }

    override fun afterConnectionClosed(session: WebSocketSession, status: CloseStatus) {
        sessionsByMatch.values.forEach { it.remove(session) }
    }

    private fun handleJoin(session: WebSocketSession, body: Map<*, *>) {
        val matchId = (body["match_id"] ?: body["matchId"])?.toString() ?: return
        val sessions = sessionsByMatch.getOrPut(matchId) { mutableSetOf() }
        sessions.add(session)
        val questions = duelService.getMatchQuestions(matchId).map { it.questionId }
        send(session, "match.question", mapOf("match_id" to matchId, "questions" to questions))
        broadcastState(matchId)
    }

    private fun handleReconnect(session: WebSocketSession, body: Map<*, *>) {
        handleJoin(session, body)
    }

    private fun handleAnswer(session: WebSocketSession, body: Map<*, *>) {
        val matchId = (body["match_id"] ?: body["matchId"])?.toString() ?: return
        val questionId = (body["question_id"] ?: body["questionId"])?.toString() ?: return
        val answer = body["answer"]?.toString() ?: ""
        val userId = session.attributes["userId"]?.toString() ?: return
        duelService.recordAnswer(matchId, userId, questionId, answer)
        broadcastState(matchId)
        maybeFinish(matchId)
    }

    private fun broadcastState(matchId: String) {
        val questions = duelService.getMatchQuestions(matchId)
        val total = questions.size
        val players = duelService.getMatchPlayers(matchId)
        val progress = players.map {
            DuelPlayerProgress(
                userId = it.userId,
                answered = duelService.getAnswerCount(matchId, it.userId)
            )
        }
        val state = DuelMatchState(matchId = matchId, totalQuestions = total, players = progress)
        broadcast(matchId, "match.state", state)
    }

    private fun maybeFinish(matchId: String) {
        val total = duelService.getMatchQuestions(matchId).size
        if (total == 0) {
            return
        }
        val players = duelService.getMatchPlayers(matchId)
        val allDone = players.all { duelService.getAnswerCount(matchId, it.userId) >= total }
        if (!allDone) {
            return
        }
        duelService.finishMatch(matchId)
        val results = duelService.getMatchResults(matchId)
        broadcast(matchId, "match.finish", mapOf("match_id" to matchId, "results" to results))
    }

    private fun broadcast(matchId: String, type: String, payload: Any) {
        val sessions = sessionsByMatch[matchId] ?: return
        val message = TextMessage(objectMapper.writeValueAsString(mapOf("type" to type, "payload" to payload)))
        sessions.filter { it.isOpen }.forEach { it.sendMessage(message) }
    }

    private fun send(session: WebSocketSession, type: String, payload: Any) {
        if (!session.isOpen) {
            return
        }
        val message = TextMessage(objectMapper.writeValueAsString(mapOf("type" to type, "payload" to payload)))
        session.sendMessage(message)
    }
}
