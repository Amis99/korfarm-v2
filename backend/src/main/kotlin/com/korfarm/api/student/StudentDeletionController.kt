package com.korfarm.api.student

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.security.SecurityUtils
import com.korfarm.api.user.UserRepository
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

data class StudentDeleteRequest(
    val reason: String,
    val nameConfirmation: String,
    val immediate: Boolean = false
)

@RestController
@RequestMapping("/v1/admin/students")
class StudentDeletionController(
    private val deletionService: StudentDeletionService,
    private val userRepository: UserRepository
) {
    /**
     * 학생 삭제 — HQ_ADMIN 전용. 응답 본문은 백업 ZIP 바이너리(즉시 다운로드).
     * Body: { reason, nameConfirmation, immediate }
     */
    @PostMapping("/{userId}/delete")
    fun deleteStudent(
        @PathVariable userId: String,
        @RequestBody request: StudentDeleteRequest
    ): ResponseEntity<ByteArray> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val actorId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "관리자 정보 없음", HttpStatus.UNAUTHORIZED)
        val actor = userRepository.findById(actorId).orElse(null)

        // 이름 확인 (실수 방지)
        val target = userRepository.findById(userId).orElseThrow {
            ApiException("NOT_FOUND", "학생을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        val expected = target.name ?: target.email
        if (request.nameConfirmation.trim() != expected.trim()) {
            throw ApiException(
                "NAME_MISMATCH",
                "확인 입력이 학생 이름과 일치하지 않습니다 (예상: $expected)",
                HttpStatus.BAD_REQUEST
            )
        }
        if (request.reason.trim().length < 4) {
            throw ApiException("REASON_REQUIRED", "삭제 사유를 4자 이상 입력하세요", HttpStatus.BAD_REQUEST)
        }

        val result = deletionService.deleteStudent(
            userId = userId,
            actorUserId = actorId,
            actorEmail = actor?.email,
            reason = request.reason.trim(),
            immediate = request.immediate
        )

        val headers = HttpHeaders().apply {
            contentType = MediaType.APPLICATION_OCTET_STREAM
            setContentDispositionFormData("attachment", result.filename)
            contentLength = result.sizeBytes
            add("X-Delete-Mode", if (request.immediate) "immediate" else "soft")
        }
        return ResponseEntity.ok().headers(headers).body(result.zipBytes)
    }

    /** 휴지통 — soft deleted 학생 목록 (HQ_ADMIN) */
    @GetMapping("/trash")
    fun listTrash(): ApiResponse<List<StudentDeletionService.TrashEntry>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(success = true, data = deletionService.listTrash())
    }

    /** 학생 복원 (30 일 이내) (HQ_ADMIN) */
    @PostMapping("/{userId}/restore")
    fun restoreStudent(@PathVariable userId: String): ApiResponse<Map<String, String>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        deletionService.restoreStudent(userId)
        return ApiResponse(success = true, data = mapOf("user_id" to userId))
    }
}
