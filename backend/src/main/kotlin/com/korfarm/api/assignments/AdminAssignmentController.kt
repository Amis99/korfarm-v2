package com.korfarm.api.assignments

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.contracts.AdminAssignmentCreateRequest
import com.korfarm.api.contracts.AdminAssignmentUpdateRequest
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.security.SecurityUtils
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/admin/assignments")
class AdminAssignmentController(
    private val assignmentService: AssignmentService
) {
    @PostMapping
    fun create(@Valid @RequestBody request: AdminAssignmentCreateRequest): ApiResponse<Map<String, String>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val orgId = request.targets.firstOrNull { it["target_type"] == "org" }?.get("target_id")?.toString()
            ?: throw ApiException("ORG_REQUIRED", "org target required", HttpStatus.BAD_REQUEST)
        val entity = assignmentService.createAssignment(orgId, userId, request)
        return ApiResponse(success = true, data = mapOf("assignment_id" to entity.id))
    }

    @GetMapping
    fun list(): ApiResponse<List<AssignmentSummary>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val data = assignmentService.listAssignmentsAdmin()
        return ApiResponse(success = true, data = data)
    }

    @PatchMapping("/{assignmentId}")
    fun update(
        @PathVariable assignmentId: String,
        @Valid @RequestBody request: AdminAssignmentUpdateRequest
    ): ApiResponse<Map<String, String>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val entity = assignmentService.updateAssignment(assignmentId, request)
        return ApiResponse(success = true, data = mapOf("assignment_id" to entity.id))
    }

    @PostMapping("/{assignmentId}/close")
    fun close(@PathVariable assignmentId: String): ApiResponse<Map<String, String>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        assignmentService.closeAssignment(assignmentId)
        return ApiResponse(success = true, data = mapOf("assignment_id" to assignmentId))
    }

    @GetMapping("/overview")
    fun overview(): ApiResponse<Map<String, Any>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val data = assignmentService.getOverview(userId)
        return ApiResponse(success = true, data = data)
    }
}
