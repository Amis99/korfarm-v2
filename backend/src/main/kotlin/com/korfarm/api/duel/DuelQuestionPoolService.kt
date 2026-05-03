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

    // 풀의 모든 활성 문제를 셔플하여 반환 (문제 수 제한 없이 전체 출제)
    fun selectAllQuestions(serverId: String): List<DuelQuestionPoolEntity> {
        val quizPool = duelQuestionPoolRepository
            .findByServerIdAndQuestionTypeAndStatus(serverId, "QUIZ", "ACTIVE")
        val readingPool = duelQuestionPoolRepository
            .findByServerIdAndQuestionTypeAndStatus(serverId, "READING", "ACTIVE")
        return (quizPool + readingPool).shuffled()
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

    // 문제 수정
    fun updateQuestion(questionId: String, questionJson: String): DuelQuestionPoolEntity {
        val entity = duelQuestionPoolRepository.findById(questionId).orElseThrow {
            IllegalArgumentException("문제를 찾을 수 없습니다: $questionId")
        }
        val node = objectMapper.readTree(questionJson)
        entity.questionType = node.get("questionType")?.asText() ?: entity.questionType
        entity.category = node.get("category")?.asText() ?: entity.category
        entity.questionJson = questionJson
        entity.updatedAt = LocalDateTime.now()
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
            // 목록에서도 발문 일부 + 검색 대상(지문·선택지) 추출
            var stem = ""
            var passage = ""
            var choicesText = ""
            try {
                val node = objectMapper.readTree(e.questionJson)
                stem = node.get("stem")?.asText() ?: ""
                passage = node.get("passage")?.asText() ?: ""
                val choices = node.get("choices")
                if (choices != null && choices.isArray) {
                    choicesText = choices.joinToString(" | ") { it.get("text")?.asText() ?: "" }
                }
            } catch (ex: Exception) { /* ignore */ }
            // 수정 이력 여부 — PrePersist 가 createdAt/updatedAt 을 동일 now 로 설정하므로
            // updatedAt 이 createdAt 보다 뒤이면 수정된 적 있음
            val edited = e.updatedAt.isAfter(e.createdAt)
            mapOf(
                "id" to e.id,
                "serverId" to e.serverId,
                "questionType" to e.questionType,
                "category" to e.category,
                "status" to e.status,
                "stem" to stem,
                "passage" to passage,
                "choicesText" to choicesText,
                "edited" to edited,
                "createdAt" to e.createdAt.toString(),
                "updatedAt" to e.updatedAt.toString()
            )
        }
    }

    // 개별 문제 상세 조회 (questionJson 파싱 포함)
    fun getQuestionDetail(questionId: String): Map<String, Any?>? {
        val entity = duelQuestionPoolRepository.findById(questionId).orElse(null) ?: return null
        val node = objectMapper.readTree(entity.questionJson)
        val choices = node.get("choices")?.map { choice ->
            mapOf("id" to choice.get("id").asText(), "text" to choice.get("text").asText())
        } ?: emptyList()

        return mapOf(
            "id" to entity.id,
            "serverId" to entity.serverId,
            "questionType" to entity.questionType,
            "category" to entity.category,
            "status" to entity.status,
            "stem" to (node.get("stem")?.asText() ?: ""),
            "passage" to node.get("passage")?.asText(),
            "choices" to choices,
            "answerId" to (node.get("answerId")?.asText() ?: ""),
            "timeLimitSec" to (node.get("timeLimitSec")?.asInt() ?: 15),
            "createdAt" to entity.createdAt.toString()
        )
    }
}
