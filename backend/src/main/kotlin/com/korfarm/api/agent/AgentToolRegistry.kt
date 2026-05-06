package com.korfarm.api.agent

import org.springframework.stereotype.Component

/**
 * AI 비서 함수 카탈로그.
 *
 * 각 함수는:
 *  - name           : 모델이 호출할 함수 식별자 (snake_case)
 *  - description    : 모델용 설명 — 언제 어떤 결과인지
 *  - inputSchema    : Anthropic tool_use 표준 JSON Schema (object)
 *  - requireConfirm : true 이면 모델이 호출 직전 사용자 확인을 받아야 함
 *  - allowedRoles   : 호출 가능한 사용자 권한 (HQ_ADMIN / ORG_ADMIN)
 *  - category       : UI 그룹핑용 (study_plan / class_student / org / billing / system)
 *
 * 1차 8개 함수 — 학습 계획표 5 + 수강반·학생 3.
 */
data class AgentToolDefinition(
    val name: String,
    val description: String,
    val inputSchema: Map<String, Any>,
    val requireConfirm: Boolean,
    val allowedRoles: Set<String>,
    val category: String,
)

@Component
class AgentToolRegistry {
    /** 운영자 권한별 호출 가능한 함수 목록을 Anthropic tool_use 형식으로 반환 */
    fun toolsForRole(role: String): List<Map<String, Any>> {
        return all
            .filter { role in it.allowedRoles }
            .map { def ->
                mapOf(
                    "name" to def.name,
                    "description" to def.description,
                    "input_schema" to def.inputSchema,
                )
            }
    }

    fun find(name: String): AgentToolDefinition? = all.firstOrNull { it.name == name }

