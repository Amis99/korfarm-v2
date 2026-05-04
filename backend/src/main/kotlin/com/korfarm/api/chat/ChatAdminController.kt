package com.korfarm.api.chat

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.security.SecurityUtils
import org.springframework.core.io.Resource
import org.springframework.core.io.UrlResource
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.nio.file.Files
import java.nio.file.Paths

@RestController
@RequestMapping("/v1/admin/chat")
class ChatAdminController(
    private val chatService: ChatService
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
        val path = Paths.get(archive.zipPath)
        if (!Files.exists(path)) {
            throw ApiException("FILE_MISSING", "ZIP 파일을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        val resource = UrlResource(path.toUri())
        val filename = "chat-${archive.roomId}-${archive.periodStart}.zip"
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .contentLength(Files.size(path))
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
