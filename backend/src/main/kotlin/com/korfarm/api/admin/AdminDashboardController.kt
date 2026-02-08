package com.korfarm.api.admin

import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.security.SecurityUtils
import com.korfarm.api.user.UserRepository
import com.korfarm.api.user.ParentStudentLinkRepository
import com.korfarm.api.org.OrgRepository
import com.korfarm.api.org.OrgMembershipRepository
import com.korfarm.api.learning.FarmLearningLogRepository
import com.korfarm.api.test.TestSubmissionRepo
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
    private val paymentRepository: PaymentRepository,
    private val farmLearningLogRepository: FarmLearningLogRepository,
    private val orgMembershipRepository: OrgMembershipRepository,
    private val parentStudentLinkRepository: ParentStudentLinkRepository,
    private val testSubmissionRepo: TestSubmissionRepo
) {
    @GetMapping("/summary")
    fun summary(): ApiResponse<Map<String, Any>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val todayStart = LocalDate.now().atStartOfDay()
        val sevenDaysAgo = LocalDate.now().minusDays(7).atStartOfDay()

        // 현재 사용자의 역할과 기관 확인
        val currentUserId = SecurityUtils.currentUserId()
        val isHqAdmin = SecurityUtils.currentRoles().contains("HQ_ADMIN")
        val userOrgId = if (!isHqAdmin && currentUserId != null) {
            orgMembershipRepository.findByUserIdAndStatus(currentUserId, "active")
                .firstOrNull()?.orgId
        } else null

        // 기존 지표
        val totalUsers = userRepository.count()
        val activeUsers = userRepository.countByStatus("active")
        val todaySignups = userRepository.countByCreatedAtAfter(todayStart)
        val activeOrgs = orgRepository.findByStatusOrderByNameAsc("active").size.toLong()

        // 신규 지표: 오늘 학습 참여 학생 수
        val todayLearners = if (isHqAdmin || userOrgId == null) {
            farmLearningLogRepository.countDistinctUserByCompletedAtAfter(todayStart)
        } else {
            farmLearningLogRepository.countDistinctUserByCompletedAtAfterAndOrgId(todayStart, userOrgId)
        }

        // 신규 지표: 가입 승인 대기 건수
        val pendingApprovals = if (isHqAdmin || userOrgId == null) {
            orgMembershipRepository.countByStatus("pending")
        } else {
            orgMembershipRepository.countByOrgIdAndStatus(userOrgId, "pending")
        }

        // 신규 지표: 학부모 연결 대기 건수
        val pendingParentLinks = parentStudentLinkRepository.countByStatus("pending")

        // 신규 지표: 최근 7일 테스트 응시 건수
        val recentTestSubmissions = if (isHqAdmin || userOrgId == null) {
            testSubmissionRepo.countByCreatedAtAfter(sevenDaysAgo)
        } else {
            testSubmissionRepo.countByCreatedAtAfterAndOrgId(sevenDaysAgo, userOrgId)
        }

        val data = mapOf(
            "todaySignups" to todaySignups,
            "activeUsers" to activeUsers,
            "totalUsers" to totalUsers,
            "activeOrgs" to activeOrgs,
            "todayLearners" to todayLearners,
            "pendingApprovals" to pendingApprovals,
            "pendingParentLinks" to pendingParentLinks,
            "recentTestSubmissions" to recentTestSubmissions
        )
        return ApiResponse(success = true, data = data)
    }
}
