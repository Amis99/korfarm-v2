package com.korfarm.api.chat

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDateTime

@Repository
interface ChatMessageRepository : JpaRepository<ChatMessageEntity, String> {
    /** 최신순 페이징 — beforeId가 있으면 해당 ID보다 오래된 메시지만 */
    @Query(
        """
        SELECT m FROM ChatMessageEntity m
        WHERE m.roomId = :roomId
          AND (:beforeCreatedAt IS NULL OR m.createdAt < :beforeCreatedAt)
        ORDER BY m.createdAt DESC
        """
    )
    fun findRecent(
        @Param("roomId") roomId: String,
        @Param("beforeCreatedAt") beforeCreatedAt: LocalDateTime?,
        pageable: org.springframework.data.domain.Pageable
    ): List<ChatMessageEntity>

    /** FULLTEXT 검색: 관련 과거 대화 (최신순, 최근 30건 제외) */
    @Query(
        value = """
        SELECT * FROM chat_messages
        WHERE room_id = :roomId
          AND message_type = 'text'
          AND status = 'active'
          AND created_at < :before
          AND MATCH(content) AGAINST(:keyword IN BOOLEAN MODE)
        ORDER BY created_at DESC
        LIMIT :lim
        """,
        nativeQuery = true
    )
    fun searchRelevant(
        @Param("roomId") roomId: String,
        @Param("keyword") keyword: String,
        @Param("before") before: LocalDateTime,
        @Param("lim") limit: Int
    ): List<ChatMessageEntity>

    /** D+7 archive 대상: live 상태이면서 N일 이전 메시지 */
    fun findByAttachmentStateAndCreatedAtBefore(
        attachmentState: String,
        createdAtBefore: LocalDateTime
    ): List<ChatMessageEntity>
}

@Repository
interface ChatUserMuteRepository : JpaRepository<ChatUserMuteEntity, String> {
    fun findByRoomIdAndUserId(roomId: String, userId: String): ChatUserMuteEntity?
    fun findByRoomId(roomId: String): List<ChatUserMuteEntity>
}

@Repository
interface ChatAttachmentArchiveRepository : JpaRepository<ChatAttachmentArchiveEntity, String> {
    fun findByRoomIdOrderByPeriodStartDesc(roomId: String): List<ChatAttachmentArchiveEntity>
    fun findByRoomIdAndPeriodStart(roomId: String, periodStart: java.time.LocalDate): ChatAttachmentArchiveEntity?
    fun findByExpiresAtBeforeAndStatus(expiresAtBefore: LocalDateTime, status: String): List<ChatAttachmentArchiveEntity>
}

@Repository
interface ChatEmoticonRepository : JpaRepository<ChatEmoticonEntity, String> {
    fun findByStatusOrderBySortOrderAscCreatedAtAsc(status: String): List<ChatEmoticonEntity>
}

@Repository
interface ChatMessageLikeRepository : JpaRepository<ChatMessageLikeEntity, String> {
    fun findByMessageIdOrderByCreatedAtAsc(messageId: String): List<ChatMessageLikeEntity>
    fun findByMessageIdAndUserId(messageId: String, userId: String): ChatMessageLikeEntity?

    @Query("SELECT l.messageId AS messageId, COUNT(l) AS cnt FROM ChatMessageLikeEntity l WHERE l.messageId IN :ids GROUP BY l.messageId")
    fun countByMessageIds(@Param("ids") ids: Collection<String>): List<Array<Any>>

    @Query("SELECT l.messageId FROM ChatMessageLikeEntity l WHERE l.messageId IN :ids AND l.userId = :userId")
    fun findLikedMessageIdsByUser(@Param("ids") ids: Collection<String>, @Param("userId") userId: String): List<String>
}
