package com.korfarm.api.user

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import java.time.LocalDate
import java.time.LocalDateTime

@Entity
@Table(name = "users")
class UserEntity(
    @Id
    var id: String,

    @Column(nullable = false, unique = true)
    var email: String,

    @Column(name = "password_hash", nullable = false)
    var passwordHash: String,

    var name: String? = null,

    var region: String? = null,

    var school: String? = null,

    @Column(name = "grade_label")
    var gradeLabel: String? = null,

    @Column(name = "level_id")
    var levelId: String? = null,

    @Column(name = "student_phone")
    var studentPhone: String? = null,

    @Column(name = "parent_phone")
    var parentPhone: String? = null,

    @Column(name = "diagnostic_opt_in")
    var diagnosticOptIn: Boolean = false,

    @Column(name = "learning_start_date")
    var learningStartDate: LocalDate? = null,

    @Column(nullable = false)
    var status: String,

    @Column(name = "last_login_at")
    var lastLoginAt: LocalDateTime? = null,

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
