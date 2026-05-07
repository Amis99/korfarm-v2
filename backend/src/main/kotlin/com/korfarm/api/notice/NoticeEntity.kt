package com.korfarm.api.notice

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.IdClass
import jakarta.persistence.PrePersist
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import java.io.Serializable
import java.time.LocalDateTime

/**
 * 공지사항.
 * - scope='GLOBAL' (HQ_ADMIN 작성, 전체 회원 대상) 시 org_id = NULL
 * - scope='ORG' (ORG_ADMIN 작성, 그 기관 학생 대상) 시 org_id NOT NULL
 */
@Entity
@Table(name = "notices")
class NoticeEntity(
    @Id
    var id: String,

    @Column(nullable = false, length = 16)
    var scope: String,

    @Column(name = "org_id", length = 64)
    var orgId: String? = null,

    @Column(nullable = false)
    var title: String,

    @Column(nullable = false, columnDefinition = "TEXT")
    var body: String,

    @Column(nullable = false, length = 32)
    var category: String = "general",

    @Column(nullable = false)
    var pinned: Boolean = false,

    @Column(name = "starts_at")
    var startsAt: LocalDateTime? = null,

    @Column(name = "ends_at")
    var endsAt: LocalDateTime? = null,

    @Column(name = "created_by", nullable = false)
    var createdBy: String,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "deleted_at")
    var deletedAt: LocalDateTime? = null,
) {
    @PrePersist
    fun onCreate() {
        val now = LocalDateTime.now()
        createdAt = now
        updatedAt = now
    }

    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }
}

/** 공지 읽음 처리 (composite PK). */
@Entity
@Table(name = "notice_reads")
@IdClass(NoticeReadId::class)
class NoticeReadEntity(
    @Id
    @Column(name = "notice_id", nullable = false)
    var noticeId: String = "",

    @Id
    @Column(name = "user_id", nullable = false)
    var userId: String = "",

    @Column(name = "read_at", nullable = false)
    var readAt: LocalDateTime = LocalDateTime.now(),
)

data class NoticeReadId(
    var noticeId: String = "",
    var userId: String = "",
) : Serializable
