package com.korfarm.api.notice

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.org.OrgMembershipRepository
import com.korfarm.api.security.SecurityUtils
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class NoticeService(
    private val noticeRepo: NoticeRepository,
    private val readRepo: NoticeReadRepository,
    private val orgMembershipRepo: OrgMembershipRepository,
) {
    /** 학생/학부모/일반 사용자의 본인 org_id (없으면 null). */
    private fun resolveUserOrgId(userId: String): String? {
        return orgMembershipRepo.findByUserIdAndStatus(userId, "active").firstOrNull()?.orgId
    }

    // ─── 일반 사용자용 ─────────────────────────────────────────

    @Transactional(readOnly = true)
    fun listForUser(userId: String): List<NoticeEntity> {
        val orgId = resolveUserOrgId(userId)
        val now = LocalDateTime.now()
        return if (orgId != null) {
            noticeRepo.findActiveForUser(now, orgId)
        } else {
            noticeRepo.findActiveGlobalOnly(now)
        }
    }

    @Transactional(readOnly = true)
    fun unreadCountForUser(userId: String): Long {
        val orgId = resolveUserOrgId(userId)
        val now = LocalDateTime.now()
        return if (orgId != null) {
            readRepo.countUnreadForUser(userId, orgId, now)
        } else {
            readRepo.countUnreadGlobalOnly(userId, now)
        }
    }

    @Transactional
    fun markRead(noticeId: String, userId: String) {
        val notice = noticeRepo.findById(noticeId).orElseThrow {
            ApiException("NOTICE_NOT_FOUND", "공지를 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        if (notice.deletedAt != null) {
            throw ApiException("NOTICE_DELETED", "삭제된 공지입니다", HttpStatus.GONE)
        }
        val key = NoticeReadId(noticeId, userId)
        if (!readRepo.existsById(key)) {
            readRepo.save(NoticeReadEntity(noticeId, userId, LocalDateTime.now()))
        }
    }

    @Transactional(readOnly = true)
    fun isRead(noticeId: String, userId: String): Boolean {
        return readRepo.existsById(NoticeReadId(noticeId, userId))
    }

    // ─── 어드민 (HQ_ADMIN / ORG_ADMIN) ────────────────────────────

    /** HQ_ADMIN 또는 ORG_ADMIN 의 어드민용 공지 목록. */
    @Transactional(readOnly = true)
    fun listForAdmin(callerUserId: String): List<NoticeEntity> {
        val isHq = SecurityUtils.hasAnyRole("HQ_ADMIN")
        return if (isHq) {
            noticeRepo.findByDeletedAtIsNullOrderByPinnedDescCreatedAtDesc()
        } else {
            // ORG_ADMIN: 자기 기관 + GLOBAL
            val orgId = resolveUserOrgId(callerUserId)
                ?: throw ApiException("NO_ORG", "기관 멤버십이 없습니다", HttpStatus.FORBIDDEN)
            noticeRepo.findForOrgAdmin(orgId)
        }
    }

    @Transactional
    fun create(callerUserId: String, scope: String, orgId: String?, title: String, body: String,
               category: String, pinned: Boolean, startsAt: LocalDateTime?, endsAt: LocalDateTime?): NoticeEntity {
        val isHq = SecurityUtils.hasAnyRole("HQ_ADMIN")

        val finalScope: String
        val finalOrgId: String?

        if (isHq) {
            // HQ 는 GLOBAL 또는 ORG (특정 기관 지정) 작성 가능
            if (scope == "GLOBAL") {
                finalScope = "GLOBAL"
                finalOrgId = null
            } else if (scope == "ORG") {
                if (orgId.isNullOrBlank()) {
                    throw ApiException("ORG_ID_REQUIRED", "scope=ORG 일 땐 orgId 필수", HttpStatus.BAD_REQUEST)
                }
                finalScope = "ORG"
                finalOrgId = orgId
            } else {
                throw ApiException("INVALID_SCOPE", "scope 는 GLOBAL 또는 ORG", HttpStatus.BAD_REQUEST)
            }
        } else {
            // ORG_ADMIN: 자기 org 의 ORG 공지만
            val callerOrgId = resolveUserOrgId(callerUserId)
                ?: throw ApiException("NO_ORG", "기관 멤버십이 없습니다", HttpStatus.FORBIDDEN)
            finalScope = "ORG"
            finalOrgId = callerOrgId
        }

        if (title.isBlank()) {
            throw ApiException("TITLE_REQUIRED", "제목 필수", HttpStatus.BAD_REQUEST)
        }
        if (body.isBlank()) {
            throw ApiException("BODY_REQUIRED", "본문 필수", HttpStatus.BAD_REQUEST)
        }

        val notice = NoticeEntity(
            id = IdGenerator.newId("notice"),
            scope = finalScope,
            orgId = finalOrgId,
            title = title,
            body = body,
            category = category.ifBlank { "general" },
            pinned = pinned,
            startsAt = startsAt,
            endsAt = endsAt,
            createdBy = callerUserId,
        )
        return noticeRepo.save(notice)
    }

    @Transactional
    fun update(callerUserId: String, noticeId: String, title: String?, body: String?,
               category: String?, pinned: Boolean?, startsAt: LocalDateTime?, endsAt: LocalDateTime?): NoticeEntity {
        val notice = noticeRepo.findById(noticeId).orElseThrow {
            ApiException("NOTICE_NOT_FOUND", "공지를 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        if (notice.deletedAt != null) {
            throw ApiException("NOTICE_DELETED", "삭제된 공지입니다", HttpStatus.GONE)
        }
        val isHq = SecurityUtils.hasAnyRole("HQ_ADMIN")
        val isOwner = notice.createdBy == callerUserId
        if (!isHq && !isOwner) {
            throw ApiException("FORBIDDEN", "작성자 또는 본사 관리자만 수정 가능", HttpStatus.FORBIDDEN)
        }
        if (title != null) notice.title = title
        if (body != null) notice.body = body
        if (category != null) notice.category = category
        if (pinned != null) notice.pinned = pinned
        if (startsAt != null) notice.startsAt = startsAt
        if (endsAt != null) notice.endsAt = endsAt
        return noticeRepo.save(notice)
    }

    @Transactional
    fun delete(callerUserId: String, noticeId: String) {
        val notice = noticeRepo.findById(noticeId).orElseThrow {
            ApiException("NOTICE_NOT_FOUND", "공지를 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        val isHq = SecurityUtils.hasAnyRole("HQ_ADMIN")
        val isOwner = notice.createdBy == callerUserId
        if (!isHq && !isOwner) {
            throw ApiException("FORBIDDEN", "작성자 또는 본사 관리자만 삭제 가능", HttpStatus.FORBIDDEN)
        }
        notice.deletedAt = LocalDateTime.now()
        noticeRepo.save(notice)
    }
}
