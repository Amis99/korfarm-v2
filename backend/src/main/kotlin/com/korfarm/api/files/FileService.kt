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

        /**
         * MIME 별 매직 넘버 시그니처. 업로드 본문 첫 N 바이트와 비교해 위·변조 방지.
         * 텍스트류·svg(텍스트 기반) 는 시그니처 강제 X.
         */
        private val MIME_SIGNATURES: Map<String, List<ByteArray>> = mapOf(
            "image/jpeg" to listOf(byteArrayOf(0xFF.toByte(), 0xD8.toByte(), 0xFF.toByte())),
            "image/png"  to listOf(byteArrayOf(0x89.toByte(), 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)),
            "image/gif"  to listOf("GIF87a".toByteArray(), "GIF89a".toByteArray()),
            "image/webp" to listOf("RIFF".toByteArray()),  // RIFF....WEBP
            "application/pdf" to listOf("%PDF-".toByteArray()),
            "audio/mpeg" to listOf(byteArrayOf(0xFF.toByte(), 0xFB.toByte()), byteArrayOf(0xFF.toByte(), 0xF3.toByte()), byteArrayOf(0xFF.toByte(), 0xF2.toByte()), "ID3".toByteArray()),
            "audio/wav"  to listOf("RIFF".toByteArray()),
            "audio/ogg"  to listOf("OggS".toByteArray()),
            "audio/webm" to listOf(byteArrayOf(0x1A, 0x45.toByte(), 0xDF.toByte(), 0xA3.toByte())),
            "video/mp4"  to listOf(byteArrayOf(0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70), byteArrayOf(0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70)),  // ....ftyp
            "video/webm" to listOf(byteArrayOf(0x1A, 0x45.toByte(), 0xDF.toByte(), 0xA3.toByte())),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" to listOf(byteArrayOf(0x50, 0x4B, 0x03, 0x04)),  // PK..
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" to listOf(byteArrayOf(0x50, 0x4B, 0x03, 0x04)),
        )

        private fun signatureOk(mime: String, head: ByteArray): Boolean {
            val sigs = MIME_SIGNATURES[mime] ?: return true  // 시그니처 정의 없으면 통과
            return sigs.any { sig ->
                if (head.size < sig.size) return@any false
                var ok = true
                for (i in sig.indices) {
                    if (head[i] != sig[i]) { ok = false; break }
                }
                ok
            }
        }
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

        // 1. 실제 크기 재검증 — presign 시 선언한 size 와 multipart 크기 일치, 절대 상한 미만
        if (file.size <= 0L) {
            throw ApiException("EMPTY_FILE", "파일이 비어 있습니다", HttpStatus.BAD_REQUEST)
        }
        if (file.size > MAX_FILE_SIZE) {
            throw ApiException("FILE_TOO_LARGE", "파일 크기가 50MB를 초과합니다", HttpStatus.BAD_REQUEST)
        }
        // presign 보다 더 큰 파일을 업로드하려는 경우 거부 (5% 여유 허용 — multipart overhead)
        val declaredSize = entity.size
        if (declaredSize > 0 && file.size > declaredSize + (declaredSize / 20).coerceAtLeast(1024)) {
            throw ApiException("SIZE_MISMATCH", "선언한 크기보다 실제 파일이 큽니다", HttpStatus.BAD_REQUEST)
        }

        // 2. multipart 의 contentType 이 presign MIME 와 일치 (브라우저가 multipart 에 자동 부착)
        val multipartMime = file.contentType?.lowercase()?.substringBefore(";")?.trim()
        if (!multipartMime.isNullOrBlank() && multipartMime != entity.mime.lowercase()) {
            throw ApiException("MIME_MISMATCH", "선언한 형식(${entity.mime}) 과 실제(${multipartMime}) 가 다릅니다", HttpStatus.BAD_REQUEST)
        }

        // 3. 매직 넘버 시그니처 검증 — 본문 첫 16바이트만 읽고 다시 stream 재구성
        val head = ByteArray(16)
        val bytes = file.bytes  // <=50MB. spring 이 디스크/메모리로 buffer.
        val headLen = minOf(head.size, bytes.size)
        System.arraycopy(bytes, 0, head, 0, headLen)
        if (!signatureOk(entity.mime, head)) {
            throw ApiException(
                "SIGNATURE_MISMATCH",
                "파일 시그니처가 ${entity.mime} 형식과 일치하지 않습니다",
                HttpStatus.BAD_REQUEST,
            )
        }

        // S3 putObject — bucket=korfarm-uploads, key=fileId
        s3Client.putObject(
            PutObjectRequest.builder()
                .bucket(bucket)
                .key(fileId)
                .contentType(entity.mime)  // 클라이언트 선언 X — entity 의 검증된 MIME 사용
                .contentLength(file.size)
                .build(),
            RequestBody.fromBytes(bytes),
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
     * 권한 분기:
     *  - chat-emoticon: anonymous OK (이모티콘은 공개 자산)
     *  - chat / board_attachment / content / study_plan: 로그인된 사용자 누구나
     *    (룸·게시판 멤버십 세밀 검증은 추후 별도 작업 — 1차로는 익명 차단)
     *  - 그 외(privacy, 학생/학부모 자료, OCR 결과 등): 소유자 + 관리자
     *
     * Pair(FileEntity, InputStream) 반환. 호출자는 stream 을 끝까지 읽고 닫아야 함.
     */
    fun openFileForDownload(userId: String?, isAdmin: Boolean, fileId: String): Pair<FileEntity, InputStream> {
        val entity = fileRepository.findById(fileId).orElseThrow {
            ApiException("NOT_FOUND", "파일을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        val isReallyPublic = entity.purpose == "chat-emoticon"
        val isBroadCommunity = entity.purpose in listOf(
            // 채팅
            "chat", "chat-thumb",
            // 게시판 첨부
            "board_attachment", "board-attachment", "wisdom",
            // 학습 콘텐츠·계획표
            "content", "content_pdf", "study_plan",
            // 시험·프로 PDF (학생이 응시·확인) — test_paper_pdf 는 시험지(학생용 OK).
            // **주의**: 정답·해설 PDF 는 별도 purpose ("test_answer_pdf") 로 저장되며
            //          여기에 포함하면 안 됨 (학생은 TestController 의 검증 엔드포인트만 통과해야 함).
            "test_paper_pdf", "pro_answer_pdf",
            // 교재 학생용 PDF — textbook_answer_pdf 는 의도적 제외 (관리자/별도 검증 통과만)
            "textbook_pdf",
            // 상점 상품 이미지
            "shop-product-image",
        )
        when {
            isReallyPublic -> { /* anonymous OK */ }
            userId == null -> throw ApiException("UNAUTHORIZED", "로그인이 필요합니다", HttpStatus.UNAUTHORIZED)
            isAdmin -> { /* 관리자 OK */ }
            entity.ownerId == userId -> { /* 본인 OK */ }
            isBroadCommunity -> { /* 로그인 사용자 누구나 */ }
            else -> throw ApiException("FORBIDDEN", "권한이 없습니다", HttpStatus.FORBIDDEN)
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
        val isReallyPublic = entity.purpose == "chat-emoticon"
        val isBroadCommunity = entity.purpose in listOf(
            "chat", "chat-thumb",
            "board_attachment", "board-attachment", "wisdom",
            "content", "content_pdf", "study_plan",
            "test_paper_pdf", "pro_answer_pdf",
            "textbook_pdf",
            "shop-product-image",
        )
        when {
            isReallyPublic -> { /* anonymous OK */ }
            userId == null -> throw ApiException("UNAUTHORIZED", "로그인이 필요합니다", HttpStatus.UNAUTHORIZED)
            isAdmin -> { /* 관리자 OK */ }
            entity.ownerId == userId -> { /* 본인 OK */ }
            isBroadCommunity -> { /* 로그인 사용자 누구나 */ }
            else -> throw ApiException("FORBIDDEN", "권한이 없습니다", HttpStatus.FORBIDDEN)
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
