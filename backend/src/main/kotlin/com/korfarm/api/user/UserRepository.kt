package com.korfarm.api.user

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

interface UserRepository : JpaRepository<UserEntity, String> {
    fun findByEmail(email: String): UserEntity?
    fun existsByEmail(email: String): Boolean
    fun countByStatus(status: String): Long
    fun countByCreatedAtAfter(after: LocalDateTime): Long

    @Modifying
    @Transactional
    @Query(
        "update UserEntity u set u.lastLoginAt = :lastLoginAt, u.updatedAt = :updatedAt where u.id = :id"
    )
    fun updateLastLoginAt(
        @Param("id") id: String,
        @Param("lastLoginAt") lastLoginAt: LocalDateTime,
        @Param("updatedAt") updatedAt: LocalDateTime
    ): Int

    // 학부모 매칭용: 이름과 전화번호로 학생 조회
    @Query("SELECT u FROM UserEntity u WHERE u.name = :name AND u.studentPhone = :studentPhone AND u.status = 'active'")
    fun findByNameAndStudentPhone(
        @Param("name") name: String,
        @Param("studentPhone") studentPhone: String
    ): UserEntity?

    // 학부모 매칭용: 이름, 학생 전화번호, 학부모 전화번호로 학생 조회
    @Query("SELECT u FROM UserEntity u WHERE u.name = :name AND u.studentPhone = :studentPhone AND u.parentPhone = :parentPhone AND u.status = 'active'")
    fun findByNameAndStudentPhoneAndParentPhone(
        @Param("name") name: String,
        @Param("studentPhone") studentPhone: String,
        @Param("parentPhone") parentPhone: String
    ): UserEntity?

    // ID 후보군 + 검색어 + 레벨 필터 — AI 비서 list_students 용. 페이징 적용.
    @Query("""
        SELECT u FROM UserEntity u
        WHERE u.status = 'active' AND u.deletedAt IS NULL
          AND u.id IN :ids
          AND (:level IS NULL OR u.levelId = :level)
          AND (:search IS NULL OR LOWER(u.name) LIKE :search OR LOWER(u.id) LIKE :search OR LOWER(u.email) LIKE :search)
        ORDER BY u.name ASC
    """)
    fun findActiveByIdsFiltered(
        @Param("ids") ids: Collection<String>,
        @Param("level") level: String?,
        @Param("search") search: String?,
        pageable: org.springframework.data.domain.Pageable,
    ): List<UserEntity>

    // 본사 권한(전체 검색) 용 — IN 절 없이 검색
    @Query("""
        SELECT u FROM UserEntity u
        WHERE u.status = 'active' AND u.deletedAt IS NULL
          AND (:level IS NULL OR u.levelId = :level)
          AND (:search IS NULL OR LOWER(u.name) LIKE :search OR LOWER(u.id) LIKE :search OR LOWER(u.email) LIKE :search)
        ORDER BY u.name ASC
    """)
    fun findActiveFiltered(
        @Param("level") level: String?,
        @Param("search") search: String?,
        pageable: org.springframework.data.domain.Pageable,
    ): List<UserEntity>
}
