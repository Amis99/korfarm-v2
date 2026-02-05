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
    fun listAssignmentsAdmin(): List<AssignmentSummary> {
        return assignmentRepository.findAll().sortedByDescending { it.createdAt }.map { it.toSummary() }
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