    /** 1차 8개 함수 정의 */
    private val all: List<AgentToolDefinition> = listOf(
        // ─────────────────────────────────────────────────────────────────
        // 1) 학습 계획표 (5개)
        // ─────────────────────────────────────────────────────────────────

        AgentToolDefinition(
            name = "list_study_plans",
            description = "현재 운영 중인 학습 계획표 목록을 조회합니다. status(active/archived) 와 검색어로 필터링할 수 있습니다.",
            requireConfirm = false,
            allowedRoles = setOf("HQ_ADMIN", "ORG_ADMIN"),
            category = "study_plan",
            inputSchema = mapOf(
                "type" to "object",
                "properties" to mapOf(
                    "status" to mapOf(
                        "type" to "string",
                        "enum" to listOf("active", "archived"),
                        "description" to "조회할 계획표 상태. 미지정 시 전체.",
                    ),
                    "search" to mapOf(
                        "type" to "string",
                        "description" to "제목 부분 일치 검색어",
                    ),
                ),
                "required" to emptyList<String>(),
            ),
        ),

        AgentToolDefinition(
            name = "get_study_plan_matrix",
            description = "특정 학습 계획표의 매트릭스(scopes × assets × cells)를 조회합니다. 셀별 진행 상태와 배정된 콘텐츠를 모두 포함합니다.",
            requireConfirm = false,
            allowedRoles = setOf("HQ_ADMIN", "ORG_ADMIN"),
            category = "study_plan",
            inputSchema = mapOf(
                "type" to "object",
                "properties" to mapOf(
                    "plan_id" to mapOf(
                        "type" to "string",
                        "description" to "학습 계획표 ID",
                    ),
                ),
                "required" to listOf("plan_id"),
            ),
        ),

        AgentToolDefinition(
            name = "assign_cell_content",
            description = "학습 계획표의 특정 셀에 콘텐츠(또는 활동)를 배정합니다. 배정 시 마감 기한(due_at) 필수. 사용자 확인이 필요한 위험 작업입니다.",
            requireConfirm = true,
            allowedRoles = setOf("HQ_ADMIN", "ORG_ADMIN"),
            category = "study_plan",
            inputSchema = mapOf(
                "type" to "object",
                "properties" to mapOf(
                    "cell_id" to mapOf(
                        "type" to "string",
                        "description" to "배정할 매트릭스 셀 ID",
                    ),
                    "cell_ref_id" to mapOf(
                        "type" to "string",
                        "description" to "배정할 콘텐츠 ID. activity 셀은 null 허용.",
                    ),
                    "assigned_label" to mapOf(
                        "type" to "string",
                        "description" to "표시명 (자유주제 활동 등에 사용). 콘텐츠 ID 가 있으면 표시명 override.",
                    ),
                    "due_at" to mapOf(
                        "type" to "string",
                        "description" to "마감 기한. ISO 형식 (yyyy-MM-dd 또는 yyyy-MM-ddTHH:mm:ss). 필수.",
                    ),
                ),
                "required" to listOf("cell_id", "due_at"),
            ),
        ),

        AgentToolDefinition(
            name = "batch_assign_recommendations",
            description = "추천된 콘텐츠를 다수 셀에 일괄 배정합니다. 동일 마감일·동일 학생 그룹에 한 번에 적용. 사용자 확인 필수.",
            requireConfirm = true,
            allowedRoles = setOf("HQ_ADMIN", "ORG_ADMIN"),
            category = "study_plan",
            inputSchema = mapOf(
                "type" to "object",
                "properties" to mapOf(
                    "plan_id" to mapOf(
                        "type" to "string",
                        "description" to "대상 학습 계획표 ID",
                    ),
                    "assignments" to mapOf(
                        "type" to "array",
                        "description" to "배정할 셀과 콘텐츠 매핑 목록",
                        "items" to mapOf(
                            "type" to "object",
                            "properties" to mapOf(
                                "cell_id" to mapOf("type" to "string"),
                                "cell_ref_id" to mapOf("type" to "string"),
                                "assigned_label" to mapOf("type" to "string"),
                                "due_at" to mapOf("type" to "string"),
                            ),
                            "required" to listOf("cell_id", "cell_ref_id", "due_at"),
                        ),
                    ),
                ),
                "required" to listOf("plan_id", "assignments"),
            ),
        ),

        AgentToolDefinition(
            name = "recommend_contents_for_competency",
            description = "10대 역량 또는 영역/세부영역/주제를 기준으로 학습 콘텐츠를 추천합니다. 약점 역량 보강 및 영역별 추천 모두 지원.",
            requireConfirm = false,
            allowedRoles = setOf("HQ_ADMIN", "ORG_ADMIN"),
            category = "study_plan",
            inputSchema = mapOf(
                "type" to "object",
                "properties" to mapOf(
                    "user_id" to mapOf(
                        "type" to "string",
                        "description" to "추천 대상 학생 ID. 미지정 시 일반 추천.",
                    ),
                    "competency" to mapOf(
                        "type" to "string",
                        "description" to "10대 역량 코드 (예: factual_comprehension, inferential_reasoning ...)",
                    ),
                    "area" to mapOf(
                        "type" to "string",
                        "description" to "분류 영역 코드 (예: nonfiction, fiction, grammar, vocabulary, writing)",
                    ),
                    "sub_area" to mapOf(
                        "type" to "string",
                        "description" to "분류 세부영역 코드",
                    ),
                    "theme" to mapOf(
                        "type" to "string",
                        "description" to "분류 주제 코드",
                    ),
                    "level" to mapOf(
                        "type" to "string",
                        "description" to "레벨 (russell1, witt2 등)",
                    ),
                    "limit" to mapOf(
                        "type" to "integer",
                        "description" to "최대 추천 개수 (기본 10)",
                    ),
                ),
                "required" to emptyList<String>(),
            ),
        ),

        // ─────────────────────────────────────────────────────────────────
        // 2) 수강반 · 학생 (3개)
        // ─────────────────────────────────────────────────────────────────

        AgentToolDefinition(
            name = "list_students",
            description = "본 기관(또는 본사 전체) 학생 목록을 조회합니다. 수강반·레벨·구독 상태 등으로 필터링 가능.",
            requireConfirm = false,
            allowedRoles = setOf("HQ_ADMIN", "ORG_ADMIN"),
            category = "class_student",
            inputSchema = mapOf(
                "type" to "object",
                "properties" to mapOf(
                    "class_id" to mapOf(
                        "type" to "string",
                        "description" to "수강반 ID 필터",
                    ),
                    "level" to mapOf(
                        "type" to "string",
                        "description" to "레벨 코드 필터",
                    ),
                    "subscription" to mapOf(
                        "type" to "string",
                        "enum" to listOf("paid", "trial", "expired"),
                    ),
                    "search" to mapOf(
                        "type" to "string",
                        "description" to "이름/아이디 검색",
                    ),
                ),
                "required" to emptyList<String>(),
            ),
        ),

        AgentToolDefinition(
            name = "get_student_detail",
            description = "특정 학생의 상세 정보(소속·레벨·역량 벡터·최근 학습 이력)를 조회합니다.",
            requireConfirm = false,
            allowedRoles = setOf("HQ_ADMIN", "ORG_ADMIN"),
            category = "class_student",
            inputSchema = mapOf(
                "type" to "object",
                "properties" to mapOf(
                    "user_id" to mapOf(
                        "type" to "string",
                        "description" to "학생 ID",
                    ),
                ),
                "required" to listOf("user_id"),
            ),
        ),

        AgentToolDefinition(
            name = "list_classes",
            description = "수강반(class) 목록을 조회합니다. 본 기관 또는 본사 전체.",
            requireConfirm = false,
            allowedRoles = setOf("HQ_ADMIN", "ORG_ADMIN"),
            category = "class_student",
            inputSchema = mapOf(
                "type" to "object",
                "properties" to mapOf(
                    "org_id" to mapOf(
                        "type" to "string",
                        "description" to "기관 필터 (HQ_ADMIN 한정 — ORG_ADMIN 은 자기 기관 자동)",
                    ),
                    "search" to mapOf(
                        "type" to "string",
                    ),
                ),
                "required" to emptyList<String>(),
            ),
        ),
    )
}
