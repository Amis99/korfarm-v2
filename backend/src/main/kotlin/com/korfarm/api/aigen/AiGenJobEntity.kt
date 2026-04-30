package com.korfarm.api.aigen

import jakarta.persistence.*
import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDateTime

@Entity
@Table(name = "ai_gen_jobs")
class AiGenJobEntity(
    @Id
    var id: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(name = "test_id")
    var testId: String? = null,

    @Column(nullable = false)
    var kind: String,                                 // passage / question

    @Column(nullable = false)
    var status: String = "queued",                    // queued / running / completed / failed

    @Column(name = "request_json", columnDefinition = "LONGTEXT", nullable = false)
    var requestJson: String,

    @Column(name = "result_json", columnDefinition = "LONGTEXT")
    var resultJson: String? = null,

    @Column(name = "error_message", columnDefinition = "TEXT")
    var errorMessage: String? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "started_at")
    var startedAt: LocalDateTime? = null,

    @Column(name = "completed_at")
    var completedAt: LocalDateTime? = null,
)

interface AiGenJobRepository : JpaRepository<AiGenJobEntity, String>
