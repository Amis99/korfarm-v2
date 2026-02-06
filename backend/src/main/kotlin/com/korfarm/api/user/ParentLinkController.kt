package com.korfarm.api.user

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.economy.Inventory
import com.korfarm.api.economy.LedgerEntry
import com.korfarm.api.learning.FarmHistoryResponse
import com.korfarm.api.test.TestHistoryItem
import com.korfarm.api.test.TestPaperSummary
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
import org.springframework.web.bind.annotation.RequestParam
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

    /**
     * 부모가 연결된 자녀의 프로필 조회
     */
    @GetMapping("/parents/children/{studentId}/profile")
    fun getChildProfile(@PathVariable studentId: String): ApiResponse<ChildProfileView> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        if (!SecurityUtils.hasAnyRole("PARENT")) {
            throw ApiException("FORBIDDEN", "부모 권한이 필요합니다", HttpStatus.FORBIDDEN)
        }
        val data = parentLinkService.getChildProfile(userId, studentId)
        return ApiResponse(success = true, data = data)
    }

    /**
     * 부모가 연결된 자녀의 인벤토리 조회
     */
    @GetMapping("/parents/children/{studentId}/inventory")
    fun getChildInventory(@PathVariable studentId: String): ApiResponse<Inventory> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        if (!SecurityUtils.hasAnyRole("PARENT")) {
            throw ApiException("FORBIDDEN", "부모 권한이 필요합니다", HttpStatus.FORBIDDEN)
        }
        val data = parentLinkService.getChildInventory(userId, studentId)
        return ApiResponse(success = true, data = data)
    }

    /**
     * 부모가 연결된 자녀의 경제 원장(씨앗/작물/비료 내역) 조회
     */
    @GetMapping("/parents/children/{studentId}/ledger")
    fun getChildLedger(@PathVariable studentId: String): ApiResponse<List<LedgerEntry>> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        if (!SecurityUtils.hasAnyRole("PARENT")) {
            throw ApiException("FORBIDDEN", "부모 권한이 필요합니다", HttpStatus.FORBIDDEN)
        }
        val data = parentLinkService.getChildLedger(userId, studentId)
        return ApiResponse(success = true, data = data)
    }

    /**
     * 부모가 연결된 자녀의 학습 히스토리(수확 장부) 조회
     */
    @GetMapping("/parents/children/{studentId}/farm/history")
    fun getChildFarmHistory(@PathVariable studentId: String): ApiResponse<FarmHistoryResponse> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        if (!SecurityUtils.hasAnyRole("PARENT")) {
            throw ApiException("FORBIDDEN", "부모 권한이 필요합니다", HttpStatus.FORBIDDEN)
        }
        val data = parentLinkService.getChildFarmHistory(userId, studentId)
        return ApiResponse(success = true, data = data)
    }

    /**
     * 부모가 연결된 자녀의 테스트 목록 조회
     */
    @GetMapping("/parents/children/{studentId}/test-storage")
    fun getChildTestList(
        @PathVariable studentId: String,
        @RequestParam(required = false) levelId: String?,
        @RequestParam(required = false) source: String?
    ): ApiResponse<List<TestPaperSummary>> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        if (!SecurityUtils.hasAnyRole("PARENT")) {
            throw ApiException("FORBIDDEN", "부모 권한이 필요합니다", HttpStatus.FORBIDDEN)
        }
        val data = parentLinkService.getChildTestList(userId, studentId, levelId, source)
        return ApiResponse(success = true, data = data)
    }

    /**
     * 부모가 연결된 자녀의 테스트 응시 히스토리 조회
     */
    @GetMapping("/parents/children/{studentId}/test-storage/history")
    fun getChildTestHistory(@PathVariable studentId: String): ApiResponse<List<TestHistoryItem>> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        if (!SecurityUtils.hasAnyRole("PARENT")) {
            throw ApiException("FORBIDDEN", "부모 권한이 필요합니다", HttpStatus.FORBIDDEN)
        }
        val data = parentLinkService.getChildTestHistory(userId, studentId)
        return ApiResponse(success = true, data = data)
    }
}
