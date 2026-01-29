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
    @Transactional
    fun createPresign(userId: String, request: PresignRequest): PresignResponse {
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
