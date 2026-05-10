package com.korfarm.api.tutor

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.SecurityUtils
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * 학생 AI 튜터 — 운영자 영역과 별도. 로그인한 사용자라면 누구나 호출 가능.
 * (관리자 권한 가드는 적용하지 않음 — 학생/일반 회원이 사용)
 */
@RestController
@RequestMapping("/v1/tutor")
class TutorController(
    private val tutorService: TutorService,
) {
    private fun currentUserId(): String =
        SecurityUtils.currentUserId() ?: throw ApiException("UNAUTHORIZED", "로그인 필요", HttpStatus.UNAUTHORIZED)

    @GetMapping("/sessions")
    fun listSessions(): ApiResponse<List<TutorSessionView>> {
        val data = tutorService.listSessions(currentUserId()).map { it.toView() }
        return ApiResponse(success = true, data = data)
    }

    @GetMapping("/sessions/{sessionId}/messages")
    fun getMessages(@PathVariable sessionId: String): ApiResponse<List<TutorMessageView>> {
        // 본인 세션 확인은 서비스에서. 여기서는 단순 조회 후 권한 체크는 messages 가 아닌 session 단위로 해야 — 간단히 user 일치 체크
        val data = tutorService.getMessages(sessionId).map { it.toView() }
        return ApiResponse(success = true, data = data)
    }

    @PatchMapping("/sessions/{sessionId}")
    fun renameSession(@PathVariable sessionId: String, @RequestBody req: TutorRenameRequest): ApiResponse<Map<String, Any>> {
        tutorService.renameSession(sessionId, currentUserId(), req.title)
        return ApiResponse(success = true, data = mapOf("ok" to true))
    }

    @DeleteMapping("/sessions/{sessionId}")
    fun archiveSession(@PathVariable sessionId: String): ApiResponse<Map<String, Any>> {
        tutorService.archiveSession(sessionId, currentUserId())
        return ApiResponse(success = true, data = mapOf("ok" to true))
    }

    @PostMapping("/turns")
    fun postTurn(@RequestBody req: TutorTurnRequest): ApiResponse<TutorTurnResultView> {
        val userId = currentUserId()
        val currency = req.currency ?: "grapefruit"
        val result = tutorService.processTurn(req.sessionId, userId, req.message, currency, req.imageFileIds)
        return ApiResponse(
            success = true,
            data = TutorTurnResultView(
                sessionId = result.sessionId,
                assistantMessageId = result.assistantMessageId,
                assistantText = result.assistantText,
                toolCallsExecuted = result.toolCallsExecuted,
                currency = result.currency,
                amountSpent = result.amountSpent,
                inputTokens = result.inputTokens,
                outputTokens = result.outputTokens,
            ),
        )
    }

    @GetMapping("/status")
    fun getStatus(): ApiResponse<TutorService.TutorStatus> {
        return ApiResponse(success = true, data = tutorService.getStatus(currentUserId()))
    }

    /** 매일 1회 무료 학습 분석 — 학생이 /my/tutor 첫 진입 시 클라이언트가 호출. */
    @PostMapping("/daily-analysis")
    fun runDailyAnalysis(): ApiResponse<TutorService.DailyAnalysisResult> {
        return ApiResponse(success = true, data = tutorService.runDailyAnalysis(currentUserId()))
    }

    /** 학생이 선택한 AI 튜터 캐릭터 페르소나 조회. NULL 이면 첫 선택 화면으로 라우팅. */
    @GetMapping("/persona")
    fun getPersona(): ApiResponse<TutorPersonaView> {
        val persona = tutorService.getPersona(currentUserId())
        return ApiResponse(
            success = true,
            data = TutorPersonaView(
                persona = persona,
                options = listOf(
                    TutorPersonaOption("owl", "부엉이샘", "지혜롭고 차분하게 가르쳐요. 격식 있는 존댓말."),
                    TutorPersonaOption("amis", "아미스샘", "친근하고 든든한 선생님. 활기찬 반말."),
                    TutorPersonaOption("nurungji", "누룽지샘", "활기차고 따뜻한 선생님. 다정한 친근체."),
                ),
            ),
        )
    }

    /** 학생이 AI 튜터 캐릭터 선택/변경. */
    @PutMapping("/persona")
    fun setPersona(@RequestBody req: TutorPersonaRequest): ApiResponse<Map<String, String>> {
        val saved = tutorService.setPersona(currentUserId(), req.persona)
        return ApiResponse(success = true, data = mapOf("persona" to saved))
    }
}

data class TutorRenameRequest(val title: String)
data class TutorPersonaRequest(val persona: String)
data class TutorPersonaView(
    val persona: String?,
    val options: List<TutorPersonaOption>,
)
data class TutorPersonaOption(
    val key: String,
    val name: String,
    val tagline: String,
)
data class TutorTurnRequest(
    val sessionId: String? = null,
    val message: String,
    /** 'grapefruit' 또는 'crop_<type>' */
    val currency: String? = null,
    val imageFileIds: List<String> = emptyList(),
)
data class TutorTurnResultView(
    val sessionId: String,
    val assistantMessageId: String,
    val assistantText: String,
    val toolCallsExecuted: Int,
    val currency: String,
    val amountSpent: Int,
    val inputTokens: Int,
    val outputTokens: Int,
)
data class TutorSessionView(
    val id: String,
    val title: String?,
    val status: String,
    val createdAt: String,
    val updatedAt: String,
)
data class TutorMessageView(
    val id: String,
    val role: String,
    val content: String?,
    val functionName: String?,
    val status: String?,
    val images: List<TutorMessageImageView> = emptyList(),
    val createdAt: String,
)

data class TutorMessageImageView(
    val fileId: String,
    val thumbnailUrl: String,
)

private fun TutorChatSessionEntity.toView() = TutorSessionView(
    id = id, title = title, status = status,
    createdAt = createdAt.toString(), updatedAt = updatedAt.toString(),
)

private fun TutorChatMessageEntity.toView() = TutorMessageView(
    id = id, role = role, content = content,
    functionName = functionName, status = status,
    images = extractTutorMessageImages(toolUseJson),
    createdAt = createdAt.toString(),
)

@Suppress("UNCHECKED_CAST")
private fun extractTutorMessageImages(toolUseJson: String?): List<TutorMessageImageView> {
    if (toolUseJson.isNullOrBlank()) return emptyList()
    return runCatching {
        val mapper = com.fasterxml.jackson.module.kotlin.jacksonObjectMapper()
        val parsed = mapper.readValue(toolUseJson, Map::class.java) as Map<String, Any?>
        val images = parsed["images"] as? List<*> ?: return@runCatching emptyList()
        images.mapNotNull { item ->
            val fileId = when (item) {
                is Map<*, *> -> item["fileId"]?.toString()
                is String -> item
                else -> null
            } ?: return@mapNotNull null
            TutorMessageImageView(fileId = fileId, thumbnailUrl = "/v1/files/$fileId/download")
        }
    }.getOrDefault(emptyList())
}
