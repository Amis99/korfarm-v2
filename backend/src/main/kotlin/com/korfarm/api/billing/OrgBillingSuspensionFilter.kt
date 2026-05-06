package com.korfarm.api.billing

import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.org.OrgMembershipRepository
import com.korfarm.api.org.OrgRepository
import com.korfarm.api.security.SecurityUtils
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

// ORG_ADMIN 의 admin endpoint 호출 시 본인 기관이 미결제 정지 상태(billing_suspended=1)면 차단.
// 예외 (정지 중에도 허용):
//  - /v1/admin/billing/...       — 청구서 조회·결제
//  - /v1/admin/grapefruit/wallet/me/charge — 자몽 충전 (별도 결제)
//  - /v1/admin/orgs/me          — 본인 기관 정보 조회
//  - /v1/auth/...                — 로그인·로그아웃
// HQ_ADMIN 은 항상 통과.
@Component
class OrgBillingSuspensionFilter(
    private val orgRepository: OrgRepository,
    private val orgMembershipRepository: OrgMembershipRepository,
    private val objectMapper: ObjectMapper,
) : OncePerRequestFilter() {

    private val allowedPathPrefixes = listOf(
        "/v1/admin/billing",
        "/v1/admin/grapefruit/wallet/me/charge",
        "/v1/admin/grapefruit/transactions/me",
        "/v1/admin/grapefruit/wallet/me",
        "/v1/admin/grapefruit/pricing",      // 단가 조회는 GET 만 허용 — 정보 표시용
        "/v1/admin/orgs/me",
        // 정지 안내 배너에 잔액·정지 상태를 표시할 수 있도록 status 만 허용 (실제 AI 채팅은 차단됨)
        "/v1/admin/agent/status",
        "/v1/auth",
    )

    override fun shouldNotFilter(request: HttpServletRequest): Boolean {
        val uri = request.requestURI
        if (!uri.startsWith("/v1/admin/")) return true
        // 화이트리스트 prefix 매칭
        return allowedPathPrefixes.any { uri.startsWith(it) }
    }

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        // HQ 는 패스
        if (SecurityUtils.hasAnyRole("HQ_ADMIN")) {
            filterChain.doFilter(request, response)
            return
        }
        // ORG_ADMIN 이 아니면 패스 (다른 가드들이 처리)
        if (!SecurityUtils.hasAnyRole("ORG_ADMIN")) {
            filterChain.doFilter(request, response)
            return
        }
        val userId = SecurityUtils.currentUserId()
        if (userId == null) {
            filterChain.doFilter(request, response)
            return
        }
        val orgIds = orgMembershipRepository.findByUserIdAndStatus(userId, "active")
            .filter { it.role == "ORG_ADMIN" }
            .map { it.orgId }
        // 정지된 기관에 속해 있는지 확인
        val suspended = orgIds.any { orgId ->
            orgRepository.findById(orgId).map { it.billingSuspended }.orElse(false)
        }
        if (suspended) {
            response.status = HttpStatus.PAYMENT_REQUIRED.value()
            response.contentType = MediaType.APPLICATION_JSON_VALUE
            response.characterEncoding = "UTF-8"
            val body = ApiResponse<Any>(
                success = false,
                error = com.korfarm.api.common.ApiError(
                    code = "ORG_SUSPENDED",
                    message = "월 사용료 미결제로 기관 관리 기능이 정지되었습니다. 결제 후 다시 이용해 주세요."
                )
            )
            response.writer.write(objectMapper.writeValueAsString(body))
            return
        }
        filterChain.doFilter(request, response)
    }
}
