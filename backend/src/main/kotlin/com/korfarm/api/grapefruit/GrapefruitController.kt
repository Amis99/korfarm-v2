package com.korfarm.api.grapefruit

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.org.OrgMembershipRepository
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.security.SecurityUtils
import jakarta.validation.Valid
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/admin/grapefruit")
class GrapefruitController(
    private val grapefruitService: GrapefruitService,
    private val orgMembershipRepository: OrgMembershipRepository,
) {
    // ─── 단가 (본사만) ────────────────────────

    @GetMapping("/pricing")
    fun listPricing(): ApiResponse<List<PricingView>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")  // ORG_ADMIN 도 단가 조회는 가능 (소비자)
        return ApiResponse(success = true, data = grapefruitService.listPricing().map { it.toView() })
    }

    @PatchMapping("/pricing/{kind}")
    fun updatePricing(@PathVariable kind: String, @Valid @RequestBody req: PricingUpdateRequest): ApiResponse<PricingView> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val updatedBy = SecurityUtils.currentUserId() ?: "unknown"
        grapefruitService.updatePricing(kind, req.priceGrapefruits, req.active, updatedBy)
        val saved = grapefruitService.listPricing().first { it.kind == kind }
        return ApiResponse(success = true, data = saved.toView())
    }

    // ─── 본인 기관 잔액·이력 (ORG_ADMIN 자기 기관) ────────────────────────

    @GetMapping("/wallet/me")
    fun getMyWallet(): ApiResponse<WalletView> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val pair = grapefruitService.getCallerOrgBalance()
            ?: throw ApiException("NOT_FOUND", "소속 기관을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        val (orgId, balance) = pair
        return ApiResponse(success = true, data = WalletView(orgId = orgId, balance = balance))
    }

    @GetMapping("/transactions/me")
    fun getMyTransactions(): ApiResponse<List<TransactionView>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val pair = grapefruitService.getCallerOrgBalance()
            ?: throw ApiException("NOT_FOUND", "소속 기관을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        val (orgId, _) = pair
        return ApiResponse(
            success = true,
            data = grapefruitService.listTransactionsForOrg(orgId).map { it.toView() }
        )
    }

    // ─── 충전 (mock — 토스 통합은 Phase D) ────────────────────────

    @PostMapping("/wallet/me/charge")
    fun chargeMyWallet(@Valid @RequestBody req: ChargeRequest): ApiResponse<WalletView> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val pair = grapefruitService.getCallerOrgBalance()
            ?: throw ApiException("NOT_FOUND", "소속 기관을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        val (orgId, _) = pair
        // mock: 즉시 잔액 증가. 실제 PG 연동은 Phase D 에서 paymentId 전달.
        val newBalance = grapefruitService.chargeOrg(orgId, req.amountWon, paymentId = null, memo = req.memo)
        return ApiResponse(success = true, data = WalletView(orgId = orgId, balance = newBalance))
    }

    // ─── 본사가 특정 기관 잔액 조회/수동 충전 (지원·이벤트용) ────────────────────────

    @GetMapping("/orgs/{orgId}/wallet")
    fun getOrgWallet(@PathVariable orgId: String): ApiResponse<WalletView> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(success = true, data = WalletView(orgId = orgId, balance = grapefruitService.getOrgBalance(orgId)))
    }

    @PostMapping("/orgs/{orgId}/charge")
    fun adminChargeOrg(@PathVariable orgId: String, @Valid @RequestBody req: ChargeRequest): ApiResponse<WalletView> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val newBalance = grapefruitService.chargeOrg(orgId, req.amountWon, paymentId = null, memo = req.memo ?: "본사 수동 지급")
        return ApiResponse(success = true, data = WalletView(orgId = orgId, balance = newBalance))
    }
}

// ─── DTO ────────────────────────

data class PricingView(
    val kind: String,
    val label: String,
    val model: String,
    val priceGrapefruits: Int,
    val description: String?,
    val active: Boolean,
    val updatedAt: String,
)

data class PricingUpdateRequest(
    @field:Min(0) val priceGrapefruits: Int,
    val active: Boolean? = null,
)

data class WalletView(
    val orgId: String,
    val balance: Int,
)

data class TransactionView(
    val id: String,
    val direction: String,
    val amount: Int,
    val kind: String?,
    val balanceAfter: Int,
    val amountWon: Int?,
    val memo: String?,
    val createdAt: String,
)

data class ChargeRequest(
    @field:Min(200) val amountWon: Int,
    val memo: String? = null,
)

private fun GrapefruitPricingEntity.toView() = PricingView(
    kind = kind, label = label, model = model,
    priceGrapefruits = priceGrapefruits, description = description, active = active,
    updatedAt = updatedAt.toString(),
)

private fun GrapefruitTransactionEntity.toView() = TransactionView(
    id = id, direction = direction, amount = amount,
    kind = kind, balanceAfter = balanceAfter,
    amountWon = amountWon, memo = memo,
    createdAt = createdAt.toString(),
)
