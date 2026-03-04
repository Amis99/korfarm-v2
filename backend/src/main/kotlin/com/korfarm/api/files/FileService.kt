package com.korfarm.api.files

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.contracts.PresignRequest
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class FileService(
    private val fileRepository: FileRepository
) {
    companion object {
        // 허용 MIME 타입
        private val ALLOWED_MIME_TYPES = setOf(
            "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
            "application/pdf",
            "audio/mpeg", "audio/wav", "audio/ogg",
            "video/mp4", "video/webm",
            "text/plain", "text/csv",
            "application/json",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
        // 최대 파일 크기: 50MB
        private const val MAX_FILE_SIZE: Long = 50 * 1024 * 1024
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
        val uploadUrl = "local://uploads/$fileId"
        val downloadUrl = "local://files/$fileId"
        val entity = FileEntity(
            id = fileId,
            ownerId = userId,
            purpose = request.purpose,
            url = downloadUrl,
            mime = request.mime,
            size = request.size,
            status = "ready"
        )
        fileRepository.save(entity)
        return PresignResponse(
            fileId = fileId,
            uploadUrl = uploadUrl,
            downloadUrl = downloadUrl,
            expiresIn = 3600
        )
    }

    @Transactional(readOnly = true)
    fun getDownload(userId: String, isAdmin: Boolean, fileId: String): FileDownloadResponse {
        val entity = fileRepository.findById(fileId).orElseThrow {
            ApiException("NOT_FOUND", "file not found", HttpStatus.NOT_FOUND)
        }
        if (!isAdmin && entity.ownerId != userId) {
            throw ApiException("FORBIDDEN", "not allowed", HttpStatus.FORBIDDEN)
        }
        return FileDownloadResponse(
            fileId = entity.id,
            downloadUrl = entity.url,
            status = entity.status
        )
    }
}

data class PresignResponse(
    val fileId: String,
    val uploadUrl: String,
    val downloadUrl: String,
    val expiresIn: Int
)

data class FileDownloadResponse(
    val fileId: String,
    val downloadUrl: String,
    val status: String
)
