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
    @Query(
        value = """
        SELECT * FROM ai_chat_references
        WHERE MATCH(content) AGAINST(:keyword IN BOOLEAN MODE)
        ORDER BY
            CASE source
                WHEN 'program_doc' THEN 0
                WHEN 'kakao_cho' THEN 1
                ELSE 2
            END,
            spoken_at DESC
        LIMIT :lim
        """,
        nativeQuery = true
    )
    fun searchRelevant(
        @Param("keyword") keyword: String,
        @Param("lim") limit: Int
    ): List<AiChatReferenceEntity>
}
