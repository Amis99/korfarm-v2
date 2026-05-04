package com.korfarm.api.aigen

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.security.SecurityUtils
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/v1/admin/ai-gen")
class AiTestGenController(
    private val service: AiTestGenService,
    private val jobService: AiGenJobService,
    private val learningConceptService: LearningConceptService,
    private val grammarRagService: GrammarRagService,
    private val fileToMarkdownService: FileToMarkdownService,
    private val objectMapper: com.fasterxml.jackson.databind.ObjectMapper,
) {
    // 전사 콘텐츠 풀에 영향가는 작업(passage·question)은 본사 전용,
    // 내용 숙지 콘텐츠 작성용 도구(study-question·file-to-markdown 등)는 ORG 도 가능
    private fun requireHq() {
        AdminGuard.requireAnyRole("HQ_ADMIN")
    }
    private fun requireAdmin() {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
    }
    private fun currentUser(): String =
        SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)

    // ─── 비동기 잡 패턴 (CloudFront 60초 timeout 회피) ───
    @PostMapping("/passage")
    fun genPassage(@RequestBody req: PassageGenRequest): ApiResponse<Map<String, String>> {
        requireHq()  // 전사 콘텐츠 풀용 지문 생성
        val userId = currentUser()
        val job = jobService.submitPassage(req, userId)
        return ApiResponse(success = true, data = mapOf("jobId" to job.id, "status" to job.status))
    }

    @PostMapping("/question")
    fun genQuestion(@RequestBody req: QuestionGenRequest): ApiResponse<Map<String, String>> {
        requireHq()  // 전사 콘텐츠 풀용 문항 생성
        val userId = currentUser()
        val job = jobService.submitQuestion(req, userId)
        return ApiResponse(success = true, data = mapOf("jobId" to job.id, "status" to job.status))
    }

    /**
     * 내용 숙지 페이지 → 4유형 문제 생성 (비동기).
     * 1단계 출제 포인트 추출(Sonnet) + 2단계 문제 생성(Opus). 페이지당 최대 30문제.
     * 응답: jobId. 폴링으로 결과 받음.
     */
    @PostMapping("/study-question")
    fun genStudyQuestion(@RequestBody req: StudyQuestionGenRequest): ApiResponse<Map<String, String>> {
        requireAdmin()
        val userId = currentUser()
        val total = req.mcqCount + req.oxCount + req.shortCount + req.essayCount
        if (total <= 0 || total > 30) {
            throw ApiException("INVALID_COUNT", "문제 개수 합계는 1~30 사이여야 합니다 (현재 $total)", HttpStatus.BAD_REQUEST)
        }
        if (req.pageMarkdown.isBlank()) {
            throw ApiException("EMPTY_PAGE", "페이지 본문이 비어 있습니다", HttpStatus.BAD_REQUEST)
        }
        val job = jobService.submitStudyQuestion(req, userId)
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

    /**
     * PDF/이미지 → 마크다운 변환 (추가 과금) — 비동기 잡 패턴.
     * multipart/form-data 로 file 업로드 → jobId 즉시 반환 (CloudFront 60초 timeout 회피).
     * 클라이언트는 GET /jobs/{jobId} 로 폴링.
     * 응답: { jobId, status }
     */
    @PostMapping("/file-to-markdown", consumes = ["multipart/form-data"])
    fun fileToMarkdown(@RequestParam("file") file: MultipartFile): ApiResponse<Map<String, String>> {
        requireAdmin()
        val userId = currentUser()
        if (file.isEmpty) throw ApiException("EMPTY_FILE", "파일이 비어 있습니다", HttpStatus.BAD_REQUEST)

        val mediaType = (file.contentType ?: guessMediaType(file.originalFilename ?: ""))
            ?: throw ApiException("UNKNOWN_MEDIA_TYPE", "파일 형식을 알 수 없습니다", HttpStatus.BAD_REQUEST)

        val job = jobService.submitFileToMarkdown(file.bytes, mediaType, file.originalFilename, userId)
        return ApiResponse(success = true, data = mapOf("jobId" to job.id, "status" to job.status))
    }

    private fun guessMediaType(filename: String): String? {
        val lower = filename.lowercase()
        return when {
            lower.endsWith(".pdf") -> "application/pdf"
            lower.endsWith(".jpg") || lower.endsWith(".jpeg") -> "image/jpeg"
            lower.endsWith(".png") -> "image/png"
            lower.endsWith(".webp") -> "image/webp"
            lower.endsWith(".gif") -> "image/gif"
            else -> null
        }
    }
}
