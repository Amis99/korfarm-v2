package com.korfarm.api.org

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import org.springframework.http.HttpStatus
import com.korfarm.api.contracts.AdminClassCreateRequest
import com.korfarm.api.contracts.AdminClassStudentsRequest
import com.korfarm.api.contracts.AdminClassUpdateRequest
import com.korfarm.api.contracts.AdminOrgAdminCreateRequest
import com.korfarm.api.contracts.AdminOrgCreateRequest
import com.korfarm.api.contracts.AdminOrgUpdateRequest
import com.korfarm.api.contracts.AdminStudentCreateRequest
import com.korfarm.api.contracts.AdminStudentUpdateRequest
import com.korfarm.api.contracts.AdminSubscriptionRequest
import com.korfarm.api.security.AdminGuard
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/admin")
class OrgController(
    private val orgService: OrgService
) {
    @GetMapping("/orgs")
    fun listOrgs(): ApiResponse<List<AdminOrgView>> {
        // HQ_ADMIN — 전체 기관 / ORG_ADMIN — 자기 기관 1개만 (학생 등록 모달 dropdown 등)
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val isHq = com.korfarm.api.security.SecurityUtils.currentRoles().contains("HQ_ADMIN")
        val all = orgService.listOrgsAdmin()
        val data = if (isHq) all else {
            val uid = com.korfarm.api.security.SecurityUtils.currentUserId()
            val myOrgIds = if (uid != null) {
                orgService.listUserOrgs(uid).map { it.id }.toSet()
            } else emptySet()
            all.filter { it.orgId in myOrgIds }
        }
        return ApiResponse(success = true, data = data)
    }

    @PostMapping("/orgs")
    fun createOrg(@Valid @RequestBody request: AdminOrgCreateRequest): ApiResponse<com.korfarm.api.contracts.AdminOrgCreateResult> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(success = true, data = orgService.createOrg(request))
    }

    /** 학생 일괄 등록 — HQ_ADMIN 또는 본인 기관 ORG_ADMIN. */
    @PostMapping("/students/bulk")
    fun bulkCreateStudents(
        @Valid @RequestBody request: com.korfarm.api.contracts.AdminStudentBulkCreateRequest
    ): ApiResponse<com.korfarm.api.contracts.AdminBulkCreateResult> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        return ApiResponse(success = true, data = orgService.bulkCreateStudents(request))
    }

    /** HQ_ADMIN 회원 통합 조회 — role: STUDENT / PARENT / ORG_ADMIN / HQ_ADMIN. */
    @GetMapping("/members")
    fun listMembers(@RequestParam role: String): ApiResponse<List<AdminMemberView>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val normalized = role.uppercase()
        if (normalized !in listOf("STUDENT", "PARENT", "ORG_ADMIN", "HQ_ADMIN")) {
            throw ApiException(
                "INVALID_ROLE", "role 은 STUDENT/PARENT/ORG_ADMIN/HQ_ADMIN 중 하나여야 합니다",
                HttpStatus.BAD_REQUEST
            )
        }
        return ApiResponse(success = true, data = orgService.listMembersAdmin(normalized))
    }

    // ORG_ADMIN 본인 기관 조회·수정 (사이드바 '기관 설정' 메뉴 용도)
    // HQ_ADMIN 은 기존 /orgs/{orgId} 사용
    @GetMapping("/orgs/me")
    fun getMyOrg(): ApiResponse<AdminOrgView> {
        AdminGuard.requireAnyRole("ORG_ADMIN", "HQ_ADMIN")
        val userId = com.korfarm.api.security.SecurityUtils.currentUserId()
            ?: throw com.korfarm.api.common.ApiException("UNAUTHORIZED", "unauthorized", org.springframework.http.HttpStatus.UNAUTHORIZED)
        val myOrgId = resolveMyOrgId(userId)
        return ApiResponse(success = true, data = orgService.getOrgView(myOrgId))
    }

    @PatchMapping("/orgs/me")
    fun updateMyOrg(@Valid @RequestBody request: AdminOrgUpdateRequest): ApiResponse<AdminOrgView> {
        AdminGuard.requireAnyRole("ORG_ADMIN", "HQ_ADMIN")
        val userId = com.korfarm.api.security.SecurityUtils.currentUserId()
            ?: throw com.korfarm.api.common.ApiException("UNAUTHORIZED", "unauthorized", org.springframework.http.HttpStatus.UNAUTHORIZED)
        val myOrgId = resolveMyOrgId(userId)
        // ORG_ADMIN 은 status / seatLimit 변경 금지 — 무시
        val safe = request.copy(status = null, seatLimit = null, plan = null)
        orgService.updateOrg(myOrgId, safe)
        return ApiResponse(success = true, data = orgService.getOrgView(myOrgId))
    }

    /**
     * /orgs/me 용 본인 기관 식별:
     *  - ORG_ADMIN: callerOrgAdminOrgIds (org_hq 제외) 의 첫 항목
     *  - HQ_ADMIN: 본인 멤버십 첫 기관 (org_hq 포함)
     *  본사+기관 ORG_ADMIN 을 동시에 가진 사용자가 본사 정보를 잡지 않도록.
     */
    private fun resolveMyOrgId(userId: String): String {
        val roles = com.korfarm.api.security.SecurityUtils.currentRoles()
        val pickedOrgId = if (roles.contains("HQ_ADMIN")) {
            orgService.listUserOrgs(userId).firstOrNull()?.id
        } else {
            orgService.callerOrgAdminOrgIds(userId).firstOrNull()
                ?: orgService.listUserOrgs(userId).firstOrNull()?.id  // ORG_ADMIN 인데 org_hq 만 가진 경우
        }
        return pickedOrgId
            ?: throw com.korfarm.api.common.ApiException("NOT_FOUND", "소속 기관을 찾을 수 없습니다", org.springframework.http.HttpStatus.NOT_FOUND)
    }

    @PatchMapping("/orgs/{orgId}")
    fun updateOrg(@PathVariable orgId: String, @Valid @RequestBody request: AdminOrgUpdateRequest): ApiResponse<AdminOrgView> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        orgService.updateOrg(orgId, request)
        return ApiResponse(success = true, data = orgService.getOrgView(orgId))
    }

    @PostMapping("/orgs/{orgId}/deactivate")
    fun deactivate(@PathVariable orgId: String): ApiResponse<Map<String, String>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        orgService.deactivateOrg(orgId)
        return ApiResponse(success = true, data = mapOf("org_id" to orgId))
    }

    @GetMapping("/orgs/{orgId}/admins")
    fun listOrgAdmins(@PathVariable orgId: String): ApiResponse<List<AdminOrgAdminView>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(success = true, data = orgService.listOrgAdmins(orgId))
    }

    @PostMapping("/orgs/{orgId}/admins")
    fun createOrgAdmin(
        @PathVariable orgId: String,
        @Valid @RequestBody request: AdminOrgAdminCreateRequest
    ): ApiResponse<AdminOrgView> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(success = true, data = orgService.createOrgAdmin(orgId, request))
    }

    @PostMapping("/orgs/{orgId}/admins/{userId}/remove")
    fun removeOrgAdmin(
        @PathVariable orgId: String,
        @PathVariable userId: String
    ): ApiResponse<Map<String, String>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        orgService.removeOrgAdmin(orgId, userId)
        return ApiResponse(success = true, data = mapOf("user_id" to userId))
    }

    @PostMapping("/students")
    fun createStudent(@Valid @RequestBody request: AdminStudentCreateRequest): ApiResponse<AdminStudentView> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val user = orgService.createStudent(request)
        return ApiResponse(success = true, data = orgService.getStudentView(user.id))
    }

    @GetMapping("/students")
    fun listStudents(): ApiResponse<List<AdminStudentView>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val roles = com.korfarm.api.security.SecurityUtils.currentRoles()
        val filterOrgId = if (roles.contains("HQ_ADMIN")) {
            null // 본사관리자: 전체 학생
        } else {
            // 기관관리자: 자기 기관 소속 학생만 — org_hq 제외 (본사+기관 동시 ORG_ADMIN 케이스 차단)
            val userId = com.korfarm.api.security.SecurityUtils.currentUserId()
            orgService.callerOrgAdminOrgIds(userId!!).firstOrNull()
        }
        return ApiResponse(success = true, data = orgService.listStudentsAdmin(filterOrgId))
    }

    @PatchMapping("/students/{userId}")
    fun updateStudent(
        @PathVariable userId: String,
        @Valid @RequestBody request: AdminStudentUpdateRequest
    ): ApiResponse<AdminStudentView> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        orgService.verifyOrgAdminAccessForStudent(userId)
        orgService.updateStudent(userId, request)
        return ApiResponse(success = true, data = orgService.getStudentView(userId))
    }

    @PostMapping("/students/{userId}/disable")
    fun disableStudent(@PathVariable userId: String): ApiResponse<Map<String, String>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        orgService.verifyOrgAdminAccessForStudent(userId)
        val user = orgService.updateStudent(userId, AdminStudentUpdateRequest(status = "inactive"))
        return ApiResponse(success = true, data = mapOf("user_id" to user.id))
    }

    /**
     * 학생 구독 상태 수정.
     * 2026-05-18 — 사용자 정책: HQ_ADMIN 만 가능. ORG_ADMIN 은 임의로 학생 구독을 늘리지 못하게 차단.
     */
    @PostMapping("/students/{userId}/subscription")
    fun updateSubscription(
        @PathVariable userId: String,
        @Valid @RequestBody request: AdminSubscriptionRequest
    ): ApiResponse<AdminStudentView> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        orgService.updateSubscription(userId, request)
        return ApiResponse(success = true, data = orgService.getStudentView(userId))
    }

    @PostMapping("/classes")
    fun createClass(@Valid @RequestBody request: AdminClassCreateRequest): ApiResponse<AdminClassView> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val classEntity = orgService.createClass(request)
        return ApiResponse(success = true, data = orgService.getClassView(classEntity.id))
    }

    @GetMapping("/classes")
    fun listClasses(): ApiResponse<List<AdminClassView>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        return ApiResponse(success = true, data = orgService.listClassesAdmin())
    }

    @PatchMapping("/classes/{classId}")
    fun updateClass(
        @PathVariable classId: String,
        @Valid @RequestBody request: AdminClassUpdateRequest
    ): ApiResponse<AdminClassView> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        orgService.verifyOrgAdminAccessForClass(classId)
        orgService.updateClass(classId, request)
        return ApiResponse(success = true, data = orgService.getClassView(classId))
    }

    @PostMapping("/classes/{classId}/deactivate")
    fun deactivateClass(@PathVariable classId: String): ApiResponse<AdminClassView> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        orgService.verifyOrgAdminAccessForClass(classId)
        orgService.deactivateClass(classId)
        return ApiResponse(success = true, data = orgService.getClassView(classId))
    }

    @GetMapping("/classes/{classId}/students")
    fun listClassStudents(@PathVariable classId: String): ApiResponse<List<AdminStudentView>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        orgService.verifyOrgAdminAccessForClass(classId)
        return ApiResponse(success = true, data = orgService.listClassStudents(classId))
    }

    @PostMapping("/classes/{classId}/students")
    fun addStudents(
        @PathVariable classId: String,
        @Valid @RequestBody request: AdminClassStudentsRequest
    ): ApiResponse<AdminClassView> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        orgService.verifyOrgAdminAccessForClass(classId)
        orgService.addStudentsToClass(classId, request)
        return ApiResponse(success = true, data = orgService.getClassView(classId))
    }

    @PostMapping("/classes/{classId}/students/{userId}/remove")
    fun removeStudentFromClass(
        @PathVariable classId: String,
        @PathVariable userId: String
    ): ApiResponse<AdminClassView> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        orgService.verifyOrgAdminAccessForClass(classId)
        orgService.removeStudentFromClass(classId, userId)
        return ApiResponse(success = true, data = orgService.getClassView(classId))
    }

    /**
     * 학생을 기관에서 탈퇴시키고 본사(ORG_HQ) 소속 무료 회원으로 자동 이전.
     * - 호출자: HQ_ADMIN(모든 기관) / ORG_ADMIN(본인 기관만)
     * - 본사(ORG_HQ) 소속 학생은 호출 시 NO-OP (이미 본사)
     * - 해당 학생의 기존 기관 멤버십 status=inactive, 본사 멤버십 active 신설
     * - 효과: resolveRoles 가 PAID 자동 부여를 안 함 → 무료 학생으로 자동 전환
     */
    @PostMapping("/orgs/{orgId}/students/{userId}/transfer-to-hq")
    fun transferStudentToHq(
        @PathVariable orgId: String,
        @PathVariable userId: String
    ): ApiResponse<Map<String, Any?>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        if (com.korfarm.api.security.SecurityUtils.currentRoles().contains("ORG_ADMIN")) {
            orgService.verifyOrgAdminAccess(orgId)
        }
        val result = orgService.transferStudentToHq(orgId, userId)
        return ApiResponse(success = true, data = result)
    }

    /**
     * 2026-05-18 — 학생을 다른 기관으로 이동 (HQ 전용).
     * body: { "toOrgId": "org_..." }
     */
    @PostMapping("/students/{userId}/transfer")
    fun transferStudent(
        @PathVariable userId: String,
        @RequestBody body: Map<String, String>,
    ): ApiResponse<Map<String, Any?>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val toOrgId = body["toOrgId"]
            ?: throw ApiException("BAD_REQUEST", "toOrgId 가 필요합니다", HttpStatus.BAD_REQUEST)
        val result = orgService.transferStudent(userId, toOrgId)
        return ApiResponse(success = true, data = result)
    }

    @GetMapping("/orgs/available")
    fun listAvailableOrgs(): ApiResponse<List<OrgSummary>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val roles = com.korfarm.api.security.SecurityUtils.currentRoles()
        val userId = com.korfarm.api.security.SecurityUtils.currentUserId()
        return if (roles.contains("HQ_ADMIN")) {
            ApiResponse(success = true, data = orgService.listActiveOrgs())
        } else {
            ApiResponse(success = true, data = orgService.listUserOrgs(userId!!))
        }
    }
}
