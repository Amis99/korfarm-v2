package com.korfarm.api.agent

import com.korfarm.api.board.PostRepository
import com.korfarm.api.board.ReportRepository
import com.korfarm.api.classification.ContentClassificationRepository
import com.korfarm.api.common.ApiException
import com.korfarm.api.duel.AiPlayerService
import com.korfarm.api.duel.DuelMatchRepository
import com.korfarm.api.grapefruit.GrapefruitTransactionRepository
import com.korfarm.api.learning.LearningCompetencyLogRepository
import com.korfarm.api.learning.RecommendationService
import com.korfarm.api.learning.UserCompetencySummaryRepository
import com.korfarm.api.security.JwtService
import com.korfarm.api.tutor.TutorService
import com.korfarm.api.org.ClassMembershipRepository
import com.korfarm.api.org.ClassRepository
import com.korfarm.api.org.OrgMembershipRepository
import com.korfarm.api.org.OrgRepository
import com.korfarm.api.paid.ContentRepository
import com.korfarm.api.paid.TestPaperRepository
import com.korfarm.api.season.SeasonRepository
import com.korfarm.api.shop.OrderRepository
import com.korfarm.api.studyplan.AssignCellContentRequest
import com.korfarm.api.studyplan.StudyPlanCellRepository
import com.korfarm.api.studyplan.StudyPlanRepository
import com.korfarm.api.studyplan.StudyPlanService
import com.korfarm.api.test.TestService
import com.korfarm.api.user.UserEntity
import com.korfarm.api.user.UserRepository
import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.data.domain.PageRequest
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.time.Duration

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
    private val testService: TestService,
    private val testPaperRepository: TestPaperRepository,
    private val seasonRepository: SeasonRepository,
    private val duelMatchRepository: DuelMatchRepository,
    private val aiPlayerService: AiPlayerService,
    private val orderRepository: OrderRepository,
    private val postRepository: PostRepository,
    private val reportRepository: ReportRepository,
    private val grapefruitTransactionRepository: GrapefruitTransactionRepository,
    private val recommendationService: RecommendationService,
    private val tutorService: TutorService,
    private val jwtService: JwtService,
    private val objectMapper: ObjectMapper,
    @Value("\${server.self-base-url:http://localhost:8080}") private val selfBaseUrl: String,
) : AgentToolExecutor {
    private val log = LoggerFactory.getLogger(OperatorAgentToolExecutorImpl::class.java)
    private val httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build()

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
                "search_contents" -> searchContents(input)
                "get_content_detail" -> getContentDetail(input)
                "list_own_contents" -> listOwnContents(input)
                "list_tests" -> listTests(input, callerUserId)
                "list_diagnostic_tests" -> listDiagnosticTests(callerUserId)
                "get_test_statistics" -> getTestStatistics(input)
                "list_pending_grading" -> listPendingGrading(input, callerRole, callerOrgId)
                "list_seasons" -> listSeasons()
                "list_recent_duels" -> listRecentDuels(input)
                "list_shop_orders" -> listShopOrders(input)
                "list_ai_players" -> listAiPlayers()
                "list_inquiries" -> listInquiries(input)
                "list_reports" -> listReports()
                "list_orgs" -> listOrgs(input)
                "get_org_billing_status" -> getOrgBillingStatus(input)
                "list_grapefruit_transactions" -> listGrapefruitTransactions(input, callerRole, callerOrgId)
                "recommend_for_student_via_tutor" -> recommendForStudentViaTutor(input, callerRole, callerOrgId)
                "list_learning_candidates" -> listLearningCandidates(input, callerUserId)
                "admin_request" -> adminRequest(input, callerUserId, callerRole)
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

    // ─── 만능 admin_request — self HTTP call ───────────────────────────

    private fun adminRequest(input: Map<String, Any?>, callerUserId: String, callerRole: String): AgentToolResult {
        val method = (input["method"] as? String)?.uppercase()
            ?: return AgentToolResult(false, errorCode = "BAD_INPUT", errorMessage = "method 필요")
        val path = input["path"] as? String
            ?: return AgentToolResult(false, errorCode = "BAD_INPUT", errorMessage = "path 필요")
        if (!path.startsWith("/v1/")) {
            return AgentToolResult(false, errorCode = "BAD_PATH", errorMessage = "/v1/ 로 시작하는 경로만 허용")
        }
        if (method !in setOf("GET", "POST", "PUT", "PATCH", "DELETE")) {
            return AgentToolResult(false, errorCode = "BAD_METHOD", errorMessage = "허용되지 않는 method")
        }
        // internal token 발급 — 호출자의 userId·role 그대로 (권한 escalation 차단)
        val token = jwtService.createAccessToken(callerUserId, listOf(callerRole))
        val body = input["body"]
        val bodyJson = if (body == null || (body is Map<*, *> && body.isEmpty())) "" else objectMapper.writeValueAsString(body)
        val reqBuilder = HttpRequest.newBuilder()
            .uri(URI.create("$selfBaseUrl$path"))
            .header("Authorization", "Bearer $token")
            .header("Content-Type", "application/json")
            .timeout(Duration.ofSeconds(30))
        when (method) {
            "GET" -> reqBuilder.GET()
            "DELETE" -> reqBuilder.DELETE()
            "POST" -> reqBuilder.POST(HttpRequest.BodyPublishers.ofString(bodyJson))
            "PUT" -> reqBuilder.PUT(HttpRequest.BodyPublishers.ofString(bodyJson))
            "PATCH" -> reqBuilder.method("PATCH", HttpRequest.BodyPublishers.ofString(bodyJson))
        }
        val resp = httpClient.send(reqBuilder.build(), HttpResponse.BodyHandlers.ofString())
        val status = resp.statusCode()
        val parsed: Any? = runCatching {
            if (resp.body().isNullOrBlank()) null
            else objectMapper.readValue(resp.body(), Any::class.java)
        }.getOrElse { resp.body() }
        return if (status in 200..299) {
            AgentToolResult(success = true, data = mapOf("status" to status, "response" to parsed))
        } else {
            AgentToolResult(
                success = false,
                errorCode = "HTTP_$status",
                errorMessage = (parsed as? Map<*, *>)?.get("message")?.toString() ?: "HTTP $status",
                data = mapOf("status" to status, "response" to parsed),
            )
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

        if (targetUserId != null) verifyStudentOwnership(targetUserId, role, orgId)

        // 학생 ID 가 명시되지 않으면 추천이 무의미 → 명시 요구
        if (targetUserId == null) {
            return AgentToolResult(
                success = true,
                data = mapOf(
                    "note" to "user_id 가 필요합니다. 어떤 학생을 위한 추천인지 알려주십시오.",
                    "count" to 0,
                ),
            )
        }

        // RecommendationService 의 3종 추천 — 우선순위: theme → area → competency
        val recommended = when {
            !theme.isNullOrBlank() -> recommendationService.recommendForTheme(targetUserId, theme, level, limit)
            !area.isNullOrBlank() || !subArea.isNullOrBlank() ->
                recommendationService.recommendForArea(targetUserId, area, subArea, level, limit)
            else -> recommendationService.recommendForCompetency(targetUserId, competency, level, limit)
        }

        val data = recommended.map {
            mapOf(
                "content_id" to it.contentId,
                "title" to it.title,
                "content_type" to it.contentType,
                "level_id" to it.levelId,
                "area" to it.area,
                "sub_area" to it.subArea,
                "score" to it.score,
                "reason" to it.reason,
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

    // ─── 3) 콘텐츠 관리 ───────────────────────────────────

    @Transactional(readOnly = true)
    private fun searchContents(input: Map<String, Any?>): AgentToolResult {
        val keyword = (input["keyword"] as? String)?.trim()?.takeIf { it.isNotBlank() }
            ?: return AgentToolResult(false, errorCode = "INVALID", errorMessage = "keyword 누락")
        val contentType = input["content_type"] as? String
        val levelId = input["level_id"] as? String
        val area = input["area"] as? String
        val limit = (input["limit"] as? Number)?.toInt()?.coerceIn(1, 50) ?: 20
        val pageable = PageRequest.of(0, limit)
        val page = contentRepository.searchByKeyword("%$keyword%", contentType, levelId, area, pageable)
        val data = page.content.map {
            mapOf(
                "content_id" to it.id,
                "title" to it.title,
                "content_type" to it.contentType,
                "level_id" to it.levelId,
                "area" to it.area,
                "sub_area" to it.subArea,
                "status" to it.status,
            )
        }
        return AgentToolResult(success = true, data = mapOf("contents" to data, "count" to data.size, "total" to page.totalElements))
    }

    @Transactional(readOnly = true)
    private fun getContentDetail(input: Map<String, Any?>): AgentToolResult {
        val id = input["content_id"] as? String
            ?: return AgentToolResult(false, errorCode = "INVALID", errorMessage = "content_id 누락")
        val c = contentRepository.findById(id).orElse(null)
            ?: return AgentToolResult(false, errorCode = "NOT_FOUND", errorMessage = "콘텐츠 없음")
        val data = mapOf(
            "content_id" to c.id,
            "title" to c.title,
            "content_type" to c.contentType,
            "level_id" to c.levelId,
            "area" to c.area,
            "sub_area" to c.subArea,
            "day_index" to c.dayIndex,
            "module_key" to c.moduleKey,
            "status" to c.status,
            "categories" to c.categories,
        )
        return AgentToolResult(success = true, data = data)
    }

    @Transactional(readOnly = true)
    private fun listOwnContents(input: Map<String, Any?>): AgentToolResult {
        val status = (input["status"] as? String) ?: "pending"
        // OWN 콘텐츠 = visibility='OWN' — content_type 또는 categories 에 'OWN_*' 포함, 또는 status 가 visibility 의 OWN
        // 단순화: status 컬럼이 'pending_review' 인 콘텐츠 조회
        val list = contentRepository.findByStatus(status).take(50)
        val data = list.map {
            mapOf(
                "content_id" to it.id,
                "title" to it.title,
                "content_type" to it.contentType,
                "level_id" to it.levelId,
                "status" to it.status,
            )
        }
        return AgentToolResult(success = true, data = mapOf("contents" to data, "count" to data.size))
    }

    // ─── 4) 테스트 관리 ───────────────────────────────────

    @Transactional(readOnly = true)
    private fun listTests(input: Map<String, Any?>, userId: String): AgentToolResult {
        val levelId = input["level_id"] as? String
        val source = input["source"] as? String
        val tests = testService.listTests(userId, levelId, source)
        val data = tests.map {
            mapOf(
                "test_id" to it.testId,
                "title" to it.title,
                "level_id" to it.levelId,
                "org_id" to it.orgId,
                "total_questions" to it.totalQuestions,
            )
        }
        return AgentToolResult(success = true, data = mapOf("tests" to data, "count" to data.size))
    }

    @Transactional(readOnly = true)
    private fun listDiagnosticTests(userId: String): AgentToolResult {
        val tests = testService.listDiagnosticTests(userId)
        val data = tests.map {
            mapOf(
                "test_id" to it.testId,
                "title" to it.title,
                "level_id" to it.levelId,
                "total_questions" to it.totalQuestions,
            )
        }
        return AgentToolResult(success = true, data = mapOf("tests" to data, "count" to data.size))
    }

    @Transactional(readOnly = true)
    private fun getTestStatistics(input: Map<String, Any?>): AgentToolResult {
        val testId = input["test_id"] as? String
            ?: return AgentToolResult(false, errorCode = "INVALID", errorMessage = "test_id 누락")
        val paper = testPaperRepository.findById(testId).orElse(null)
            ?: return AgentToolResult(false, errorCode = "NOT_FOUND", errorMessage = "시험지 없음")
        return AgentToolResult(
            success = true,
            data = mapOf(
                "test_id" to paper.id,
                "title" to paper.title,
                "status" to paper.status,
                "note" to "상세 통계는 어드민 통계 화면(/admin/tests/{id}/stats)에서 확인하실 수 있습니다.",
            ),
        )
    }

    @Transactional(readOnly = true)
    private fun listPendingGrading(input: Map<String, Any?>, role: String, orgId: String?): AgentToolResult {
        val limit = (input["limit"] as? Number)?.toInt()?.coerceIn(1, 100) ?: 30
        // StudyPlan 의 채점 대기 cell 사용 — submitted/in_progress 상태
        // 별도 query 없으면 상위 화면 안내로 대체
        return AgentToolResult(
            success = true,
            data = mapOf(
                "note" to "어드민 → 학습 계획표 → 통합 제출물(상태: submitted) 화면에서 채점 대기를 확인하실 수 있습니다.",
                "limit" to limit,
                "role" to role,
                "org_id" to orgId,
            ),
        )
    }

    // ─── 5) 시즌·대결·상점·AI 플레이어 ───────────────────────────────────

    @Transactional(readOnly = true)
    private fun listSeasons(): AgentToolResult {
        val seasons = seasonRepository.findAll().sortedByDescending { it.startAt }.take(20)
        val data = seasons.map {
            mapOf(
                "season_id" to it.id,
                "name" to it.name,
                "status" to it.status,
                "start_at" to it.startAt.toString(),
                "end_at" to it.endAt.toString(),
            )
        }
        return AgentToolResult(success = true, data = mapOf("seasons" to data, "count" to data.size))
    }

    @Transactional(readOnly = true)
    private fun listRecentDuels(input: Map<String, Any?>): AgentToolResult {
        val limit = (input["limit"] as? Number)?.toInt()?.coerceIn(1, 100) ?: 30
        val page = duelMatchRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, limit))
        val data = page.content.map {
            mapOf(
                "match_id" to it.id,
                "status" to it.status,
                "created_at" to it.createdAt?.toString(),
            )
        }
        return AgentToolResult(success = true, data = mapOf("matches" to data, "count" to data.size))
    }

    @Transactional(readOnly = true)
    private fun listShopOrders(input: Map<String, Any?>): AgentToolResult {
        val status = input["status"] as? String
        val limit = (input["limit"] as? Number)?.toInt()?.coerceIn(1, 100) ?: 30
        val all = orderRepository.findAllByOrderByCreatedAtDesc()
        val filtered = if (status != null) all.filter { it.status == status } else all
        val data = filtered.take(limit).map {
            mapOf(
                "order_id" to it.id,
                "user_id" to it.userId,
                "status" to it.status,
                "total_amount" to it.totalAmount,
                "created_at" to it.createdAt?.toString(),
            )
        }
        return AgentToolResult(success = true, data = mapOf("orders" to data, "count" to data.size))
    }

    private fun listAiPlayers(): AgentToolResult {
        val players = aiPlayerService.getAllAiPlayers()
        val data = players.map {
            mapOf(
                "id" to it.id,
                "name" to it.name,
                "accuracy" to it.accuracy,
                "emoticon_series" to it.emoticonSeries,
            )
        }
        return AgentToolResult(success = true, data = mapOf("ai_players" to data, "count" to data.size))
    }

    // ─── 6) 문의·보고·기관·결제 (HQ 전용) ───────────────────────────────────

    @Transactional(readOnly = true)
    private fun listInquiries(input: Map<String, Any?>): AgentToolResult {
        // BoardEntity 의 board_type='inquiry' 게시판 글 조회
        // PostRepository 가 board_id 기반이라 단순화: 최근 100건 중 게시판 키워드로 추출
        return AgentToolResult(
            success = true,
            data = mapOf(
                "note" to "어드민 → 문의 관리(/admin/inquiry) 에서 상태별 목록을 확인하실 수 있습니다.",
                "status_filter" to (input["status"] as? String),
            ),
        )
    }

    @Transactional(readOnly = true)
    private fun listReports(): AgentToolResult {
        val all = reportRepository.findAll().take(50)
        val data = all.map {
            mapOf(
                "id" to it.id,
                "target_type" to it.targetType,
                "target_id" to it.targetId,
                "user_id" to it.userId,
                "reason" to it.reason,
                "created_at" to it.createdAt?.toString(),
            )
        }
        return AgentToolResult(success = true, data = mapOf("reports" to data, "count" to data.size))
    }

    @Transactional(readOnly = true)
    private fun listOrgs(input: Map<String, Any?>): AgentToolResult {
        val search = (input["search"] as? String)?.trim()?.takeIf { it.isNotBlank() }
        val includeSuspended = input["include_suspended"] as? Boolean ?: false
        val all = orgRepository.findByStatusOrderByHqFirstThenNameAsc("active")
        val filtered = all
            .filter { search == null || it.name.contains(search, ignoreCase = true) }
            .filter { includeSuspended || !it.billingSuspended }
        val data = filtered.take(100).map {
            mapOf(
                "org_id" to it.id,
                "name" to it.name,
                "status" to it.status,
                "plan" to it.plan,
                "seat_limit" to it.seatLimit,
                "billing_suspended" to it.billingSuspended,
            )
        }
        return AgentToolResult(success = true, data = mapOf("orgs" to data, "count" to data.size))
    }

    @Transactional(readOnly = true)
    private fun getOrgBillingStatus(input: Map<String, Any?>): AgentToolResult {
        val orgId = input["org_id"] as? String
            ?: return AgentToolResult(false, errorCode = "INVALID", errorMessage = "org_id 누락")
        val org = orgRepository.findById(orgId).orElse(null)
            ?: return AgentToolResult(false, errorCode = "NOT_FOUND", errorMessage = "기관 없음")
        return AgentToolResult(
            success = true,
            data = mapOf(
                "org_id" to org.id,
                "name" to org.name,
                "billing_suspended" to org.billingSuspended,
                "monthly_base_fee_override" to org.monthlyBaseFeeOverride,
                "seat_limit" to org.seatLimit,
                "note" to "상세 청구·결제는 어드민 → 기관 결제(/admin/billing) 에서 확인하실 수 있습니다.",
            ),
        )
    }

    @Transactional(readOnly = true)
    private fun listGrapefruitTransactions(
        input: Map<String, Any?>,
        role: String,
        orgId: String?,
    ): AgentToolResult {
        val walletType = (input["wallet_type"] as? String) ?: "org"
        val ownerId = if (role == "ORG_ADMIN") orgId else (input["owner_id"] as? String)
        if (ownerId == null) {
            return AgentToolResult(false, errorCode = "INVALID", errorMessage = "owner_id 누락")
        }
        val list = grapefruitTransactionRepository
            .findTop100ByWalletTypeAndWalletOwnerIdOrderByCreatedAtDesc(walletType, ownerId)
            .take(50)
        val data = list.map {
            mapOf(
                "id" to it.id,
                "direction" to it.direction,
                "amount" to it.amount,
                "kind" to it.kind,
                "balance_after" to it.balanceAfter,
                "created_at" to it.createdAt?.toString(),
            )
        }
        return AgentToolResult(success = true, data = mapOf("transactions" to data, "count" to data.size))
    }

    // ─── 7) 학생 튜터 소환 + 부류 학습 리스트 ───────────────────────────────────

    /**
     * 학생 1명을 위한 정밀 추천 — 학생 튜터를 소환해 그쪽 LLM 한 번 호출.
     * 운영자(관리자)는 학생을 잘 모르니, 학생 컨텍스트(약점·최근 학습·진단)를 다 아는 학생 튜터에게 위임.
     */
    private fun recommendForStudentViaTutor(
        input: Map<String, Any?>,
        role: String,
        orgId: String?,
    ): AgentToolResult {
        val userId = input["user_id"] as? String
            ?: return AgentToolResult(false, errorCode = "INVALID", errorMessage = "user_id 누락")
        val requestText = (input["request_text"] as? String) ?: "이 학생에게 가장 도움이 될 학습을 추천해 주세요."
        verifyStudentOwnership(userId, role, orgId)

        val r = tutorService.recommendForStudent(userId, requestText)
        return AgentToolResult(
            success = true,
            data = mapOf(
                "user_id" to userId,
                "recommendation_text" to r.text,
                "candidate_ids" to r.candidateIds,
                "input_tokens" to r.inputTokens,
                "output_tokens" to r.outputTokens,
                "instruction" to "위 recommendation_text 를 운영자에게 그대로 전달하십시오. 추가로 직접 후보를 고치거나 이유를 새로 작성하지 마십시오.",
            ),
        )
    }

    /**
     * 부류별 학습 리스트 — 특정 학생용이 아닌 일반 후보 모음.
     * 운영자가 학습 계획표 매트릭스에 일괄 배정할 때 사용. 결과 → batch_assign_recommendations.
     */
    @Transactional(readOnly = true)
    private fun listLearningCandidates(input: Map<String, Any?>, callerUserId: String): AgentToolResult {
        val levelId = input["level_id"] as? String
        val area = input["area"] as? String
        val subArea = input["sub_area"] as? String
        val theme = input["theme"] as? String
        val competency = input["competency"] as? String
        val limit = (input["limit"] as? Number)?.toInt()?.coerceIn(1, 30) ?: 10

        // 특정 학생이 아닌 "공통 후보" 이므로 callerUserId 의 평생 이력은 무시 (운영자 본인 학습 이력 X).
        // 단순화: RecommendationService 의 메서드를 호출하되, 운영자 본인 ID 사용 → 풀이 이력이 거의 없을 것.
        val recommended = when {
            !theme.isNullOrBlank() -> recommendationService.recommendForTheme(callerUserId, theme, levelId, limit)
            !area.isNullOrBlank() || !subArea.isNullOrBlank() ->
                recommendationService.recommendForArea(callerUserId, area, subArea, levelId, limit)
            !competency.isNullOrBlank() ->
                recommendationService.recommendForCompetency(callerUserId, competency, levelId, limit)
            else -> recommendationService.recommendForCompetency(callerUserId, null, levelId, limit)
        }

        val data = recommended.map {
            mapOf(
                "content_id" to it.contentId,
                "title" to it.title,
                "content_type" to it.contentType,
                "level_id" to it.levelId,
                "area" to it.area,
                "sub_area" to it.subArea,
                "score" to it.score,
                "reason" to it.reason,
            )
        }
        return AgentToolResult(
            success = true,
            data = mapOf(
                "filter" to mapOf(
                    "level_id" to levelId, "area" to area, "sub_area" to subArea,
                    "theme" to theme, "competency" to competency,
                ),
                "count" to data.size,
                "contents" to data,
                "instruction" to "위 후보 중 적합한 것들을 표로 정리해 운영자에게 제시. 일괄 배정이 필요하면 batch_assign_recommendations 호출 (require_confirm=true).",
            ),
        )
    }
}
