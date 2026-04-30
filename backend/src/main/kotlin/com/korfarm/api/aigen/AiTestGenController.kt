package com.korfarm.api.aigen

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.security.SecurityUtils
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/v1/admin/ai-gen")
class AiTestGenController(
    private val service: AiTestGenService,
    private val jobService: AiGenJobService,
    private val learningConceptService: LearningConceptService,
    private val grammarRagService: GrammarRagService,
    private val objectMapper: com.fasterxml.jackson.databind.ObjectMapper,
) {
    private fun requireAdmin() {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
    }
    private fun currentUser(): String =
        SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)

    // ─── 비동기 잡 패턴 (CloudFront 60초 timeout 회피) ───
    @PostMapping("/passage")
    fun genPassage(@RequestBody req: PassageGenRequest): ApiResponse<Map<String, String>> {
        requireAdmin()
        val userId = currentUser()
        val job = jobService.submitPassage(req, userId)
        return ApiResponse(success = true, data = mapOf("jobId" to job.id, "status" to job.status))
    }

    @PostMapping("/question")
    fun genQuestion(@RequestBody req: QuestionGenRequest): ApiResponse<Map<String, String>> {
        requireAdmin()
        val userId = currentUser()
        val job = jobService.submitQuestion(req, userId)
        return ApiResponse(success = true, data = mapOf("jobId" to job.id, "status" to job.status))
    }

    @GetMapping("/jobs/{jobId}")
    fun getJob(@PathVariable jobId: String): ApiResponse<Map<String, Any?>> {
        requireAdmin()
        val userId = currentUser()
        val job = jobService.get(jobId, userId)
            ?: throw ApiException("NOT_FOUND", "Job 을 찾을 수 없습니다.", HttpStatus.NOT_FOUND)
        val resultObj: Any? = job.resultJson?.let {
            try { objectMapper.readValue(it, Any::class.java) } catch (_: Exception) { null }
        }
        return ApiResponse(success = true, data = mapOf(
            "jobId" to job.id,
            "kind" to job.kind,
            "status" to job.status,
            "result" to resultObj,
            "errorMessage" to job.errorMessage,
            "createdAt" to job.createdAt.toString(),
            "completedAt" to job.completedAt?.toString(),
        ))
    }

    @GetMapping("/learning-concepts")
    fun learningConcepts(
        @RequestParam area: String,
        @RequestParam(required = false) subArea: String?,
    ): ApiResponse<List<LearningConceptDto>> {
        requireAdmin()
        return ApiResponse(success = true, data = learningConceptService.listForArea(area, subArea))
    }

    @GetMapping("/grammar-topics")
    fun grammarTopics(): ApiResponse<List<GrammarRagService.TopicCount>> {
        requireAdmin()
        return ApiResponse(success = true, data = grammarRagService.listTopics())
    }
}
