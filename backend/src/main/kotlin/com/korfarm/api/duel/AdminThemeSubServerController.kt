package com.korfarm.api.duel

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.security.SecurityUtils
import com.korfarm.api.system.FeatureFlagService
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
import java.time.LocalDateTime
import java.util.UUID

/**
 * 테마 대결 — 기관별 서브 서버(A1~A10) 관리.
 *
 * 정책:
 *  - 한 기관당 status="active" 인 서브 서버는 최대 10개
 *  - 시한(expire_at) 지나면 자동으로 expired 처리되어 학생 입장·매치 시작 차단 (통계 보존)
 *  - HQ_ADMIN: 모든 기관, ORG_ADMIN: 본인 관리 기관만
 */
@RestController
@RequestMapping("/v1/admin/duel/theme-sub-servers")
class AdminThemeSubServerController(
    private val themeSubServerRepository: ThemeSubServerRepository,
    private val orgRepository: com.korfarm.api.org.OrgRepository,
    private val orgMembershipRepository: com.korfarm.api.org.OrgMembershipRepository,
    private val featureFlagService: FeatureFlagService
) {
    private fun assertCanManage(orgId: String): String {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        if (orgId == "org_hq") {
            throw ApiException("BAD_REQUEST", "본사는 테마 모드를 운영할 수 없습니다", HttpStatus.BAD_REQUEST)
        }
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        if (SecurityUtils.hasAnyRole("HQ_ADMIN")) return userId
        // ORG_ADMIN 은 본인이 관리하는 기관만
        val isAdmin = orgMembershipRepository.findByUserIdAndStatus(userId, "active")
            .any { it.role == "ORG_ADMIN" && it.orgId == orgId }
        if (!isAdmin) {
            throw ApiException("FORBIDDEN", "이 기관의 관리자가 아닙니다", HttpStatus.FORBIDDEN)
        }
        return userId
    }

    /** 기한 만료된 active 행을 expired 로 자동 갱신 후 응답에도 반영 */
    private fun autoExpire(rows: List<ThemeSubServerEntity>): List<ThemeSubServerEntity> {
        val now = LocalDateTime.now()
        rows.forEach { r ->
            if (r.status == "active" && r.expireAt != null && r.expireAt!!.isBefore(now)) {
                r.status = "expired"
                r.updatedAt = now
                themeSubServerRepository.save(r)
            }
        }
        return rows
    }

    private fun toView(r: ThemeSubServerEntity): Map<String, Any?> = mapOf(
        "id" to r.id,
        "orgId" to r.orgId,
        "subName" to r.subName,
        "expireAt" to r.expireAt?.toString(),
        "status" to r.status,
        "createdBy" to r.createdBy,
        "createdAt" to r.createdAt.toString(),
        "updatedAt" to r.updatedAt.toString()
    )

    /** 기관의 서브 서버 list (active + expired + closed) */
    @GetMapping
    fun list(@RequestParam orgId: String): ApiResponse<List<Map<String, Any?>>> {
        assertCanManage(orgId)
        val rows = autoExpire(themeSubServerRepository.findByOrgIdOrderByCreatedAtDesc(orgId))
        return ApiResponse(success = true, data = rows.map { toView(it) })
    }

    data class CreateRequest(
        val orgId: String,
        val subName: String,
        val expireAt: String? = null
    )

    /** 서브 서버 생성 — 동시 active 10개 제한 */
    @PostMapping
    fun create(@RequestBody req: CreateRequest): ApiResponse<Map<String, Any?>> {
        val userId = assertCanManage(req.orgId)
        if (req.subName.isBlank()) {
            throw ApiException("BAD_REQUEST", "서브 서버 이름을 입력해 주세요", HttpStatus.BAD_REQUEST)
        }
        // 기관 존재 검증
        orgRepository.findById(req.orgId).orElseThrow {
            ApiException("ORG_NOT_FOUND", "기관을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        // active 10개 제한 (기한 미만료만 카운트)
        val now = LocalDateTime.now()
        val activeCount = themeSubServerRepository.findByOrgIdAndStatusOrderByCreatedAtDesc(req.orgId, "active")
            .count { it.expireAt == null || it.expireAt!!.isAfter(now) }
        if (activeCount >= 10) {
            throw ApiException("LIMIT_EXCEEDED",
                "한 기관당 운영 가능한 서브 서버는 최대 10개입니다 (현재 $activeCount 개)",
                HttpStatus.CONFLICT)
        }
        val expireAt = req.expireAt?.takeIf { it.isNotBlank() }?.let { parseDatetime(it) }
        // 서브 서버 ID = "theme_<orgId>_<random>" (server_id 로 사용)
        val id = "theme_${req.orgId}_${UUID.randomUUID().toString().replace("-", "").substring(0, 8)}"
        val entity = ThemeSubServerEntity(
            id = id,
            orgId = req.orgId,
            subName = req.subName.trim(),
            expireAt = expireAt,
            status = "active",
            createdBy = userId
        )
        themeSubServerRepository.save(entity)
        return ApiResponse(success = true, data = toView(entity))
    }

    data class UpdateRequest(
        val subName: String? = null,
        val expireAt: String? = null,
        val clearExpireAt: Boolean = false,
        val status: String? = null  // "active" | "closed" 만 허용
    )

    @PutMapping("/{id}")
    fun update(@PathVariable id: String, @RequestBody req: UpdateRequest): ApiResponse<Map<String, Any?>> {
        val entity = themeSubServerRepository.findById(id).orElseThrow {
            ApiException("NOT_FOUND", "서브 서버를 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        assertCanManage(entity.orgId)
        req.subName?.takeIf { it.isNotBlank() }?.let { entity.subName = it.trim() }
        if (req.clearExpireAt) {
            entity.expireAt = null
        } else if (!req.expireAt.isNullOrBlank()) {
            entity.expireAt = parseDatetime(req.expireAt)
        }
        if (req.status == "active" || req.status == "closed") {
            entity.status = req.status
        }
        entity.updatedAt = LocalDateTime.now()
        themeSubServerRepository.save(entity)
        return ApiResponse(success = true, data = toView(entity))
    }

    /** 즉시 마감 (status="closed"). 통계는 보존 */
    @DeleteMapping("/{id}")
    fun close(@PathVariable id: String): ApiResponse<Map<String, Boolean>> {
        val entity = themeSubServerRepository.findById(id).orElseThrow {
            ApiException("NOT_FOUND", "서브 서버를 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        assertCanManage(entity.orgId)
        entity.status = "closed"
        entity.updatedAt = LocalDateTime.now()
        themeSubServerRepository.save(entity)
        return ApiResponse(success = true, data = mapOf("closed" to true))
    }

    private fun parseDatetime(s: String): LocalDateTime {
        return try {
            LocalDateTime.parse(if (s.length == 10) "${s}T23:59:59" else s)
        } catch (e: Exception) {
            throw ApiException("BAD_REQUEST", "기한 형식 오류 (예: 2026-12-31T23:59)", HttpStatus.BAD_REQUEST)
        }
    }
}
