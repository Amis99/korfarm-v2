package com.korfarm.api.student

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "student_deletion_logs")
class StudentDeletionLogEntity(
    @Id
    var id: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(name = "deleted_user_email", nullable = false)
    var deletedUserEmail: String,

    @Column(name = "deleted_user_name")
    var deletedUserName: String? = null,

    @Column(name = "deleted_by", nullable = false)
    var deletedBy: String,

    @Column(name = "deleted_by_email")
    var deletedByEmail: String? = null,

    @Column(columnDefinition = "TEXT")
    var reason: String? = null,

    @Column(nullable = false)
    var immediate: Boolean = false,

    @Column(name = "backup_size_bytes")
    var backupSizeBytes: Long? = null,

    @Column(name = "hard_deleted_at")
    var hardDeletedAt: LocalDateTime? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
)
