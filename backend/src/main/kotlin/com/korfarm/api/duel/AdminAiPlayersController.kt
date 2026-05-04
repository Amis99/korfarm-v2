package com.korfarm.api.duel

import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.security.SecurityUtils
import com.korfarm.api.system.FeatureFlagService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * 어드민 — AI 플레이어 능력치(0.7~1.0) 조회/수정.
 * 이름·이모티콘 시리즈는 코드 default 고정. 능력치만 슬라이더로 조절.
 */
@RestController
@RequestMapping("/v1/admin/duel/ai-players")
class AdminAiPlayersController(
    private val featureFlagService: FeatureFlagService,
    private val aiPlayerService: AiPlayerService
) {
    data class AiPlayerView(
        val id: String,
        val name: String,
        val accuracy: Double,
        val emoticonSeries: String,
        val avatarFileId: String?
    )

    data class AccuracyUpdate(val id: String, val accuracy: Double)

    @GetMapping
    fun list(): ApiResponse<List<AiPlayerView>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        val list = aiPlayerService.getAllAiPlayers().map {
            AiPlayerView(
                id = it.id,
                name = it.name,
                accuracy = it.accuracy,
                emoticonSeries = it.emoticonSeries,
                avatarFileId = aiPlayerService.getAvatarFileIdForSeries(it.emoticonSeries)
            )
        }
        return ApiResponse(success = true, data = list)
    }

    @PutMapping
    fun save(@RequestBody body: List<AccuracyUpdate>): ApiResponse<Map<String, Any?>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        val userId = SecurityUtils.currentUserId() ?: "system"
        val updates = body.associate { it.id to it.accuracy.coerceIn(0.7, 1.0) }
        aiPlayerService.saveAccuracies(updates, userId)
        aiPlayerService.invalidateAvatarCache()
        return ApiResponse(success = true, data = mapOf("saved" to true))
    }
}
