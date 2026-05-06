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
            inputSchema = mapOf(
                "type" to "object",
                "properties" to emptyMap<String, Any>(),
                "required" to emptyList<String>(),
            ),
        ),
        TutorToolDefinition(
            name = "recommend_my_study",
            description = "내 약점 역량 또는 지정한 영역·주제의 추천 학습 콘텐츠를 가져옵니다. 우선순위: theme > area > competency. 인자 미지정 시 자동 약점 보강.",
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
