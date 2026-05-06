package com.korfarm.api.files

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.contracts.PresignRequest
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import software.amazon.awssdk.core.sync.RequestBody
import software.amazon.awssdk.core.sync.ResponseTransformer
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.GetObjectRequest
import software.amazon.awssdk.services.s3.model.HeadObjectRequest
import software.amazon.awssdk.services.s3.model.NoSuchKeyException
import software.amazon.awssdk.services.s3.model.PutObjectRequest
import java.io.ByteArrayInputStream
import java.io.InputStream
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths

/**
 * 파일 저장·조회 서비스 (2026-05-06: EC2 디스크 → S3 마이그레이션).
 *
 * 정책:
 *  - 신규 업로드: S3 (`korfarm-uploads` 버킷, key = fileId)
 *  - 다운로드: 1차 S3 → 미존재 시 EC2 로컬 fallback (마이그레이션 전 기존 파일 보호)
 *  - 마이그레이션 완료 후 EC2 fallback 제거 가능
 */
@Service
class FileService(
    private val fileRepository: FileRepository,
    private val s3Client: S3Client,
    @Value("\${app.upload.dir:./uploads}") private val uploadDir: String,
    @Value("\${app.s3.bucket:korfarm-uploads}") private val bucket: String,
) {
    private val log = LoggerFactory.getLogger(FileService::class.java)

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

    /** 마이그레이션 전 EC2 fallback 다운로드 경로 */
    private fun ec2Path(fileId: String): Path = Paths.get(uploadDir).resolve(fileId)

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
        // S3 putObject — bucket=korfarm-uploads, key=fileId
        s3Client.putObject(
            PutObjectRequest.builder()
                .bucket(bucket)
                .key(fileId)
                .contentType(file.contentType ?: entity.mime)
                .contentLength(file.size)
                .build(),
            RequestBody.fromInputStream(file.inputStream, file.size),
        )
        entity.status = "uploaded"
        entity.size = file.size
        entity.originalName = file.originalFilename
        fileRepository.save(entity)
    }

    /**
     * 서버 내부 생성물(예: HTML→PDF 변환 결과)을 직접 저장. byte[] → S3.
     */
    @Transactional
    fun saveBinary(
        ownerUserId: String,
        purpose: String,
        filename: String,
        mime: String,
        data: ByteArray
    ): String {
        val fileId = IdGenerator.newId("file")
        val entity = FileEntity(
            id = fileId,
            ownerId = ownerUserId,
            purpose = purpose,
            url = "/v1/files/$fileId/download",
            mime = mime,
            size = data.size.toLong(),
            status = "uploaded",
            originalName = filename
        )
        fileRepository.save(entity)
        s3Client.putObject(
            PutObjectRequest.builder()
                .bucket(bucket)
                .key(fileId)
                .contentType(mime)
                .contentLength(data.size.toLong())
                .build(),
            RequestBody.fromBytes(data),
        )
        return fileId
    }

    /**
     * 다운로드용 — 권한 검증 후 S3 stream 반환. S3 미존재 시 EC2 디스크 fallback.
     *
     * Pair(FileEntity, InputStream) 반환. 호출자는 stream 을 끝까지 읽고 닫아야 함.
     */
    fun openFileForDownload(userId: String?, isAdmin: Boolean, fileId: String): Pair<FileEntity, InputStream> {
        val entity = fileRepository.findById(fileId).orElseThrow {
            ApiException("NOT_FOUND", "파일을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        // 공개 파일: 이모티콘, 게시판 첨부파일
        val isPublic = entity.purpose in listOf("chat", "chat-emoticon", "board_attachment", "board-attachment", "content", "study_plan")
        if (!isPublic && !isAdmin && userId == null) {
            throw ApiException("UNAUTHORIZED", "로그인이 필요합니다", HttpStatus.UNAUTHORIZED)
        }
        if (!isPublic && !isAdmin && entity.ownerId != userId) {
            throw ApiException("FORBIDDEN", "권한이 없습니다", HttpStatus.FORBIDDEN)
        }

        // 1차: S3 시도
        try {
            val resp = s3Client.getObject(
                GetObjectRequest.builder().bucket(bucket).key(fileId).build(),
                ResponseTransformer.toBytes(),
            )
            return Pair(entity, ByteArrayInputStream(resp.asByteArray()))
        } catch (_: NoSuchKeyException) {
            log.debug("S3 에 없음, EC2 fallback 시도: {}", fileId)
        } catch (e: Exception) {
            log.warn("S3 조회 실패, EC2 fallback 시도: {} — {}", fileId, e.message)
        }

        // 2차: EC2 로컬 fallback
        val localPath = ec2Path(fileId)
        if (Files.exists(localPath)) {
            return Pair(entity, Files.newInputStream(localPath))
        }

        throw ApiException("FILE_NOT_FOUND", "파일이 존재하지 않습니다", HttpStatus.NOT_FOUND)
    }

    /**
     * @deprecated openFileForDownload 사용. 호환성 위해 임시 유지 — 호출처 제거 후 삭제.
     */
    @Deprecated("openFileForDownload 사용", ReplaceWith("openFileForDownload(userId, isAdmin, fileId)"))
    fun getFileForDownload(userId: String?, isAdmin: Boolean, fileId: String): Pair<FileEntity, Path> {
        val entity = fileRepository.findById(fileId).orElseThrow {
            ApiException("NOT_FOUND", "파일을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        val isPublic = entity.purpose in listOf("chat", "chat-emoticon", "board_attachment", "board-attachment", "content", "study_plan")
        if (!isPublic && !isAdmin && userId == null) {
            throw ApiException("UNAUTHORIZED", "로그인이 필요합니다", HttpStatus.UNAUTHORIZED)
        }
        if (!isPublic && !isAdmin && entity.ownerId != userId) {
            throw ApiException("FORBIDDEN", "권한이 없습니다", HttpStatus.FORBIDDEN)
        }
        val filePath = ec2Path(fileId)
        if (!Files.exists(filePath)) {
            throw ApiException("FILE_NOT_FOUND", "파일이 서버에 존재하지 않습니다 (구식 API). openFileForDownload 사용 필요.", HttpStatus.NOT_FOUND)
        }
        return Pair(entity, filePath)
    }

    /** S3 객체 존재 여부 (마이그레이션 검증용) */
    fun existsInS3(fileId: String): Boolean = try {
        s3Client.headObject(HeadObjectRequest.builder().bucket(bucket).key(fileId).build())
        true
    } catch (_: NoSuchKeyException) {
        false
    } catch (_: Exception) {
        false
    }

    /**
     * 권한 체크 없이 파일 byte[] 조회 — 서버 내부 호출용 (포도 AI 댓글, 글쓰기 OCR 등).
     * 1차 S3 → 2차 EC2 fallback. 둘 다 없으면 null.
     * 호출자 책임: 권한 검증 별도로.
     */
    fun readBytes(fileId: String): ByteArray? {
        // 1차: S3
        try {
            val resp = s3Client.getObject(
                GetObjectRequest.builder().bucket(bucket).key(fileId).build(),
                ResponseTransformer.toBytes(),
            )
            return resp.asByteArray()
        } catch (_: NoSuchKeyException) {
            log.debug("S3 에 없음, EC2 fallback 시도: {}", fileId)
        } catch (e: Exception) {
            log.warn("S3 조회 실패, EC2 fallback 시도: {} — {}", fileId, e.message)
        }
        // 2차: EC2 로컬 fallback
        val localPath = ec2Path(fileId)
        return if (Files.exists(localPath)) Files.readAllBytes(localPath) else null
    }
}

data class PresignResponse(
    val fileId: String,
    val uploadUrl: String,
    val downloadUrl: String,
    val expiresIn: Int
)
