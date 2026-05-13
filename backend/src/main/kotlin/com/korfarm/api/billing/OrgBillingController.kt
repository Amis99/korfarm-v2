package com.korfarm.api.billing

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.org.OrgMembershipRepository
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.security.SecurityUtils
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.YearMonth

@RestController
@RequestMapping("/v1/admin/billing")
class OrgBillingController(
    private val orgBillingService: OrgBillingService,
    private val orgMembershipRepository: OrgMembershipRepository,
) {
    // ─── 본인 기관 (ORG_ADMIN) — 정지 중에도 호출 가능 ────────────────────────

    @GetMapping("/me")
    fun listMyBillings(): ApiResponse<List<BillingView>> {
        AdminGuard.requireAnyRole("ORG_ADMIN", "HQ_ADMIN")
        val orgId = resolveCallerOrgId()
        val list = orgBillingService.listBillings(orgId).map { it.toView() }
        return ApiResponse(success = true, data = list)
    }

    @GetMapping("/me/status")
    fun myStatus(): ApiResponse<OrgBillingStatus> {
        AdminGuard.requireAnyRole("ORG_ADMIN", "HQ_ADMIN")
        val orgId = resolveCallerOrgId()
        return ApiResponse(success = true, data = orgBillingService.getOrgBillingStatus(orgId))
    }

    @GetMapping("/me/calculate")
    fun calculateCurrentMonth(): ApiResponse<BillingCalculation> {
        AdminGuard.requireAnyRole("ORG_ADMIN", "HQ_ADMIN")
        val orgId = resolveCallerOrgId()
        return ApiResponse(success = true, data = orgBillingService.calculateMonthlyFee(orgId, YearMonth.now()))
    }

    /** 미결제 청구서 결제 (mock — 추후 토스 연동 시 paymentId 받음) */
    @PostMapping("/{billingId}/pay")
    fun payBilling(@PathVariable billingId: String, @Valid @RequestBody req: PayRequest?): ApiResponse<BillingView> {
        AdminGuard.requireAnyRole("ORG_ADMIN", "HQ_ADMIN")
        // 본인 기관의 청구서인지 검증
        val orgId = resolveCallerOrgId()
        val billing = orgBillingService.listBillings(orgId).firstOrNull { it.id == billingId }
            ?: throw ApiException("FORBIDDEN", "본인 기관 청구서가 아닙니다", HttpStatus.FORBIDDEN)
        if (!SecurityUtils.hasAnyRole("HQ_ADMIN") && billing.orgId != orgId) {
            throw ApiException("FORBIDDEN", "권한 없음", HttpStatus.FORBIDDEN)
        }
        val saved = orgBillingService.payBilling(billingId, req?.paymentId)
        return ApiResponse(success = true, data = saved.toView())
    }

    // ─── 본사 (HQ_ADMIN) — 기관별 청구·감면 ────────────────────────

    /** 본사 — 모든 기관의 결제 상태 한 번에 조회 (출시 전 운영자 AI 가 호출) */
    @GetMapping("/all")
    fun listAllOrgBillings(): ApiResponse<List<OrgBillingSummary>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(success = true, data = orgBillingService.summaryForAllOrgs())
    }

    @GetMapping("/orgs/{orgId}")
    fun listOrgBillings(@PathVariable orgId: String): ApiResponse<List<BillingView>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(success = true, data = orgBillingService.listBillings(orgId).map { it.toView() })
    }

    @PostMapping("/orgs/{orgId}/issue")
    fun issueOrgBilling(@PathVariable orgId: String, @RequestBody req: IssueRequest?): ApiResponse<BillingView> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val ym = req?.yearMonth?.let { YearMonth.parse(it) } ?: YearMonth.now()
        val saved = orgBillingService.issueBilling(orgId, ym)
        return ApiResponse(success = true, data = saved.toView())
    }

    @PatchMapping("/orgs/{orgId}/base-fee")
    fun setBaseFeeOverride(@PathVariable orgId: String, @Valid @RequestBody req: BaseFeeOverrideRequest): ApiResponse<Map<String, Any?>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        orgBillingService.setMonthlyBaseFeeOverride(orgId, req.monthlyBaseFee)
        return ApiResponse(success = true, data = mapOf("orgId" to orgId, "monthlyBaseFee" to req.monthlyBaseFee))
    }

    /** 본사 — 기관 정지 상태 강제 해제 (지원 후 결제 정상화 등 케이스) */
    @PostMapping("/orgs/{orgId}/unsuspend")
    fun unsuspendOrg(@PathVariable orgId: String): ApiResponse<Map<String, String>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        orgBillingService.unsuspendOrg(orgId)
        return ApiResponse(success = true, data = mapOf("orgId" to orgId, "status" to "unsuspended"))
    }

    private fun resolveCallerOrgId(): String {
        if (SecurityUtils.hasAnyRole("HQ_ADMIN")) {
            // HQ 가 미세 사용 시 본인 멤버십 첫 번째 기관 (org_hq) 또는 명시 X
            val uid = SecurityUtils.currentUserId() ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
            val first = orgMembershipRepository.findByUserIdAndStatus(uid, "active").firstOrNull()?.orgId
            return first ?: throw ApiException("NOT_FOUND", "소속 기관 없음", HttpStatus.NOT_FOUND)
        }
        // ORG_ADMIN — `org_hq` 멤버십 제외 (본사+기관 동시 ORG_ADMIN 케이스 차단)
        val uid = SecurityUtils.currentUserId() ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        return orgMembershipRepository.findByUserIdAndStatus(uid, "active")
            .firstOrNull { it.role == "ORG_ADMIN" && it.orgId != "org_hq" }?.orgId
            ?: throw ApiException("NOT_FOUND", "소속 기관 없음", HttpStatus.NOT_FOUND)
    }
}

// DTOs
data class BillingView(
    val id: String,
    val orgId: String,
    val yearMonth: String,
    val baseFee: Int,
    val excessStudentCount: Int,
    val excessDays: Int,
    val excessFee: Int,
    val totalFee: Int,
    val activeStudentCount: Int,
    val dueAt: String,
    val paidAt: String?,
    val status: String,
    val notes: String?,
)

data class PayRequest(val paymentId: String? = null)
data class IssueRequest(val yearMonth: String? = null)
data class BaseFeeOverrideRequest(val monthlyBaseFee: Int? = null)

private fun OrgBillingEntity.toView() = BillingView(
    id = id, orgId = orgId, yearMonth = yearMonth,
    baseFee = baseFee, excessStudentCount = excessStudentCount,
    excessDays = excessDays, excessFee = excessFee, totalFee = totalFee,
    activeStudentCount = activeStudentCount,
    dueAt = dueAt.toString(),
    paidAt = paidAt?.toString(),
    status = status, notes = notes,
)
