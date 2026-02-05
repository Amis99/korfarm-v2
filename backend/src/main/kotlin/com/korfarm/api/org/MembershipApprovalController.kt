package com.korfarm.api.org

import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.UserPrincipal
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/v1/admin/memberships")
class MembershipApprovalController(
    private val membershipApprovalService: MembershipApprovalService,
    private val orgMembershipRepository: OrgMembershipRepository
) {
    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('HQ_ADMIN', 'ORG_ADMIN')")
    fun getPendingMemberships(
        @AuthenticationPrincipal user: UserPrincipal,
        @RequestParam(required = false) orgId: String?
    ): ApiResponse<List<PendingMembershipDto>> {
        // HQ_ADMIN은 모든 기관의 pending 조회 가능
        // ORG_ADMIN은 자신의 기관만 조회 가능
        val isHqAdmin = user.roles.contains("HQ_ADMIN")
        val effectiveOrgId = if (isHqAdmin) {
            orgId
        } else {
            // ORG_ADMIN은 본인 기관만 조회
            val userOrg = orgMembershipRepository.findByUserIdAndStatus(user.userId, "active")
                .firstOrNull()?.orgId
            orgId ?: userOrg
        }
        val result = membershipApprovalService.getPendingMemberships(effectiveOrgId)
        return ApiResponse.success(result)
    }

    @PostMapping("/{membershipId}/approve")
    @PreAuthorize("hasAnyRole('HQ_ADMIN', 'ORG_ADMIN')")
    fun approveMembership(
        @AuthenticationPrincipal user: UserPrincipal,
        @PathVariable membershipId: String,
        @RequestBody(required = false) request: MembershipApproveRequest?
    ): ApiResponse<MembershipApprovalResult> {
        val result = membershipApprovalService.approveMembership(membershipId, user.userId)
        return ApiResponse.success(result)
    }

    @PostMapping("/{membershipId}/reject")
    @PreAuthorize("hasAnyRole('HQ_ADMIN', 'ORG_ADMIN')")
    fun rejectMembership(
        @AuthenticationPrincipal user: UserPrincipal,
        @PathVariable membershipId: String,
        @RequestBody request: MembershipRejectRequest
    ): ApiResponse<MembershipApprovalResult> {
        val result = membershipApprovalService.rejectMembership(membershipId, user.userId, request.reason)
        return ApiResponse.success(result)
    }
}
