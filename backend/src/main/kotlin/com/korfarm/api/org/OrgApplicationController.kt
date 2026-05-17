package com.korfarm.api.org

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.contracts.AdminOrgCreateRequest
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.security.SecurityUtils
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import org.springframework.http.HttpStatus
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.time.LocalDateTime

/**
 * 학원·학교 셀프 서비스 도입 신청.
 *
 *   공개 (인증 불필요):
 *     POST /v1/public/org-applications   — 신청 제출
 *
 *   본사 어드민 (HQ_ADMIN):
 *     GET    /v1/admin/org-applications              — 목록
 *     POST   /v1/admin/org-applications/{id}/approve — 승인 (orgs + ORG_ADMIN 자동 생성)
 *     POST   /v1/admin/org-applications/{id}/reject  — 거절 (사유 입력)
 */
@RestController
class OrgApplicationController(
    private val applicationRepository: OrgApplicationRepository,
    private val orgService: OrgService,
) {
    data class ApplyRequest(
        @field:NotBlank val orgName: String,
        val orgType: String? = null,
        val addressRegion: String? = null,
        val addressDetail: String? = null,
        val businessNumber: String? = null,
        val representativeName: String? = null,
        @field:NotBlank val contactPhone: String,
        @field:NotBlank val contactEmail: String,
        val taxEmail: String? = null,
        val estimatedStudents: Int? = null,
        val applicantLoginId: String? = null,
        val applicantName: String? = null,
        val message: String? = null,
        val businessLicenseFileId: String? = null,
    )

    data class ApplicationView(
        val id: String,
        val orgName: String,
        val orgType: String?,
        val addressRegion: String?,
        val addressDetail: String?,
        val businessNumber: String?,
        val representativeName: String?,
        val contactPhone: String,
        val contactEmail: String,
        val taxEmail: String?,
        val estimatedStudents: Int?,
        val applicantLoginId: String?,
        val applicantName: String?,
        val message: String?,
        val businessLicenseFileId: String?,
        val status: String,
        val orgId: String?,
        val adminUserId: String?,
        val adminTemporaryPassword: String?,
        val rejectionReason: String?,
        val createdAt: String,
        val reviewedAt: String?,
    )

    data class RejectRequest(@field:NotBlank val reason: String)

    /** 공개 신청 — 인증 불필요. SecurityConfig 의 permitAll 패턴에 맞춰 등록. */
    @PostMapping("/v1/public/org-applications")
    @Transactional
    fun apply(@Valid @RequestBody req: ApplyRequest): ApiResponse<Map<String, String>> {
        val entity = OrgApplicationEntity(
            id = IdGenerator.newId("oapp"),
            orgName = req.orgName.trim(),
            orgType = req.orgType,
            addressRegion = req.addressRegion,
            addressDetail = req.addressDetail,
            businessNumber = req.businessNumber?.takeIf { it.isNotBlank() },
            representativeName = req.representativeName?.takeIf { it.isNotBlank() },
            contactPhone = req.contactPhone.trim(),
            contactEmail = req.contactEmail.trim(),
            taxEmail = req.taxEmail?.takeIf { it.isNotBlank() },
            estimatedStudents = req.estimatedStudents,
            applicantLoginId = req.applicantLoginId?.takeIf { it.isNotBlank() },
            applicantName = req.applicantName?.takeIf { it.isNotBlank() },
            message = req.message?.takeIf { it.isNotBlank() },
            businessLicenseFileId = req.businessLicenseFileId,
        )
        val saved = applicationRepository.save(entity)
        return ApiResponse(success = true, data = mapOf(
            "applicationId" to saved.id,
            "message" to "신청이 접수됐습니다. 본사가 검토 후 입력하신 연락처/이메일로 결과를 안내드립니다.",
        ))
    }

    @GetMapping("/v1/admin/org-applications")
    fun listApplications(@RequestParam(required = false) status: String?): ApiResponse<List<ApplicationView>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val rows = if (status.isNullOrBlank()) applicationRepository.findAllByOrderByCreatedAtDesc()
                   else applicationRepository.findByStatusOrderByCreatedAtDesc(status)
        return ApiResponse(success = true, data = rows.map { it.toView() })
    }

    @PostMapping("/v1/admin/org-applications/{id}/approve")
    @Transactional
    fun approve(@PathVariable id: String): ApiResponse<ApplicationView> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val reviewerId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val app = applicationRepository.findById(id).orElseThrow {
            ApiException("NOT_FOUND", "신청을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        if (app.status != "pending") {
            throw ApiException("INVALID_STATUS", "이미 처리된 신청입니다 (${app.status})", HttpStatus.BAD_REQUEST)
        }
        // OrgService.createOrg 재활용 — orgs + user + ORG_ADMIN 동시 생성 트랜잭션
        val createReq = AdminOrgCreateRequest(
            name = app.orgName,
            orgType = app.orgType,
            addressRegion = app.addressRegion,
            addressDetail = app.addressDetail,
            businessNumber = app.businessNumber,
            representativeName = app.representativeName,
            contactPhone = app.contactPhone,
            contactEmail = app.contactEmail,
            taxEmail = app.taxEmail,
            adminLoginId = app.applicantLoginId,
            adminName = app.applicantName,
            adminPhone = app.contactPhone,
        )
        val result = orgService.createOrg(createReq)
        app.status = "approved"
        app.orgId = result.org.orgId
        app.adminUserId = result.admin?.userId
        app.adminTemporaryPassword = result.admin?.temporaryPassword   // 한 번만 본사 화면에 표시
        app.reviewedBy = reviewerId
        app.reviewedAt = LocalDateTime.now()
        app.updatedAt = LocalDateTime.now()
        applicationRepository.save(app)
        return ApiResponse(success = true, data = app.toView())
    }

    @PostMapping("/v1/admin/org-applications/{id}/reject")
    @Transactional
    fun reject(@PathVariable id: String, @Valid @RequestBody req: RejectRequest): ApiResponse<ApplicationView> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val reviewerId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val app = applicationRepository.findById(id).orElseThrow {
            ApiException("NOT_FOUND", "신청을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        if (app.status != "pending") {
            throw ApiException("INVALID_STATUS", "이미 처리된 신청입니다", HttpStatus.BAD_REQUEST)
        }
        app.status = "rejected"
        app.rejectionReason = req.reason
        app.reviewedBy = reviewerId
        app.reviewedAt = LocalDateTime.now()
        app.updatedAt = LocalDateTime.now()
        applicationRepository.save(app)
        return ApiResponse(success = true, data = app.toView())
    }

    private fun OrgApplicationEntity.toView() = ApplicationView(
        id = id, orgName = orgName, orgType = orgType,
        addressRegion = addressRegion, addressDetail = addressDetail,
        businessNumber = businessNumber, representativeName = representativeName,
        contactPhone = contactPhone, contactEmail = contactEmail, taxEmail = taxEmail,
        estimatedStudents = estimatedStudents,
        applicantLoginId = applicantLoginId, applicantName = applicantName,
        message = message, businessLicenseFileId = businessLicenseFileId,
        status = status, orgId = orgId,
        adminUserId = adminUserId, adminTemporaryPassword = adminTemporaryPassword,
        rejectionReason = rejectionReason,
        createdAt = createdAt.toString(),
        reviewedAt = reviewedAt?.toString(),
    )
}
