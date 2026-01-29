package com.korfarm.api.user

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "parent_student_links")
class ParentStudentLinkEntity(
    @Id
    var id: String,

    @Column(name = "parent_user_id", nullable = false)
    var parentUserId: String,

    @Column(name = "student_user_id", nullable = false)
    var studentUserId: String,

    @Column(name = "request_code")
    var requestCode: String? = null,

    @Column(name = "requested_at")
    var requestedAt: LocalDateTime? = null,

    @Column(name = "approved_at")
    var approvedAt: LocalDateTime? = null,

    @Column(name = "approved_by")
    var approvedBy: String? = null,

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
