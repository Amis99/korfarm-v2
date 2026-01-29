package com.korfarm.api.board

import java.time.LocalDateTime

data class BoardView(
    val boardId: String,
    val boardType: String,
    val orgScope: String,
    val status: String
)

data class PostAttachmentView(
    val fileId: String,
    val name: String,
    val mime: String,
    val size: Long
)

data class PostSummary(
    val postId: String,
    val boardId: String,
    val title: String,
    val status: String,
    val createdAt: LocalDateTime,
    val authorId: String
)

data class PostDetail(
    val postId: String,
    val boardId: String,
    val title: String,
    val content: String,
    val status: String,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime,
    val authorId: String,
    val attachments: List<PostAttachmentView>
)

data class CommentView(
    val commentId: String,
    val postId: String,
    val authorId: String,
    val content: String,
    val status: String,
    val createdAt: LocalDateTime
)

data class ReportResult(
    val reportId: String,
    val status: String
)

data class AdminReportView(
    val reportId: String,
    val targetType: String,
    val targetId: String,
    val reason: String,
    val status: String,
    val createdAt: LocalDateTime
)
