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
    private val featureFlagService: FeatureFlagService
) {
    @PostMapping("/rooms")
    fun createRoom(@Valid @RequestBody request: DuelRoomCreateRequest): ApiResponse<DuelRoomDetail> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        requireDuelEnabled(userId)
        val data = duelService.createRoom(userId, request)
        return ApiResponse(success = true, data = data)
    }

    @GetMapping("/rooms")
    fun rooms(): ApiResponse<List<DuelRoomView>> {
        requireDuelEnabled(SecurityUtils.currentUserId())
        return ApiResponse(success = true, data = duelService.listRooms())
    }

    @PostMapping("/rooms/{roomId}/join")
    fun join(@PathVariable roomId: String): ApiResponse<DuelRoomJoinResult> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        requireDuelEnabled(userId)
        val data = duelService.joinRoom(userId, roomId)
        return ApiResponse(success = true, data = data)
    }

    @PostMapping("/rooms/{roomId}/leave")
    fun leave(@PathVariable roomId: String): ApiResponse<Map<String, String>> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        requireDuelEnabled(userId)
        duelService.leaveRoom(userId, roomId)
        return ApiResponse(success = true, data = mapOf("status" to "left"))
    }

    @PostMapping("/queue/join")
    fun queueJoin(
        @RequestParam(defaultValue = "frege1") levelId: String,
        @RequestParam(defaultValue = "1") stakeAmount: Int,
        @RequestParam(defaultValue = "seed_wheat") stakeCropType: String,
        @RequestParam(defaultValue = "2") roomSize: Int
    ): ApiResponse<DuelQueueStatus> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        requireDuelEnabled(userId)
        val data = duelService.queueJoin(userId, levelId, stakeAmount, stakeCropType, roomSize)
        return ApiResponse(success = true, data = data)
    }

    @PostMapping("/queue/leave")
    fun queueLeave(): ApiResponse<DuelQueueStatus> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        requireDuelEnabled(userId)
        val data = duelService.queueLeave(userId)
        return ApiResponse(success = true, data = data)
    }

    @GetMapping("/stats")
    fun stats(@RequestParam(defaultValue = "frege1") levelId: String): ApiResponse<DuelStatsView> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        requireDuelEnabled(userId)
        val data = duelService.getStats(userId, levelId)
        return ApiResponse(success = true, data = data)
    }

    @GetMapping("/leaderboards")
    fun leaderboards(@RequestParam(defaultValue = "frege1") levelId: String): ApiResponse<com.korfarm.api.season.DuelLeaderboards> {
        requireDuelEnabled(SecurityUtils.currentUserId())
        val data = duelService.leaderboards(levelId)
        return ApiResponse(success = true, data = data)
    }

    private fun requireDuelEnabled(userId: String?) {
        featureFlagService.requireNotKilled("ops.kill_switch.duel")
        featureFlagService.requireEnabled("feature.duel.mode", userId)
    }
}
