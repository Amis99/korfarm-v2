package com.korfarm.api.notice

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDateTime

interface NoticeRepository : JpaRepository<NoticeEntity, String> {

    /** Active 공지 = soft-deleted 아니고, ends_at 미지정 또는 미래, starts_at 미지정 또는 과거. */
    @Query("""
        SELECT n FROM NoticeEntity n
        WHERE n.deletedAt IS NULL
          AND (n.endsAt IS NULL OR n.endsAt > :now)
          AND (n.startsAt IS NULL OR n.startsAt <= :now)
          AND (
              n.scope = 'GLOBAL'
              OR (n.scope = 'ORG' AND n.orgId = :orgId)
          )
        ORDER BY n.pinned DESC, n.createdAt DESC
    """)
    fun findActiveForUser(@Param("now") now: LocalDateTime, @Param("orgId") orgId: String?): List<NoticeEntity>

    /** Active 공지 — orgId 가 NULL 인 경우 (학부모처럼 기관 멤버십 없을 수 있음): GLOBAL 만. */
    @Query("""
        SELECT n FROM NoticeEntity n
        WHERE n.deletedAt IS NULL
          AND n.scope = 'GLOBAL'
          AND (n.endsAt IS NULL OR n.endsAt > :now)
          AND (n.startsAt IS NULL OR n.startsAt <= :now)
        ORDER BY n.pinned DESC, n.createdAt DESC
    """)
    fun findActiveGlobalOnly(@Param("now") now: LocalDateTime): List<NoticeEntity>

    /** HQ_ADMIN 용 — 모든 공지 (deleted 제외). */
    fun findByDeletedAtIsNullOrderByPinnedDescCreatedAtDesc(): List<NoticeEntity>

    /** ORG_ADMIN 용 — 자기 기관 ORG + 모든 GLOBAL (deleted 제외). */
    @Query("""
        SELECT n FROM NoticeEntity n
        WHERE n.deletedAt IS NULL
          AND (n.scope = 'GLOBAL' OR (n.scope = 'ORG' AND n.orgId = :orgId))
        ORDER BY n.pinned DESC, n.createdAt DESC
    """)
    fun findForOrgAdmin(@Param("orgId") orgId: String): List<NoticeEntity>
}

interface NoticeReadRepository : JpaRepository<NoticeReadEntity, NoticeReadId> {

    fun findByUserId(userId: String): List<NoticeReadEntity>

    /** 읽지 않은 공지 수 — DB level join 으로. */
    @Query("""
        SELECT COUNT(n) FROM NoticeEntity n
        WHERE n.deletedAt IS NULL
          AND (n.endsAt IS NULL OR n.endsAt > :now)
          AND (n.startsAt IS NULL OR n.startsAt <= :now)
          AND (
              n.scope = 'GLOBAL'
              OR (n.scope = 'ORG' AND n.orgId = :orgId)
          )
          AND NOT EXISTS (
              SELECT 1 FROM NoticeReadEntity r
              WHERE r.noticeId = n.id AND r.userId = :userId
          )
    """)
    fun countUnreadForUser(
        @Param("userId") userId: String,
        @Param("orgId") orgId: String?,
        @Param("now") now: LocalDateTime,
    ): Long

    @Query("""
        SELECT COUNT(n) FROM NoticeEntity n
        WHERE n.deletedAt IS NULL
          AND n.scope = 'GLOBAL'
          AND (n.endsAt IS NULL OR n.endsAt > :now)
          AND (n.startsAt IS NULL OR n.startsAt <= :now)
          AND NOT EXISTS (
              SELECT 1 FROM NoticeReadEntity r
              WHERE r.noticeId = n.id AND r.userId = :userId
          )
    """)
    fun countUnreadGlobalOnly(
        @Param("userId") userId: String,
        @Param("now") now: LocalDateTime,
    ): Long
}
