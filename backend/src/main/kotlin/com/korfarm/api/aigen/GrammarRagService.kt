package com.korfarm.api.aigen

import org.springframework.stereotype.Service

/**
 * 문법 RAG — Phase 1: 토픽 키워드 기반 단순 검색.
 * 향후 임베딩 기반 검색으로 확장 가능.
 */
@Service
class GrammarRagService(
    private val grammarCorpusRepo: GrammarCorpusRepository,
) {
    /**
     * 토픽으로 최근 자료 N개 fetch.
     * @return 자료 본문 markdown 리스트 (시스템 프롬프트에 첨부될 수 있게 단순 String)
     */
    fun fetchByTopic(topic: String, limit: Int = 3, maxCharsPerItem: Int = 8000): List<String> {
        val rows = grammarCorpusRepo.findByTopicAndStatusOrderByCreatedAtDesc(topic, "active")
        return rows.take(limit).map { row ->
            val title = "[${row.title}] (출처: ${row.source ?: "-"})"
            val body = if (row.contentMd.length > maxCharsPerItem)
                row.contentMd.substring(0, maxCharsPerItem) + "\n\n…(생략)"
            else row.contentMd
            "$title\n$body"
        }
    }

    fun listTopics(): List<TopicCount> {
        val rows = grammarCorpusRepo.findByStatusOrderByCreatedAtDesc("active")
        return rows.groupingBy { it.topic }.eachCount()
            .entries.sortedByDescending { it.value }
            .map { TopicCount(it.key, it.value) }
    }

    data class TopicCount(val topic: String, val count: Int)
}
