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
        // HQ_ADMIN은 모든 기관의 pending 조회 가능. orgId 명시 시 그 기관만.
        // ORG_ADMIN은 자기 ORG_ADMIN 멤버십 기관(org_hq 제외) 의 pending 만.
        //   본사+기관 둘 다 ORG_ADMIN 인 사용자(예: pjchany1) 가 firstOrNull 로
        //   본사를 잡아 자기 기관 pending 이 안 나오던 결함을 차단.
        val isHqAdmin = user.roles.contains("HQ_ADMIN")
        val effectiveOrgIds: Collection<String>? = if (isHqAdmin) {
            orgId?.let { listOf(it) }  // null 이면 전체
        } else {
            val ids = orgMembershipRepository.findByUserIdAndStatus(user.userId, "active")
                .filter { it.role == "ORG_ADMIN" && it.orgId != "org_hq" }
                .map { it.orgId }
                .toSet()
            if (orgId != null) ids.filter { it == orgId }.toSet() else ids
        }
        val result = membershipApprovalService.getPendingMemberships(effectiveOrgIds)
        return ApiResponse(success = true, data = result)
    }

    @PostMapping("/{membershipId}/approve")
    @PreAuthorize("hasAnyRole('HQ_ADMIN', 'ORG_ADMIN')")
    fun approveMembership(
        @AuthenticationPrincipal user: UserPrincipal,
        @PathVariable membershipId: String,
        @RequestBody(required = false) request: MembershipApproveRequest?
    ): ApiResponse<MembershipApprovalResult> {
        val result = membershipApprovalService.approveMembership(membershipId, user.userId)
        return ApiResponse(success = true, data = result)
    }

    @PostMapping("/{membershipId}/reject")
    @PreAuthorize("hasAnyRole('HQ_ADMIN', 'ORG_ADMIN')")
    fun rejectMembership(
        @AuthenticationPrincipal user: UserPrincipal,
        @PathVariable membershipId: String,
        @RequestBody request: MembershipRejectRequest
    ): ApiResponse<MembershipApprovalResult> {
        val result = membershipApprovalService.rejectMembership(membershipId, user.userId, request.reason)
        return ApiResponse(success = true, data = result)
    }
}
