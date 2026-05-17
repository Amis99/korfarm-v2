package com.korfarm.api.org

import com.korfarm.api.billing.OrgBillingRepository
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.security.SecurityUtils
import com.korfarm.api.studyplan.StudyPlanRepository
import org.springframework.http.HttpStatus
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * 학원장 온보딩 체크리스트 — ORG_ADMIN 첫 로그인 후 단계별 가이드.
 *
 *   GET /v1/admin/onboarding/status   → { orgInfo, students, studyPlanTemplate, billing }
 *
 * 각 단계의 completed 가 true 가 될 때까지 첫 화면에 표시.
 */
@RestController
@RequestMapping("/v1/admin/onboarding")
class OnboardingController(
    private val orgRepository: OrgRepository,
    private val orgMembershipRepository: OrgMembershipRepository,
    private val studyPlanRepository: StudyPlanRepository,
    private val orgBillingRepository: OrgBillingRepository,
) {
    data class OnboardingStatus(
        val orgId: String,
        val orgName: String,
        val orgInfo: StepStatus,
        val students: StepStatus,
        val studyPlanTemplate: StepStatus,
        val billing: StepStatus,
        val allCompleted: Boolean,
    )

    data class StepStatus(
        val completed: Boolean,
        val detail: String,
    )

    @GetMapping("/status")
    @Transactional(readOnly = true)
    fun getStatus(): ApiResponse<OnboardingStatus> {
        AdminGuard.requireAnyRole("ORG_ADMIN", "HQ_ADMIN")
        val callerId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)

        // 본사 ORG_ADMIN(org_hq) 가 아닌 진짜 기관 ORG_ADMIN 의 첫 active 기관 1개
        val orgIds = orgMembershipRepository.findByUserIdAndStatus(callerId, "active")
            .filter { it.role == "ORG_ADMIN" && it.orgId != "org_hq" }
            .map { it.orgId }
        if (orgIds.isEmpty()) {
            // HQ 또는 기관 멤버십 없는 사용자 — 빈 응답
            return ApiResponse(success = true, data = OnboardingStatus(
                orgId = "", orgName = "",
                orgInfo = StepStatus(true, "본사 관리자"),
                students = StepStatus(true, "-"),
                studyPlanTemplate = StepStatus(true, "-"),
                billing = StepStatus(true, "-"),
                allCompleted = true,
            ))
        }
        val orgId = orgIds.first()
        val org = orgRepository.findById(orgId).orElseThrow {
            ApiException("NOT_FOUND", "기관을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }

        // 1. 기관 정보 — 사업자번호·대표자·연락처 중 하나라도 있으면 시작 OK
        val orgInfoComplete = !org.businessNumber.isNullOrBlank()
            && !org.representativeName.isNullOrBlank()
        val orgInfoDetail = when {
            orgInfoComplete -> "사업자번호·대표자 등록됨"
            org.businessNumber.isNullOrBlank() && org.representativeName.isNullOrBlank() ->
                "사업자번호·대표자 미입력"
            org.businessNumber.isNullOrBlank() -> "사업자번호 미입력"
            else -> "대표자 미입력"
        }

        // 2. 학생 — 1명 이상 active STUDENT 멤버십
        val studentCount = orgMembershipRepository.findByOrgIdAndStatus(orgId, "active")
            .count { it.role == "STUDENT" }
        val studentsComplete = studentCount >= 1
        val studentDetail = "${studentCount}명 등록됨"

        // 3. 학습 계획표 템플릿 — is_template=true active 1개 이상
        val templateCount = studyPlanRepository
            .findByOrgIdAndIsTemplateAndStatus(orgId, true, "active").size
        val templateComplete = templateCount >= 1
        val templateDetail = if (templateComplete) "${templateCount}개 등록됨" else "신규 학생 자동 배포용 템플릿 없음"

        // 4. 결제 — 월 사용료 paid 청구 1건 이상
        val billingComplete = orgBillingRepository.existsByOrgIdAndStatus(orgId, "paid")
        val billingDetail = if (billingComplete) "결제 이력 있음" else "월 사용료 미결제"

        val all = orgInfoComplete && studentsComplete && templateComplete && billingComplete
        return ApiResponse(success = true, data = OnboardingStatus(
            orgId = org.id, orgName = org.name,
            orgInfo = StepStatus(orgInfoComplete, orgInfoDetail),
            students = StepStatus(studentsComplete, studentDetail),
            studyPlanTemplate = StepStatus(templateComplete, templateDetail),
            billing = StepStatus(billingComplete, billingDetail),
            allCompleted = all,
        ))
    }
}
