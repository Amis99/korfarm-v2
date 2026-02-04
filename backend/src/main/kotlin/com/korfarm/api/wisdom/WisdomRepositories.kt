package com.korfarm.api.wisdom

import org.springframework.data.jpa.repository.JpaRepository

interface WisdomPostRepository : JpaRepository<WisdomPostEntity, String> {
    fun findByLevelIdAndStatusOrderByCreatedAtDesc(levelId: String, status: String): List<WisdomPostEntity>
    fun findByLevelIdAndTopicKeyAndStatusOrderByCreatedAtDesc(levelId: String, topicKey: String, status: String): List<WisdomPostEntity>
    fun findByUserIdAndStatusOrderByCreatedAtDesc(userId: String, status: String): List<WisdomPostEntity>
    fun findByLevelIdOrderByCreatedAtDesc(levelId: String): List<WisdomPostEntity>
    fun findByLevelIdAndTopicKeyOrderByCreatedAtDesc(levelId: String, topicKey: String): List<WisdomPostEntity>
    fun existsByLevelIdAndTopicKeyAndUserIdAndStatus(levelId: String, topicKey: String, userId: String, status: String): Boolean
}

interface WisdomAttachmentRepository : JpaRepository<WisdomAttachmentEntity, String> {
    fun findByPostId(postId: String): List<WisdomAttachmentEntity>
}

interface WisdomFeedbackRepository : JpaRepository<WisdomFeedbackEntity, String> {
    fun findByPostId(postId: String): WisdomFeedbackEntity?
    fun findByPostIdIn(postIds: List<String>): List<WisdomFeedbackEntity>
}

interface WisdomLikeRepository : JpaRepository<WisdomLikeEntity, String> {
    fun findByPostIdAndUserId(postId: String, userId: String): WisdomLikeEntity?
    fun deleteByPostIdAndUserId(postId: String, userId: String)
    fun countByPostId(postId: String): Long
    fun findByPostIdIn(postIds: List<String>): List<WisdomLikeEntity>
}

interface WisdomCommentRepository : JpaRepository<WisdomCommentEntity, String> {
    fun findByPostIdAndStatusOrderByCreatedAtAsc(postId: String, status: String): List<WisdomCommentEntity>
    fun countByPostIdAndStatus(postId: String, status: String): Long
    fun findByPostIdInAndStatus(postIds: List<String>, status: String): List<WisdomCommentEntity>
}
