package com.korfarm.api.notice

import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.security.SecurityUtils
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDateTime

/**
 * 학생/학부모/일반 사용자용 — 본인이 볼 수 있는 활성 공지 목록 + 읽음 처리.
 */
@RestController
@RequestMapping("/v1/notices")
class NoticeUserController(
    private val noticeService: NoticeService,
) {
    private fun currentUserId(): String =
        SecurityUtils.currentUserId() ?: throw com.korfarm.api.common.ApiException(
            "UNAUTHORIZED", "로그인이 필요합니다", org.springframework.http.HttpStatus.UNAUTHORIZED
        )

    @GetMapping
    fun list(): ApiResponse<List<NoticeView>> {
        val userId = currentUserId()
        val rows = noticeService.listForUser(userId)
        val readSet = rows.filter { noticeService.isRead(it.id, userId) }.map { it.id }.toSet()
        return ApiResponse(
            success = true,
            data = rows.map { it.toView(read = it.id in readSet) }
        )
    }

    @GetMapping("/unread-count")
    fun unreadCount(): ApiResponse<Map<String, Long>> {
        val userId = currentUserId()
        return ApiResponse(success = true, data = mapOf("count" to noticeService.unreadCountForUser(userId)))
    }

    @PostMapping("/{noticeId}/read")
    fun markRead(@PathVariable noticeId: String): ApiResponse<Map<String, Any>> {
        val userId = currentUserId()
        noticeService.markRead(noticeId, userId)
        return ApiResponse(success = true, data = mapOf("noticeId" to noticeId, "read" to true))
    }
}

/**
 * HQ_ADMIN / ORG_ADMIN 전용 — 공지 작성·관리.
 */
@RestController
@RequestMapping("/v1/admin/notices")
class AdminNoticeController(
    private val noticeService: NoticeService,
) {
    private fun currentUserId(): String =
        SecurityUtils.currentUserId() ?: throw com.korfarm.api.common.ApiException(
            "UNAUTHORIZED", "로그인이 필요합니다", org.springframework.http.HttpStatus.UNAUTHORIZED
        )

    @GetMapping
    fun list(): ApiResponse<List<NoticeView>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val userId = currentUserId()
        val rows = noticeService.listForAdmin(userId)
        return ApiResponse(success = true, data = rows.map { it.toView(read = false) })
    }

    @PostMapping
    fun create(@Valid @RequestBody req: NoticeCreateRequest): ApiResponse<NoticeView> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val userId = currentUserId()
        val saved = noticeService.create(
            callerUserId = userId,
            scope = req.scope,
            orgId = req.orgId,
            title = req.title,
            body = req.body,
            category = req.category ?: "general",
            pinned = req.pinned ?: false,
            startsAt = req.startsAt,
            endsAt = req.endsAt,
        )
        return ApiResponse(success = true, data = saved.toView(read = false))
    }

    @PatchMapping("/{noticeId}")
    fun update(@PathVariable noticeId: String, @Valid @RequestBody req: NoticeUpdateRequest): ApiResponse<NoticeView> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val userId = currentUserId()
        val saved = noticeService.update(
            callerUserId = userId,
            noticeId = noticeId,
            title = req.title,
            body = req.body,
            category = req.category,
            pinned = req.pinned,
            startsAt = req.startsAt,
            endsAt = req.endsAt,
        )
        return ApiResponse(success = true, data = saved.toView(read = false))
    }

    @DeleteMapping("/{noticeId}")
    fun delete(@PathVariable noticeId: String): ApiResponse<Map<String, String>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val userId = currentUserId()
        noticeService.delete(userId, noticeId)
        return ApiResponse(success = true, data = mapOf("noticeId" to noticeId, "status" to "deleted"))
    }
}

// ─── DTOs ─────────────────────────────────────────────────────

data class NoticeView(
    val id: String,
    val scope: String,
    val orgId: String?,
    val title: String,
    val body: String,
    val category: String,
    val pinned: Boolean,
    val startsAt: String?,
    val endsAt: String?,
    val createdBy: String,
    val createdAt: String,
    val updatedAt: String,
    val read: Boolean,
)

data class NoticeCreateRequest(
    val scope: String,                       // "GLOBAL" | "ORG"
    val orgId: String? = null,               // scope=ORG 일 때 (HQ가 특정 기관 지정 시). ORG_ADMIN은 자동.
    val title: String,
    val body: String,
    val category: String? = null,
    val pinned: Boolean? = null,
    val startsAt: LocalDateTime? = null,
    val endsAt: LocalDateTime? = null,
)

data class NoticeUpdateRequest(
    val title: String? = null,
    val body: String? = null,
    val category: String? = null,
    val pinned: Boolean? = null,
    val startsAt: LocalDateTime? = null,
    val endsAt: LocalDateTime? = null,
)

private fun NoticeEntity.toView(read: Boolean) = NoticeView(
    id = id,
    scope = scope,
    orgId = orgId,
    title = title,
    body = body,
    category = category,
    pinned = pinned,
    startsAt = startsAt?.toString(),
    endsAt = endsAt?.toString(),
    createdBy = createdBy,
    createdAt = createdAt.toString(),
    updatedAt = updatedAt.toString(),
    read = read,
)
