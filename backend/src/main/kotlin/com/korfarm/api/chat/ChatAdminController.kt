package com.korfarm.api.chat

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.files.FileService
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.security.SecurityUtils
import org.springframework.core.io.InputStreamResource
import org.springframework.core.io.Resource
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/v1/admin/chat")
class ChatAdminController(
    private val chatService: ChatService,
    private val fileService: FileService,
) {
    private fun adminId(): String =
        SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "인증이 필요합니다", HttpStatus.UNAUTHORIZED)

    @GetMapping("/rooms/{roomId}/archives")
    fun listArchives(@PathVariable roomId: String): ApiResponse<List<ArchiveListItem>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(success = true, data = chatService.listArchives(roomId))
    }

    @GetMapping("/archives/{archiveId}/download")
    fun downloadArchive(@PathVariable archiveId: String): ResponseEntity<Resource> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val archive = chatService.getArchiveForDownload(archiveId)
        // archive.zipPath 의미 변경: file path → fileId (S3 마이그레이션 후)
        // 기존 데이터 호환: path 가 "/" 로 시작하면 옛 file path, 아니면 fileId 로 처리.
        val zipPath = archive.zipPath
        val (entity, stream) = try {
            if (zipPath.startsWith("/") || zipPath.startsWith("file:") || zipPath.contains(java.io.File.separator) && !zipPath.startsWith("file_")) {
                // 옛 EC2 디스크 path — fallback. byte[] 로 읽음
                val p = java.nio.file.Paths.get(zipPath)
                if (!java.nio.file.Files.exists(p)) {
                    throw ApiException("FILE_MISSING", "ZIP 파일을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
                }
                Pair(null, java.nio.file.Files.newInputStream(p))
            } else {
                // 새 데이터: fileId
                fileService.openFileForDownload(SecurityUtils.currentUserId(), true, zipPath)
            }
        } catch (e: ApiException) { throw e }
        val resource = InputStreamResource(stream)
        val filename = "chat-${archive.roomId}-${archive.periodStart}.zip"
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .contentLength(entity?.size ?: archive.zipSize)
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"$filename\"")
            .body(resource)
    }

    @GetMapping("/rooms/{roomId}/mutes")
    fun listMutes(@PathVariable roomId: String): ApiResponse<List<MutedUserView>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(success = true, data = chatService.listMutes(roomId))
    }

    @PostMapping("/rooms/{roomId}/mutes")
    fun muteUser(
        @PathVariable roomId: String,
        @RequestBody request: MuteUserRequest
    ): ApiResponse<MutedUserView> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(success = true, data = chatService.muteUser(roomId, adminId(), request))
    }

    @DeleteMapping("/rooms/{roomId}/mutes/{userId}")
    fun unmuteUser(
        @PathVariable roomId: String,
        @PathVariable userId: String
    ): ApiResponse<Map<String, Any>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        chatService.unmuteUser(roomId, userId)
        return ApiResponse(success = true, data = mapOf("userId" to userId, "status" to "unmuted"))
    }

    // ── 이모티콘 관리 (관리자 전용) ──

    @GetMapping("/emoticons")
    fun listEmoticons(): ApiResponse<List<EmoticonView>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(success = true, data = chatService.listEmoticons())
    }

    @PostMapping("/emoticons")
    fun createEmoticon(@RequestBody request: CreateEmoticonRequest): ApiResponse<EmoticonView> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(success = true, data = chatService.createEmoticon(adminId(), request))
    }

    @DeleteMapping("/emoticons/{emoticonId}")
    fun deleteEmoticon(@PathVariable emoticonId: String): ApiResponse<Map<String, Any>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        chatService.deleteEmoticon(emoticonId)
        return ApiResponse(success = true, data = mapOf("emoticonId" to emoticonId, "status" to "deleted"))
    }

    @PatchMapping("/emoticons/{emoticonId}")
    fun updateEmoticon(
        @PathVariable emoticonId: String,
        @RequestBody request: UpdateEmoticonRequest
    ): ApiResponse<EmoticonView> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        return ApiResponse(success = true, data = chatService.updateEmoticon(emoticonId, request))
    }
}
