package com.korfarm.api.security

import com.korfarm.api.auth.AuthService.Companion.ORG_HQ_ID
import com.korfarm.api.common.ApiException
import com.korfarm.api.org.OrgMembershipRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component

/**
 * orgId 위장 방어용 공용 유틸.
 *
 * 요청 body 의 orgId 를 그대로 신뢰하지 않는다.
 *  - HQ_ADMIN  : 본사("org_hq")·null·임의 기관 모두 지정 가능
 *  - ORG_ADMIN : 본인 active 멤버십에 있는 orgId 만 허용
 *                requestedOrgId 가 null 이면 본인 첫 기관으로 강제
 *                requestedOrgId 가 "org_hq" 면 FORBIDDEN
 *                requestedOrgId 가 자기 멤버십 외 값이면 FORBIDDEN
 *
 * 사용처: 시험지·교재·반·기타 기관 귀속 자원 생성 API.
 */
@Component
class OrgScopeResolver(
    private val orgMembershipRepository: OrgMembershipRepository,
) {
    fun resolveCallerOrgId(callerId: String, requestedOrgId: String?): String? {
        if (SecurityUtils.hasAnyRole("HQ_ADMIN")) return requestedOrgId
        val myOrgs = orgMembershipRepository
            .findByUserIdAndStatus(callerId, "active")
            .map { it.orgId }
        return when {
            requestedOrgId == null -> myOrgs.firstOrNull()
                ?: throw ApiException(
                    "NO_ORG", "소속 기관이 없습니다.", HttpStatus.BAD_REQUEST
                )
            requestedOrgId == ORG_HQ_ID -> throw ApiException(
                "FORBIDDEN",
                "본사 자료는 본사 관리자만 생성할 수 있습니다.",
                HttpStatus.FORBIDDEN
            )
            requestedOrgId !in myOrgs -> throw ApiException(
                "FORBIDDEN",
                "본인 기관 외 자료를 생성할 수 없습니다.",
                HttpStatus.FORBIDDEN
            )
            else -> requestedOrgId
        }
    }
}
