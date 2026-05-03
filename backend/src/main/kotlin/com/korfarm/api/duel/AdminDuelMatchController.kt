package com.korfarm.api.duel

import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.system.FeatureFlagService
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
    private val featureFlagService: FeatureFlagService,
    private val objectMapper: ObjectMapper
) {
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
            mapOf<String, Any?>(
                "id" to m.id,
                "seasonId" to m.seasonId,
                "serverId" to m.serverId,
                "roomId" to m.roomId,
                "status" to m.status,
                "playerCount" to players.size,
                "winnerUserId" to players.firstOrNull { it.result == "WIN" }?.userId,
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
                "result" to p.result,
                "rankPosition" to p.rankPosition,
                "stakeAmount" to p.stakeAmount,
                "correctCount" to p.correctCount,
                "totalTimeMs" to p.totalTimeMs,
                "rewardAmount" to p.rewardAmount
            )
        }
        val questions = duelQuestionRepository.findByMatchIdOrderByOrderIndexAsc(matchId).map { q ->
            // 풀에서 stem 한 번 조회 (없으면 빈 문자열)
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
        val answers = duelAnswerRepository.findByMatchId(matchId).map { a ->
            mapOf<String, Any?>(
                "userId" to a.userId,
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
