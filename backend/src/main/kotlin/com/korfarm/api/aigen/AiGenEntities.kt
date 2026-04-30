package com.korfarm.api.aigen

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "grammar_corpus")
class GrammarCorpusEntity(
    @Id
    var id: String,

    @Column(nullable = false)
    var topic: String,

    var source: String? = null,

    @Column(nullable = false)
    var title: String,

    @Column(name = "content_md", columnDefinition = "MEDIUMTEXT", nullable = false)
    var contentMd: String,

    var tags: String? = null,

    @Column(name = "level_min")
    var levelMin: String? = null,

    @Column(name = "level_max")
    var levelMax: String? = null,

    @Column(nullable = false)
    var status: String = "active",

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
)

@Entity
@Table(name = "learning_concepts")
class LearningConceptEntity(
    @Id
    var id: String,

    @Column(nullable = false)
    var area: String,

    @Column(name = "sub_area")
    var subArea: String? = null,

    @Column(nullable = false)
    var name: String,

    @Column(columnDefinition = "TEXT")
    var description: String? = null,

    @Column(name = "level_min")
    var levelMin: String? = null,

    @Column(name = "level_max")
    var levelMax: String? = null,

    @Column(name = "display_order", nullable = false)
    var displayOrder: Int = 0,

    @Column(nullable = false)
    var status: String = "active",

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
)

@Entity
@Table(name = "ai_gen_logs")
class AiGenLogEntity(
    @Id
    var id: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(name = "test_id")
    var testId: String? = null,

    @Column(nullable = false)
    var kind: String,

    @Column(nullable = false)
    var model: String,

    @Column(name = "input_tokens")
    var inputTokens: Int? = null,

    @Column(name = "output_tokens")
    var outputTokens: Int? = null,

    @Column(name = "duration_ms")
    var durationMs: Int? = null,

    var passed: Boolean? = null,

    @Column(name = "retry_count", nullable = false)
    var retryCount: Int = 0,

    @Column(nullable = false)
    var status: String = "success",

    @Column(name = "error_message", columnDefinition = "TEXT")
    var errorMessage: String? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
)
