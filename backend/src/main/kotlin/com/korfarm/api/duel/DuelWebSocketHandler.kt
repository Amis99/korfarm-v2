package com.korfarm.api.duel

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import org.springframework.web.socket.CloseStatus
import org.springframework.web.socket.TextMessage
import org.springframework.web.socket.WebSocketSession
import org.springframework.web.socket.handler.TextWebSocketHandler
import java.util.concurrent.*

data class MatchRoundState(
    val questions: List<DuelQuestionView>,
    var currentIndex: Int = 0,
    val activePlayers: MutableSet<String>,
    val allPlayers: Set<String>
)

@Component
class DuelWebSocketHandler(
    private val duelService: DuelService,
    private val objectMapper: ObjectMapper
) : TextWebSocketHandler() {
    private val log = LoggerFactory.getLogger(DuelWebSocketHandler::class.java)

    private val sessionsByRoom: MutableMap<String, MutableSet<WebSocketSession>> = ConcurrentHashMap()
    private val sessionsByMatch: MutableMap<String, MutableSet<WebSocketSession>> = ConcurrentHashMap()

    // 매치별 라운드 상태 (탈락제 진행)
    private val matchStates: ConcurrentHashMap<String, MatchRoundState> = ConcurrentHashMap()
    // 문제별 타이머
    private val questionTimers: ConcurrentHashMap<String, ScheduledFuture<*>> = ConcurrentHashMap()
    private val scheduler: ScheduledExecutorService = Executors.newScheduledThreadPool(2)

    override fun handleTextMessage(session: WebSocketSession, message: TextMessage) {
        val payload: Map<String, Any> = objectMapper.readValue(message.payload, object : TypeReference<Map<String, Any>>() {})
        val type = payload["type"]?.toString() ?: return
        val body = payload["payload"] as? Map<*, *> ?: emptyMap<Any, Any>()

        try {
            when (type) {
                "room.join" -> handleRoomJoin(session, body)
                "room.leave" -> handleRoomLeave(session, body)
                "room.ready" -> handleRoomReady(session, body)
                "room.start" -> handleRoomStart(session, body)
                "match.join" -> handleMatchJoin(session, body)
                "match.answer" -> handleMatchAnswer(session, body)
                "match.reconnect" -> handleMatchJoin(session, body)
                else -> send(session, "error", mapOf("message" to "unknown type: $type"))
            }
        } catch (e: Exception) {
            log.error("WebSocket 메시지 처리 오류: $type", e)
            send(session, "error", mapOf("message" to e.message))
        }
    }

    override fun afterConnectionClosed(session: WebSocketSession, status: CloseStatus) {
        sessionsByRoom.values.forEach { it.remove(session) }
        sessionsByMatch.values.forEach { it.remove(session) }
    }

    // === 대기방 핸들러 ===

    private fun handleRoomJoin(session: WebSocketSession, body: Map<*, *>) {
        val roomId = (body["room_id"] ?: body["roomId"])?.toString() ?: return
        val sessions = sessionsByRoom.getOrPut(roomId) { ConcurrentHashMap.newKeySet() }
        sessions.add(session)
        session.attributes["roomId"] = roomId
        val detail = duelService.roomDetail(roomId)
        send(session, "room.state", detail)
    }

    private fun handleRoomLeave(session: WebSocketSession, body: Map<*, *>) {
        val roomId = (body["room_id"] ?: body["roomId"])?.toString()
            ?: session.attributes["roomId"]?.toString() ?: return
        val userId = session.attributes["userId"]?.toString() ?: return
        duelService.leaveRoom(userId, roomId)
        sessionsByRoom[roomId]?.remove(session)
        // 방이 닫혔으면 남은 세션에 알림 후 정리
        try {
            val detail = duelService.roomDetail(roomId)
            if (detail.room.status == "closed") {
                val isHost = detail.room.createdBy == userId
                val reason = if (isHost) "방장이 나가서 방이 닫혔습니다." else "방이 닫혔습니다."
                broadcastToRoom(roomId, "room.closed", mapOf("reason" to reason))
                sessionsByRoom.remove(roomId)
            } else {
                broadcastToRoom(roomId, "room.update", detail)
            }
        } catch (e: Exception) {
            broadcastToRoom(roomId, "room.closed", mapOf("reason" to "방이 닫혔습니다."))
            sessionsByRoom.remove(roomId)
        }
    }

    private fun handleRoomReady(session: WebSocketSession, body: Map<*, *>) {
        val roomId = (body["room_id"] ?: body["roomId"])?.toString()
            ?: session.attributes["roomId"]?.toString() ?: return
        val userId = session.attributes["userId"]?.toString() ?: return
        val stakeSeedType = (body["stake_seed_type"] ?: body["stakeSeedType"])?.toString()
        duelService.toggleReady(userId, roomId, stakeSeedType)
        broadcastRoomUpdate(roomId)
    }

    private fun handleRoomStart(session: WebSocketSession, body: Map<*, *>) {
        val roomId = (body["room_id"] ?: body["roomId"])?.toString()
            ?: session.attributes["roomId"]?.toString() ?: return
        val userId = session.attributes["userId"]?.toString() ?: return

        val matchId = duelService.startMatch(userId, roomId)

        // 매치 상태 초기화 (탈락제)
        val questions = duelService.getMatchQuestionViews(matchId)
        val playerIds = duelService.getMatchPlayers(matchId).map { it.userId }.toSet()
        matchStates[matchId] = MatchRoundState(
            questions = questions,
            activePlayers = playerIds.toMutableSet(),
            allPlayers = playerIds
        )

        broadcastToRoom(roomId, "room.matchStarted", mapOf("matchId" to matchId))

        // 방 세션 → 매치 세션 전환
        val roomSessions = sessionsByRoom.remove(roomId) ?: return
        val matchSessions = sessionsByMatch.getOrPut(matchId) { ConcurrentHashMap.newKeySet() }
        matchSessions.addAll(roomSessions)
        roomSessions.forEach { s -> s.attributes["matchId"] = matchId }

        // 첫 문제 전송
        sendCurrentQuestion(matchId)
        broadcastMatchState(matchId)
    }

    // === 매치 핸들러 ===

    private fun handleMatchJoin(session: WebSocketSession, body: Map<*, *>) {
        val matchId = (body["match_id"] ?: body["matchId"])?.toString() ?: return
        val sessions = sessionsByMatch.getOrPut(matchId) { ConcurrentHashMap.newKeySet() }
        sessions.add(session)
        session.attributes["matchId"] = matchId

        // 현재 진행 중인 문제 전송 (재접속 지원)
        val state = matchStates[matchId]
        if (state != null) {
            val question = state.questions.getOrNull(state.currentIndex)
            if (question != null) {
                send(session, "match.question", mapOf(
                    "questionIndex" to state.currentIndex,
                    "question" to question,
                    "timeLimitSec" to (question.timeLimitSec ?: 30),
                    "totalQuestions" to state.questions.size,
                    "remainingPlayers" to state.activePlayers.size
                ))
            }
        }
        broadcastMatchState(matchId)
    }

    private fun handleMatchAnswer(session: WebSocketSession, body: Map<*, *>) {
        val matchId = (body["match_id"] ?: body["matchId"])?.toString()
            ?: session.attributes["matchId"]?.toString() ?: return
        val questionId = (body["question_id"] ?: body["questionId"])?.toString() ?: return
        val answer = body["answer"]?.toString() ?: ""
        val timeMs = (body["time_ms"] ?: body["timeMs"])?.toString()?.toLongOrNull() ?: 0L
        val userId = session.attributes["userId"]?.toString() ?: return

        val state = matchStates[matchId] ?: return
        val currentQ = state.questions.getOrNull(state.currentIndex) ?: return

        // 현재 문제에 대한 답만 허용
        if (questionId != currentQ.questionId) return
        // 탈락한 플레이어는 답 불가
        if (userId !in state.activePlayers) return

        val isCorrect = duelService.recordAnswer(matchId, userId, questionId, answer, timeMs)

        // 답변 결과를 제출자에게 전송
        send(session, "match.answerResult", mapOf(
            "questionId" to questionId,
            "isCorrect" to isCorrect
        ))

        broadcastMatchState(matchId)

        // 모든 활성 플레이어가 답했는지 확인
        val answeredUsers = duelService.getUsersWhoAnsweredQuestion(matchId, currentQ.questionId)
        val activeAnswered = state.activePlayers.count { it in answeredUsers }
        if (activeAnswered >= state.activePlayers.size) {
            cancelQuestionTimer(matchId)
            scheduler.schedule({ processRoundResult(matchId) }, 1500, TimeUnit.MILLISECONDS)
        }
    }

    // === 라운드 결과 처리 (탈락제) ===

    private fun processRoundResult(matchId: String) {
        val state = matchStates[matchId] ?: return
        val currentQ = state.questions.getOrNull(state.currentIndex) ?: return

        val results = duelService.getQuestionResults(matchId, currentQ.questionId)
        val correctAnswerId = duelService.getCorrectAnswerId(currentQ.questionId) ?: ""

        val correctPlayers = mutableSetOf<String>()
        val wrongPlayers = mutableSetOf<String>()

        for (playerId in state.activePlayers) {
            val isCorrect = results[playerId]
            if (isCorrect == true) {
                correctPlayers.add(playerId)
            } else {
                wrongPlayers.add(playerId) // 미답변도 오답 처리
            }
        }

        // 전원 오답이면 탈락 없음 (게임 계속)
        val eliminated = if (correctPlayers.isEmpty()) emptySet() else wrongPlayers.toSet()
        state.activePlayers.removeAll(eliminated)

        // 라운드 결과 브로드캐스트
        broadcastToMatch(matchId, "match.roundResult", mapOf(
            "questionIndex" to state.currentIndex,
            "correctAnswerId" to correctAnswerId,
            "eliminated" to eliminated,
            "remainingPlayers" to state.activePlayers.toList(),
            "remainingCount" to state.activePlayers.size
        ))

        // 종료 조건: 1명 이하 남았을 때만 종료
        if (state.activePlayers.size <= 1) {
            scheduler.schedule({
                try {
                    val result = duelService.finishMatch(matchId)
                    if (result != null) {
                        broadcastMatchFinish(matchId, result)
                    }
                } catch (e: Exception) {
                    log.error("매치 종료 실패: $matchId", e)
                } finally {
                    cleanupMatch(matchId)
                }
            }, 2500, TimeUnit.MILLISECONDS)
        } else {
            // 다음 문제로 진행 (문제 소진 시 처음부터 순환)
            scheduler.schedule({
                state.currentIndex++
                if (state.currentIndex >= state.questions.size) {
                    state.currentIndex = 0
                }
                sendCurrentQuestion(matchId)
                broadcastMatchState(matchId)
            }, 2500, TimeUnit.MILLISECONDS)
        }
    }

    // === 문제 전송 ===

    private fun sendCurrentQuestion(matchId: String) {
        val state = matchStates[matchId] ?: return
        val question = state.questions.getOrNull(state.currentIndex) ?: return
        val timeLimitSec = question.timeLimitSec ?: 30

        broadcastToMatch(matchId, "match.question", mapOf(
            "questionIndex" to state.currentIndex,
            "question" to question,
            "timeLimitSec" to timeLimitSec,
            "totalQuestions" to state.questions.size,
            "remainingPlayers" to state.activePlayers.size
        ))

        scheduleQuestionTimer(matchId, timeLimitSec.toLong())
    }

    // === 타이머 관리 ===

    private fun scheduleQuestionTimer(matchId: String, seconds: Long) {
        cancelQuestionTimer(matchId)
        val future = scheduler.schedule({
            processRoundResult(matchId)
        }, seconds, TimeUnit.SECONDS)
        questionTimers[matchId] = future
    }

    private fun cancelQuestionTimer(matchId: String) {
        questionTimers.remove(matchId)?.cancel(false)
    }

    private fun cleanupMatch(matchId: String) {
        cancelQuestionTimer(matchId)
        matchStates.remove(matchId)
    }

    // === 브로드캐스트 ===

    private fun broadcastRoomUpdate(roomId: String) {
        try {
            val detail = duelService.roomDetail(roomId)
            broadcastToRoom(roomId, "room.update", detail)
        } catch (e: Exception) {
            log.warn("방 업데이트 브로드캐스트 실패: $roomId", e)
        }
    }

    private fun broadcastMatchState(matchId: String) {
        val state = matchStates[matchId] ?: return
        val currentQ = state.questions.getOrNull(state.currentIndex)
        val currentQuestionId = currentQ?.questionId

        val answeredForCurrent = if (currentQuestionId != null) {
            duelService.getUsersWhoAnsweredQuestion(matchId, currentQuestionId)
        } else emptySet()

        val players = duelService.getMatchPlayers(matchId)
        val progress = players.map {
            DuelPlayerProgress(
                userId = it.userId,
                answered = duelService.getAnswerCount(matchId, it.userId),
                correctCount = duelService.getCorrectCount(matchId, it.userId),
                answeredCurrent = it.userId in answeredForCurrent,
                active = it.userId in state.activePlayers
            )
        }
        val matchState = DuelMatchState(
            matchId = matchId,
            totalQuestions = state.questions.size,
            currentQuestionIndex = state.currentIndex,
            players = progress
        )
        broadcastToMatch(matchId, "match.state", matchState)
    }

    // 외부에서 호출 가능 (타이머 스케줄러용)
    fun broadcastMatchFinish(matchId: String, result: DuelMatchResultDetailView) {
        broadcastToMatch(matchId, "match.finish", mapOf("matchId" to matchId, "results" to result))
    }

    private fun broadcastToRoom(roomId: String, type: String, payload: Any) {
        val sessions = sessionsByRoom[roomId] ?: return
        val message = TextMessage(objectMapper.writeValueAsString(mapOf("type" to type, "payload" to payload)))
        sessions.filter { it.isOpen }.forEach {
            try { it.sendMessage(message) } catch (e: Exception) { log.warn("전송 실패", e) }
        }
    }

    private fun broadcastToMatch(matchId: String, type: String, payload: Any) {
        val sessions = sessionsByMatch[matchId] ?: return
        val message = TextMessage(objectMapper.writeValueAsString(mapOf("type" to type, "payload" to payload)))
        sessions.filter { it.isOpen }.forEach {
            try { it.sendMessage(message) } catch (e: Exception) { log.warn("전송 실패", e) }
        }
    }

    private fun send(session: WebSocketSession, type: String, payload: Any) {
        if (!session.isOpen) return
        try {
            val message = TextMessage(objectMapper.writeValueAsString(mapOf("type" to type, "payload" to payload)))
            session.sendMessage(message)
        } catch (e: Exception) {
            log.warn("전송 실패", e)
        }
    }
}
