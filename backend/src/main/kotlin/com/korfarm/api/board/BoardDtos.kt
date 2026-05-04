package com.korfarm.api.board

import java.time.LocalDateTime

data class BoardView(
    val boardId: String,
    val boardType: String,
    val status: String,
    /** 열람 최소 등급 (FREE/PAID/ORG_ADMIN/HQ_ADMIN) */
    val viewMinRole: String,
    val writeMinRole: String,
    /** 댓글+좋아요 최소 등급 */
    val commentMinRole: String,
    /** 현재 사용자가 이 게시판에 가진 권한 — 프론트에서 버튼 disabled 판단용 */
    val canView: Boolean = true,
    val canWrite: Boolean = false,
    val canComment: Boolean = false
)

data class PostAttachmentView(
    val fileId: String,
    val name: String,
    val originalName: String? = null,
    val mime: String,
    val size: Long
)

data class PostSummary(
    val postId: String,
    val boardId: String,
    val title: String,
    val status: String,
    val createdAt: LocalDateTime,
    val authorId: String,
    val authorName: String? = null,
    val likeCount: Int = 0,
    val commentCount: Int = 0,
    val reportCount: Int = 0,
    val isGuest: Boolean = false,
    val guestName: String? = null,
    val guestContact: String? = null,
    /** 회원 작성자의 연락처(학생→학부모 우선) — 어드민 문의 관리에서만 채움. */
    val authorPhone: String? = null,
    val authorSchool: String? = null,
    val authorGrade: String? = null
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
    val authorName: String? = null,
    val attachments: List<PostAttachmentView>,
    val isGuest: Boolean = false,
    val guestName: String? = null,
    val guestContact: String? = null
)

data class CommentView(
    val commentId: String,
    val postId: String,
    val authorId: String,
    val authorName: String? = null,
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
