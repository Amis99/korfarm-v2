package com.korfarm.api.board

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.security.SecurityUtils
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/admin/boards/materials")
class AdminBoardController(
    private val boardService: BoardService
) {
    @PostMapping("/{postId}/approve")
    fun approve(@PathVariable postId: String): ApiResponse<PostDetail> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val reviewerId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val data = boardService.reviewMaterialsPost(postId, true, reviewerId)
        return ApiResponse(success = true, data = data)
    }

    @PostMapping("/{postId}/reject")
    fun reject(@PathVariable postId: String): ApiResponse<PostDetail> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val reviewerId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val data = boardService.reviewMaterialsPost(postId, false, reviewerId)
        return ApiResponse(success = true, data = data)
    }
}
