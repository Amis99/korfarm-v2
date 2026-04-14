package com.korfarm.api.chat

import jakarta.persistence.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDateTime

@Entity
@Table(name = "ai_chat_references")
class AiChatReferenceEntity(
    @Id var id: String,
    @Column(nullable = false) var source: String = "kakao",
    @Column(nullable = false) var speaker: String,
    @Column(columnDefinition = "TEXT", nullable = false) var content: String,
    @Column(name = "spoken_at") var spokenAt: LocalDateTime? = null,
    @Column(name = "created_at", nullable = false) var createdAt: LocalDateTime = LocalDateTime.now()
)

interface AiChatReferenceRepository : JpaRepository<AiChatReferenceEntity, String> {
    /** 프로그램 문서는 항상 전부 로드 */
    fun findBySource(source: String): List<AiChatReferenceEntity>

    /** 카톡 발언 FULLTEXT 검색 (NATURAL LANGUAGE MODE) */
    @Query(
        value = """
        SELECT * FROM ai_chat_references
        WHERE source IN ('kakao_cho', 'kakao_humor')
          AND MATCH(content) AGAINST(:keyword IN NATURAL LANGUAGE MODE)
        ORDER BY spoken_at DESC
        LIMIT :lim
        """,
        nativeQuery = true
    )
    fun searchKakao(
        @Param("keyword") keyword: String,
        @Param("lim") limit: Int
    ): List<AiChatReferenceEntity>

    /** 문법 문서 FULLTEXT 검색 */
    @Query(
        value = """
        SELECT * FROM ai_chat_references
        WHERE source = 'grammar_doc'
          AND MATCH(content) AGAINST(:keyword IN NATURAL LANGUAGE MODE)
        LIMIT :lim
        """,
        nativeQuery = true
    )
    fun searchGrammar(
        @Param("keyword") keyword: String,
        @Param("lim") limit: Int
    ): List<AiChatReferenceEntity>
}
