package com.korfarm.api.board

import org.springframework.data.jpa.repository.JpaRepository

interface BoardRepository : JpaRepository<BoardEntity, String> {
    fun findByStatusOrderByBoardTypeAsc(status: String): List<BoardEntity>
}

interface PostRepository : JpaRepository<PostEntity, String> {
    fun findByBoardIdOrderByCreatedAtDesc(boardId: String): List<PostEntity>
}

interface PostAttachmentRepository : JpaRepository<PostAttachmentEntity, String> {
    fun findByPostId(postId: String): List<PostAttachmentEntity>
    fun deleteByPostId(postId: String)
}

interface PostReviewRepository : JpaRepository<PostReviewEntity, String> {
    fun findByPostId(postId: String): PostReviewEntity?
}

interface CommentRepository : JpaRepository<CommentEntity, String> {
    fun findByPostIdOrderByCreatedAtAsc(postId: String): List<CommentEntity>
}

interface ReportRepository : JpaRepository<ReportEntity, String>
