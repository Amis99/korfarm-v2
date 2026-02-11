package com.korfarm.api.duel

import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.stereotype.Service
import java.util.concurrent.ThreadLocalRandom

@Service
class AiPlayerService(
    private val questionPoolService: DuelQuestionPoolService,
    private val duelQuestionPoolRepo: DuelQuestionPoolRepository,
    private val objectMapper: ObjectMapper
) {
    companion object {
        val AI_PLAYERS = listOf(
            AiPlayer("ai_player_1", "민수 (AI)", 0.95),
            AiPlayer("ai_player_2", "영희 (AI)", 0.90),
            AiPlayer("ai_player_3", "철수 (AI)", 0.90),
        )
        const val AI_STAKE_AMOUNT = 2
    }

    data class AiPlayer(val id: String, val name: String, val accuracy: Double)

    fun isAiPlayer(userId: String) = userId.startsWith("ai_player_")

    fun getAiPlayer(userId: String) = AI_PLAYERS.find { it.id == userId }

    fun getAiPlayerName(userId: String) = getAiPlayer(userId)?.name ?: userId

    /**
     * AI 답변 결정: accuracy 확률로 정답, 나머지는 오답 중 랜덤
     */
    fun decideAnswer(aiPlayer: AiPlayer, questionId: String): String {
        val poolEntity = duelQuestionPoolRepo.findById(questionId).orElse(null)
            ?: return ""
        val correctId = questionPoolService.getAnswerId(poolEntity.questionJson) ?: return ""

        // accuracy 확률로 정답 선택
        if (ThreadLocalRandom.current().nextDouble() < aiPlayer.accuracy) {
            return correctId
        }

        // 오답 중 랜덤 선택
        val node = objectMapper.readTree(poolEntity.questionJson)
        val choiceIds = node.get("choices")?.map { it.get("id").asText() } ?: return correctId
        val wrongIds = choiceIds.filter { it != correctId }
        return if (wrongIds.isNotEmpty()) wrongIds.random() else correctId
    }

    /**
     * AI 답변 딜레이 (2~6초)
     */
    fun randomDelayMs(): Long = ThreadLocalRandom.current().nextLong(2000, 6001)
}
