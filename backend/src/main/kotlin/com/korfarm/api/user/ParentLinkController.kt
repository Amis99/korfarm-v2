package com.korfarm.api.user

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.security.SecurityUtils
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1")
class ParentLinkController(
    private val parentLinkService: ParentLinkService
) {
    @PostMapping("/admin/parents/links")
    fun createLink(@Valid @RequestBody request: ParentLinkRequest): ApiResponse<ParentLinkView> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val reviewerId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val data = parentLinkService.createLink(request, reviewerId)
        return ApiResponse(success = true, data = data)
    }

    @GetMapping("/admin/parents/links")
    fun listLinks(): ApiResponse<List<ParentLinkView>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val data = parentLinkService.listAll()
        return ApiResponse(success = true, data = data)
    }

    @PostMapping("/admin/parents/links/{linkId}/approve")
    fun approveLink(@PathVariable linkId: String): ApiResponse<ParentLinkView> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val reviewerId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val data = parentLinkService.approveLink(linkId, reviewerId)
        return ApiResponse(success = true, data = data)
    }

    @PostMapping("/admin/parents/links/{linkId}/reject")
    fun rejectLink(@PathVariable linkId: String): ApiResponse<ParentLinkView> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val reviewerId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val data = parentLinkService.rejectLink(linkId, reviewerId)
        return ApiResponse(success = true, data = data)
    }

    @GetMapping("/parents/links")
    fun myLinks(): ApiResponse<List<ParentLinkView>> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val data = parentLinkService.listForParent(userId)
        return ApiResponse(success = true, data = data)
    }

    @PostMapping("/parents/links/request")
    fun requestLink(@Valid @RequestBody request: ParentLinkRequestCodeRequest): ApiResponse<ParentLinkView> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        if (!SecurityUtils.hasAnyRole("PARENT")) {
            throw ApiException("FORBIDDEN", "parent role required", HttpStatus.FORBIDDEN)
        }
        val data = parentLinkService.requestLink(userId, request)
        return ApiResponse(success = true, data = data)
    }

    @PostMapping("/students/links/confirm")
    fun confirmLink(@Valid @RequestBody request: ParentLinkConfirmRequest): ApiResponse<ParentLinkView> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val data = parentLinkService.confirmLink(userId, request)
        return ApiResponse(success = true, data = data)
    }

    @DeleteMapping("/admin/parents/links/{linkId}")
    fun deleteLink(@PathVariable linkId: String): ApiResponse<Map<String, String>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        parentLinkService.deactivate(linkId)
        return ApiResponse(success = true, data = mapOf("status" to "inactive"))
    }
}
