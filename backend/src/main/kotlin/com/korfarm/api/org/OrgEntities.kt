package com.korfarm.api.org

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import java.time.LocalDate
import java.time.LocalDateTime

@Entity
@Table(name = "orgs")
class OrgEntity(
    @Id
    var id: String,

    @Column(nullable = false)
    var name: String,

    @Column(nullable = false)
    var status: String,

    var plan: String? = null,

    @Column(name = "org_type")
    var orgType: String? = null,

    @Column(name = "address_region")
    var addressRegion: String? = null,

    @Column(name = "address_detail")
    var addressDetail: String? = null,

    @Column(name = "seat_limit", nullable = false)
    var seatLimit: Int = 0,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    @PrePersist
    fun onCreate() {
        val now = LocalDateTime.now()
        createdAt = now
        updatedAt = now
    }

    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }
}

@Entity
@Table(name = "org_memberships")
class OrgMembershipEntity(
    @Id
    var id: String,

    @Column(name = "org_id", nullable = false)
    var orgId: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(nullable = false)
    var role: String,

    @Column(nullable = false)
    var status: String,

    @Column(name = "requested_at")
    var requestedAt: LocalDateTime? = null,

    @Column(name = "approved_at")
    var approvedAt: LocalDateTime? = null,

    @Column(name = "approved_by")
    var approvedBy: String? = null,

    @Column(name = "rejection_reason")
    var rejectionReason: String? = null,

    @Column(name = "linked_student_name")
    var linkedStudentName: String? = null,

    @Column(name = "linked_student_phone")
    var linkedStudentPhone: String? = null,

    @Column(name = "linked_parent_phone")
    var linkedParentPhone: String? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    @PrePersist
    fun onCreate() {
        val now = LocalDateTime.now()
        createdAt = now
        updatedAt = now
        if (requestedAt == null) {
            requestedAt = now
        }
    }

    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }
}

@Entity
@Table(name = "classes")
class ClassEntity(
    @Id
    var id: String,

    @Column(name = "org_id", nullable = false)
    var orgId: String,

    @Column(nullable = false)
    var name: String,

    var description: String? = null,

    @Column(name = "level_id")
    var levelId: String? = null,

    var grade: String? = null,

    @Column(nullable = false)
    var status: String,

    @Column(name = "start_at")
    var startAt: LocalDate? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    @PrePersist
    fun onCreate() {
        val now = LocalDateTime.now()
        createdAt = now
        updatedAt = now
    }

    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }
}

@Entity
@Table(name = "class_memberships")
class ClassMembershipEntity(
    @Id
    var id: String,

    @Column(name = "class_id", nullable = false)
    var classId: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(nullable = false)
    var status: String,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    @PrePersist
    fun onCreate() {
        val now = LocalDateTime.now()
        createdAt = now
        updatedAt = now
    }

    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }
}
