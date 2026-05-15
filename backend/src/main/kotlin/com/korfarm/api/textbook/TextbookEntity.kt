package com.korfarm.api.textbook

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "textbooks")
class TextbookEntity(
    @Id
    var id: String,

    @Column(name = "org_id", nullable = false)
    var orgId: String,

    @Column(nullable = false)
    var title: String,

    @Column
    var series: String? = null,

    @Column
    var level: Int? = null,

    @Column
    var volume: Int? = null,

    @Column(name = "payload_json", columnDefinition = "LONGTEXT", nullable = false)
    var payloadJson: String,

    @Column(name = "source_json", columnDefinition = "LONGTEXT")
    var sourceJson: String? = null,

    @Column(name = "student_pdf_file_id")
    var studentPdfFileId: String? = null,

    @Column(name = "answer_pdf_file_id")
    var answerPdfFileId: String? = null,

    @Column(nullable = false)
    var status: String = "draft",

    @Column(name = "created_by")
    var createdBy: String? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),
)
