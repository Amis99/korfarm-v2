package com.korfarm.api.wisdom

import java.time.LocalDateTime

data class WisdomPostSummary(
    val postId: String,
    val levelId: String,
    val topicKey: String,
    val topicLabel: String,
    val submissionType: String,
    val isOwn: Boolean,
    val authorName: String?,
    val hasFeedback: Boolean,
    val likeCount: Int,
    val isLikedByMe: Boolean,
    val commentCount: Int,
    val createdAt: LocalDateTime
)

data class WisdomPostListResponse(
    val hasMyPost: Boolean,
    val posts: List<WisdomPostSummary>
)

data class WisdomPostDetail(
    val postId: String,
    val levelId: String,
    val topicKey: String,
    val topicLabel: String,
    val submissionType: String,
    val content: String?,
    val isOwn: Boolean,
    val authorName: String?,
    val attachments: List<WisdomAttachmentView>,
    val feedback: WisdomFeedbackView?,
    val likeCount: Int,
    val isLikedByMe: Boolean,
    val comments: List<WisdomCommentView>,
    val createdAt: LocalDateTime
)

data class WisdomAttachmentView(
    val fileId: String,
    val name: String,
    val mime: String,
    val size: Long
)

data class WisdomFeedbackView(
    val feedbackId: String,
    val reviewerName: String?,
    val comment: String,
    val correction: String?,
    val createdAt: LocalDateTime
)

data class WisdomCommentView(
    val commentId: String,
    val isOwn: Boolean,
    val authorName: String?,
    val content: String,
    val createdAt: LocalDateTime
)

data class AdminWisdomPostSummary(
    val postId: String,
    val levelId: String,
    val topicKey: String,
    val topicLabel: String,
    val submissionType: String,
    val authorId: String,
    val authorName: String?,
    val hasFeedback: Boolean,
    val status: String,
    val createdAt: LocalDateTime
)

data class AdminWisdomPostDetail(
    val postId: String,
    val levelId: String,
    val topicKey: String,
    val topicLabel: String,
    val submissionType: String,
    val content: String?,
    val authorId: String,
    val authorName: String?,
    val attachments: List<WisdomAttachmentView>,
    val feedback: WisdomFeedbackView?,
    val comments: List<WisdomCommentView>,
    val status: String,
    val createdAt: LocalDateTime
)
