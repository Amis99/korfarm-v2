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
