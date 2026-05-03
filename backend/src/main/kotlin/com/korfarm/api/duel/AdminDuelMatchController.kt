package com.korfarm.api.duel

import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.system.FeatureFlagService
import com.korfarm.api.user.UserRepository
import org.springframework.data.domain.PageRequest
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

/**
 * 어드민 — 듀얼 매치 기록 조회 (페이지네이션 + 필터 + 라운드별 답변 상세).
 */
@RestController
@RequestMapping("/v1/admin/duel/matches")
class AdminDuelMatchController(
    private val duelMatchRepository: DuelMatchRepository,
    private val duelMatchPlayerRepository: DuelMatchPlayerRepository,
    private val duelQuestionRepository: DuelQuestionRepository,
    private val duelAnswerRepository: DuelAnswerRepository,
    private val duelEscrowRepository: DuelEscrowRepository,
    private val duelQuestionPoolRepository: DuelQuestionPoolRepository,
    private val userRepository: UserRepository,
    private val featureFlagService: FeatureFlagService,
    private val objectMapper: ObjectMapper
) {
    /** userId → 사용자 표시용 메타 (이름 / 학교 / 학년). AI 플레이어는 그대로 ID. */
    private fun userMeta(userId: String): Map<String, Any?> {
        if (userId.startsWith("ai_player_")) {
            return mapOf("userId" to userId, "displayName" to "AI ${userId.removePrefix("ai_player_")}", "isAi" to true)
        }
        val u = userRepository.findById(userId).orElse(null)
        if (u == null) return mapOf("userId" to userId, "displayName" to userId, "isAi" to false)
        val school = u.school?.takeIf { it.isNotBlank() }
        val grade = u.gradeLabel?.takeIf { it.isNotBlank() }
        val name = u.name?.takeIf { it.isNotBlank() } ?: u.email
        val parts = listOfNotNull(school, grade).joinToString(" ")
        return mapOf(
            "userId" to userId,
            "displayName" to if (parts.isNotBlank()) "$name ($parts)" else name,
            "name" to name,
            "school" to school,
            "grade" to grade,
            "isAi" to false
        )
    }
    @GetMapping
    fun list(
        @RequestParam(required = false) serverId: String?,
        @RequestParam(required = false) status: String?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ApiResponse<Map<String, Any?>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        val pageable = PageRequest.of(page, size.coerceIn(1, 100))
        val pageResult = when {
            serverId != null && status != null ->
                duelMatchRepository.findByServerIdAndStatusOrderByCreatedAtDesc(serverId, status, pageable)
            serverId != null -> duelMatchRepository.findByServerIdOrderByCreatedAtDesc(serverId, pageable)
            status != null -> duelMatchRepository.findByStatusOrderByCreatedAtDesc(status, pageable)
            else -> duelMatchRepository.findAllByOrderByCreatedAtDesc(pageable)
        }
        // 각 매치에 player count 포함
        val rows = pageResult.content.map { m ->
            val players = duelMatchPlayerRepository.findByMatchId(m.id)
            val winner = players.firstOrNull { it.result == "WIN" }
            mapOf<String, Any?>(
                "id" to m.id,
                "seasonId" to m.seasonId,
                "serverId" to m.serverId,
                "roomId" to m.roomId,
                "status" to m.status,
                "playerCount" to players.size,
                "winnerUserId" to winner?.userId,
                "winnerDisplay" to winner?.let { userMeta(it.userId)["displayName"] },
                "startedAt" to m.startedAt?.toString(),
                "endedAt" to m.endedAt?.toString(),
                "createdAt" to m.createdAt.toString()
            )
        }
        return ApiResponse(
            success = true,
            data = mapOf(
                "items" to rows,
                "page" to page,
                "size" to size,
                "totalElements" to pageResult.totalElements,
                "totalPages" to pageResult.totalPages
            )
        )
    }

    @GetMapping("/{matchId}")
    fun detail(@PathVariable matchId: String): ApiResponse<Map<String, Any?>> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        featureFlagService.requireEnabled("feature.admin.console")
        val match = duelMatchRepository.findById(matchId).orElseThrow {
            ApiException("NOT_FOUND", "match not found: $matchId", HttpStatus.NOT_FOUND)
        }
        val players = duelMatchPlayerRepository.findByMatchId(matchId).map { p ->
            mapOf<String, Any?>(
                "userId" to p.userId,
                "user" to userMeta(p.userId),
                "result" to p.result,
                "rankPosition" to p.rankPosition,
                "stakeAmount" to p.stakeAmount,
                "correctCount" to p.correctCount,
                "totalTimeMs" to p.totalTimeMs,
                "rewardAmount" to p.rewardAmount
            )
        }
        // 매치 시작 시 풀 전체가 INSERT 되었으므로(과거 버그), 실제 풀린 문제만 노출.
        // 풀린 기준 = duel_answers 에 등장한 questionId distinct.
        val playedQuestionIds = duelAnswerRepository.findByMatchId(matchId)
            .map { it.questionId }.toSet()
        val allQuestions = duelQuestionRepository.findByMatchIdOrderByOrderIndexAsc(matchId)
        val questions = allQuestions
            .filter { it.questionId in playedQuestionIds }
            .map { q ->
                val stem = duelQuestionPoolRepository.findById(q.questionId).orElse(null)?.let { pool ->
                    try { objectMapper.readTree(pool.questionJson).get("stem")?.asText() ?: "" }
                    catch (e: Exception) { "" }
                } ?: ""
                mapOf<String, Any?>(
                    "orderIndex" to q.orderIndex,
                    "questionId" to q.questionId,
                    "stem" to (if (stem.length > 80) stem.take(80) + "…" else stem)
                )
            }
            .sortedBy { it["orderIndex"] as Int }
        val answers = duelAnswerRepository.findByMatchId(matchId).map { a ->
            mapOf<String, Any?>(
                "userId" to a.userId,
                "user" to userMeta(a.userId),
                "questionId" to a.questionId,
                "answerJson" to a.answerJson,
                "isCorrect" to a.isCorrect,
                "timeMs" to a.timeMs,
                "submittedAt" to a.submittedAt.toString()
            )
        }
        val escrows = duelEscrowRepository.findByMatchId(matchId).map { e ->
            mapOf<String, Any?>(
                "userId" to e.userId,
                "user" to userMeta(e.userId),
                "seedType" to e.seedType,
                "amount" to e.amount,
                "status" to e.status
            )
        }
        return ApiResponse(
            success = true,
            data = mapOf(
                "match" to mapOf(
                    "id" to match.id,
                    "seasonId" to match.seasonId,
                    "serverId" to match.serverId,
                    "roomId" to match.roomId,
                    "status" to match.status,
                    "timeLimitSec" to match.timeLimitSec,
                    "startedAt" to match.startedAt?.toString(),
                    "endedAt" to match.endedAt?.toString(),
                    "createdAt" to match.createdAt.toString()
                ),
                "players" to players,
                "questions" to questions,
                "answers" to answers,
                "escrows" to escrows
            )
        )
    }
}
