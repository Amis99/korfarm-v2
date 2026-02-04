package com.korfarm.api.org

import com.korfarm.api.common.ApiResponse
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
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/admin")
class OrgController(
    private val orgService: OrgService
) {
    @GetMapping("/orgs")
    fun listOrgs(): ApiResponse<List<AdminOrgView>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(success = true, data = orgService.listOrgsAdmin())
    }

    @PostMapping("/orgs")
    fun createOrg(@Valid @RequestBody request: AdminOrgCreateRequest): ApiResponse<AdminOrgView> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val org = orgService.createOrg(request)
        return ApiResponse(success = true, data = orgService.getOrgView(org.id))
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
        return ApiResponse(success = true, data = orgService.listStudentsAdmin())
    }

    @PatchMapping("/students/{userId}")
    fun updateStudent(
        @PathVariable userId: String,
        @Valid @RequestBody request: AdminStudentUpdateRequest
    ): ApiResponse<AdminStudentView> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        orgService.updateStudent(userId, request)
        return ApiResponse(success = true, data = orgService.getStudentView(userId))
    }

    @PostMapping("/students/{userId}/disable")
    fun disableStudent(@PathVariable userId: String): ApiResponse<Map<String, String>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val user = orgService.updateStudent(userId, AdminStudentUpdateRequest(status = "inactive"))
        return ApiResponse(success = true, data = mapOf("user_id" to user.id))
    }

    @PostMapping("/students/{userId}/subscription")
    fun updateSubscription(
        @PathVariable userId: String,
        @Valid @RequestBody request: AdminSubscriptionRequest
    ): ApiResponse<AdminStudentView> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
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
        orgService.updateClass(classId, request)
        return ApiResponse(success = true, data = orgService.getClassView(classId))
    }

    @PostMapping("/classes/{classId}/deactivate")
    fun deactivateClass(@PathVariable classId: String): ApiResponse<AdminClassView> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        orgService.deactivateClass(classId)
        return ApiResponse(success = true, data = orgService.getClassView(classId))
    }

    @GetMapping("/classes/{classId}/students")
    fun listClassStudents(@PathVariable classId: String): ApiResponse<List<AdminStudentView>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        return ApiResponse(success = true, data = orgService.listClassStudents(classId))
    }

    @PostMapping("/classes/{classId}/students")
    fun addStudents(
        @PathVariable classId: String,
        @Valid @RequestBody request: AdminClassStudentsRequest
    ): ApiResponse<AdminClassView> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        orgService.addStudentsToClass(classId, request)
        return ApiResponse(success = true, data = orgService.getClassView(classId))
    }

    @PostMapping("/classes/{classId}/students/{userId}/remove")
    fun removeStudentFromClass(
        @PathVariable classId: String,
        @PathVariable userId: String
    ): ApiResponse<AdminClassView> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        orgService.removeStudentFromClass(classId, userId)
        return ApiResponse(success = true, data = orgService.getClassView(classId))
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
