package com.korfarm.api.agent

import com.korfarm.api.classification.ContentClassificationRepository
import com.korfarm.api.common.ApiException
import com.korfarm.api.learning.LearningCompetencyLogRepository
import com.korfarm.api.learning.UserCompetencySummaryRepository
import com.korfarm.api.org.ClassMembershipRepository
import com.korfarm.api.org.ClassRepository
import com.korfarm.api.org.OrgMembershipRepository
import com.korfarm.api.org.OrgRepository
import com.korfarm.api.paid.ContentRepository
import com.korfarm.api.studyplan.AssignCellContentRequest
import com.korfarm.api.studyplan.StudyPlanCellRepository
import com.korfarm.api.studyplan.StudyPlanRepository
import com.korfarm.api.studyplan.StudyPlanService
import com.korfarm.api.user.UserEntity
import com.korfarm.api.user.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.PageRequest
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

/**
 * AgentToolExecutor 의 운영자(본사·기관) AI 비서용 구현체.
 *
 * 1차 8개 함수 — 학습 계획표 5 + 수강반·학생 3.
 *
 * ## 권한 검증 정책
 * - HQ_ADMIN: 모든 데이터 접근 OK
 * - ORG_ADMIN: 본 기관 데이터만. cell/plan/user 의 orgId 가 본인 기관과 일치하는지 검증.
 *   불일치 시 ApiException("FORBIDDEN") 발생 → AgentToolResult 의 errorCode 로 모델에게 전달.
 */
