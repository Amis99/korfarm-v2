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
import com.korfarm.api.studyplan.StudyPlanRepository
import com.korfarm.api.studyplan.StudyPlanService
import com.korfarm.api.user.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

/**
 * AgentToolExecutor 의 운영자(본사·기관) AI 비서용 구현체.
 *
 * 1차 8개 함수:
 * - 학습 계획표 5: list_study_plans / get_study_plan_matrix / assign_cell_content / batch_assign_recommendations / recommend_contents_for_competency
 * - 수강반·학생 3: list_students / get_student_detail / list_classes
 *
 * 2차 이후: 콘텐츠 관리·테스트·시즌·문의·결제 등.
 */
@Component
class OperatorAgentToolExecutorImpl(
    private val studyPlanService: StudyPlanService,
    private val studyPlanRepository: StudyPlanRepository,
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
                "assign_cell_content" -> assignCellContent(input)
                "batch_assign_recommendations" -> batchAssignRecommendations(input)
                "recommend_contents_for_competency" -> recommendContents(input)
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

    // ─── 1) 학습 계획표 ───────────────────────────────────

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

    private fun getStudyPlanMatrix(
        input: Map<String, Any?>,
        userId: String,
        role: String,
        orgId: String?,
    ): AgentToolResult {
        val planId = input["plan_id"] as? String
            ?: return AgentToolResult(false, errorCode = "INVALID", errorMessage = "plan_id 누락")
        // ORG_ADMIN 권한 — 본 기관 plan 인지 확인
        if (role == "ORG_ADMIN" && orgId != null) {
            val plan = studyPlanRepository.findById(planId).orElse(null)
                ?: return AgentToolResult(false, errorCode = "NOT_FOUND", errorMessage = "계획표 없음")
            if (plan.orgId != orgId) {
                return AgentToolResult(false, errorCode = "FORBIDDEN", errorMessage = "본 기관 계획표만 조회 가능")
            }
        }
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

    private fun assignCellContent(input: Map<String, Any?>): AgentToolResult {
        val cellId = input["cell_id"] as? String
            ?: return AgentToolResult(false, errorCode = "INVALID", errorMessage = "cell_id 누락")
        val dueAt = input["due_at"] as? String
            ?: return AgentToolResult(false, errorCode = "INVALID", errorMessage = "due_at 누락")
        val cellRefId = input["cell_ref_id"] as? String
        val assignedLabel = input["assigned_label"] as? String

        val req = AssignCellContentRequest(
            cellRefId = cellRefId,
            assignedLabel = assignedLabel,
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

    private fun batchAssignRecommendations(input: Map<String, Any?>): AgentToolResult {
        val planId = input["plan_id"] as? String
            ?: return AgentToolResult(false, errorCode = "INVALID", errorMessage = "plan_id 누락")
        @Suppress("UNCHECKED_CAST")
        val assignments = input["assignments"] as? List<Map<String, Any?>>
            ?: return AgentToolResult(false, errorCode = "INVALID", errorMessage = "assignments 누락")

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

    private fun recommendContents(input: Map<String, Any?>): AgentToolResult {
        val competency = input["competency"] as? String
        val area = input["area"] as? String
        val subArea = input["sub_area"] as? String
        val theme = input["theme"] as? String
        val level = input["level"] as? String
        val limit = (input["limit"] as? Number)?.toInt()?.coerceIn(1, 50) ?: 10

        // 1차 추천 — 분류 코드 매칭. 현재는 area/sub_area/theme 중 가장 좁은 단위로 필터.
        // (역량 기반 추천은 콘텐츠 competency_vector 가 도입된 후 정밀화 예정)
        val pickedCode = theme ?: subArea ?: area
        val candidates = if (pickedCode != null) {
            // content_classifications 에서 해당 코드를 가진 contentId 추출 후 contents 조회
            val classifs = contentClassificationRepository.findAll()
                .filter { it.id.classificationCode == pickedCode }
            val contentIds = classifs.map { it.id.contentId }.toSet()
            if (contentIds.isEmpty()) emptyList()
            else contentRepository.findAllById(contentIds)
                .filter { it.status == "active" && (level == null || it.levelId == level) }
                .take(limit)
        } else if (level != null) {
            contentRepository.findByStatus("active")
                .filter { it.levelId == level }
                .take(limit)
        } else {
            contentRepository.findByStatus("active").take(limit)
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
                ),
                "count" to data.size,
                "contents" to data,
            ),
        )
    }

    // ─── 2) 수강반·학생 ───────────────────────────────────

    private fun listStudents(input: Map<String, Any?>, role: String, orgId: String?): AgentToolResult {
        val classId = input["class_id"] as? String
        val level = input["level"] as? String
        val search = (input["search"] as? String)?.trim()?.takeIf { it.isNotBlank() }

        // ORG_ADMIN 은 본 기관 학생만, HQ_ADMIN 은 전체
        val candidateUserIds: Set<String> = when {
            role == "ORG_ADMIN" && orgId != null -> {
                orgMembershipRepository.findByOrgIdAndStatus(orgId, "active")
                    .filter { it.role == "STUDENT" }
                    .map { it.userId }
                    .toSet()
            }
            classId != null -> {
                classMembershipRepository.findByClassIdAndStatus(classId, "active")
                    .map { it.userId }
                    .toSet()
            }
            else -> userRepository.findAll().map { it.id }.toSet()
        }

        // classId 필터 추가 — ORG_ADMIN 의 본 기관 학생 중 해당 반 소속만
        val finalUserIds = if (classId != null && role == "ORG_ADMIN") {
            val inClass = classMembershipRepository.findByClassIdAndStatus(classId, "active")
                .map { it.userId }.toSet()
            candidateUserIds.intersect(inClass)
        } else {
            candidateUserIds
        }

        val users = userRepository.findAllById(finalUserIds)
            .asSequence()
            .filter { it.status == "active" && it.deletedAt == null }
            .filter { level == null || it.levelId == level }
            .filter { s ->
                if (search == null) true
                else (s.name?.contains(search, ignoreCase = true) == true) ||
                    s.id.contains(search, ignoreCase = true) ||
                    s.email.contains(search, ignoreCase = true)
            }
            .take(100)
            .toList()

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

    private fun getStudentDetail(input: Map<String, Any?>, role: String, orgId: String?): AgentToolResult {
        val userId = input["user_id"] as? String
            ?: return AgentToolResult(false, errorCode = "INVALID", errorMessage = "user_id 누락")
        val user = userRepository.findById(userId).orElse(null)
            ?: return AgentToolResult(false, errorCode = "NOT_FOUND", errorMessage = "학생 없음")

        // ORG_ADMIN 권한 — 본 기관 학생인지 확인
        if (role == "ORG_ADMIN" && orgId != null) {
            val belongsHere = orgMembershipRepository.findByOrgIdAndUserId(orgId, userId) != null
            if (!belongsHere) {
                return AgentToolResult(false, errorCode = "FORBIDDEN", errorMessage = "본 기관 학생만 조회 가능")
            }
        }

        // 소속 기관 / 반
        val orgMemberships = orgMembershipRepository.findByUserIdAndStatus(userId, "active")
        val classMemberships = classMembershipRepository.findByUserIdAndStatus(userId, "active")

        // 역량 요약 — 슬라이딩 윈도우 기반
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

    private fun listClasses(input: Map<String, Any?>, role: String, orgId: String?): AgentToolResult {
        val targetOrgId = if (role == "ORG_ADMIN") orgId else (input["org_id"] as? String)
        val search = (input["search"] as? String)?.trim()?.takeIf { it.isNotBlank() }

        val classes = classRepository.findAll()
            .filter { it.status == "active" }
            .filter { targetOrgId == null || it.orgId == targetOrgId }
            .filter { search == null || it.name.contains(search, ignoreCase = true) }

        val orgsById = orgRepository.findAll().associateBy { it.id }

        val data = classes.map {
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
