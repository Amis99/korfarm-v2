package com.korfarm.api.duel

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.contracts.AdminDuelSeasonRequest
import com.korfarm.api.contracts.AdminDuelSnapshotRequest
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.season.SeasonEntity
import com.korfarm.api.security.SecurityUtils
import com.korfarm.api.system.FeatureFlagService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/admin/duel")
class AdminDuelController(
    private val adminDuelService: AdminDuelService,
    private val questionPoolService: DuelQuestionPoolService,
    private val featureFlagService: FeatureFlagService,
    private val seasonService: com.korfarm.api.season.SeasonService,
    private val orgRepository: com.korfarm.api.org.OrgRepository,
    private val orgMembershipRepository: com.korfarm.api.org.OrgMembershipRepository
) {
    /**
     * 테마 대결 관리에서 사용할 기관 목록.
     * - HQ_ADMIN: 전사 공용(theme_common) + 모든 active 기관
     * - ORG_ADMIN: 본인이 ORG_ADMIN 인 기관만
     */
    @GetMapping("/theme-orgs")
    fun themeOrgs(): ApiResponse<List<Map<String, Any?>>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val isHq = SecurityUtils.hasAnyRole("HQ_ADMIN")
        val items = mutableListOf<Map<String, Any?>>()
        if (isHq) {
            items.add(mapOf(
                "serverId" to "theme_common",
                "orgId" to null,
                "orgName" to "전사 공용",
                "isCommon" to true
            ))
            orgRepository.findAll()
                .filter { it.status == "active" }
                .sortedBy { it.name }
                .forEach { org ->
                    items.add(mapOf(
                        "serverId" to "theme_${org.id}",
                        "orgId" to org.id,
                        "orgName" to org.name,
                        "isCommon" to false
                    ))
                }
        } else {
            val adminOrgIds = orgMembershipRepository.findByUserIdAndStatus(userId, "active")
                .filter { it.role == "ORG_ADMIN" }
                .map { it.orgId }
                .toSet()
            orgRepository.findAllById(adminOrgIds)
                .sortedBy { it.name }
                .forEach { org ->
                    items.add(mapOf(
                        "serverId" to "theme_${org.id}",
                        "orgId" to org.id,
                        "orgName" to org.name,
                        "isCommon" to false
                    ))
                }
        }
        return ApiResponse(success = true, data = items)
    }

    @GetMapping("/seasons")
    fun listSeasons(): ApiResponse<List<Map<String, Any?>>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        val data = seasonService.allSeasons().map { season ->
            mapOf<String, Any?>(
                "id" to season.seasonId,
                "name" to season.name,
                "levelId" to season.levelId,
                "startAt" to season.startAt,
                "endAt" to season.endAt,
                "status" to season.status
            )
        }
        return ApiResponse(success = true, data = data)
    }

    /**
     * 시즌·서버별 가장 최근 랭킹 스냅샷.
     * frontend 시즌 탭에서 시즌+서버 선택 시 호출.
     */
    @GetMapping("/rankings")
    fun rankings(
        @RequestParam seasonId: String,
        @RequestParam(required = false) serverId: String?
    ): ApiResponse<Map<String, Any?>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        val sid = serverId ?: seasonService.getSeasonEntity(seasonId).levelId
        val data = adminDuelService.latestRankingSnapshot(seasonId, sid)
        return ApiResponse(success = true, data = data)
    }

    @PostMapping("/seasons")
    fun createSeason(@Valid @RequestBody request: AdminDuelSeasonRequest): ApiResponse<Map<String, String>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        val season: SeasonEntity = adminDuelService.createSeason(request)
        return ApiResponse(success = true, data = mapOf("season_id" to season.id))
    }

    @PostMapping("/snapshots")
    fun snapshot(@Valid @RequestBody request: AdminDuelSnapshotRequest): ApiResponse<Map<String, String>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        val snapshot = adminDuelService.snapshot(request)
        return ApiResponse(success = true, data = mapOf("snapshot_id" to snapshot.id))
    }

    @PostMapping("/recalculate")
    fun recalc(@RequestBody(required = false) request: AdminDuelSnapshotRequest?): ApiResponse<Map<String, String>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        val season = if (request == null) {
            seasonService.currentSeason()
        } else {
            seasonService.getSeasonEntity(request.seasonId).let {
                com.korfarm.api.season.Season(
                    seasonId = it.id,
                    levelId = it.levelId,
                    name = it.name,
                    startAt = it.startAt.toString(),
                    endAt = it.endAt.toString(),
                    status = it.status
                )
            }
        }
        val seasonId = season.seasonId
        val levelId = request?.levelId ?: season.levelId
        val ranking = adminDuelService.recalculate(seasonId, levelId)
        return ApiResponse(success = true, data = mapOf("ranking_id" to ranking.id))
    }

    // === 문제 풀 관리 API ===

    // JSON 배열로 문제 일괄 등록
    @PostMapping("/questions/import")
    fun importQuestions(@RequestBody body: String): ApiResponse<Map<String, Int>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        val count = questionPoolService.importQuestions(body)
        return ApiResponse(success = true, data = mapOf("imported" to count))
    }

    // 단일 문제 등록
    @PostMapping("/questions")
    fun addQuestion(@RequestBody body: String): ApiResponse<Map<String, String>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        val entity = questionPoolService.addQuestion(body)
        return ApiResponse(success = true, data = mapOf("id" to entity.id))
    }

    // 문제 수정
    @PutMapping("/questions/{questionId}")
    fun updateQuestion(@PathVariable questionId: String, @RequestBody body: String): ApiResponse<Map<String, String>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        val entity = questionPoolService.updateQuestion(questionId, body)
        return ApiResponse(success = true, data = mapOf("id" to entity.id))
    }

    // 문제 비활성화
    @DeleteMapping("/questions/{questionId}")
    fun deactivateQuestion(@PathVariable questionId: String): ApiResponse<Map<String, String>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        val ok = questionPoolService.deactivateQuestion(questionId)
        if (!ok) throw ApiException("NOT_FOUND", "문제를 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        return ApiResponse(success = true, data = mapOf("status" to "deactivated"))
    }

    // 서버별 문제 수 조회
    @GetMapping("/questions/count")
    fun questionCounts(): ApiResponse<Map<String, Map<String, Int>>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        return ApiResponse(success = true, data = questionPoolService.countByServer())
    }

    // 서버별 문제 목록 조회
    @GetMapping("/questions")
    fun listQuestions(@RequestParam serverId: String): ApiResponse<List<Map<String, Any>>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        return ApiResponse(success = true, data = questionPoolService.listByServer(serverId))
    }

    // 개별 문제 상세 조회
    @GetMapping("/questions/{questionId}")
    fun questionDetail(@PathVariable questionId: String): ApiResponse<Map<String, Any?>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        val detail = questionPoolService.getQuestionDetail(questionId)
            ?: throw ApiException("NOT_FOUND", "문제를 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        return ApiResponse(success = true, data = detail)
    }
}
