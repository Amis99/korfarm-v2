package com.korfarm.api.assignments

import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDateTime

interface AssignmentRepository : JpaRepository<AssignmentEntity, String> {
    // 상태별 카운트
    fun countByStatus(status: String): Long
    // 기관별 카운트
    fun countByOrgIdAndStatus(orgId: String, status: String): Long
    // 기관별 목록 (최근 순)
    fun findByOrgIdOrderByCreatedAtDesc(orgId: String): List<AssignmentEntity>
    // 마감일 초과 + 특정 상태 카운트 (기한 지난 과제)
    fun countByStatusAndDueAtBefore(status: String, dueAt: LocalDateTime): Long
    fun countByOrgIdAndStatusAndDueAtBefore(orgId: String, status: String, dueAt: LocalDateTime): Long
}

interface AssignmentTargetRepository : JpaRepository<AssignmentTargetEntity, String> {
    fun findByTargetTypeAndTargetId(targetType: String, targetId: String): List<AssignmentTargetEntity>
    fun findByAssignmentId(assignmentId: String): List<AssignmentTargetEntity>
}

interface AssignmentSubmissionRepository : JpaRepository<AssignmentSubmissionEntity, String> {
    fun findByAssignmentIdAndUserId(assignmentId: String, userId: String): AssignmentSubmissionEntity?
    fun findByUserId(userId: String): List<AssignmentSubmissionEntity>
}
