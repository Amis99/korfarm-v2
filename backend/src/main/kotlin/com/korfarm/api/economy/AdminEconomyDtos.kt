package com.korfarm.api.economy

import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull

/** 관리자 인벤토리 지급/차감 요청 DTO */
data class AdminInventoryAdjustRequest(
    @field:NotBlank val type: String,
    val itemType: String? = null,
    @field:NotNull @field:Min(1) val amount: Int,
    @field:NotBlank val reason: String
)

/** 관리자 인벤토리 조정 결과 DTO */
data class AdminInventoryAdjustResult(
    val userId: String,
    val type: String,
    val itemType: String?,
    val delta: Int,
    val reason: String,
    val inventory: Inventory
)
