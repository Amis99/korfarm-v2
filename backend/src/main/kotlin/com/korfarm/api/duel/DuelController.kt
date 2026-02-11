package com.korfarm.api.duel

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.contracts.DuelRoomCreateRequest
import com.korfarm.api.security.SecurityUtils
import com.korfarm.api.system.FeatureFlagService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/duel")
class DuelController(
    private val duelService: DuelService,
    private val featureFlagService: FeatureFlagService,
    private val duelWebSocketHandler: DuelWebSocketHandler
) {
    // 서버별 방 목록 조회
    @GetMapping("/rooms")
    fun rooms(@RequestParam(required = false) serverId: String?): ApiResponse<List<DuelRoomView>> {
        requireDuelEnabled(SecurityUtils.currentUserId())
        return ApiResponse(success = true, data = duelService.listRooms(serverId))
    }

    // 방 생성
    @PostMapping("/rooms")
    fun createRoom(@Valid @RequestBody request: DuelRoomCreateRequest): ApiResponse<DuelRoomDetail> {
        val userId = requireUserId()
        requireDuelEnabled(userId)
        val data = duelService.createRoom(userId, request)
        return ApiResponse(success = true, data = data)
    }

    // 방 입장
    @PostMapping("/rooms/{roomId}/join")
    fun join(@PathVariable roomId: String): ApiResponse<DuelRoomJoinResult> {
        val userId = requireUserId()
        requireDuelEnabled(userId)
        val data = duelService.joinRoom(userId, roomId)
        return ApiResponse(success = true, data = data)
    }

    // AI 방 참가 (방 생성 + AI 배치 + 매치 자동 시작)
    @PostMapping("/rooms/ai-join")
    fun aiJoin(@RequestBody body: Map<String, String>): ApiResponse<Map<String, String>> {
        val userId = requireUserId()
        requireDuelEnabled(userId)
        val serverId = body["serverId"] ?: body["server_id"]
            ?: throw ApiException("INVALID_REQUEST", "serverId가 필요합니다", HttpStatus.BAD_REQUEST)
        val result = duelService.joinAiRoom(userId, serverId)

        // 매치 상태 초기화 + 첫 문제 전송
        val matchId = result.second
        val questions = duelService.getMatchQuestionViews(matchId)
        val playerIds = duelService.getMatchPlayers(matchId).map { it.userId }.toSet()
        duelWebSocketHandler.initMatchState(matchId, questions, playerIds)
        duelWebSocketHandler.triggerFirstQuestion(matchId)

        return ApiResponse(success = true, data = mapOf(
            "roomId" to result.first,
            "matchId" to matchId
        ))
    }

    // 방 퇴장
    @PostMapping("/rooms/{roomId}/leave")
    fun leave(@PathVariable roomId: String): ApiResponse<Map<String, String>> {
        val userId = requireUserId()
        requireDuelEnabled(userId)
        duelService.leaveRoom(userId, roomId)
        return ApiResponse(success = true, data = mapOf("status" to "left"))
    }

    // 준비 토글
    @PostMapping("/rooms/{roomId}/ready")
    fun ready(@PathVariable roomId: String): ApiResponse<Map<String, Any>> {
        val userId = requireUserId()
        requireDuelEnabled(userId)
        val isReady = duelService.toggleReady(userId, roomId)
        return ApiResponse(success = true, data = mapOf("isReady" to isReady))
    }

    // 방 상세 조회
    @GetMapping("/rooms/{roomId}")
    fun roomDetail(@PathVariable roomId: String): ApiResponse<DuelRoomDetail> {
        requireDuelEnabled(SecurityUtils.currentUserId())
        return ApiResponse(success = true, data = duelService.roomDetail(roomId))
    }

    // 매치 시작 (방장만)
    @PostMapping("/rooms/{roomId}/start")
    fun startMatch(@PathVariable roomId: String): ApiResponse<Map<String, String>> {
        val userId = requireUserId()
        requireDuelEnabled(userId)
        val matchId = duelService.startMatch(userId, roomId)
        return ApiResponse(success = true, data = mapOf("matchId" to matchId))
    }

    // 매치 상태 조회
    @GetMapping("/matches/{matchId}")
    fun matchDetail(@PathVariable matchId: String): ApiResponse<Map<String, Any>> {
        requireDuelEnabled(SecurityUtils.currentUserId())
        val data = duelService.getMatchDetail(matchId)
            ?: throw ApiException("NOT_FOUND", "매치를 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        return ApiResponse(success = true, data = data)
    }

    // 매치 문제 조회 (정답 제외)
    @GetMapping("/matches/{matchId}/questions")
    fun matchQuestions(@PathVariable matchId: String): ApiResponse<List<DuelQuestionView>> {
        requireDuelEnabled(SecurityUtils.currentUserId())
        val data = duelService.getMatchQuestionViews(matchId)
        return ApiResponse(success = true, data = data)
    }

    // 매치 결과 조회
    @GetMapping("/matches/{matchId}/results")
    fun matchResults(@PathVariable matchId: String): ApiResponse<DuelMatchResultDetailView> {
        requireDuelEnabled(SecurityUtils.currentUserId())
        val data = duelService.getMatchResults(matchId)
            ?: throw ApiException("NOT_FOUND", "결과를 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        return ApiResponse(success = true, data = data)
    }

    // 전적 조회
    @GetMapping("/stats")
    fun stats(@RequestParam(defaultValue = "frege") serverId: String): ApiResponse<DuelStatsView> {
        val userId = requireUserId()
        requireDuelEnabled(userId)
        val data = duelService.getStats(userId, serverId)
        return ApiResponse(success = true, data = data)
    }

    // 리더보드
    @GetMapping("/leaderboards")
    fun leaderboards(@RequestParam(defaultValue = "frege") serverId: String): ApiResponse<com.korfarm.api.season.DuelLeaderboards> {
        requireDuelEnabled(SecurityUtils.currentUserId())
        val data = duelService.leaderboards(serverId)
        return ApiResponse(success = true, data = data)
    }

    private fun requireUserId(): String {
        return SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "로그인이 필요합니다", HttpStatus.UNAUTHORIZED)
    }

    private fun requireDuelEnabled(userId: String?) {
        featureFlagService.requireNotKilled("ops.kill_switch.duel")
        featureFlagService.requireEnabled("feature.duel.mode", userId)
    }
}
