package com.korfarm.api.wisdom

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDateTime

object AiFeedbackJobStatus {
    const val PENDING = "PENDING"
    const val RUNNING = "RUNNING"
    const val COMPLETED = "COMPLETED"
    const val FAILED = "FAILED"
}

@Entity
@Table(name = "ai_feedback_jobs")
class AiFeedbackJobEntity(
    @Id
    var id: String,

    @Column(name = "post_id", nullable = false)
    var postId: String,

    @Column(name = "requested_by", nullable = false)
    var requestedBy: String,

    @Column(nullable = false, length = 16)
    var status: String,

    @Column(name = "result_comment", columnDefinition = "text")
    var resultComment: String? = null,

    @Column(name = "result_correction", columnDefinition = "text")
    var resultCorrection: String? = null,

    @Column(name = "error_message", columnDefinition = "text")
    var errorMessage: String? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "completed_at")
    var completedAt: LocalDateTime? = null
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

interface AiFeedbackJobRepository : JpaRepository<AiFeedbackJobEntity, String> {
    fun findFirstByPostIdAndStatusInOrderByCreatedAtDesc(
        postId: String,
        statuses: Collection<String>
    ): AiFeedbackJobEntity?
}
