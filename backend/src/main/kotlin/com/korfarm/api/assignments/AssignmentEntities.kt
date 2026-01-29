package com.korfarm.api.assignments

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "assignments")
class AssignmentEntity(
    @Id
    var id: String,

    @Column(name = "org_id", nullable = false)
    var orgId: String,

    @Column(name = "assignment_type", nullable = false)
    var assignmentType: String,

    @Column(nullable = false)
    var title: String,

    @Column(name = "payload_json", columnDefinition = "json", nullable = false)
    var payloadJson: String,

    @Column(name = "due_at")
    var dueAt: LocalDateTime? = null,

    @Column(nullable = false)
    var status: String,

    @Column(name = "created_by", nullable = false)
    var createdBy: String,

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
@Table(name = "assignment_targets")
class AssignmentTargetEntity(
    @Id
    var id: String,

    @Column(name = "assignment_id", nullable = false)
    var assignmentId: String,

    @Column(name = "target_type", nullable = false)
    var targetType: String,

    @Column(name = "target_id", nullable = false)
    var targetId: String,

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
@Table(name = "assignment_submissions")
class AssignmentSubmissionEntity(
    @Id
    var id: String,

    @Column(name = "assignment_id", nullable = false)
    var assignmentId: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(nullable = false)
    var status: String,

    @Column(name = "submitted_at")
    var submittedAt: LocalDateTime? = null,

    @Column(name = "content_json", columnDefinition = "json")
    var contentJson: String? = null,

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
