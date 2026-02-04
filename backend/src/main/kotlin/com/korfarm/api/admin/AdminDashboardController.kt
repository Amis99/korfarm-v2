package com.korfarm.api.admin

import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.user.UserRepository
import com.korfarm.api.org.OrgRepository
import com.korfarm.api.payment.PaymentRepository
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDateTime
import java.time.LocalDate

@RestController
@RequestMapping("/v1/admin/dashboard")
class AdminDashboardController(
    private val userRepository: UserRepository,
    private val orgRepository: OrgRepository,
    private val paymentRepository: PaymentRepository
) {
    @GetMapping("/summary")
    fun summary(): ApiResponse<Map<String, Any>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val todayStart = LocalDate.now().atStartOfDay()
        val totalUsers = userRepository.count()
        val activeUsers = userRepository.countByStatus("active")
        val todaySignups = userRepository.countByCreatedAtAfter(todayStart)
        val activeOrgs = orgRepository.findByStatusOrderByNameAsc("active").size.toLong()
        val data = mapOf(
            "todaySignups" to todaySignups,
            "activeUsers" to activeUsers,
            "totalUsers" to totalUsers,
            "activeOrgs" to activeOrgs
        )
        return ApiResponse(success = true, data = data)
    }
}