@Component
class OperatorAgentToolExecutorImpl(
    private val studyPlanService: StudyPlanService,
    private val studyPlanRepository: StudyPlanRepository,
    private val studyPlanCellRepository: StudyPlanCellRepository,
    private val orgRepository: OrgRepository,
    private val orgMembershipRepository: OrgMembershipRepository,
    private val classRepository: ClassRepository,
    private val classMembershipRepository: ClassMembershipRepository,
    private val userRepository: UserRepository,
    private val contentRepository: ContentRepository,
    private val contentClassificationRepository: ContentClassificationRepository,
    private val competencyLogRepository: LearningCompetencyLogRepository,
    private val competencySummaryRepository: UserCompetencySummaryRepository,
) : AgentToolExecutor {
    private val log = LoggerFactory.getLogger(OperatorAgentToolExecutorImpl::class.java)

    override fun execute(
        functionName: String,
        input: Map<String, Any?>,
        callerUserId: String,
        callerRole: String,
        callerOrgId: String?,
    ): AgentToolResult {
        return try {
            when (functionName) {
                "list_study_plans" -> listStudyPlans(input, callerUserId)
                "get_study_plan_matrix" -> getStudyPlanMatrix(input, callerUserId, callerRole, callerOrgId)
                "assign_cell_content" -> assignCellContent(input, callerRole, callerOrgId)
                "batch_assign_recommendations" -> batchAssignRecommendations(input, callerRole, callerOrgId)
                "recommend_contents_for_competency" -> recommendContents(input, callerRole, callerOrgId)
                "list_students" -> listStudents(input, callerRole, callerOrgId)
                "get_student_detail" -> getStudentDetail(input, callerRole, callerOrgId)
                "list_classes" -> listClasses(input, callerRole, callerOrgId)
                else -> AgentToolResult(
                    success = false,
                    errorCode = "UNKNOWN_FUNCTION",
                    errorMessage = "구현되지 않은 함수: $functionName",
                )
            }
        } catch (e: ApiException) {
            AgentToolResult(success = false, errorCode = e.code, errorMessage = e.message)
        } catch (e: Exception) {
            log.error("tool 실행 실패 — name={}", functionName, e)
            AgentToolResult(success = false, errorCode = "INTERNAL", errorMessage = e.message)
        }
    }

    // ─── 권한 검증 헬퍼 ───────────────────────────────────

    /**
     * cell 이 호출자(ORG_ADMIN)의 본 기관 plan 의 cell 인지 검증. HQ_ADMIN 은 통과.
     * 검증 실패 시 ApiException("FORBIDDEN").
     */
    private fun verifyCellOwnership(cellId: String, role: String, orgId: String?) {
        if (role == "HQ_ADMIN") return
        if (orgId == null) throw ApiException("FORBIDDEN", "기관 소속 없음", HttpStatus.FORBIDDEN)
        val cell = studyPlanCellRepository.findById(cellId).orElseThrow {
            ApiException("NOT_FOUND", "셀 없음: $cellId", HttpStatus.NOT_FOUND)
        }
        val plan = studyPlanRepository.findById(cell.planId).orElseThrow {
            ApiException("NOT_FOUND", "계획표 없음: ${cell.planId}", HttpStatus.NOT_FOUND)
        }
        if (plan.orgId != orgId) {
            throw ApiException("FORBIDDEN", "본 기관 셀이 아닙니다.", HttpStatus.FORBIDDEN)
        }
    }

    /** plan 권한 검증 — 호출자가 본 기관 plan 인지. */
    private fun verifyPlanOwnership(planId: String, role: String, orgId: String?) {
        if (role == "HQ_ADMIN") return
        if (orgId == null) throw ApiException("FORBIDDEN", "기관 소속 없음", HttpStatus.FORBIDDEN)
        val plan = studyPlanRepository.findById(planId).orElseThrow {
            ApiException("NOT_FOUND", "계획표 없음: $planId", HttpStatus.NOT_FOUND)
        }
        if (plan.orgId != orgId) {
            throw ApiException("FORBIDDEN", "본 기관 계획표가 아닙니다.", HttpStatus.FORBIDDEN)
        }
    }

    /** 학생 user 권한 검증 — ORG_ADMIN 은 본 기관 소속만. */
    private fun verifyStudentOwnership(userId: String, role: String, orgId: String?) {
        if (role == "HQ_ADMIN") return
        if (orgId == null) throw ApiException("FORBIDDEN", "기관 소속 없음", HttpStatus.FORBIDDEN)
        val belongsHere = orgMembershipRepository.findByOrgIdAndUserId(orgId, userId) != null
        if (!belongsHere) {
            throw ApiException("FORBIDDEN", "본 기관 학생이 아닙니다.", HttpStatus.FORBIDDEN)
        }
    }

    // ─── 1) 학습 계획표 ───────────────────────────────────

    @Transactional(readOnly = true)
    private fun listStudyPlans(input: Map<String, Any?>, userId: String): AgentToolResult {
        val status = input["status"] as? String
        val search = input["search"] as? String
        val plans = studyPlanService.listPlans(userId, status, search)
        val data = plans.map {
            mapOf(
                "plan_id" to it.planId,
                "title" to it.title,
                "description" to it.description,
                "exam_scope" to it.examScope,
                "start_date" to it.startDate,
                "end_date" to it.endDate,
                "status" to it.status,
                "target_count" to it.targetCount,
            )
        }
        return AgentToolResult(success = true, data = mapOf("plans" to data, "count" to data.size))
    }

    @Transactional(readOnly = true)
    private fun getStudyPlanMatrix(
        input: Map<String, Any?>,
        userId: String,
        role: String,
        orgId: String?,
    ): AgentToolResult {
        val planId = input["plan_id"] as? String
            ?: return AgentToolResult(false, errorCode = "INVALID", errorMessage = "plan_id 누락")
        verifyPlanOwnership(planId, role, orgId)

        val matrix = studyPlanService.getMatrix(planId, userId, isAdmin = true)
        val data = mapOf(
            "scopes" to matrix.scopes.map { mapOf("id" to it.id, "label" to it.label, "sort_order" to it.sortOrder) },
            "assets" to matrix.assets.map {
                mapOf(
                    "id" to it.id, "asset_type" to it.assetType, "label" to it.label,
                    "asset_kind" to it.assetKind, "ref_id" to it.refId,
                )
            },
            "cells" to matrix.cells.map {
                mapOf(
                    "cell_id" to it.cellId, "scope_id" to it.scopeId, "asset_id" to it.assetId,
                    "user_id" to it.userId, "status" to it.status,
                    "cell_ref_id" to it.cellRefId, "due_at" to it.dueAt,
                    "assigned_label" to it.assignedLabel, "is_overdue" to it.isOverdue,
                )
            },
            "cell_count" to matrix.cells.size,
        )
        return AgentToolResult(success = true, data = data)
    }

    @Transactional
    private fun assignCellContent(
        input: Map<String, Any?>,
        role: String,
        orgId: String?,
    ): AgentToolResult {
        val cellId = input["cell_id"] as? String
            ?: return AgentToolResult(false, errorCode = "INVALID", errorMessage = "cell_id 누락")
        val dueAt = input["due_at"] as? String
            ?: return AgentToolResult(false, errorCode = "INVALID", errorMessage = "due_at 누락")
        verifyCellOwnership(cellId, role, orgId)

        val req = AssignCellContentRequest(
            cellRefId = input["cell_ref_id"] as? String,
            assignedLabel = input["assigned_label"] as? String,
            dueAt = dueAt,
        )
        val cell = studyPlanService.assignCellContent(cellId, req)
        return AgentToolResult(
            success = true,
            data = mapOf(
                "cell_id" to cell.id,
                "status" to cell.status,
                "cell_ref_id" to cell.cellRefId,
                "assigned_label" to cell.assignedLabel,
                "due_at" to cell.dueAt?.toString(),
            ),
        )
    }

    @Transactional
    private fun batchAssignRecommendations(
        input: Map<String, Any?>,
        role: String,
        orgId: String?,
    ): AgentToolResult {
        val planId = input["plan_id"] as? String
            ?: return AgentToolResult(false, errorCode = "INVALID", errorMessage = "plan_id 누락")
        @Suppress("UNCHECKED_CAST")
        val assignments = input["assignments"] as? List<Map<String, Any?>>
            ?: return AgentToolResult(false, errorCode = "INVALID", errorMessage = "assignments 누락")
        verifyPlanOwnership(planId, role, orgId)

        val results = mutableListOf<Map<String, Any?>>()
        var success = 0
        var failed = 0
        for (a in assignments) {
            val cellId = a["cell_id"] as? String
            val cellRefId = a["cell_ref_id"] as? String
            val due = a["due_at"] as? String
            if (cellId == null || due == null) {
                results.add(mapOf("cell_id" to cellId, "ok" to false, "error" to "INVALID"))
                failed++
                continue
            }
            try {
                verifyCellOwnership(cellId, role, orgId)
                studyPlanService.assignCellContent(
                    cellId,
                    AssignCellContentRequest(
                        cellRefId = cellRefId,
                        assignedLabel = a["assigned_label"] as? String,
                        dueAt = due,
                    )
                )
                results.add(mapOf("cell_id" to cellId, "ok" to true))
                success++
            } catch (e: ApiException) {
                results.add(mapOf("cell_id" to cellId, "ok" to false, "error" to e.code))
                failed++
            } catch (e: Exception) {
                results.add(mapOf("cell_id" to cellId, "ok" to false, "error" to "INTERNAL"))
                failed++
            }
        }
        return AgentToolResult(
            success = true,
            data = mapOf(
                "plan_id" to planId,
                "success_count" to success,
                "failed_count" to failed,
                "results" to results,
            ),
        )
    }

    @Transactional(readOnly = true)
    private fun recommendContents(
        input: Map<String, Any?>,
        role: String,
        orgId: String?,
    ): AgentToolResult {
        val competency = input["competency"] as? String
        val area = input["area"] as? String
        val subArea = input["sub_area"] as? String
        val theme = input["theme"] as? String
        val level = input["level"] as? String
        val targetUserId = input["user_id"] as? String
        val limit = (input["limit"] as? Number)?.toInt()?.coerceIn(1, 50) ?: 10

        // 학생 ID 가 지정되었으면 ORG_ADMIN 권한 체크
        if (targetUserId != null) verifyStudentOwnership(targetUserId, role, orgId)

        val pickedCode = theme ?: subArea ?: area
        val candidates = if (pickedCode != null) {
            // 분류 코드에 매핑된 contentId 만 추출 (메모리 폭발 방지)
            val contentIds = contentClassificationRepository.findContentIdsByCode(pickedCode)
            if (contentIds.isEmpty()) emptyList()
            else contentRepository.findAllById(contentIds)
                .filter { it.status == "active" && (level == null || it.levelId == level) }
                .take(limit)
        } else if (level != null) {
            // 레벨만 지정된 경우 — level 기반 검색
            contentRepository.findByContentTypeAndLevelIdAndStatus("DAILY_READING", level, "active")
                .ifEmpty { contentRepository.findByAreaAndLevelIdAndStatus("nonfiction", level, "active") }
                .take(limit)
        } else {
            // 추천 기준이 전혀 없으면 빈 결과 (전체 적재 금지)
            emptyList()
        }

        val data = candidates.map {
            mapOf(
                "content_id" to it.id,
                "title" to it.title,
                "content_type" to it.contentType,
                "level_id" to it.levelId,
                "area" to it.area,
                "sub_area" to it.subArea,
            )
        }
        return AgentToolResult(
            success = true,
            data = mapOf(
                "filter" to mapOf(
                    "competency" to competency, "area" to area,
                    "sub_area" to subArea, "theme" to theme, "level" to level,
                    "user_id" to targetUserId,
                ),
                "count" to data.size,
                "contents" to data,
                "note" to if (pickedCode == null && level == null)
                    "최소 한 가지 필터(theme/sub_area/area/level/competency)가 필요합니다."
                else null,
            ),
        )
    }

    // ─── 2) 수강반·학생 ───────────────────────────────────

    @Transactional(readOnly = true)
    private fun listStudents(input: Map<String, Any?>, role: String, orgId: String?): AgentToolResult {
        val classId = input["class_id"] as? String
        val level = input["level"] as? String
        val search = (input["search"] as? String)?.trim()?.takeIf { it.isNotBlank() }
        val searchPattern = search?.let { "%${it.lowercase()}%" }
        val pageable = PageRequest.of(0, 100)

        val users: List<UserEntity> = when {
            // 본 기관 학생만 (ORG_ADMIN)
            role == "ORG_ADMIN" && orgId != null -> {
                val orgUserIds = orgMembershipRepository.findByOrgIdAndStatus(orgId, "active")
                    .filter { it.role == "STUDENT" }
                    .map { it.userId }
                val finalIds = if (classId != null) {
                    val inClass = classMembershipRepository.findByClassIdAndStatus(classId, "active")
                        .map { it.userId }.toSet()
                    orgUserIds.filter { it in inClass }
                } else orgUserIds
                if (finalIds.isEmpty()) emptyList()
                else userRepository.findActiveByIdsFiltered(finalIds, level, searchPattern, pageable)
            }
            // HQ_ADMIN + class_id 지정
            classId != null -> {
                val ids = classMembershipRepository.findByClassIdAndStatus(classId, "active").map { it.userId }
                if (ids.isEmpty()) emptyList()
                else userRepository.findActiveByIdsFiltered(ids, level, searchPattern, pageable)
            }
            // HQ_ADMIN — 전체에서 검색
            else -> userRepository.findActiveFiltered(level, searchPattern, pageable)
        }

        val data = users.map {
            mapOf(
                "user_id" to it.id,
                "name" to it.name,
                "email" to it.email,
                "level_id" to it.levelId,
                "school" to it.school,
                "grade_label" to it.gradeLabel,
            )
        }
        return AgentToolResult(success = true, data = mapOf("students" to data, "count" to data.size))
    }

    @Transactional(readOnly = true)
    private fun getStudentDetail(input: Map<String, Any?>, role: String, orgId: String?): AgentToolResult {
        val userId = input["user_id"] as? String
            ?: return AgentToolResult(false, errorCode = "INVALID", errorMessage = "user_id 누락")
        verifyStudentOwnership(userId, role, orgId)
        val user = userRepository.findById(userId).orElse(null)
            ?: return AgentToolResult(false, errorCode = "NOT_FOUND", errorMessage = "학생 없음")

        val orgMemberships = orgMembershipRepository.findByUserIdAndStatus(userId, "active")
        val classMemberships = classMembershipRepository.findByUserIdAndStatus(userId, "active")

        val summary = competencySummaryRepository.findByUserId(userId)
            .associate {
                it.competency to mapOf(
                    "earned" to it.earnedTotal,
                    "max" to it.maxTotal,
                    "ratio" to it.ratioScore,
                    "sample_count" to it.sampleCount,
                )
            }

        val data = mapOf(
            "user_id" to user.id,
            "name" to user.name,
            "email" to user.email,
            "level_id" to user.levelId,
            "school" to user.school,
            "grade_label" to user.gradeLabel,
            "status" to user.status,
            "orgs" to orgMemberships.map { mapOf("org_id" to it.orgId, "role" to it.role) },
            "classes" to classMemberships.map { mapOf("class_id" to it.classId) },
            "competency_summary" to summary,
            "competency_log_count" to competencyLogRepository.countInWindow(userId),
        )
        return AgentToolResult(success = true, data = data)
    }

    @Transactional(readOnly = true)
    private fun listClasses(input: Map<String, Any?>, role: String, orgId: String?): AgentToolResult {
        val targetOrgId = if (role == "ORG_ADMIN") orgId else (input["org_id"] as? String)
        val search = (input["search"] as? String)?.trim()?.takeIf { it.isNotBlank() }

        // 쿼리 단에서 status + orgId 필터 (findAll 제거)
        val baseClasses = if (targetOrgId != null) {
            classRepository.findByOrgIdAndStatusOrderByNameAsc(targetOrgId, "active")
        } else {
            classRepository.findByStatusOrderByNameAsc("active")
        }
        val classes = baseClasses.filter { search == null || it.name.contains(search, ignoreCase = true) }

        // org 이름은 보여줄 만큼만 일괄 조회 (페이지 결과 내에서만)
        val orgIds = classes.map { it.orgId }.toSet()
        val orgsById = if (orgIds.isEmpty()) emptyMap()
        else orgRepository.findAllById(orgIds).associateBy { it.id }

        val data = classes.take(100).map {
            mapOf(
                "class_id" to it.id,
                "name" to it.name,
                "description" to it.description,
                "org_id" to it.orgId,
                "org_name" to orgsById[it.orgId]?.name,
                "level_id" to it.levelId,
                "grade" to it.grade,
                "member_count" to classMembershipRepository.countByClassIdAndStatus(it.id, "active"),
            )
        }
        return AgentToolResult(success = true, data = mapOf("classes" to data, "count" to data.size))
    }
}
