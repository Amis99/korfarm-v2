package com.korfarm.api.files

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.contracts.PresignRequest
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.nio.file.StandardCopyOption

@Service
class FileService(
    private val fileRepository: FileRepository,
    @Value("\${app.upload.dir:./uploads}") private val uploadDir: String
) {
    companion object {
        private val ALLOWED_MIME_TYPES = setOf(
            "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
            "application/pdf",
            "audio/mpeg", "audio/wav", "audio/ogg", "audio/webm",
            "video/mp4", "video/webm",
            "text/plain", "text/csv",
            "application/json",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
        private const val MAX_FILE_SIZE: Long = 50 * 1024 * 1024
    }

    private fun uploadPath(): Path {
        val path = Paths.get(uploadDir)
        if (!Files.exists(path)) Files.createDirectories(path)
        return path
    }

    @Transactional
    fun createPresign(userId: String, request: PresignRequest): PresignResponse {
        if (request.mime !in ALLOWED_MIME_TYPES) {
            throw ApiException("INVALID_MIME", "허용되지 않는 파일 형식입니다: ${request.mime}", HttpStatus.BAD_REQUEST)
        }
        if (request.size > MAX_FILE_SIZE) {
            throw ApiException("FILE_TOO_LARGE", "파일 크기가 50MB를 초과합니다", HttpStatus.BAD_REQUEST)
        }
        val fileId = IdGenerator.newId("file")
        val entity = FileEntity(
            id = fileId,
            ownerId = userId,
            purpose = request.purpose,
            url = "/v1/files/$fileId/download",
            mime = request.mime,
            size = request.size,
            status = "ready"
        )
        fileRepository.save(entity)
        return PresignResponse(
            fileId = fileId,
            uploadUrl = "/v1/files/$fileId/upload",
            downloadUrl = "/v1/files/$fileId/download",
            expiresIn = 3600
        )
    }

    @Transactional
    fun uploadFile(fileId: String, userId: String, file: MultipartFile) {
        val entity = fileRepository.findById(fileId).orElseThrow {
            ApiException("NOT_FOUND", "파일을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        if (entity.ownerId != userId) {
            throw ApiException("FORBIDDEN", "권한이 없습니다", HttpStatus.FORBIDDEN)
        }
        if (entity.status == "uploaded") {
            throw ApiException("ALREADY_UPLOADED", "이미 업로드된 파일입니다", HttpStatus.CONFLICT)
        }
        val dest = uploadPath().resolve(fileId)
        Files.copy(file.inputStream, dest, StandardCopyOption.REPLACE_EXISTING)
        entity.status = "uploaded"
        entity.size = file.size
        entity.originalName = file.originalFilename
        fileRepository.save(entity)
    }

    fun getFileForDownload(userId: String?, isAdmin: Boolean, fileId: String): Pair<FileEntity, Path> {
        val entity = fileRepository.findById(fileId).orElseThrow {
            ApiException("NOT_FOUND", "파일을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        // 공개 파일: 이모티콘, 게시판 첨부파일
        val isPublic = entity.purpose in listOf("chat-emoticon", "board_attachment", "board-attachment", "content", "study_plan")
        // 로그인 사용자는 공개 파일 + 본인 파일 접근 가능, 비로그인은 공개 파일만
        if (!isPublic && !isAdmin && userId == null) {
            throw ApiException("UNAUTHORIZED", "로그인이 필요합니다", HttpStatus.UNAUTHORIZED)
        }
        if (!isPublic && !isAdmin && entity.ownerId != userId) {
            throw ApiException("FORBIDDEN", "권한이 없습니다", HttpStatus.FORBIDDEN)
        }
        val filePath = uploadPath().resolve(fileId)
        if (!Files.exists(filePath)) {
            throw ApiException("FILE_NOT_FOUND", "파일이 서버에 존재하지 않습니다", HttpStatus.NOT_FOUND)
        }
        return Pair(entity, filePath)
    }
}

data class PresignResponse(
    val fileId: String,
    val uploadUrl: String,
    val downloadUrl: String,
    val expiresIn: Int
)
