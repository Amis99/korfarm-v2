package com.korfarm.api.files

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.contracts.PresignRequest
import com.korfarm.api.security.SecurityUtils
import com.korfarm.api.system.FeatureFlagService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/files")
class FileController(
    private val fileService: FileService,
    private val featureFlagService: FeatureFlagService
) {
    @PostMapping("/presign")
    fun presign(@Valid @RequestBody request: PresignRequest): ApiResponse<PresignResponse> {
        featureFlagService.requireNotKilled("ops.kill_switch.uploads")
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        featureFlagService.requireEnabled("feature.uploads", userId)
        val data = fileService.createPresign(userId, request)
        return ApiResponse(success = true, data = data)
    }

    @GetMapping("/{fileId}/download")
    fun download(@PathVariable fileId: String): ApiResponse<FileDownloadResponse> {
        featureFlagService.requireNotKilled("ops.kill_switch.uploads")
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        featureFlagService.requireEnabled("feature.uploads", userId)
        val isAdmin = SecurityUtils.hasAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val data = fileService.getDownload(userId, isAdmin, fileId)
        return ApiResponse(success = true, data = data)
    }
}
