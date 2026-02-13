package com.korfarm.api.assignments

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.contracts.AdminAssignmentCreateRequest
import com.korfarm.api.contracts.AdminAssignmentUpdateRequest
import com.korfarm.api.contracts.AssignmentSubmitRequest
import com.korfarm.api.economy.EconomyService
import com.korfarm.api.economy.SeedCatalogRepository
import com.korfarm.api.learning.SeedRewardPolicy
import com.korfarm.api.org.ClassMembershipRepository
import com.korfarm.api.org.OrgMembershipRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class AssignmentService(
    private val assignmentRepository: AssignmentRepository,
    private val assignmentTargetRepository: AssignmentTargetRepository,
    private val assignmentSubmissionRepository: AssignmentSubmissionRepository,
    private val classMembershipRepository: ClassMembershipRepository,
    private val orgMembershipRepository: OrgMembershipRepository,
    private val objectMapper: ObjectMapper,
    private val economyService: EconomyService,
    private val seedCatalogRepository: SeedCatalogRepository
) {
    @Transactional
    fun createAssignment(orgId: String, createdBy: String, request: AdminAssignmentCreateRequest): AssignmentEntity {
        val payloadJson = objectMapper.writeValueAsString(request.payload)
        val entity = AssignmentEntity(
            id = IdGenerator.newId("as"),
            orgId = orgId,
            assignmentType = request.assignmentType,
            title = request.title,
            payloadJson = payloadJson,
            dueAt = request.dueAt?.let { LocalDateTime.parse(it) },
            status = "open",
            createdBy = createdBy
        )
        assignmentRepository.save(entity)
        request.targets.forEach { target ->
            val targetType = target["target_type"]?.toString() ?: return@forEach
            val targetId = target["target_id"]?.toString() ?: return@forEach
            assignmentTargetRepository.save(
                AssignmentTargetEntity(
                    id = IdGenerator.newId("at"),
                    assignmentId = entity.id,
                    targetType = targetType,
                    targetId = targetId
                )
            )
        }
        return entity
    }

    @Transactional
    fun updateAssignment(assignmentId: String, request: AdminAssignmentUpdateRequest): AssignmentEntity {
        val entity = assignmentRepository.findById(assignmentId).orElseThrow {
            ApiException("NOT_FOUND", "assignment not found", HttpStatus.NOT_FOUND)
        }
        request.title?.let { entity.title = it }
        request.payload?.let { entity.payloadJson = objectMapper.writeValueAsString(it) }
        request.dueAt?.let { entity.dueAt = LocalDateTime.parse(it) }
        request.status?.let { entity.status = it }
        return assignmentRepository.save(entity)
    }

    @Transactional
    fun closeAssignment(assignmentId: String) {
        val entity = assignmentRepository.findById(assignmentId).orElseThrow {
            ApiException("NOT_FOUND", "assignment not found", HttpStatus.NOT_FOUND)
        }
        entity.status = "closed"
        assignmentRepository.save(entity)
    }

    @Transactional(readOnly = true)
    fun listAssignmentsForUser(userId: String): List<AssignmentSummary> {
        val assignmentIds = resolveAssignmentIds(userId)
        if (assignmentIds.isEmpty()) {
            return emptyList()
        }
        return assignmentRepository.findAllById(assignmentIds).map { it.toSummary() }
    }

    @Transactional(readOnly = true)
    fun listAssignmentsAdmin(userId: String): List<AssignmentSummary> {
        val isHqAdmin = com.korfarm.api.security.SecurityUtils.hasAnyRole("HQ_ADMIN")
        if (isHqAdmin) {
            return assignmentRepository.findAll().sortedByDescending { it.createdAt }.map { it.toSummary() }
        }
        val orgId = orgMembershipRepository.findByUserIdAndStatus(userId, "active")
            .firstOrNull()?.orgId ?: return emptyList()
        return assignmentRepository.findByOrgIdOrderByCreatedAtDesc(orgId).map { it.toSummary() }
    }

    @Transactional(readOnly = true)
    fun getAssignmentDetail(assignmentId: String): AssignmentDetail {
        val entity = assignmentRepository.findById(assignmentId).orElseThrow {
            ApiException("NOT_FOUND", "assignment not found", HttpStatus.NOT_FOUND)
        }
        val payload: Map<String, Any> = objectMapper.readValue(entity.payloadJson, object : TypeReference<Map<String, Any>>() {})
        return entity.toDetail(payload)
    }

    @Transactional
    fun submitAssignment(userId: String, assignmentId: String, request: AssignmentSubmitRequest): AssignmentSubmitResponse {
        val existing = assignmentSubmissionRepository.findByAssignmentIdAndUserId(assignmentId, userId)
        if (existing != null) {
            // 재제출: 씨앗 보상 없음
            existing.contentJson = objectMapper.writeValueAsString(request.content)
            existing.status = "submitted"
            existing.submittedAt = LocalDateTime.now()
            assignmentSubmissionRepository.save(existing)
            return AssignmentSubmitResponse(submissionId = existing.id, seedGrant = null)
        }
        // 첫 제출: 씨앗 보상 지급
        val submission = AssignmentSubmissionEntity(
            id = IdGenerator.newId("asub"),
            assignmentId = assignmentId,
            userId = userId,
            status = "submitted",
            submittedAt = LocalDateTime.now(),
            contentJson = objectMapper.writeValueAsString(request.content)
        )
        assignmentSubmissionRepository.save(submission)

        // 랜덤 씨앗 보상 (5종 중 가중치 기반)
        val catalog = seedCatalogRepository.findAll()
        val seedType = SeedRewardPolicy.randomSeedType(catalog)
        val seedCount = 2 // 과제 완료 기본 씨앗 보상

        economyService.addSeeds(
            userId = userId,
            seedType = seedType,
            count = seedCount,
            reason = "assignment_submit",
            refType = "assignment",
            refId = assignmentId
        )

        return AssignmentSubmitResponse(
            submissionId = submission.id,
            seedGrant = SeedGrant(seedType = seedType, count = seedCount)
        )
    }

    @Transactional(readOnly = true)
    fun progress(userId: String, assignmentId: String): AssignmentProgress {
        val submission = assignmentSubmissionRepository.findByAssignmentIdAndUserId(assignmentId, userId)
        val completed = submission != null && submission.status == "submitted"
        val progressRate = if (completed) 1.0 else 0.0
        return AssignmentProgress(completed = completed, progressRate = progressRate)
    }

    /**
     * 과제 현황 통계 집계
     * HQ_ADMIN: 전체 과제, ORG_ADMIN: 자기 기관 과제만
     */
    @Transactional(readOnly = true)
    fun getOverview(userId: String): Map<String, Any> {
        val now = LocalDateTime.now()

        // ORG_ADMIN이면 자기 기관 orgId 조회, HQ_ADMIN이면 null (전체)
        val isHqAdmin = com.korfarm.api.security.SecurityUtils.hasAnyRole("HQ_ADMIN")
        val orgId: String? = if (isHqAdmin) {
            null
        } else {
            orgMembershipRepository.findByUserIdAndStatus(userId, "active")
                .firstOrNull()?.orgId
        }

        // 통계 집계
        val total: Long
        val completed: Long
        val pending: Long
        val overdue: Long
        val recentAssignments: List<AssignmentSummary>

        if (orgId != null) {
            // ORG_ADMIN: 자기 기관 과제만
            total = assignmentRepository.countByOrgIdAndStatus(orgId, "open") +
                    assignmentRepository.countByOrgIdAndStatus(orgId, "closed")
            completed = assignmentRepository.countByOrgIdAndStatus(orgId, "closed")
            overdue = assignmentRepository.countByOrgIdAndStatusAndDueAtBefore(orgId, "open", now)
            pending = assignmentRepository.countByOrgIdAndStatus(orgId, "open") - overdue
            recentAssignments = assignmentRepository.findByOrgIdOrderByCreatedAtDesc(orgId)
                .take(5)
                .map { it.toSummary() }
        } else {
            // HQ_ADMIN: 전체 과제
            total = assignmentRepository.count()
            completed = assignmentRepository.countByStatus("closed")
            overdue = assignmentRepository.countByStatusAndDueAtBefore("open", now)
            pending = assignmentRepository.countByStatus("open") - overdue
            recentAssignments = assignmentRepository.findAll()
                .sortedByDescending { it.createdAt }
                .take(5)
                .map { it.toSummary() }
        }

        return mapOf(
            "total" to total,
            "completed" to completed,
            "pending" to pending,
            "overdue" to overdue,
            "recentAssignments" to recentAssignments
        )
    }

    /**
     * 과제별 제출 현황 조회
     */
    @Transactional(readOnly = true)
    fun getSubmissionStatus(assignmentId: String): Map<String, Any> {
        val targets = assignmentTargetRepository.findByAssignmentId(assignmentId)
        // 대상 학생 수 계산
        var totalStudents = 0L
        for (target in targets) {
            when (target.targetType) {
                "user" -> totalStudents++
                "class" -> totalStudents += classMembershipRepository
                    .findByClassIdAndStatus(target.targetId, "active").size
                "org" -> totalStudents += orgMembershipRepository
                    .countByOrgIdAndStatus(target.targetId, "active")
            }
        }
        val submissions = assignmentSubmissionRepository.findByAssignmentId(assignmentId)
        return mapOf(
            "totalStudents" to totalStudents,
            "submittedCount" to submissions.size,
            "submissions" to submissions.map { sub ->
                mapOf(
                    "userId" to sub.userId,
                    "status" to sub.status,
                    "submittedAt" to sub.submittedAt?.toString()
                )
            }
        )
    }

    private fun resolveAssignmentIds(userId: String): Set<String> {
        val classIds = classMembershipRepository.findByUserIdAndStatus(userId, "active").map { it.classId }
        val orgIds = orgMembershipRepository.findByUserIdAndStatus(userId, "active").map { it.orgId }
        val targets = mutableListOf<AssignmentTargetEntity>()
        targets += assignmentTargetRepository.findByTargetTypeAndTargetId("user", userId)
        classIds.forEach { targets += assignmentTargetRepository.findByTargetTypeAndTargetId("class", it) }
        orgIds.forEach { targets += assignmentTargetRepository.findByTargetTypeAndTargetId("org", it) }
        return targets.map { it.assignmentId }.toSet()
    }
}
