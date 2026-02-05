package com.korfarm.api.assignments

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.contracts.AssignmentSubmitRequest
import com.korfarm.api.security.SecurityUtils
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/assignments")
class AssignmentController(
    private val assignmentService: AssignmentService
) {
    @GetMapping
    fun list(): ApiResponse<List<AssignmentSummary>> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        return ApiResponse(success = true, data = assignmentService.listAssignmentsForUser(userId))
    }

    @GetMapping("/{assignmentId}")
    fun detail(@PathVariable assignmentId: String): ApiResponse<AssignmentDetail> {
        return ApiResponse(success = true, data = assignmentService.getAssignmentDetail(assignmentId))
    }

    @PostMapping("/{assignmentId}/submit")
    fun submit(
        @PathVariable assignmentId: String,
        @Valid @RequestBody request: AssignmentSubmitRequest
    ): ApiResponse<AssignmentSubmitResponse> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val response = assignmentService.submitAssignment(userId, assignmentId, request)
        return ApiResponse(success = true, data = response)
    }

    @GetMapping("/{assignmentId}/progress")
    fun progress(@PathVariable assignmentId: String): ApiResponse<AssignmentProgress> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        return ApiResponse(success = true, data = assignmentService.progress(userId, assignmentId))
    }
}
