package com.korfarm.api.admin

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.org.OrgMembershipEntity
import com.korfarm.api.org.OrgMembershipRepository
import com.korfarm.api.user.UserEntity
import com.korfarm.api.user.UserRepository
import org.springframework.http.HttpStatus
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.security.SecureRandom
import java.time.LocalDateTime

/**
 * 본사 관리자(HQ_ADMIN) 계정 관리 (2026-05-18).
 *
 * 저장 방식: users + org_memberships(org_id='org_hq', role='HQ_ADMIN').
 * 신규 추가 시 임시 비밀번호 평문 1회 반환(관리자가 직접 본인에게 전달).
 * 영구 삭제는 "마지막 활성 HQ 1명 보호" 가드 필수.
 */
@Service
class HqAdminService(
    private val userRepository: UserRepository,
    private val orgMembershipRepository: OrgMembershipRepository,
    private val passwordEncoder: PasswordEncoder,
    private val authService: com.korfarm.api.auth.AuthService,
) {
    companion object {
        const val ORG_HQ = "org_hq"
        const val ROLE_HQ = "HQ_ADMIN"
        private val PW_CHARS = ("abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ" + "23456789").toCharArray()
        private val random = SecureRandom()
    }

    data class HqAdminView(
        val userId: String,
        val loginId: String,
        val name: String?,
        val email: String,
        val phone: String?,
        val status: String,
        val createdAt: String?,
    )

    @Transactional(readOnly = true)
    fun list(): List<HqAdminView> {
        val memberships = orgMembershipRepository.findByOrgIdAndRole(ORG_HQ, ROLE_HQ)
        val userIds = memberships.map { it.userId }.toSet()
        val users = userRepository.findAllById(userIds).filter { it.deletedAt == null }
        return users.map { it.toView() }
    }

    @Transactional
    fun create(loginId: String, name: String?, phone: String?): Pair<HqAdminView, String> {
        val cleanedLogin = loginId.trim()
        if (cleanedLogin.isBlank()) {
            throw ApiException("INVALID_LOGIN_ID", "아이디를 입력해 주세요", HttpStatus.BAD_REQUEST)
        }
        // 같은 email(loginId) 의 활성 사용자 있는지 — 우선 활성 사용자 중복 차단
        val existing = userRepository.findByEmail(cleanedLogin)
        if (existing != null && existing.deletedAt == null) {
            throw ApiException("DUPLICATE_LOGIN", "이미 사용 중인 아이디입니다", HttpStatus.CONFLICT)
        }
        val tempPassword = generateTempPassword(12)
        val now = LocalDateTime.now()
        val user = UserEntity(
            id = IdGenerator.newId("u"),
            email = cleanedLogin,
            passwordHash = passwordEncoder.encode(tempPassword),
            name = name?.takeIf { it.isNotBlank() } ?: cleanedLogin,
            status = "active",
            studentPhone = phone,
        )
        userRepository.save(user)
        orgMembershipRepository.save(
            OrgMembershipEntity(
                id = IdGenerator.newId("om"),
                orgId = ORG_HQ,
                userId = user.id,
                role = ROLE_HQ,
                status = "active",
                requestedAt = now,
                approvedAt = now,
            )
        )
        return user.toView() to tempPassword
    }

    @Transactional
    fun update(userId: String, name: String?, phone: String?, email: String?): HqAdminView {
        val user = userRepository.findById(userId).orElseThrow {
            ApiException("NOT_FOUND", "사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        requireHqMembership(userId)
        name?.takeIf { it.isNotBlank() }?.let { user.name = it }
        phone?.let { user.studentPhone = it.ifBlank { null } }
        email?.takeIf { it.isNotBlank() && it != user.email }?.let { newEmail ->
            val other = userRepository.findByEmail(newEmail)
            if (other != null && other.id != user.id) {
                throw ApiException("DUPLICATE_LOGIN", "이미 사용 중인 아이디입니다", HttpStatus.CONFLICT)
            }
            user.email = newEmail
        }
        userRepository.save(user)
        return user.toView()
    }

    @Transactional
    fun suspend(userId: String): HqAdminView {
        val user = userRepository.findById(userId).orElseThrow {
            ApiException("NOT_FOUND", "사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        requireHqMembership(userId)
        guardLastActiveHq(userId)
        user.status = "inactive"
        userRepository.save(user)
        // 멤버십도 inactive 처리해 list 에서 제거
        orgMembershipRepository.findByOrgIdAndRole(ORG_HQ, ROLE_HQ)
            .firstOrNull { it.userId == userId }
            ?.let {
                it.status = "inactive"
                orgMembershipRepository.save(it)
            }
        return user.toView()
    }

    @Transactional
    fun delete(userId: String) {
        val user = userRepository.findById(userId).orElseThrow {
            ApiException("NOT_FOUND", "사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        requireHqMembership(userId)
        guardLastActiveHq(userId)
        // soft delete — users.deleted_at + 멤버십 inactive
        user.deletedAt = LocalDateTime.now()
        user.status = "inactive"
        userRepository.save(user)
        orgMembershipRepository.findByOrgIdAndRole(ORG_HQ, ROLE_HQ)
            .firstOrNull { it.userId == userId }
            ?.let {
                it.status = "inactive"
                orgMembershipRepository.save(it)
            }
    }

    /** 임시 비밀번호 재발급 (관리자가 다시 평문 받아 본인에게 전달). */
    @Transactional
    fun resetPassword(userId: String): String {
        val user = userRepository.findById(userId).orElseThrow {
            ApiException("NOT_FOUND", "사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        requireHqMembership(userId)
        val temp = generateTempPassword(12)
        user.passwordHash = passwordEncoder.encode(temp)
        userRepository.save(user)
        // N-33 (2026-05-22) — 본사 관리자도 모든 활성 refresh token revoke
        authService.revokeAllRefreshTokens(userId)
        return temp
    }

    private fun requireHqMembership(userId: String) {
        val ms = orgMembershipRepository.findByOrgIdAndRole(ORG_HQ, ROLE_HQ)
            .firstOrNull { it.userId == userId }
            ?: throw ApiException("NOT_HQ_ADMIN", "본사 관리자가 아닙니다", HttpStatus.BAD_REQUEST)
        if (ms.status != "active") {
            throw ApiException("INACTIVE_HQ_ADMIN", "이미 정지된 본사 관리자입니다", HttpStatus.BAD_REQUEST)
        }
    }

    /** 마지막 활성 HQ_ADMIN 1명 보호 — 자신이 마지막이면 거부. */
    private fun guardLastActiveHq(userId: String) {
        val activeIds = orgMembershipRepository.findByOrgIdAndRole(ORG_HQ, ROLE_HQ)
            .filter { it.status == "active" }
            .map { it.userId }
            .toSet()
        if (activeIds.size <= 1 && userId in activeIds) {
            throw ApiException(
                "LAST_HQ_ADMIN",
                "마지막 활성 본사 관리자는 정지/삭제할 수 없습니다.",
                HttpStatus.CONFLICT
            )
        }
    }

    private fun generateTempPassword(length: Int): String {
        val sb = StringBuilder()
        repeat(length) { sb.append(PW_CHARS[random.nextInt(PW_CHARS.size)]) }
        return sb.toString()
    }

    private fun UserEntity.toView(): HqAdminView = HqAdminView(
        userId = id,
        loginId = email,
        name = name,
        email = email,
        phone = studentPhone,
        status = status,
        createdAt = createdAt.toString(),
    )
}
