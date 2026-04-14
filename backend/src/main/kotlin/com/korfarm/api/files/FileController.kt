package com.korfarm.api.files

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.contracts.PresignRequest
import com.korfarm.api.security.SecurityUtils
import com.korfarm.api.system.FeatureFlagService
import jakarta.validation.Valid
import org.springframework.core.io.Resource
import org.springframework.core.io.UrlResource
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile
import java.nio.file.Files

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

    @PostMapping("/{fileId}/upload")
    fun upload(
        @PathVariable fileId: String,
        @RequestParam("file") file: MultipartFile
    ): ApiResponse<Map<String, String>> {
        featureFlagService.requireNotKilled("ops.kill_switch.uploads")
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        featureFlagService.requireEnabled("feature.uploads", userId)
        fileService.uploadFile(fileId, userId, file)
        return ApiResponse(success = true, data = mapOf("file_id" to fileId, "status" to "uploaded"))
    }

    @GetMapping("/{fileId}/download")
    fun download(@PathVariable fileId: String): ResponseEntity<Resource> {
        // 이모티콘 등 공개 파일은 비인증 허용
        val userId = SecurityUtils.currentUserId()
        val isAdmin = userId != null && SecurityUtils.hasAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val (entity, filePath) = fileService.getFileForDownload(userId, isAdmin, fileId)
        val resource = UrlResource(filePath.toUri())
        val disposition = if (entity.mime.startsWith("image/") || entity.mime == "application/pdf") {
            "inline"
        } else {
            "attachment; filename=\"${entity.id}\""
        }
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(entity.mime))
            .contentLength(Files.size(filePath))
            .header(HttpHeaders.CONTENT_DISPOSITION, disposition)
            .body(resource)
    }
}
