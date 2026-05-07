package com.korfarm.api.payment

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.SecurityUtils
import com.korfarm.api.user.ParentStudentLinkRepository
import com.korfarm.api.user.UserRepository
import jakarta.validation.Valid
import jakarta.validation.constraints.Min
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * 학부모 → 자녀 월 구독 결제 대행.
 * 학부모는 자몽 X (학습 안 하므로). 자녀의 월 이용료만 결제 대행.
 */
@RestController
@RequestMapping("/v1/parents")
class ParentPaymentController(
    private val paymentService: PaymentService,
    private val subscriptionService: SubscriptionService,
    private val subscriptionRepository: SubscriptionRepository,
    private val parentLinkRepo: ParentStudentLinkRepository,
    private val userRepository: UserRepository,
) {
    private fun currentUserId(): String =
        SecurityUtils.currentUserId() ?: throw ApiException(
            "UNAUTHORIZED", "로그인이 필요합니다", HttpStatus.UNAUTHORIZED
        )

    private fun verifyParentChild(parentUserId: String, childUserId: String) {
        if (!SecurityUtils.hasAnyRole("PARENT")) {
            throw ApiException("FORBIDDEN", "학부모 권한이 필요합니다", HttpStatus.FORBIDDEN)
        }
        val link = parentLinkRepo.findByParentUserIdAndStudentUserId(parentUserId, childUserId)
            ?: throw ApiException("LINK_NOT_FOUND", "연결된 자녀가 아닙니다", HttpStatus.FORBIDDEN)
        if (link.status != "active") {
            throw ApiException("LINK_INACTIVE", "활성 자녀 연결이 아닙니다", HttpStatus.FORBIDDEN)
        }
    }

    /** 자녀 구독 상태 조회. */
    @GetMapping("/children/{studentId}/subscription")
    fun getChildSubscription(@PathVariable studentId: String): ApiResponse<ChildSubscriptionView> {
        val parentUserId = currentUserId()
        verifyParentChild(parentUserId, studentId)

        val sub = subscriptionRepository.findTopByUserIdOrderByEndAtDesc(studentId)
        val status: String
        val expiresAt: String?
        if (sub == null) {
            status = "free"
            expiresAt = null
        } else if (subscriptionService.isEntitled(sub) && sub.status == "active") {
            status = "active"
            expiresAt = sub.endAt.toString()
        } else {
            status = "expired"
            expiresAt = sub.endAt.toString()
        }
        val childUser = userRepository.findById(studentId).orElse(null)
        return ApiResponse(
            success = true,
            data = ChildSubscriptionView(
                studentId = studentId,
                studentName = childUser?.name,
                status = status,
                expiresAt = expiresAt,
            )
        )
    }

    /** 학부모가 자녀 구독 결제 prepare. */
    @PostMapping("/children/{studentId}/subscribe")
    fun subscribeChild(
        @PathVariable studentId: String,
        @Valid @RequestBody req: ParentSubscribeRequest,
    ): ApiResponse<PaymentPrepareResult> {
        val parentUserId = currentUserId()
        verifyParentChild(parentUserId, studentId)
        val result = paymentService.prepareSubscriptionForChild(parentUserId, studentId, req.months)
        return ApiResponse(success = true, data = result)
    }
}

data class ParentSubscribeRequest(
    @field:Min(1)
    val months: Int = 1,
)

data class ChildSubscriptionView(
    val studentId: String,
    val studentName: String?,
    val status: String,        // "active" | "expired" | "free"
    val expiresAt: String?,
)
