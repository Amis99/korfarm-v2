package com.korfarm.api.tutor

import org.springframework.stereotype.Component

/**
 * 학생 AI 튜터 함수 카탈로그.
 *
 * 6개 함수 — 모두 호출자 학생 본인 데이터만 다룸. 절대 다른 학생 데이터 접근 X.
 */
data class TutorToolDefinition(
    val name: String,
    val description: String,
    val inputSchema: Map<String, Any>,
    /** 후속 turn 모델 — "sonnet" (분석·추천·설명) / "haiku" (단순 조회). default haiku. */
    val preferredModel: String = "haiku",
)

@Component
class TutorToolRegistry {
    fun toolsForApi(): List<Map<String, Any>> = all.map {
        mapOf(
            "name" to it.name,
            "description" to it.description,
            "input_schema" to it.inputSchema,
        )
    }

    fun find(name: String): TutorToolDefinition? = all.firstOrNull { it.name == name }

    private val all: List<TutorToolDefinition> = listOf(
        TutorToolDefinition(
            name = "explain_concept",
            description = "국어 학습 개념(어법·문법·독해 전략 등)을 학생 눈높이에 맞게 풀어 설명합니다.",
            preferredModel = "sonnet",
            inputSchema = mapOf(
                "type" to "object",
                "properties" to mapOf(
                    "concept" to mapOf("type" to "string", "description" to "설명할 개념 (예: '문장의 호응', '추론적 독해')"),
                    "level_id" to mapOf("type" to "string", "description" to "학생 레벨 (예: russell1)"),
                ),
                "required" to listOf("concept"),
            ),
        ),
        TutorToolDefinition(
            name = "get_my_competency",
            description = "내 10대 역량 현황(누적 점수·약점 영역)을 조회합니다.",
            preferredModel = "sonnet",  // 약점 분석·코멘트 작성용
            inputSchema = mapOf(
                "type" to "object",
                "properties" to emptyMap<String, Any>(),
                "required" to emptyList<String>(),
            ),
        ),
        TutorToolDefinition(
            name = "recommend_my_study",
            description = "내가 원하는 영역·주제·역량을 명시했을 때 단순 추천(최대 10개). 인자 미지정 시 자동 약점 보강.",
            inputSchema = mapOf(
                "type" to "object",
                "properties" to mapOf(
                    "competency" to mapOf("type" to "string", "description" to "10대 역량명 (예: 어휘력, 문장 독해력, 논리 사고력)"),
                    "area" to mapOf("type" to "string", "description" to "분류 영역 코드"),
                    "theme" to mapOf("type" to "string", "description" to "분류 주제 코드"),
                    "limit" to mapOf("type" to "integer"),
                ),
                "required" to emptyList<String>(),
            ),
        ),
        TutorToolDefinition(
            name = "get_recommendation_candidates",
            description = "정밀 추천을 위한 후보 풀을 한 번에 가져옵니다 — 역량 보강 10개 + 영역 매칭 10개 + 주제 매칭 10개 (총 30개). 본문 X, 메타만. 이걸 받은 후 너가 직접 학생 약점과 최근 경향을 종합해 카테고리별 1~2개씩 골라 이유와 함께 제시할 것.",
            preferredModel = "sonnet",  // 종합 판단·선별
            inputSchema = mapOf(
                "type" to "object",
                "properties" to mapOf(
                    "level_id" to mapOf("type" to "string", "description" to "학생 레벨. 미지정 시 학생 본인 레벨 자동."),
                    "per_category" to mapOf("type" to "integer", "description" to "카테고리당 후보 수 (기본 10, 최대 15)"),
                ),
                "required" to emptyList<String>(),
            ),
        ),
        TutorToolDefinition(
            name = "get_my_recommendations",
            description = "통합 분석표와 동일한 fallback 추천을 한 번에 가져옵니다 — 약점이 있으면 약점, 없으면 학습량 부족 영역, 그래도 없으면 학생 레벨별 가중치 기반 추천. " +
                "응답에는 strategy(weakness/low_volume/level_default) 와 targetLabels(추천 근거 역량/영역) 가 포함됨. " +
                "학생에게 추천을 제시할 때는 이 함수를 우선 사용하고, strategy 에 맞춰 자연어로 이유를 짚어줄 것. 예: 약점이 어휘력이라 어휘 학습부터 권합니다 / 비문학 학습량이 적어 비문학 콘텐츠를 추천합니다 / 현재 레벨에서는 선택지 분석 비중이 높아 관련 콘텐츠를 권합니다.",
            preferredModel = "sonnet",
            inputSchema = mapOf(
                "type" to "object",
                "properties" to mapOf(
                    "per_category" to mapOf("type" to "integer", "description" to "카테고리(역량/영역)당 후보 수 (기본 6, 1~12)"),
                ),
                "required" to emptyList<String>(),
            ),
        ),
        TutorToolDefinition(
            name = "get_my_recent_history",
            description = "최근 내가 푼 학습/문제 이력을 조회합니다.",
            inputSchema = mapOf(
                "type" to "object",
                "properties" to mapOf(
                    "limit" to mapOf("type" to "integer", "description" to "기본 20, 최대 50"),
                ),
                "required" to emptyList<String>(),
            ),
        ),
        TutorToolDefinition(
            name = "search_content",
            description = "공개 학습 콘텐츠를 키워드로 검색합니다.",
            inputSchema = mapOf(
                "type" to "object",
                "properties" to mapOf(
                    "keyword" to mapOf("type" to "string"),
                    "level_id" to mapOf("type" to "string"),
                    "limit" to mapOf("type" to "integer"),
                ),
                "required" to listOf("keyword"),
            ),
        ),
        TutorToolDefinition(
            name = "explain_question_solution",
            description = "특정 문제(콘텐츠 ID + 문제 번호)의 풀이를 단계별로 설명합니다.",
            inputSchema = mapOf(
                "type" to "object",
                "properties" to mapOf(
                    "content_id" to mapOf("type" to "string"),
                    "question_index" to mapOf("type" to "integer", "description" to "1-based 문제 번호"),
                ),
                "required" to listOf("content_id", "question_index"),
            ),
        ),
    )
}
