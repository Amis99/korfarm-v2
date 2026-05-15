package com.korfarm.api.paid

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.contracts.AdminContentImportRequest
import com.korfarm.api.contracts.AdminTestAnswersRequest
import com.korfarm.api.contracts.AdminTestCreateRequest
import com.korfarm.api.contracts.AdminTestGradeRequest
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.security.SecurityUtils
import com.korfarm.api.system.FeatureFlagService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/admin")
class AdminContentController(
    private val adminContentService: AdminContentService,
    private val featureFlagService: FeatureFlagService,
    private val recommendationIndexService: com.korfarm.api.learning.ContentRecommendationIndexService
) {
    // 콘텐츠 import / 수정 / 원고 = 전사 콘텐츠 풀 운영 → 본사 관리자 전용
    @PostMapping("/content/import")
    fun importContent(@Valid @RequestBody request: AdminContentImportRequest): ApiResponse<AdminContentImportResult> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val data = adminContentService.importContent(request, userId)
        return ApiResponse(success = true, data = data)
    }

    @PostMapping("/content/batch-import")
    fun batchImportContent(@Valid @RequestBody request: AdminContentBatchImportRequest): ApiResponse<AdminContentBatchImportResult> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val data = adminContentService.batchImportContent(request, userId)
        return ApiResponse(success = true, data = data)
    }

    @GetMapping("/manuscripts")
    fun listManuscripts(): ApiResponse<List<ManuscriptSummary>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        val data = adminContentService.listManuscripts()
        return ApiResponse(success = true, data = data)
    }

    @GetMapping("/content")
    fun listContent(): ApiResponse<List<AdminContentSummary>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        val data = adminContentService.listContents()
        return ApiResponse(success = true, data = data)
    }

    /** 본문/문제 검색 — content_versions.content_json LIKE 매칭.
     *  scope: body|question (현재 동작 동일, 1차에서는 path 구분 안 함) */
    @GetMapping("/content/search")
    fun searchContentBody(
        @RequestParam(name = "q") q: String,
        @RequestParam(name = "scope", required = false, defaultValue = "body") scope: String,
        @RequestParam(name = "limit", required = false, defaultValue = "200") limit: Int
    ): ApiResponse<List<AdminContentSummary>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        val capped = limit.coerceIn(1, 500)
        val data = adminContentService.searchContentsByBody(q, capped)
        return ApiResponse(success = true, data = data)
    }

    @PutMapping("/content/{contentId}")
    fun updateContent(
        @PathVariable contentId: String,
        @Valid @RequestBody request: AdminContentImportRequest
    ): ApiResponse<AdminContentImportResult> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val data = adminContentService.updateContent(contentId, request, userId)
        return ApiResponse(success = true, data = data)
    }

    @DeleteMapping("/content/{contentId}")
    fun deleteContent(@PathVariable contentId: String): ApiResponse<Map<String, Boolean>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        adminContentService.deleteContent(contentId)
        return ApiResponse(success = true, data = mapOf("deleted" to true))
    }

    @GetMapping("/content/{contentId}/preview")
    fun preview(@PathVariable contentId: String): ApiResponse<ContentPreview> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        val data = adminContentService.previewContent(contentId)
        return ApiResponse(success = true, data = data)
    }

    /**
     * 일일퀴즈 10번 문제 backfill (HQ_ADMIN 전용).
     * 해당 콘텐츠의 최신 content_version 의 contentJson.payload.questions[9] 를
     * 새 q10 로 교체한 신규 content_version 을 INSERT (이력 보존).
     *
     * Body: { "contentId": "dq-SAUSSURE_1-020", "q10": {...} }
     */
    @PostMapping("/dailyquiz/q10-backfill")
    fun dailyQuizQ10Backfill(@RequestBody request: Map<String, Any?>): ApiResponse<Map<String, Any?>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val contentId = request["contentId"] as? String
            ?: throw ApiException("BAD_REQUEST", "contentId is required", HttpStatus.BAD_REQUEST)
        @Suppress("UNCHECKED_CAST")
        val q10 = request["q10"] as? Map<String, Any?>
            ?: throw ApiException("BAD_REQUEST", "q10 is required", HttpStatus.BAD_REQUEST)
        val userId = SecurityUtils.currentUserId() ?: "system"
        val result = adminContentService.backfillDailyQuizQ10(contentId, q10, userId)
        return ApiResponse(success = true, data = result)
    }

    /**
     * 일일퀴즈 Q1~9 의 competency 단일 필드 일괄 backfill (HQ_ADMIN 전용).
     * 1번=어휘력 ~ 9번=문제 분석 및 전략 수립 능력. Q10 은 건드리지 않음.
     * 이미 competencyVector 또는 competency 있는 문항은 보호.
     */
    @PostMapping("/dailyquiz/q1to9-competency-backfill")
    fun dailyQuizQ1to9CompetencyBackfill(): ApiResponse<Map<String, Any?>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val userId = SecurityUtils.currentUserId() ?: "system"
        val result = adminContentService.backfillDailyQuizQ1to9Competency(userId)
        return ApiResponse(success = true, data = result)
    }

    /**
     * 일일퀴즈 Q1~Q10 의 competencyVector(정답 +) + 오답 선택지별 wrongVector(- 약점) 일괄 backfill.
     * Q번호 → 단일 역량 1.0 분포로 채움. 이미 비어있지 않은 벡터는 보호.
     * 사람이 비주얼 에디터로 세부 조정하기 전에 일단 시스템이 작동하도록 minimal default 적용.
     */
    @PostMapping("/dailyquiz/full-vector-backfill")
    fun dailyQuizFullVectorBackfill(): ApiResponse<Map<String, Any?>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val userId = SecurityUtils.currentUserId() ?: "system"
        val result = adminContentService.backfillDailyQuizFullVectors(userId)
        return ApiResponse(success = true, data = result)
    }

    /**
     * 추천 인덱스 일괄 백필 (HQ_ADMIN 전용).
     * 모든 active 콘텐츠의 content_recommendation_index 갱신.
     * 1회 실행으로 약 4,500건 인덱스 채움.
     */
    @PostMapping("/recommendation-index/rebuild")
    fun rebuildRecommendationIndex(): ApiResponse<com.korfarm.api.learning.ContentRecommendationIndexService.RebuildResult> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val result = recommendationIndexService.rebuildAll()
        return ApiResponse(success = true, data = result)
    }

    /**
     * 농장·프로·논리·내용숙지 콘텐츠에 default competency vector 일괄 backfill (HQ 전용).
     * 매핑 정책은 AdminContentService.backfillDefaultCompetencyVector 참조.
     * 일일퀴즈는 Q1~9 backfill 이 별도라 skip.
     * 이미 vector 있는 문항은 보호.
     */
    @PostMapping("/content/default-competency-backfill")
    fun defaultCompetencyVectorBackfill(): ApiResponse<Map<String, Any?>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val userId = SecurityUtils.currentUserId() ?: "system"
        val result = adminContentService.backfillDefaultCompetencyVector(userId)
        return ApiResponse(success = true, data = result)
    }

    /**
     * 일일퀴즈 1번 문제(어휘) 의 본문 텍스트 키들을 단일 "보기" 키로 통합.
     * 학생 화면이 passage / prompt / 보기 / examples 등 여러 키를 박스로 렌더하던 것을
     * 한 박스("보기")로 단순화하기 위한 1회성 마이그레이션.
     * 기존 텍스트는 우선순위(보기→examples→example→additionalInfo→passage→prompt) 로 모두 join.
     */
    @PostMapping("/dailyquiz/q1-merge-bogi")
    fun mergeDailyQuizQ1Bogi(): ApiResponse<Map<String, Any?>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val userId = SecurityUtils.currentUserId() ?: "system"
        val result = adminContentService.mergeDailyQuizQ1Bogi(userId)
        return ApiResponse(success = true, data = result)
    }

    @PostMapping("/tests")
    fun createTest(@Valid @RequestBody request: AdminTestCreateRequest): ApiResponse<TestPaperView> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        featureFlagService.requireEnabled("feature.paid.test_bank")
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val data = adminContentService.createTest(request, userId)
        return ApiResponse(success = true, data = data)
    }

    @PostMapping("/tests/{testId}/answers")
    fun saveAnswers(
        @PathVariable testId: String,
        @Valid @RequestBody request: AdminTestAnswersRequest
    ): ApiResponse<TestAnswerKeyView> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        featureFlagService.requireEnabled("feature.paid.test_bank")
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val data = adminContentService.saveAnswerKey(testId, request, userId)
        return ApiResponse(success = true, data = data)
    }

    // 콘텐츠 편집 이력은 본사 관리자 전용 (콘텐츠 운영 추적)
    @GetMapping("/content/{contentId}/edit-history")
    fun getContentEditHistory(@PathVariable contentId: String): ApiResponse<List<ContentEditLogDto>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        val data = adminContentService.getEditLogsByContent(contentId)
        return ApiResponse(success = true, data = data)
    }

    @GetMapping("/edit-history/by-editor")
    fun getEditorEditHistory(@RequestParam editorId: String): ApiResponse<List<ContentEditLogDto>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        val data = adminContentService.getEditLogsByEditor(editorId)
        return ApiResponse(success = true, data = data)
    }

    @GetMapping("/editors")
    fun listEditors(): ApiResponse<List<AdminUserDto>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        val data = adminContentService.listAdminUsers()
        return ApiResponse(success = true, data = data)
    }

    @PostMapping("/tests/{testId}/grade")
    fun grade(
        @PathVariable testId: String,
        @Valid @RequestBody request: AdminTestGradeRequest
    ): ApiResponse<TestGradeResult> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        featureFlagService.requireEnabled("feature.paid.test_bank")
        val data = adminContentService.gradeTest(testId, request)
        return ApiResponse(success = true, data = data)
    }
}
