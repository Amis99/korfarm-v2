package com.korfarm.api.learning

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "quiz_answer_details")
class QuizAnswerDetailEntity(
    @Id
    var id: String,

    @Column(name = "log_id", nullable = false)
    var logId: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(name = "question_id", nullable = false)
    var questionId: String,

    @Column(name = "question_kind")
    var questionKind: String? = null,

    @Column(nullable = false)
    var correct: Boolean = false,

    @Column(name = "answered_at", nullable = false)
    var answeredAt: LocalDateTime = LocalDateTime.now()
)
