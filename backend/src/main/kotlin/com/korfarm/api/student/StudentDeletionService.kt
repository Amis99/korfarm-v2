package com.korfarm.api.student

import com.fasterxml.jackson.databind.ObjectMapper
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
        ZipOutputStream(baos).use { zip ->
            // 1) users 테이블 (id 컬럼)
            val userRows = jdbc.queryForList("SELECT * FROM users WHERE id = ?", userId)
            writeJsonEntry(zip, "users.json", userRows)

            // 2) user_id 컬럼이 있는 모든 테이블 자동 dump
            val tables = findTablesWithUserId()
            for (table in tables) {
                try {
                    val rows = jdbc.queryForList("SELECT * FROM `$table` WHERE user_id = ?", userId)
                    if (rows.isNotEmpty()) {
                        writeJsonEntry(zip, "$table.json", rows)
                    }
                } catch (ex: Exception) {
                    logger.warn("dump failed for table {}: {}", table, ex.message)
                }
            }

            // 3) 메타데이터
            val meta = mapOf(
                "userId" to userId,
                "exportedAt" to LocalDateTime.now().toString(),
                "tablesIncluded" to tables,
                "userTableRowCount" to userRows.size
            )
            writeJsonEntry(zip, "_meta.json", meta)
        }
        return baos.toByteArray()
    }

    private fun writeJsonEntry(zip: ZipOutputStream, name: String, data: Any) {
        zip.putNextEntry(ZipEntry(name))
        zip.write(objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(data))
        zip.closeEntry()
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

    /** 모든 user_id row + users row 영구 삭제 */
    private fun hardDeleteUserData(userId: String) {
        val tables = findTablesWithUserId()
        for (table in tables) {
            try {
                jdbc.update("DELETE FROM `$table` WHERE user_id = ?", userId)
            } catch (ex: Exception) {
                logger.warn("delete failed for table {}: {}", table, ex.message)
            }
        }
        // users 본체 (FK 잔재 무시 위해 마지막)
        jdbc.update("DELETE FROM users WHERE id = ?", userId)
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
