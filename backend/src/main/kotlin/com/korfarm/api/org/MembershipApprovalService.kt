package com.korfarm.api.org

import com.korfarm.api.common.ApiException
import com.korfarm.api.user.UserRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.slf4j.LoggerFactory
import java.time.LocalDateTime

@Service
class MembershipApprovalService(
    private val orgMembershipRepository: OrgMembershipRepository,
    private val orgRepository: OrgRepository,
    private val userRepository: UserRepository
) {
    private val logger = LoggerFactory.getLogger(MembershipApprovalService::class.java)

    fun getPendingMemberships(orgId: String?): List<PendingMembershipDto> {
        val memberships = if (orgId.isNullOrBlank()) {
            orgMembershipRepository.findByStatusOrderByRequestedAtDesc("pending")
        } else {
            orgMembershipRepository.findByOrgIdAndStatusOrderByRequestedAtDesc(orgId, "pending")
        }

        val userIds = memberships.map { it.userId }.distinct()
        val orgIds = memberships.map { it.orgId }.distinct()

        val usersMap = userRepository.findAllById(userIds).associateBy { it.id }
        val orgsMap = orgRepository.findAllById(orgIds).associateBy { it.id }

        return memberships.map { membership ->
            val user = usersMap[membership.userId]
            val org = orgsMap[membership.orgId]

            // 학부모인 경우 학생 매칭 여부 확인
            val studentMatched = if (membership.role == "PARENT" && !membership.linkedStudentName.isNullOrBlank()) {
                val matchedStudent = if (!membership.linkedParentPhone.isNullOrBlank() && !membership.linkedStudentPhone.isNullOrBlank()) {
                    userRepository.findByNameAndStudentPhoneAndParentPhone(
                        membership.linkedStudentName!!,
                        membership.linkedStudentPhone!!,
                        membership.linkedParentPhone!!
                    )
                } else if (!membership.linkedStudentPhone.isNullOrBlank()) {
                    userRepository.findByNameAndStudentPhone(
                        membership.linkedStudentName!!,
                        membership.linkedStudentPhone!!
                    )
                } else {
                    null
                }
                matchedStudent != null
            } else {
                false
            }

            PendingMembershipDto(
                id = membership.id,
                userId = membership.userId,
                userName = user?.name,
                userLoginId = user?.email ?: "",
                orgId = membership.orgId,
                orgName = org?.name,
                role = membership.role,
                status = membership.status,
                requestedAt = membership.requestedAt,
                linkedStudentName = membership.linkedStudentName,
                linkedStudentPhone = membership.linkedStudentPhone,
                linkedParentPhone = membership.linkedParentPhone,
                studentMatched = studentMatched
            )
        }
    }

    fun approveMembership(membershipId: String, approvedBy: String): MembershipApprovalResult {
        val membership = orgMembershipRepository.findById(membershipId).orElseThrow {
            ApiException("NOT_FOUND", "멤버십을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }

        if (membership.status != "pending") {
            throw ApiException("INVALID_STATUS", "승인 대기 상태가 아닙니다", HttpStatus.BAD_REQUEST)
        }

        val now = LocalDateTime.now()
        membership.status = "active"
        membership.approvedAt = now
        membership.approvedBy = approvedBy
        membership.updatedAt = now

        orgMembershipRepository.save(membership)

        logger.info("멤버십 승인 완료: membershipId={}, approvedBy={}", membershipId, approvedBy)

        return MembershipApprovalResult(
            membershipId = membershipId,
            status = "active",
            message = "승인이 완료되었습니다"
        )
    }

    fun rejectMembership(membershipId: String, rejectedBy: String, reason: String): MembershipApprovalResult {
        val membership = orgMembershipRepository.findById(membershipId).orElseThrow {
            ApiException("NOT_FOUND", "멤버십을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }

        if (membership.status != "pending") {
            throw ApiException("INVALID_STATUS", "승인 대기 상태가 아닙니다", HttpStatus.BAD_REQUEST)
        }

        val now = LocalDateTime.now()
        membership.status = "rejected"
        membership.approvedAt = now
        membership.approvedBy = rejectedBy
        membership.rejectionReason = reason
        membership.updatedAt = now

        orgMembershipRepository.save(membership)

        logger.info("멤버십 거절 완료: membershipId={}, rejectedBy={}, reason={}", membershipId, rejectedBy, reason)

        return MembershipApprovalResult(
            membershipId = membershipId,
            status = "rejected",
            message = "거절 처리되었습니다"
        )
    }
}
