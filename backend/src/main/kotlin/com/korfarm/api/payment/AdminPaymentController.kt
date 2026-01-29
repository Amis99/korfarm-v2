package com.korfarm.api.payment

import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/admin")
class AdminPaymentController(
    private val paymentService: PaymentService
) {
    @GetMapping("/payments")
    fun payments(): ApiResponse<List<PaymentView>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(success = true, data = paymentService.listPaymentsAdmin())
    }
}

