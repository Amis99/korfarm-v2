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
    private val duelWebSocketHandler: DuelWebSocketHandler,
    private val orgMembershipRepository: com.korfarm.api.org.OrgMembershipRepository,
    private val orgRepository: com.korfarm.api.org.OrgRepository,
    private val themeSubServerRepository: ThemeSubServerRepository
) {
    /**
     * 학생 본인의 듀얼 컨텍스트.
     * - themeOrgId: 본사(org_hq) 외의 첫 제휴기관 ID — 개인 회원이면 null
     * - orgName: 본인 기관 이름 (학생/관리자 화면 라벨용)
     * 학생 화면 DuelMainPage 가 테마 카드 노출 여부 결정.
     */
    @GetMapping("/me")
    fun me(): ApiResponse<Map<String, Any?>> {
        val userId = requireUserId()
        requireDuelEnabled(userId)
        val partnerOrg = orgMembershipRepository.findByUserIdAndStatus(userId, "active")
            .firstOrNull { it.orgId != "org_hq" }
        val orgName = partnerOrg?.let { orgRepository.findById(it.orgId).orElse(null)?.name }
        return ApiResponse(success = true, data = mapOf(
            "userId" to userId,
            "orgId" to partnerOrg?.orgId,
            "orgName" to orgName,
            "themeOrgId" to partnerOrg?.orgId
        ))
    }

    /**
     * 학생 — 본인 기관의 활성 테마 서브 서버 목록.
     * 시한 만료된 서버는 자동 제외. (어드민 화면에서는 만료된 것까지 보임)
     */
    @GetMapping("/theme-servers")
    fun themeServers(): ApiResponse<List<Map<String, Any?>>> {
        val userId = requireUserId()
        requireDuelEnabled(userId)
        val partnerOrg = orgMembershipRepository.findByUserIdAndStatus(userId, "active")
            .firstOrNull { it.orgId != "org_hq" }
            ?: return ApiResponse(success = true, data = emptyList())
        val now = java.time.LocalDateTime.now()
        val rows = themeSubServerRepository.findByOrgIdAndStatusOrderByCreatedAtDesc(partnerOrg.orgId, "active")
            .filter { it.expireAt == null || it.expireAt!!.isAfter(now) }
        return ApiResponse(success = true, data = rows.map { r ->
            mapOf<String, Any?>(
                "serverId" to r.id,
                "subName" to r.subName,
                "expireAt" to r.expireAt?.toString()
            )
        })
    }

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
        val stakeSeedType = body["stakeSeedType"] ?: body["stake_seed_type"]
        val result = duelService.joinAiRoom(userId, serverId, stakeSeedType)

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
    fun ready(
        @PathVariable roomId: String,
        @RequestBody(required = false) body: Map<String, String>?
    ): ApiResponse<Map<String, Any>> {
        val userId = requireUserId()
        requireDuelEnabled(userId)
        val stakeSeedType = body?.get("stakeSeedType") ?: body?.get("stake_seed_type")
        val isReady = duelService.toggleReady(userId, roomId, stakeSeedType)
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
        val userId = requireUserId()
        requireDuelEnabled(userId)
        requireMatchParticipant(matchId, userId)
        val data = duelService.getMatchQuestionViews(matchId)
        return ApiResponse(success = true, data = data)
    }

    // 매치 결과 조회
    @GetMapping("/matches/{matchId}/results")
    fun matchResults(@PathVariable matchId: String): ApiResponse<DuelMatchResultDetailView> {
        val userId = requireUserId()
        requireDuelEnabled(userId)
        requireMatchParticipant(matchId, userId)
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

    private fun requireMatchParticipant(matchId: String, userId: String) {
        val players = duelService.getMatchPlayers(matchId)
        if (players.none { it.userId == userId }) {
            throw ApiException("FORBIDDEN", "이 매치의 참가자가 아닙니다", HttpStatus.FORBIDDEN)
        }
    }
}
