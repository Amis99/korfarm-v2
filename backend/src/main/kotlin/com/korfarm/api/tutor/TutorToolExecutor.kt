package com.korfarm.api.tutor

import com.korfarm.api.classification.ContentClassificationRepository
import com.korfarm.api.common.ApiException
import com.korfarm.api.learning.LearningCompetencyLogRepository
import com.korfarm.api.learning.RecommendationService
import com.korfarm.api.learning.UserCompetencySummaryRepository
import com.korfarm.api.paid.ContentRepository
import com.korfarm.api.paid.ContentVersionRepository
import com.korfarm.api.user.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

data class TutorToolResult(
    val success: Boolean,
    val data: Any? = null,
    val errorCode: String? = null,
    val errorMessage: String? = null,
)

/**
 * 학생 AI 튜터 함수 실행기.
 * 모든 함수는 호출자 학생(callerUserId) 본인 데이터만 다룬다.
 */
@Component
class TutorToolExecutor(
    private val userRepository: UserRepository,
    private val contentRepository: ContentRepository,
    private val contentVersionRepository: ContentVersionRepository,
    private val classificationRepository: ContentClassificationRepository,
    private val competencyLogRepository: LearningCompetencyLogRepository,
    private val competencySummaryRepository: UserCompetencySummaryRepository,
    private val recommendationService: RecommendationService,
) {
    private val log = LoggerFactory.getLogger(TutorToolExecutor::class.java)

    fun execute(functionName: String, input: Map<String, Any?>, userId: String): TutorToolResult {
        return try {
            when (functionName) {
                "explain_concept" -> explainConcept(input, userId)
                "get_my_competency" -> getMyCompetency(userId)
                "recommend_my_study" -> recommendMyStudy(input, userId)
                "get_recommendation_candidates" -> getRecommendationCandidates(input, userId)
                "get_my_recommendations" -> getMyRecommendations(input, userId)
                "get_my_recent_history" -> getMyRecentHistory(input, userId)
                "search_content" -> searchContent(input)
                "explain_question_solution" -> explainQuestionSolution(input)
                else -> TutorToolResult(false, errorCode = "UNKNOWN_FUNCTION", errorMessage = "구현되지 않은 함수: $functionName")
            }
        } catch (e: ApiException) {
            TutorToolResult(false, errorCode = e.code, errorMessage = e.message)
        } catch (e: Exception) {
            log.error("tutor tool 실행 실패 — name={}", functionName, e)
            TutorToolResult(false, errorCode = "INTERNAL", errorMessage = e.message)
        }
    }

    private fun explainConcept(input: Map<String, Any?>, userId: String): TutorToolResult {
        val concept = (input["concept"] as? String)?.trim()?.takeIf { it.isNotBlank() }
            ?: return TutorToolResult(false, errorCode = "INVALID", errorMessage = "concept 누락")
        val user = userRepository.findById(userId).orElse(null)
        val level = (input["level_id"] as? String) ?: user?.levelId
        // 실제 설명은 Claude 가 응답에 직접 작성. 이 함수는 학생 정보 제공만.
        return TutorToolResult(
            success = true,
            data = mapOf(
                "concept" to concept,
                "student_level" to level,
                "instruction" to "해당 학생 레벨에 맞춰 친근한 말투로, 예시 1~2개를 들어 200자 내외로 설명해 주세요.",
            ),
        )
    }

    @Transactional(readOnly = true)
    private fun getMyCompetency(userId: String): TutorToolResult {
        val summary = competencySummaryRepository.findByUserId(userId)
            .associate {
                it.competency to mapOf(
                    "ratio" to it.ratioScore,
                    "earned" to it.earnedTotal,
                    "max" to it.maxTotal,
                    "sample_count" to it.sampleCount,
                )
            }
        // 약점 — ratio 낮은 순
        val weakest = summary.entries
            .sortedBy { (it.value["ratio"] as? Number)?.toDouble() ?: 0.0 }
            .take(3)
            .map { it.key }
        return TutorToolResult(
            success = true,
            data = mapOf(
                "competency" to summary,
                "weakest_competencies" to weakest,
                "log_count" to competencyLogRepository.countInWindow(userId),
            ),
        )
    }

    @Transactional(readOnly = true)
    private fun getRecommendationCandidates(input: Map<String, Any?>, userId: String): TutorToolResult {
        val levelId = input["level_id"] as? String
        val perCategory = (input["per_category"] as? Number)?.toInt()?.coerceIn(3, 15) ?: 10
        val all = recommendationService.recommendCandidatesAll(userId, levelId, perCategory)

        fun toMeta(list: List<com.korfarm.api.learning.RecommendationService.RecommendedContent>): List<Map<String, Any?>> =
            list.map {
                mapOf(
                    "content_id" to it.contentId,
                    "title" to it.title,
                    "content_type" to it.contentType,
                    "level_id" to it.levelId,
                    "area" to it.area,
                    "sub_area" to it.subArea,
                    "score" to it.score,
                    "reason_hint" to it.reason,
                )
            }

        return TutorToolResult(
            success = true,
            data = mapOf(
                "competency_candidates" to toMeta(all.competency),
                "area_candidates" to toMeta(all.area),
                "theme_candidates" to toMeta(all.theme),
                "instruction" to "위 30개 메타데이터만 보고, 학생의 약점·최근 학습·진단 결과를 종합하여 카테고리별 1~2개씩(총 3~6개) 선별해 이유와 함께 자연어로 제시할 것. 30개 그대로 노출 금지.",
            ),
        )
    }

    @Transactional(readOnly = true)
    private fun getMyRecommendations(input: Map<String, Any?>, userId: String): TutorToolResult {
        val perCategory = (input["per_category"] as? Number)?.toInt()?.coerceIn(1, 12) ?: 6
        val bundle = recommendationService.recommendWithFallback(userId, perCategory)

        fun toMeta(items: List<RecommendationService.RecommendedContent>): List<Map<String, Any?>> =
            items.map {
                mapOf(
                    "content_id" to it.contentId,
                    "title" to it.title,
                    "content_type" to it.contentType,
                    "level_id" to it.levelId,
                    "area" to it.area,
                    "sub_area" to it.subArea,
                    "reason_hint" to it.reason,
                )
            }

        return TutorToolResult(
            success = true,
            data = mapOf(
                "level_id" to bundle.levelId,
                "competency" to mapOf(
                    "strategy" to bundle.competency.strategy,
                    "target_labels" to bundle.competency.targetLabels,
                    "items" to toMeta(bundle.competency.items),
                ),
                "area" to mapOf(
                    "strategy" to bundle.area.strategy,
                    "target_labels" to bundle.area.targetLabels,
                    "items" to toMeta(bundle.area.items),
                ),
                "instruction" to "strategy 가 weakness 면 약점 보강, low_volume 이면 학습량 부족, level_default 면 레벨 가중치 기반 추천이라는 사실을 학생에게 자연어로 짧게 짚어준 뒤, 카테고리별 1~2개를 이유와 함께 제시할 것. 모든 항목 그대로 노출 금지. 자기 호칭은 '선생님'.",
            ),
        )
    }

    @Transactional(readOnly = true)
    private fun recommendMyStudy(input: Map<String, Any?>, userId: String): TutorToolResult {
        val competency = input["competency"] as? String
        val area = input["area"] as? String
        val theme = input["theme"] as? String
        val limit = (input["limit"] as? Number)?.toInt()?.coerceIn(1, 30) ?: 10
        val user = userRepository.findById(userId).orElse(null)
        val level = user?.levelId

        // 우선순위: theme → area → competency(약점 자동)
        val recommended = when {
            !theme.isNullOrBlank() -> recommendationService.recommendForTheme(userId, theme, level, limit)
            !area.isNullOrBlank() -> recommendationService.recommendForArea(userId, area, null, level, limit)
            else -> recommendationService.recommendForCompetency(userId, competency, level, limit)
        }

        val data = recommended.map {
            mapOf(
                "content_id" to it.contentId,
                "title" to it.title,
                "content_type" to it.contentType,
                "level_id" to it.levelId,
                "area" to it.area,
                "sub_area" to it.subArea,
                "reason" to it.reason,
            )
        }
        return TutorToolResult(success = true, data = mapOf(
            "filter" to mapOf("competency" to competency, "area" to area, "theme" to theme, "level" to level),
            "count" to data.size,
            "contents" to data,
        ))
    }

    @Transactional(readOnly = true)
    private fun getMyRecentHistory(input: Map<String, Any?>, userId: String): TutorToolResult {
        val limit = (input["limit"] as? Number)?.toInt()?.coerceIn(1, 50) ?: 20
        val recent = competencyLogRepository.findInWindowDesc(userId).take(limit)
        val data = recent.map {
            mapOf(
                "content_id" to it.contentId,
                "source" to it.source,
                "weight" to it.weight,
                "completed_at" to it.completedAt.toString(),
            )
        }
        return TutorToolResult(success = true, data = mapOf("recent" to data, "count" to data.size))
    }

    @Transactional(readOnly = true)
    private fun searchContent(input: Map<String, Any?>): TutorToolResult {
        val keyword = (input["keyword"] as? String)?.trim()?.takeIf { it.isNotBlank() }
            ?: return TutorToolResult(false, errorCode = "INVALID", errorMessage = "keyword 누락")
        val level = input["level_id"] as? String
        val limit = (input["limit"] as? Number)?.toInt()?.coerceIn(1, 30) ?: 10
        val pageable = PageRequest.of(0, limit)
        val page = contentRepository.searchByKeyword("%$keyword%", null, level, null, pageable)
        val data = page.content.map {
            mapOf(
                "content_id" to it.id,
                "title" to it.title,
                "content_type" to it.contentType,
                "level_id" to it.levelId,
            )
        }
        return TutorToolResult(success = true, data = mapOf("contents" to data, "count" to data.size))
    }

    @Transactional(readOnly = true)
    private fun explainQuestionSolution(input: Map<String, Any?>): TutorToolResult {
        val contentId = input["content_id"] as? String
            ?: return TutorToolResult(false, errorCode = "INVALID", errorMessage = "content_id 누락")
        val qIdx = (input["question_index"] as? Number)?.toInt()
            ?: return TutorToolResult(false, errorCode = "INVALID", errorMessage = "question_index 누락")
        val content = contentRepository.findById(contentId).orElse(null)
            ?: return TutorToolResult(false, errorCode = "NOT_FOUND", errorMessage = "콘텐츠 없음")
        val version = contentVersionRepository.findTopByContentIdOrderByCreatedAtDesc(contentId)
            ?: return TutorToolResult(false, errorCode = "NOT_FOUND", errorMessage = "콘텐츠 본문 없음")
        // payload 의 questions[qIdx-1] 을 찾아 모델에게 컨텍스트로 전달
        return TutorToolResult(
            success = true,
            data = mapOf(
                "content_id" to content.id,
                "title" to content.title,
                "content_type" to content.contentType,
                "level_id" to content.levelId,
                "question_index" to qIdx,
                "payload" to version.contentJson,
                "instruction" to "위 payload 의 questions 배열에서 ${qIdx}번째(0-based: ${qIdx - 1}) 문제의 풀이를 단계별로 친근하게 설명해 주세요. 정답을 바로 말하지 말고 학생이 스스로 발견할 수 있도록 힌트부터 점차 구체화하십시오.",
            ),
        )
    }
}
