package com.korfarm.api.org

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDateTime

@Entity
@Table(name = "org_applications")
class OrgApplicationEntity(
    @Id var id: String,
    @Column(name = "org_name", nullable = false) var orgName: String,
    @Column(name = "org_type") var orgType: String? = null,
    @Column(name = "address_region") var addressRegion: String? = null,
    @Column(name = "address_detail") var addressDetail: String? = null,
    @Column(name = "business_number") var businessNumber: String? = null,
    @Column(name = "representative_name") var representativeName: String? = null,
    @Column(name = "contact_phone", nullable = false) var contactPhone: String,
    @Column(name = "contact_email", nullable = false) var contactEmail: String,
    @Column(name = "tax_email") var taxEmail: String? = null,
    @Column(name = "estimated_students") var estimatedStudents: Int? = null,
    @Column(name = "applicant_login_id") var applicantLoginId: String? = null,
    @Column(name = "applicant_name") var applicantName: String? = null,
    @Column(columnDefinition = "TEXT") var message: String? = null,
    @Column(name = "business_license_file_id") var businessLicenseFileId: String? = null,
    @Column(nullable = false) var status: String = "pending",   // pending / approved / rejected
    @Column(name = "org_id") var orgId: String? = null,
    @Column(name = "admin_user_id") var adminUserId: String? = null,
    @Column(name = "admin_temporary_password", length = 64) var adminTemporaryPassword: String? = null,
    @Column(name = "reviewed_by") var reviewedBy: String? = null,
    @Column(name = "reviewed_at") var reviewedAt: LocalDateTime? = null,
    @Column(name = "rejection_reason", columnDefinition = "TEXT") var rejectionReason: String? = null,
    @Column(name = "created_at", nullable = false) var createdAt: LocalDateTime = LocalDateTime.now(),
    @Column(name = "updated_at", nullable = false) var updatedAt: LocalDateTime = LocalDateTime.now(),
)

interface OrgApplicationRepository : JpaRepository<OrgApplicationEntity, String> {
    fun findByStatusOrderByCreatedAtDesc(status: String): List<OrgApplicationEntity>
    fun findAllByOrderByCreatedAtDesc(): List<OrgApplicationEntity>
}
