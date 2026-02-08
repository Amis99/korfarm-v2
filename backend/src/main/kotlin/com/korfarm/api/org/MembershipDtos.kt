package com.korfarm.api.org

import java.time.LocalDateTime

data class PendingMembershipDto(
    val id: String,
    val userId: String,
    val userName: String?,
    val userLoginId: String,
    val orgId: String,
    val orgName: String?,
    val role: String,
    val status: String,
    val requestedAt: LocalDateTime?,
    val linkedStudentName: String?,
    val linkedStudentPhone: String?,
    val linkedParentPhone: String?,
    val studentMatched: Boolean
)

data class MembershipApproveRequest(
    val reason: String? = null
)

data class MembershipRejectRequest(
    val reason: String
)

data class MembershipApprovalResult(
    val membershipId: String,
    val status: String,
    val message: String,
    val autoLinked: Boolean = false
)