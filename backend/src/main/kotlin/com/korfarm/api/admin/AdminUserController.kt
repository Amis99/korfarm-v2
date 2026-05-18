package com.korfarm.api.admin

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.org.OrgMembershipRepository
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.user.UserRepository
import org.springframework.http.HttpStatus
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDateTime

/**
 * 통합 회원 정보 수정·삭제 (2026-05-18).
 * 학부모·기관 관리자·본사 관리자 모두 사용 가능.
 * 학생은 별도 학생 수정/삭제 엔드포인트(`/v1/admin/students/...`) 사용 — 학생 deletion 은 백업 ZIP 흐름 보장.
 */
@RestController
@RequestMapping("/v1/admin/users")
class AdminUserController(
    private val userRepository: UserRepository,
    private val orgMembershipRepository: OrgMembershipRepository,
) {
    @PatchMapping("/{userId}")
    @Transactional
    fun updateUser(
        @PathVariable userId: String,
        @RequestBody body: Map<String, String?>
    ): ApiResponse<Map<String, Any?>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val user = userRepository.findById(userId).orElseThrow {
            ApiException("NOT_FOUND", "사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        // 학생은 학생 전용 엔드포인트 사용 권장. 그래도 통합 PATCH 는 허용 (HQ 만).
        body["name"]?.takeIf { it.isNotBlank() }?.let { user.name = it }
        body["phone"]?.let {
            // 학부모는 parentPhone, 다른 사용자는 studentPhone 으로 저장
            val role = orgMembershipRepository.findByUserIdAndStatus(userId, "active")
                .map { it.role }.firstOrNull()
            if (role == "PARENT") user.parentPhone = it.ifBlank { null }
            else user.studentPhone = it.ifBlank { null }
        }
        body["email"]?.takeIf { it.isNotBlank() && it != user.email }?.let { newEmail ->
            val other = userRepository.findByEmail(newEmail)
            if (other != null && other.id != user.id) {
                throw ApiException("DUPLICATE_LOGIN", "이미 사용 중인 아이디입니다", HttpStatus.CONFLICT)
            }
            user.email = newEmail
        }
        body["status"]?.let { user.status = it }
        userRepository.save(user)
        return ApiResponse(success = true, data = mapOf(
            "userId" to user.id,
            "name" to user.name,
            "email" to user.email,
            "phone" to (user.parentPhone ?: user.studentPhone),
            "status" to user.status,
        ))
    }

    /**
     * 사용자 soft delete (학부모·관리자용). HQ_ADMIN 전용.
     * 학생은 백업 ZIP 흐름이 있는 별도 엔드포인트(/v1/admin/students/{userId}/delete) 사용.
     */
    @DeleteMapping("/{userId}")
    @Transactional
    fun deleteUser(@PathVariable userId: String): ApiResponse<Map<String, String>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val user = userRepository.findById(userId).orElseThrow {
            ApiException("NOT_FOUND", "사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        // 학생 차단 — 학생은 백업 ZIP 흐름이 있는 별도 엔드포인트로 안내
        val activeRoles = orgMembershipRepository.findByUserIdAndStatus(userId, "active").map { it.role }.toSet()
        if ("STUDENT" in activeRoles) {
            throw ApiException(
                "USE_STUDENT_DELETE",
                "학생 계정은 학생 삭제 엔드포인트(/v1/admin/students/{userId}/delete)를 사용하세요.",
                HttpStatus.BAD_REQUEST
            )
        }
        user.deletedAt = LocalDateTime.now()
        user.status = "deleted"
        userRepository.save(user)
        // 멤버십 모두 inactive
        orgMembershipRepository.findByUserIdAndStatus(userId, "active").forEach {
            it.status = "inactive"
            orgMembershipRepository.save(it)
        }
        return ApiResponse(success = true, data = mapOf("userId" to userId))
    }
}
