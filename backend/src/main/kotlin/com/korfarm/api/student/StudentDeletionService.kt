package com.korfarm.api.student

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.SerializationFeature
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.user.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.io.ByteArrayOutputStream
import java.time.LocalDateTime
import java.util.Base64
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

/**
 * 학생 삭제(soft delete + 30일 유예 + 즉시 백업 ZIP) 서비스.
 *
 * 동적 dump 정책: information_schema.columns 에서 컬럼명이 'user_id' 인 모든 테이블을 자동 식별해
 * SELECT * WHERE user_id = ? 결과를 JSON 으로 ZIP 에 묶음. 새 테이블이 추가돼도 자동 백업됨.
 * users 테이블은 id 컬럼으로 별도 dump.
 */
@Service
class StudentDeletionService(
    private val jdbc: JdbcTemplate,
    private val userRepository: UserRepository,
    private val deletionLogRepository: StudentDeletionLogRepository,
    private val objectMapper: ObjectMapper
) {
    private val logger = LoggerFactory.getLogger(StudentDeletionService::class.java)

    /**
     * 백업 ZIP 전용 ObjectMapper (2026-05-18).
     * 일반 ObjectMapper 는 SNAKE_CASE·non-null·timezone 설정이 영향 — 백업은 그것 무관하게 안전 직렬화.
     * - JavaTimeModule 명시 등록 (LocalDateTime 등 안전)
     * - WRITE_DATES_AS_TIMESTAMPS 비활성화 (ISO 문자열)
     * - FAIL_ON_EMPTY_BEANS 비활성화
     */
    private val backupMapper: ObjectMapper = jacksonObjectMapper()
        .registerModule(JavaTimeModule())
        .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
        .disable(SerializationFeature.FAIL_ON_EMPTY_BEANS)

    /** 학생 삭제 + 백업 ZIP 생성. immediate=true 면 즉시 hard delete, 아니면 soft + 30일 후 hard. */
    @Transactional
    fun deleteStudent(
        userId: String,
        actorUserId: String,
        actorEmail: String?,
        reason: String,
        immediate: Boolean
    ): DeletionResult {
        val user = userRepository.findById(userId).orElseThrow {
            ApiException("NOT_FOUND", "학생을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        if (user.deletedAt != null && !immediate) {
            throw ApiException("ALREADY_DELETED", "이미 삭제 처리된 학생입니다", HttpStatus.CONFLICT)
        }

        val backupZip = buildBackupZip(userId)

        val log = StudentDeletionLogEntity(
            id = IdGenerator.newId("sdl"),
            userId = userId,
            deletedUserEmail = user.email,
            deletedUserName = user.name,
            deletedBy = actorUserId,
            deletedByEmail = actorEmail,
            reason = reason,
            immediate = immediate,
            backupSizeBytes = backupZip.size.toLong(),
            createdAt = LocalDateTime.now()
        )

        if (immediate) {
            // 즉시 영구 삭제
            hardDeleteUserData(userId)
            log.hardDeletedAt = LocalDateTime.now()
        } else {
            // soft delete: 30 일 유예
            user.deletedAt = LocalDateTime.now()
            user.deletedBy = actorUserId
            user.deleteReason = reason
            user.status = "deleted"
            userRepository.save(user)
        }
        deletionLogRepository.save(log)

        return DeletionResult(
            zipBytes = backupZip,
            filename = "student_${userId}_${System.currentTimeMillis()}.zip",
            sizeBytes = backupZip.size.toLong()
        )
    }

    /** soft deleted 학생 복원 (30일 이내) */
    @Transactional
    fun restoreStudent(userId: String) {
        val user = userRepository.findById(userId).orElseThrow {
            ApiException("NOT_FOUND", "학생을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        if (user.deletedAt == null) {
            throw ApiException("NOT_DELETED", "삭제 상태가 아닙니다", HttpStatus.CONFLICT)
        }
        user.deletedAt = null
        user.deletedBy = null
        user.deleteReason = null
        user.status = "active"
        userRepository.save(user)
    }

    /** 휴지통 (soft deleted, 아직 hard delete 되지 않은) 목록 */
    @Transactional(readOnly = true)
    fun listTrash(): List<TrashEntry> {
        val users = userRepository.findAll().filter { it.deletedAt != null }
        return users.map { u ->
            val daysLeft = u.deletedAt?.let {
                30 - java.time.Duration.between(it, LocalDateTime.now()).toDays()
            }?.toInt() ?: 0
            TrashEntry(
                userId = u.id,
                email = u.email,
                name = u.name,
                deletedAt = u.deletedAt?.toString(),
                deletedBy = u.deletedBy,
                reason = u.deleteReason,
                daysLeftUntilHardDelete = daysLeft.coerceAtLeast(0)
            )
        }.sortedByDescending { it.deletedAt }
    }

    /** 매일 04:00 — 30 일 지난 soft deleted 학생 hard delete */
    @Scheduled(cron = "0 0 4 * * *")
    @Transactional
    fun cleanupExpiredDeletions() {
        val cutoff = LocalDateTime.now().minusDays(30)
        val expired = userRepository.findAll().filter {
            it.deletedAt != null && it.deletedAt!!.isBefore(cutoff)
        }
        if (expired.isEmpty()) return
        logger.info("scheduler: hard deleting {} expired soft-deleted students", expired.size)
        for (user in expired) {
            try {
                hardDeleteUserData(user.id)
                deletionLogRepository.findByUserIdAndHardDeletedAtIsNull(user.id)?.let { log ->
                    log.hardDeletedAt = LocalDateTime.now()
                    deletionLogRepository.save(log)
                }
            } catch (ex: Exception) {
                logger.error("hard delete failed for user {}", user.id, ex)
            }
        }
    }

    // ────────────────────────────────────────────────
    // 내부 유틸 — 백업 + hard delete
    // ────────────────────────────────────────────────

    /** user_id 컬럼이 있는 모든 테이블 + users 테이블 데이터를 ZIP(JSON) 으로 dump */
    private fun buildBackupZip(userId: String): ByteArray {
        val baos = ByteArrayOutputStream()
        val tablesDumped = mutableListOf<String>()
        ZipOutputStream(baos).use { zip ->
            // 1) users 테이블 (id 컬럼) — 실패해도 백업 자체는 계속 진행
            try {
                val userRows = sanitizeRows(jdbc.queryForList("SELECT * FROM users WHERE id = ?", userId))
                writeJsonEntry(zip, "users.json", userRows)
            } catch (ex: Exception) {
                logger.warn("dump failed for table users: {}", ex.message)
                writeJsonEntry(zip, "users.json", mapOf("error" to (ex.message ?: "dump 실패")))
            }

            // 2) user_id 컬럼이 있는 모든 테이블 자동 dump
            val tables = try { findTablesWithUserId() } catch (ex: Exception) {
                logger.warn("findTablesWithUserId failed: {}", ex.message); emptyList()
            }
            for (table in tables) {
                try {
                    val rows = sanitizeRows(jdbc.queryForList("SELECT * FROM `$table` WHERE user_id = ?", userId))
                    if (rows.isNotEmpty()) {
                        writeJsonEntry(zip, "$table.json", rows)
                        tablesDumped.add(table)
                    }
                } catch (ex: Exception) {
                    logger.warn("dump failed for table {}: {}", table, ex.message)
                }
            }

            // 3) 메타데이터
            val meta = mapOf(
                "userId" to userId,
                "exportedAt" to LocalDateTime.now().toString(),
                "tablesIncluded" to tablesDumped,
                "tablesCandidates" to tables,
            )
            writeJsonEntry(zip, "_meta.json", meta)
        }
        return baos.toByteArray()
    }

    /**
     * 직렬화 안전화: 행 안의 byte[] / Blob / 알 수 없는 타입을 Base64 또는 toString 으로 변환.
     * Jackson 이 처리하지 못하는 타입을 미리 안전한 표현으로 바꿔 ZIP 생성 자체가 실패하지 않게.
     */
    private fun sanitizeRows(rows: List<Map<String, Any?>>): List<Map<String, Any?>> {
        return rows.map { row ->
            row.mapValues { (_, v) ->
                when (v) {
                    null -> null
                    is ByteArray -> "base64:${Base64.getEncoder().encodeToString(v)}"
                    is java.sql.Blob -> try {
                        val bytes = v.getBytes(1, v.length().toInt()); "base64:${Base64.getEncoder().encodeToString(bytes)}"
                    } catch (_: Exception) { "(blob)" }
                    is java.sql.Clob -> try { v.getSubString(1, v.length().toInt()) } catch (_: Exception) { "(clob)" }
                    is java.sql.Timestamp, is java.sql.Date, is java.sql.Time,
                    is java.time.LocalDateTime, is java.time.LocalDate, is java.time.LocalTime,
                    is java.util.Date, is Number, is String, is Boolean -> v
                    else -> v.toString()
                }
            }
        }
    }

    private fun writeJsonEntry(zip: ZipOutputStream, name: String, data: Any) {
        try {
            zip.putNextEntry(ZipEntry(name))
            zip.write(backupMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(data))
            zip.closeEntry()
        } catch (ex: Exception) {
            logger.warn("zip entry write failed for {}: {}", name, ex.message)
            // 이미 putNextEntry 만 호출하고 write 실패한 경우 ZipOutputStream 이 corrupted 될 수 있음 —
            // 가능한 한 fallback 메시지로 닫는다.
            try {
                zip.write("""{"error":"serialization failed: ${ex.message?.replace("\"", "'")}"}""".toByteArray())
                zip.closeEntry()
            } catch (_: Exception) { /* 이미 망가졌으면 다음 entry 에 영향 — caller 가 알 수 있게 로그만 */ }
        }
    }

    /** information_schema 에서 user_id 컬럼이 있는 테이블 목록 (system 테이블 제외) */
    private fun findTablesWithUserId(): List<String> {
        return jdbc.queryForList(
            """
            SELECT table_name
              FROM information_schema.columns
             WHERE table_schema = DATABASE()
               AND column_name = 'user_id'
               AND table_name NOT IN ('flyway_schema_history')
             ORDER BY table_name
            """.trimIndent(),
            String::class.java
        )
    }

    /**
     * 모든 user_id row + users.id 를 참조하는 모든 외래키 row + users row 영구 삭제.
     *
     * 2026-05-18 fix:
     *   - 옛 구현은 user_id 컬럼만 처리해서 duel_rooms.created_by 등 다른 컬럼명이 users 를 참조하는 경우
     *     DELETE FROM users 가 SQLIntegrityConstraintViolation 으로 500 에러.
     *   - information_schema.key_column_usage 에서 users.id 를 참조하는 모든 외래키를 동적 탐색해
     *     각 (테이블, 컬럼) 쌍에 대해 DELETE 시도 후 마지막에 users 본체 삭제.
     */
    private fun hardDeleteUserData(userId: String) {
        // 1) user_id 컬럼이 있는 테이블 (기존 동작 유지)
        val tables = findTablesWithUserId()
        for (table in tables) {
            try {
                jdbc.update("DELETE FROM `$table` WHERE user_id = ?", userId)
            } catch (ex: Exception) {
                logger.warn("delete failed for table {} by user_id: {}", table, ex.message)
            }
        }
        // 2) users.id 를 참조하는 모든 외래키 컬럼 (user_id 가 아닌 컬럼명 포함 — created_by/deleted_by 등)
        val refs = try { findReferencingColumns() } catch (ex: Exception) {
            logger.warn("findReferencingColumns failed: {}", ex.message); emptyList()
        }
        for ((refTable, refColumn) in refs) {
            try {
                jdbc.update("DELETE FROM `$refTable` WHERE `$refColumn` = ?", userId)
            } catch (ex: Exception) {
                logger.warn("delete failed for table {}.{}: {}", refTable, refColumn, ex.message)
            }
        }
        // 3) users 본체
        try {
            jdbc.update("DELETE FROM users WHERE id = ?", userId)
        } catch (ex: Exception) {
            logger.warn("DELETE FROM users WHERE id = {} 실패: {}", userId, ex.message)
            throw ex
        }
    }

    /** information_schema 에서 users.id 를 참조하는 모든 외래키 컬럼 추출. */
    private fun findReferencingColumns(): List<Pair<String, String>> {
        val rows = jdbc.queryForList(
            """
            SELECT table_name, column_name
              FROM information_schema.key_column_usage
             WHERE referenced_table_schema = DATABASE()
               AND referenced_table_name = 'users'
               AND referenced_column_name = 'id'
               AND table_schema = DATABASE()
            """.trimIndent()
        )
        return rows.mapNotNull { row ->
            val t = (row["TABLE_NAME"] ?: row["table_name"]) as? String ?: return@mapNotNull null
            val c = (row["COLUMN_NAME"] ?: row["column_name"]) as? String ?: return@mapNotNull null
            t to c
        }
    }

    data class DeletionResult(
        val zipBytes: ByteArray,
        val filename: String,
        val sizeBytes: Long
    )

    data class TrashEntry(
        val userId: String,
        val email: String,
        val name: String?,
        val deletedAt: String?,
        val deletedBy: String?,
        val reason: String?,
        val daysLeftUntilHardDelete: Int
    )
}
