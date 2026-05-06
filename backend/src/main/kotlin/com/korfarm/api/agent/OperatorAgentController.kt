package com.korfarm.api.agent

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.org.OrgMembershipRepository
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.security.SecurityUtils
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/admin/agent")
class OperatorAgentController(
    private val agentService: OperatorAgentService,
    private val membershipRepository: OrgMembershipRepository,
) {
    // ─── 세션 ───────────────────────────────────

    @GetMapping("/sessions")
    fun listSessions(): ApiResponse<List<SessionView>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "로그인 필요", HttpStatus.UNAUTHORIZED)
        val data = agentService.listSessions(userId).map { it.toView() }
        return ApiResponse(success = true, data = data)
    }

    @GetMapping("/sessions/{sessionId}/messages")
    fun getMessages(@PathVariable sessionId: String): ApiResponse<List<MessageView>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "로그인 필요", HttpStatus.UNAUTHORIZED)
        val data = agentService.getMessages(sessionId).map { it.toView() }
        return ApiResponse(success = true, data = data)
    }

    @PatchMapping("/sessions/{sessionId}")
    fun renameSession(
        @PathVariable sessionId: String,
        @RequestBody req: RenameRequest,
    ): ApiResponse<Map<String, Any>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "로그인 필요", HttpStatus.UNAUTHORIZED)
        agentService.renameSession(sessionId, userId, req.title)
        return ApiResponse(success = true, data = mapOf("ok" to true))
    }

    @DeleteMapping("/sessions/{sessionId}")
    fun archiveSession(@PathVariable sessionId: String): ApiResponse<Map<String, Any>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "로그인 필요", HttpStatus.UNAUTHORIZED)
        agentService.archiveSession(sessionId, userId)
        return ApiResponse(success = true, data = mapOf("ok" to true))
    }

    // ─── 메시지 전송 ───────────────────────────────────

    @PostMapping("/turns")
    fun postTurn(@RequestBody req: TurnRequest): ApiResponse<TurnResultView> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "로그인 필요", HttpStatus.UNAUTHORIZED)
        val role = if (SecurityUtils.hasAnyRole("HQ_ADMIN")) "HQ_ADMIN" else "ORG_ADMIN"
        val orgId = if (role == "ORG_ADMIN") {
            membershipRepository.findByUserIdAndStatus(userId, "active")
                .firstOrNull { it.role == "ORG_ADMIN" }?.orgId
        } else null

        val result = agentService.processTurn(
            sessionIdInput = req.sessionId,
            userId = userId,
            role = role,
            orgId = orgId,
            userText = req.message,
        )
        return ApiResponse(
            success = true,
            data = TurnResultView(
                sessionId = result.sessionId,
                assistantMessageId = result.assistantMessageId,
                assistantText = result.assistantText,
                toolCallsExecuted = result.toolCallsExecuted,
                isExtra = result.isExtra,
                grapefruitSpent = result.grapefruitSpent,
                inputTokens = result.inputTokens,
                outputTokens = result.outputTokens,
            ),
        )
    }
}

// ─── DTO ───────────────────────────────────

data class RenameRequest(val title: String)

data class TurnRequest(
    val sessionId: String? = null,
    val message: String,
)

data class TurnResultView(
    val sessionId: String,
    val assistantMessageId: String,
    val assistantText: String,
    val toolCallsExecuted: Int,
    val isExtra: Boolean,
    val grapefruitSpent: Int,
    val inputTokens: Int,
    val outputTokens: Int,
)

data class SessionView(
    val id: String,
    val title: String?,
    val status: String,
    val createdAt: String,
    val updatedAt: String,
)

data class MessageView(
    val id: String,
    val role: String,
    val content: String?,
    val functionName: String?,
    val status: String?,
    val createdAt: String,
)

private fun AgentChatSessionEntity.toView() = SessionView(
    id = id,
    title = title,
    status = status,
    createdAt = createdAt.toString(),
    updatedAt = updatedAt.toString(),
)

private fun AgentChatMessageEntity.toView() = MessageView(
    id = id,
    role = role,
    content = content,
    functionName = functionName,
    status = status,
    createdAt = createdAt.toString(),
)
