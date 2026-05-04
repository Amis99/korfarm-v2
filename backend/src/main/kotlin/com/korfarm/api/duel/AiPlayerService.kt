package com.korfarm.api.duel

import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.chat.ChatEmoticonRepository
import org.springframework.stereotype.Service
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.ThreadLocalRandom

/**
 * AI 플레이어 — 능력치/이름/이모티콘 시리즈는 DB(duel_settings JSON 의 ai_players 키) 에서 로드.
 *
 * 정답 확률 = base × accuracy
 *   - base : 그 문제의 학생(AI 제외) 정답률.  데이터가 없으면 1.0
 *   - accuracy : 어드민 슬라이더로 0.7~1.0 사이 설정
 *
 * 프로필 이미지는 채팅 이모티콘 시리즈명을 통해 chat_emoticons 테이블에서 첫 번째(sort_order 가장 작은)
 * fileId 를 lookup. 시리즈 → fileId 캐싱.
 */
@Service
class AiPlayerService(
    private val questionPoolService: DuelQuestionPoolService,
    private val duelQuestionPoolRepo: DuelQuestionPoolRepository,
    private val duelAnswerRepository: DuelAnswerRepository,
    private val duelSettingsRepository: DuelSettingsRepository,
    private val chatEmoticonRepository: ChatEmoticonRepository,
    private val objectMapper: ObjectMapper
) {
    companion object {
        const val AI_STAKE_AMOUNT = 2
        const val DEFAULTS_ID = "default"

        /** 코드 default — DB 비었을 때 사용. 사용자 요청 매핑(2026-05-04). */
        val DEFAULT_AI_PLAYERS = listOf(
            AiPlayer("ai_player_1", "포도", 0.95, "포도는 야옹이"),
            AiPlayer("ai_player_2", "닥터뵹", 0.90, "닥터 뵹"),
            AiPlayer("ai_player_3", "감규리", 0.90, "감규리 시리즈"),
        )
    }

    data class AiPlayer(
        val id: String,
        val name: String,
        /** 0.7~1.0. 어드민 슬라이더로 조절. 정답 확률은 base × accuracy. */
        val accuracy: Double,
        /** chat_emoticons.series 와 일치해야 함. */
        val emoticonSeries: String
    )

    private val emoticonFileIdCache = ConcurrentHashMap<String, String>()

    fun isAiPlayer(userId: String) = userId.startsWith("ai_player_")

    /** 모든 AI 플레이어 (DB 우선, 없으면 default). */
    fun getAllAiPlayers(): List<AiPlayer> {
        val row = duelSettingsRepository.findById(DEFAULTS_ID).orElse(null)
        if (row != null) {
            try {
                @Suppress("UNCHECKED_CAST")
                val map = objectMapper.readValue(row.settingsJson, Map::class.java) as Map<String, Any?>
                val list = map["ai_players"] as? List<Map<String, Any?>>
                if (list != null) {
                    val parsed = list.mapNotNull { parsed -> parseAiPlayer(parsed) }
                    if (parsed.isNotEmpty()) return parsed
                }
            } catch (_: Exception) { /* fallback */ }
        }
        return DEFAULT_AI_PLAYERS
    }

    private fun parseAiPlayer(map: Map<String, Any?>): AiPlayer? {
        val id = map["id"] as? String ?: return null
        val name = map["name"] as? String ?: return null
        val accRaw = (map["accuracy"] as? Number)?.toDouble() ?: 0.9
        val acc = accRaw.coerceIn(0.7, 1.0)
        val series = map["emoticonSeries"] as? String ?: ""
        return AiPlayer(id, name, acc, series)
    }

    fun getAiPlayer(userId: String) = getAllAiPlayers().find { it.id == userId }

    fun getAiPlayerName(userId: String) = getAiPlayer(userId)?.name ?: userId

    /** AI 프로필 file_id (없으면 null). 시리즈 첫 번째(sort_order 가장 작은) 이모티콘. */
    fun getAiAvatarFileId(userId: String): String? {
        val ai = getAiPlayer(userId) ?: return null
        return getAvatarFileIdForSeries(ai.emoticonSeries)
    }

    fun getAvatarFileIdForSeries(series: String): String? {
        if (series.isBlank()) return null
        emoticonFileIdCache[series]?.let { return it }
        val first = chatEmoticonRepository
            .findByStatusOrderBySeriesAscSortOrderAsc("active")
            .firstOrNull { it.series == series }
            ?: return null
        emoticonFileIdCache[series] = first.fileId
        return first.fileId
    }

    /** 캐시 무효화 — 어드민 저장 시 호출. */
    fun invalidateAvatarCache() {
        emoticonFileIdCache.clear()
    }

    /**
     * 문제별 base 정답률 — 학생(AI 제외) 의 누적 정답률. 응답 데이터 없으면 1.0.
     */
    fun computeBaseRate(questionId: String): Double {
        val answers = duelAnswerRepository.findByQuestionId(questionId)
            .filter { !isAiPlayer(it.userId) }
        if (answers.isEmpty()) return 1.0
        val correct = answers.count { it.isCorrect == true }
        return correct.toDouble() / answers.size
    }

    /**
     * AI 답변 결정 — base × accuracy 확률로 정답, 나머지는 오답 중 랜덤.
     */
    fun decideAnswer(aiPlayer: AiPlayer, questionId: String): String {
        val poolEntity = duelQuestionPoolRepo.findById(questionId).orElse(null)
            ?: return ""
        val correctId = questionPoolService.getAnswerId(poolEntity.questionJson) ?: return ""

        val base = computeBaseRate(questionId)
        val effective = (base * aiPlayer.accuracy).coerceIn(0.0, 1.0)

        if (ThreadLocalRandom.current().nextDouble() < effective) {
            return correctId
        }
        val node = objectMapper.readTree(poolEntity.questionJson)
        val choiceIds = node.get("choices")?.map { it.get("id").asText() } ?: return correctId
        val wrongIds = choiceIds.filter { it != correctId }
        return if (wrongIds.isNotEmpty()) wrongIds.random() else correctId
    }

    /** AI 답변 딜레이 (2~6초) */
    fun randomDelayMs(): Long = ThreadLocalRandom.current().nextLong(2000, 6001)

    /** 어드민 — 능력치만 갱신 (이름·시리즈는 고정). */
    fun saveAccuracies(updates: Map<String, Double>, userId: String) {
        val current = getAllAiPlayers()
        val merged = current.map { ai ->
            val acc = updates[ai.id]?.coerceIn(0.7, 1.0) ?: ai.accuracy
            ai.copy(accuracy = acc)
        }
        val payload = mapOf(
            "ai_players" to merged.map {
                mapOf(
                    "id" to it.id,
                    "name" to it.name,
                    "accuracy" to it.accuracy,
                    "emoticonSeries" to it.emoticonSeries
                )
            }
        )
        // 기존 settings 와 merge
        val existing = duelSettingsRepository.findById(DEFAULTS_ID).orElse(null)
        val baseMap: MutableMap<String, Any?> = if (existing != null) {
            try {
                @Suppress("UNCHECKED_CAST")
                (objectMapper.readValue(existing.settingsJson, Map::class.java) as Map<String, Any?>).toMutableMap()
            } catch (_: Exception) { mutableMapOf() }
        } else mutableMapOf()
        baseMap["ai_players"] = payload["ai_players"]
        val json = objectMapper.writeValueAsString(baseMap)
        if (existing != null) {
            existing.settingsJson = json
            existing.updatedAt = java.time.LocalDateTime.now()
            existing.updatedBy = userId
            duelSettingsRepository.save(existing)
        } else {
            duelSettingsRepository.save(
                DuelSettingsEntity(
                    id = DEFAULTS_ID,
                    settingsJson = json,
                    updatedAt = java.time.LocalDateTime.now(),
                    updatedBy = userId
                )
            )
        }
    }
}
