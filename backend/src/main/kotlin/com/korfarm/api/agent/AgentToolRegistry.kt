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
    /**
     * 이 함수 호출 결과를 모델이 정리·요약할 때 사용할 권장 모델.
     * - "sonnet" : 분석·추천·종합 판단
     * - "haiku"  : 단순 데이터 조회·작업 실행 (기본값, 1/3 비용)
     *
     * 첫 호출(의도파악·함수선택)은 항상 sonnet. tool_use 후속 turn 에서만 다운시프트 적용.
     * 한 turn 안에 여러 함수가 호출되면 그중 하나라도 sonnet 이 필요하면 sonnet 사용.
     */
    val preferredModel: String = "haiku",
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
            name = "recommend_for_student_via_tutor",
            description = "특정 학생 1명을 위한 정밀 학습 추천. 학생 튜터 AI 를 소환하여 그 학생의 약점·최근 학습·진단 결과를 종합 분석한 추천을 받습니다. 학생 개인 추천은 반드시 이 함수를 사용 — 직접 후보를 고르거나 추천 이유를 만들지 말 것.",
            requireConfirm = false,
            allowedRoles = setOf("HQ_ADMIN", "ORG_ADMIN"),
            category = "study_plan",
            preferredModel = "sonnet",
            inputSchema = mapOf(
                "type" to "object",
                "properties" to mapOf(
                    "user_id" to mapOf("type" to "string", "description" to "추천 받을 학생 ID"),
                    "request_text" to mapOf("type" to "string", "description" to "운영자의 추가 요구사항 (예: '고전 시 위주', '최근 어려워한 영역 보강'). 미지정 시 자동 약점 보강."),
                ),
                "required" to listOf("user_id"),
            ),
        ),

        AgentToolDefinition(
            name = "list_learning_candidates",
            description = "특정 부류(레벨·영역·주제·역량) 의 학습 후보 리스트를 가져옵니다. 학생 개인 추천이 아니라, 운영자가 학습 계획표에 배정할 후보를 모을 때 사용. 결과 → batch_assign_recommendations 로 일괄 배정 가능.",
            requireConfirm = false,
            allowedRoles = setOf("HQ_ADMIN", "ORG_ADMIN"),
            category = "study_plan",
            inputSchema = mapOf(
                "type" to "object",
                "properties" to mapOf(
                    "level_id" to mapOf("type" to "string", "description" to "레벨 코드 (예: russell1)"),
                    "area" to mapOf("type" to "string", "description" to "영역 코드"),
                    "sub_area" to mapOf("type" to "string", "description" to "세부영역 코드"),
                    "theme" to mapOf("type" to "string", "description" to "주제 코드"),
                    "competency" to mapOf("type" to "string", "description" to "10대 역량명"),
                    "limit" to mapOf("type" to "integer", "description" to "기본 10, 최대 30"),
                ),
                "required" to emptyList<String>(),
            ),
        ),

        AgentToolDefinition(
            name = "recommend_contents_for_competency",
            description = "[deprecated] 단순 후보 리스트만 필요할 때 사용. 학생 개인 추천은 recommend_for_student_via_tutor 를, 부류 학습 리스트는 list_learning_candidates 를 우선 사용.",
            requireConfirm = false,
            allowedRoles = setOf("HQ_ADMIN", "ORG_ADMIN"),
            category = "study_plan",
            preferredModel = "sonnet",
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
            description = "특정 학생의 상세 정보(소속·레벨·역량 벡터·최근 학습 이력)를 조회합니다. 역량 분포 분석에 사용.",
            requireConfirm = false,
            allowedRoles = setOf("HQ_ADMIN", "ORG_ADMIN"),
            category = "class_student",
            preferredModel = "sonnet",
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

        // ═════════════════════════════════════════════════════════════════
        // 3) 콘텐츠 관리 (HQ + ORG 공용)
        // ═════════════════════════════════════════════════════════════════

        AgentToolDefinition(
            name = "search_contents",
            description = "콘텐츠(일일독해/일일퀴즈/내용숙지/프로 등)를 키워드·레벨·종류로 검색합니다.",
            requireConfirm = false,
            allowedRoles = setOf("HQ_ADMIN", "ORG_ADMIN"),
            category = "content",
            inputSchema = mapOf(
                "type" to "object",
                "properties" to mapOf(
                    "keyword" to mapOf("type" to "string", "description" to "제목·영역·세부영역 부분 일치 검색어"),
                    "content_type" to mapOf("type" to "string", "description" to "예: DAILY_READING, DAILY_QUIZ, STUDY_CONTENT, PRO_READING"),
                    "level_id" to mapOf("type" to "string"),
                    "area" to mapOf("type" to "string"),
                    "limit" to mapOf("type" to "integer", "description" to "최대 50, 기본 20"),
                ),
                "required" to listOf("keyword"),
            ),
        ),

        AgentToolDefinition(
            name = "get_content_detail",
            description = "콘텐츠 단일 메타데이터(제목·레벨·영역·세부영역·상태)를 조회합니다.",
            requireConfirm = false,
            allowedRoles = setOf("HQ_ADMIN", "ORG_ADMIN"),
            category = "content",
            inputSchema = mapOf(
                "type" to "object",
                "properties" to mapOf("content_id" to mapOf("type" to "string")),
                "required" to listOf("content_id"),
            ),
        ),

        AgentToolDefinition(
            name = "list_own_contents",
            description = "학생이 직접 만든 OWN 학습 콘텐츠 검수 대기 목록을 조회합니다 (HQ 전용).",
            requireConfirm = false,
            allowedRoles = setOf("HQ_ADMIN"),
            category = "content",
            inputSchema = mapOf(
                "type" to "object",
                "properties" to mapOf(
                    "status" to mapOf("type" to "string", "enum" to listOf("pending", "approved", "rejected")),
                ),
                "required" to emptyList<String>(),
            ),
        ),

        // ═════════════════════════════════════════════════════════════════
        // 4) 테스트 관리
        // ═════════════════════════════════════════════════════════════════

        AgentToolDefinition(
            name = "list_tests",
            description = "기타 테스트(시험지) 목록을 조회합니다. 본 기관 + 본사 PUBLIC.",
            requireConfirm = false,
            allowedRoles = setOf("HQ_ADMIN", "ORG_ADMIN"),
            category = "test",
            inputSchema = mapOf(
                "type" to "object",
                "properties" to mapOf(
                    "level_id" to mapOf("type" to "string"),
                    "source" to mapOf("type" to "string", "description" to "예: org / hq"),
                ),
                "required" to emptyList<String>(),
            ),
        ),

        AgentToolDefinition(
            name = "list_diagnostic_tests",
            description = "진단 테스트 목록을 조회합니다.",
            requireConfirm = false,
            allowedRoles = setOf("HQ_ADMIN", "ORG_ADMIN"),
            category = "test",
            inputSchema = mapOf(
                "type" to "object",
                "properties" to emptyMap<String, Any>(),
                "required" to emptyList<String>(),
            ),
        ),

        AgentToolDefinition(
            name = "get_test_statistics",
            description = "특정 테스트의 통계(응시 인원·평균·역량별 분포)를 조회합니다. 통계 해석·인사이트 도출에 사용.",
            requireConfirm = false,
            allowedRoles = setOf("HQ_ADMIN", "ORG_ADMIN"),
            category = "test",
            preferredModel = "sonnet",
            inputSchema = mapOf(
                "type" to "object",
                "properties" to mapOf("test_id" to mapOf("type" to "string")),
                "required" to listOf("test_id"),
            ),
        ),

        AgentToolDefinition(
            name = "list_pending_grading",
            description = "수동 채점 대기 중인 학생 제출물(서술형)을 조회합니다.",
            requireConfirm = false,
            allowedRoles = setOf("HQ_ADMIN", "ORG_ADMIN"),
            category = "test",
            inputSchema = mapOf(
                "type" to "object",
                "properties" to mapOf(
                    "limit" to mapOf("type" to "integer", "description" to "기본 30, 최대 100"),
                ),
                "required" to emptyList<String>(),
            ),
        ),

        // ═════════════════════════════════════════════════════════════════
        // 5) 시즌·대결·상점·AI 플레이어
        // ═════════════════════════════════════════════════════════════════

        AgentToolDefinition(
            name = "list_seasons",
            description = "대결 시즌 목록(현재·과거)을 조회합니다.",
            requireConfirm = false,
            allowedRoles = setOf("HQ_ADMIN"),
            category = "season",
            inputSchema = mapOf(
                "type" to "object",
                "properties" to emptyMap<String, Any>(),
                "required" to emptyList<String>(),
            ),
        ),

        AgentToolDefinition(
            name = "list_recent_duels",
            description = "최근 대결 매치 이력을 조회합니다.",
            requireConfirm = false,
            allowedRoles = setOf("HQ_ADMIN"),
            category = "season",
            inputSchema = mapOf(
                "type" to "object",
                "properties" to mapOf(
                    "limit" to mapOf("type" to "integer", "description" to "기본 30, 최대 100"),
                ),
                "required" to emptyList<String>(),
            ),
        ),

        AgentToolDefinition(
            name = "list_shop_orders",
            description = "쇼핑몰 주문 목록을 조회합니다 (HQ 전용).",
            requireConfirm = false,
            allowedRoles = setOf("HQ_ADMIN"),
            category = "shop",
            inputSchema = mapOf(
                "type" to "object",
                "properties" to mapOf(
                    "status" to mapOf("type" to "string", "enum" to listOf("pending", "shipping", "delivered")),
                    "limit" to mapOf("type" to "integer"),
                ),
                "required" to emptyList<String>(),
            ),
        ),

        AgentToolDefinition(
            name = "list_ai_players",
            description = "대결용 AI 플레이어 봇 목록을 조회합니다 (HQ 전용).",
            requireConfirm = false,
            allowedRoles = setOf("HQ_ADMIN"),
            category = "season",
            inputSchema = mapOf(
                "type" to "object",
                "properties" to emptyMap<String, Any>(),
                "required" to emptyList<String>(),
            ),
        ),

        // ═════════════════════════════════════════════════════════════════
        // 6) 문의·보고·기관·결제 (HQ 전용)
        // ═════════════════════════════════════════════════════════════════

        AgentToolDefinition(
            name = "list_inquiries",
            description = "사용자 문의 게시글 목록을 조회합니다 (HQ 전용).",
            requireConfirm = false,
            allowedRoles = setOf("HQ_ADMIN"),
            category = "hq",
            inputSchema = mapOf(
                "type" to "object",
                "properties" to mapOf(
                    "status" to mapOf("type" to "string", "enum" to listOf("open", "answered", "closed")),
                ),
                "required" to emptyList<String>(),
            ),
        ),

        AgentToolDefinition(
            name = "list_reports",
            description = "신고된 게시물·댓글 목록을 조회합니다 (HQ 전용).",
            requireConfirm = false,
            allowedRoles = setOf("HQ_ADMIN"),
            category = "hq",
            inputSchema = mapOf(
                "type" to "object",
                "properties" to emptyMap<String, Any>(),
                "required" to emptyList<String>(),
            ),
        ),

        AgentToolDefinition(
            name = "list_orgs",
            description = "전체 기관 목록을 조회합니다 (HQ 전용).",
            requireConfirm = false,
            allowedRoles = setOf("HQ_ADMIN"),
            category = "hq",
            inputSchema = mapOf(
                "type" to "object",
                "properties" to mapOf(
                    "search" to mapOf("type" to "string"),
                    "include_suspended" to mapOf("type" to "boolean", "description" to "기본 false — 정지된 기관도 포함할지"),
                ),
                "required" to emptyList<String>(),
            ),
        ),

        AgentToolDefinition(
            name = "get_org_billing_status",
            description = "특정 기관의 월결제 상태(미결제·정지·다음 결제일)를 조회합니다 (HQ 전용).",
            requireConfirm = false,
            allowedRoles = setOf("HQ_ADMIN"),
            category = "hq",
            inputSchema = mapOf(
                "type" to "object",
                "properties" to mapOf("org_id" to mapOf("type" to "string")),
                "required" to listOf("org_id"),
            ),
        ),

        AgentToolDefinition(
            name = "list_grapefruit_transactions",
            description = "자몽 거래 이력(충전/차감)을 조회합니다. ORG_ADMIN 은 본 기관, HQ_ADMIN 은 지정한 기관/사용자.",
            requireConfirm = false,
            allowedRoles = setOf("HQ_ADMIN", "ORG_ADMIN"),
            category = "billing",
            inputSchema = mapOf(
                "type" to "object",
                "properties" to mapOf(
                    "wallet_type" to mapOf("type" to "string", "enum" to listOf("org", "user")),
                    "owner_id" to mapOf("type" to "string", "description" to "조회 대상 ID"),
                ),
                "required" to emptyList<String>(),
            ),
        ),
    )
}
