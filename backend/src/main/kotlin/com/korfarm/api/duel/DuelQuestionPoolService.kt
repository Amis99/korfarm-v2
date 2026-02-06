package com.korfarm.api.duel

import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.IdGenerator
import org.springframework.stereotype.Service
import java.time.LocalDateTime

@Service
class DuelQuestionPoolService(
    private val duelQuestionPoolRepository: DuelQuestionPoolRepository,
    private val objectMapper: ObjectMapper
) {
    // 서버별 문제 선정: 퀴즈형 quizCount + 독해형 readingCount (랜덤)
    fun selectQuestions(serverId: String, quizCount: Int = 6, readingCount: Int = 4): List<DuelQuestionPoolEntity> {
        val quizPool = duelQuestionPoolRepository
            .findByServerIdAndQuestionTypeAndStatus(serverId, "QUIZ", "ACTIVE")
        val readingPool = duelQuestionPoolRepository
            .findByServerIdAndQuestionTypeAndStatus(serverId, "READING", "ACTIVE")

        val selectedQuiz = selectWithCategoryDiversity(quizPool, quizCount)
        val selectedReading = selectWithCategoryDiversity(readingPool, readingCount)

        return selectedQuiz + selectedReading
    }

    // 같은 카테고리에서 최대 2문제만 선정하여 다양성 보장
    private fun selectWithCategoryDiversity(
        pool: List<DuelQuestionPoolEntity>,
        count: Int,
        maxPerCategory: Int = 2
    ): List<DuelQuestionPoolEntity> {
        if (pool.size <= count) return pool.shuffled()

        val shuffled = pool.shuffled()
        val selected = mutableListOf<DuelQuestionPoolEntity>()
        val categoryCounts = mutableMapOf<String, Int>()

        for (q in shuffled) {
            if (selected.size >= count) break
            val catCount = categoryCounts.getOrDefault(q.category, 0)
            if (catCount < maxPerCategory) {
                selected.add(q)
                categoryCounts[q.category] = catCount + 1
            }
        }

        if (selected.size < count) {
            val remaining = shuffled.filter { it !in selected }
            selected.addAll(remaining.take(count - selected.size))
        }

        return selected
    }

    // 문제 JSON에서 정답 ID 추출
    fun getAnswerId(questionJson: String): String? {
        return try {
            val node = objectMapper.readTree(questionJson)
            node.get("answerId")?.asText()
        } catch (e: Exception) {
            null
        }
    }

    // 문제 JSON → DuelQuestionView 변환 (정답 제외, 선택지 순서 랜덤)
    fun toQuestionView(entity: DuelQuestionPoolEntity, orderIndex: Int): DuelQuestionView {
        val node = objectMapper.readTree(entity.questionJson)
        val choices = node.get("choices")?.map { choice ->
            DuelChoiceView(
                id = choice.get("id").asText(),
                text = choice.get("text").asText()
            )
        }?.shuffled() ?: emptyList() // 선택지 순서 랜덤

        return DuelQuestionView(
            questionId = entity.id,
            orderIndex = orderIndex,
            questionType = entity.questionType,
            category = entity.category,
            stem = node.get("stem")?.asText() ?: "",
            passage = node.get("passage")?.asText(),
            choices = choices,
            timeLimitSec = node.get("timeLimitSec")?.asInt()
        )
    }

    // === 관리자 기능: 문제 추가/수정/삭제 ===

    // JSON 배열로 문제 일괄 등록
    fun importQuestions(jsonArray: String): Int {
        val nodes = objectMapper.readTree(jsonArray)
        if (!nodes.isArray) throw IllegalArgumentException("JSON 배열 형식이어야 합니다")

        var count = 0
        for (node in nodes) {
            val serverId = node.get("serverId")?.asText() ?: continue
            val questionType = node.get("questionType")?.asText() ?: continue
            val category = node.get("category")?.asText() ?: continue
            val id = node.get("id")?.asText() ?: IdGenerator.newId("dq")

            val entity = DuelQuestionPoolEntity(
                id = id,
                serverId = serverId,
                questionType = questionType,
                category = category,
                questionJson = objectMapper.writeValueAsString(node),
                status = "ACTIVE"
            )
            duelQuestionPoolRepository.save(entity)
            count++
        }
        return count
    }

    // 단일 문제 등록
    fun addQuestion(questionJson: String): DuelQuestionPoolEntity {
        val node = objectMapper.readTree(questionJson)
        val serverId = node.get("serverId")?.asText() ?: throw IllegalArgumentException("serverId 필수")
        val questionType = node.get("questionType")?.asText() ?: throw IllegalArgumentException("questionType 필수")
        val category = node.get("category")?.asText() ?: throw IllegalArgumentException("category 필수")
        val id = node.get("id")?.asText() ?: IdGenerator.newId("dq")

        val entity = DuelQuestionPoolEntity(
            id = id,
            serverId = serverId,
            questionType = questionType,
            category = category,
            questionJson = questionJson,
            status = "ACTIVE"
        )
        return duelQuestionPoolRepository.save(entity)
    }

    // 문제 비활성화
    fun deactivateQuestion(questionId: String): Boolean {
        val entity = duelQuestionPoolRepository.findById(questionId).orElse(null) ?: return false
        entity.status = "INACTIVE"
        duelQuestionPoolRepository.save(entity)
        return true
    }

    // 서버별 문제 수 조회
    fun countByServer(): Map<String, Map<String, Int>> {
        val servers = listOf("saussure", "frege", "russell", "wittgenstein")
        val result = mutableMapOf<String, Map<String, Int>>()
        for (server in servers) {
            val active = duelQuestionPoolRepository.findByServerIdAndStatus(server, "ACTIVE")
            val quizCount = active.count { it.questionType == "QUIZ" }
            val readingCount = active.count { it.questionType == "READING" }
            result[server] = mapOf("quiz" to quizCount, "reading" to readingCount, "total" to active.size)
        }
        return result
    }

    // 서버별 문제 목록 조회
    fun listByServer(serverId: String): List<Map<String, Any>> {
        val entities = duelQuestionPoolRepository.findByServerIdAndStatus(serverId, "ACTIVE")
        return entities.map { e ->
            mapOf(
                "id" to e.id,
                "serverId" to e.serverId,
                "questionType" to e.questionType,
                "category" to e.category,
                "status" to e.status,
                "createdAt" to e.createdAt.toString()
            )
        }
    }
}
