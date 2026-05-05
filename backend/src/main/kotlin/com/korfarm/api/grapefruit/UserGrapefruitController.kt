package com.korfarm.api.grapefruit

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.SecurityUtils
import jakarta.validation.Valid
import jakarta.validation.constraints.Min
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * 학생(개인) 자몽 충전 + 잔액 + 거래 이력 — Phase C
 *
 * - 1자몽 = 250원 (개인). 만원 = 40자몽.
 * - 작물(밀/쌀/옥수수/포도/사과)도 1:1 자몽 환산으로 AI 사용 가능.
 * - user_crops 는 랭킹용 누적 (사용해도 차감 X), user_crop_wallet 만 차감.
 */
@RestController
@RequestMapping("/v1/me/grapefruit")
class UserGrapefruitController(
    private val grapefruitService: GrapefruitService,
) {
    /** 자몽 + 작물 잔액 + 단가표 (충전 페이지에 한 번에 표시용) */
    @GetMapping("/balance")
    fun balance(): ApiResponse<UserBalanceView> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val bal = grapefruitService.getUserAiBalance(userId)
        return ApiResponse(success = true, data = UserBalanceView(
            grapefruits = bal.grapefruits,
            crops = bal.crops,
        ))
    }

    @GetMapping("/transactions")
    fun transactions(): ApiResponse<List<TransactionView>> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        return ApiResponse(success = true, data = grapefruitService.listTransactionsForUser(userId).map { it.toViewSimple() })
    }

    /** mock 충전 (Phase D 토스 통합 시 paymentId 받음) */
    @PostMapping("/charge")
    fun charge(@Valid @RequestBody req: UserChargeRequest): ApiResponse<Map<String, Any>> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val newBalance = grapefruitService.chargeUser(userId, req.amountWon, paymentId = null, memo = req.memo ?: "개인 자몽 충전")
        return ApiResponse(success = true, data = mapOf("balance" to newBalance, "amountWon" to req.amountWon))
    }
}

data class UserBalanceView(
    val grapefruits: Int,
    val crops: Map<String, Int>,
)

data class UserChargeRequest(
    @field:Min(250) val amountWon: Int,
    val memo: String? = null,
)

private fun GrapefruitTransactionEntity.toViewSimple() = TransactionView(
    id = id, direction = direction, amount = amount,
    kind = kind, balanceAfter = balanceAfter,
    amountWon = amountWon, memo = memo,
    createdAt = createdAt.toString(),
)
