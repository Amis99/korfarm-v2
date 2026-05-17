package com.korfarm.api.admin

import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * 본사 관리자(HQ_ADMIN) 계정 관리 (2026-05-18).
 * 모든 엔드포인트 HQ_ADMIN 전용. 마지막 활성 1명은 정지/삭제 불가.
 */
@RestController
@RequestMapping("/v1/admin/hq-admins")
class HqAdminController(
    private val hqAdminService: HqAdminService,
) {
    @GetMapping
    fun list(): ApiResponse<List<HqAdminService.HqAdminView>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(success = true, data = hqAdminService.list())
    }

    /** 신규 추가 — 응답에 평문 임시 비밀번호 포함 (관리자가 본인에게 전달). */
    @PostMapping
    fun create(@RequestBody body: Map<String, String?>): ApiResponse<Map<String, Any?>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val loginId = body["loginId"]?.trim()
            ?: throw com.korfarm.api.common.ApiException(
                "INVALID_LOGIN_ID", "loginId 가 필요합니다",
                org.springframework.http.HttpStatus.BAD_REQUEST
            )
        val (view, tempPassword) = hqAdminService.create(
            loginId = loginId,
            name = body["name"],
            phone = body["phone"],
        )
        return ApiResponse(success = true, data = mapOf(
            "admin" to view,
            "tempPassword" to tempPassword,
            "message" to "임시 비밀번호: $tempPassword — 본인에게 즉시 전달하고 첫 로그인 후 변경하도록 안내해 주세요.",
        ))
    }

    @PatchMapping("/{userId}")
    fun update(
        @PathVariable userId: String,
        @RequestBody body: Map<String, String?>
    ): ApiResponse<HqAdminService.HqAdminView> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val view = hqAdminService.update(
            userId = userId,
            name = body["name"],
            phone = body["phone"],
            email = body["email"] ?: body["loginId"],
        )
        return ApiResponse(success = true, data = view)
    }

    @PostMapping("/{userId}/suspend")
    fun suspend(@PathVariable userId: String): ApiResponse<HqAdminService.HqAdminView> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(success = true, data = hqAdminService.suspend(userId))
    }

    @DeleteMapping("/{userId}")
    fun delete(@PathVariable userId: String): ApiResponse<Map<String, String>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        hqAdminService.delete(userId)
        return ApiResponse(success = true, data = mapOf("userId" to userId))
    }

    /** 임시 비밀번호 재발급 — 응답에 평문 1회 노출. */
    @PostMapping("/{userId}/reset-password")
    fun resetPassword(@PathVariable userId: String): ApiResponse<Map<String, String>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val temp = hqAdminService.resetPassword(userId)
        return ApiResponse(success = true, data = mapOf(
            "tempPassword" to temp,
            "message" to "임시 비밀번호: $temp — 본인에게 즉시 전달.",
        ))
    }
}
