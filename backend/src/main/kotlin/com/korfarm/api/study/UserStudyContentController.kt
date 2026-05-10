package com.korfarm.api.study

import com.korfarm.api.aigen.AiGenJobService
import com.korfarm.api.aigen.StudyQuestionGenRequest
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.grapefruit.GrapefruitService
import com.korfarm.api.payment.SubscriptionService
import com.korfarm.api.security.SecurityUtils
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * 학생용 AI 학습 생성 (Phase C-2)
 *
 * - POST /v1/me/study/contents — 학습 콘텐츠 메타 생성 (visibility=OWN, creator=학생)
 * - GET  /v1/me/study/contents — 본인이 만든 학습 목록
 * - POST /v1/me/study/contents/{id}/generate-questions — AI 가 페이지 본문에서 체크포인트+문제 생성 (자몽/작물 차감)
 *
 * 유료 구독 학생만 사용 가능.
 */
@RestController
@RequestMapping("/v1/me/study")
class UserStudyContentController(
    private val studyContentService: StudyContentService,
    private val aiGenJobService: AiGenJobService,
    private val grapefruitService: GrapefruitService,
    private val subscriptionService: SubscriptionService,
) {
    @GetMapping("/contents")
    fun listMyContents(): ApiResponse<List<StudyContentSummary>> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        return ApiResponse(success = true, data = studyContentService.listForUser(userId))
    }

    @PostMapping("/contents")
    fun createMyContent(@Valid @RequestBody request: StudyContentCreateRequest): ApiResponse<StudyContentDetail> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        subscriptionService.requireActive(userId)
        return ApiResponse(success = true, data = studyContentService.createForUser(request, userId))
    }

    /**
     * AI 학습 문항 생성 — 본인 OWN 콘텐츠에 대해서만.
     * currency: 'grapefruit' / 'crop_*'
     * tier: 'BASIC' (Sonnet) / 'ADVANCED' (Opus)
     * 5문항 단위 묶음 가격 × ceil(total/5) + 체크포인트 추출 (existingCheckpoints 없을 때).
     */
    @PostMapping("/contents/{contentId}/generate-questions")
    fun generateQuestions(
        @PathVariable contentId: String,
        @Valid @RequestBody req: UserGenerateQuestionsRequest,
    ): ApiResponse<Map<String, String>> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        subscriptionService.requireActive(userId)

        // 본인 OWN 콘텐츠인지 검증
        val owned = studyContentService.listForUser(userId).any { it.id == contentId }
        if (!owned) {
            throw ApiException("FORBIDDEN", "본인 학습이 아닙니다", HttpStatus.FORBIDDEN)
        }

        val total = req.mcqCount + req.oxCount + req.shortCount + req.essayCount
        if (total <= 0 || total > 30) {
            throw ApiException("INVALID_COUNT", "문항 1~30 사이", HttpStatus.BAD_REQUEST)
        }
        if (req.pageMarkdown.isBlank()) {
            throw ApiException("EMPTY_PAGE", "페이지 본문이 비어 있습니다", HttpStatus.BAD_REQUEST)
        }

        // 자몽/작물 차감 (체크포인트 + 문항 패키지)
        // 2026-05-10 정정: 체크포인트 단일 단가 (일반/고급 분기 없음).
        // 문항은 일반/고급 분기 유지 + 5문항 단위 1회 차감 (1~5문항 동일 1회).
        val isAdvanced = req.tier == "ADVANCED"
        grapefruitService.spendForUser(userId, "checkpoint-extract", req.currency, memo = "체크포인트 추출")

        val packages = (total + 4) / 5
        val qKind = if (isAdvanced) "study-questions-opus" else "study-questions-sonnet"
        repeat(packages) {
            grapefruitService.spendForUser(userId, qKind, req.currency, memo = "학습 문항 ${total}개")
        }

        // 비동기 잡 시작 — autoSaveContentId 로 결과 자동 저장 (페이지·문제 → study_pages/study_questions)
        val genReq = StudyQuestionGenRequest(
            pageMarkdown = req.pageMarkdown,
            area = req.area,
            subArea = req.subArea,
            levelId = req.levelId,
            mcqCount = req.mcqCount,
            oxCount = req.oxCount,
            shortCount = req.shortCount,
            essayCount = req.essayCount,
            existingCheckpoints = null,
            tier = req.tier,
            autoSaveContentId = contentId,
        )
        val job = aiGenJobService.submitStudyQuestion(genReq, userId)
        return ApiResponse(success = true, data = mapOf("jobId" to job.id, "status" to job.status))
    }
}

data class UserGenerateQuestionsRequest(
    val pageMarkdown: String,
    val area: String? = null,
    val subArea: String? = null,
    val levelId: String? = null,
    val mcqCount: Int = 0,
    val oxCount: Int = 0,
    val shortCount: Int = 0,
    val essayCount: Int = 0,
    val tier: String = "BASIC",
    val currency: String = "grapefruit",
)
