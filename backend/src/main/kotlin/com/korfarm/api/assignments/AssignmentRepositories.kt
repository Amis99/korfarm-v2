package com.korfarm.api.assignments

import org.springframework.data.jpa.repository.JpaRepository

interface AssignmentRepository : JpaRepository<AssignmentEntity, String>

interface AssignmentTargetRepository : JpaRepository<AssignmentTargetEntity, String> {
    fun findByTargetTypeAndTargetId(targetType: String, targetId: String): List<AssignmentTargetEntity>
    fun findByAssignmentId(assignmentId: String): List<AssignmentTargetEntity>
}

interface AssignmentSubmissionRepository : JpaRepository<AssignmentSubmissionEntity, String> {
    fun findByAssignmentIdAndUserId(assignmentId: String, userId: String): AssignmentSubmissionEntity?
    fun findByUserId(userId: String): List<AssignmentSubmissionEntity>
}
