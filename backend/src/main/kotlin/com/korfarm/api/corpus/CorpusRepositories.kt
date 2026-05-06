package com.korfarm.api.corpus

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface LearningCorpusRepository : JpaRepository<LearningCorpusEntity, String> {
    fun findByAreaAndStatusOrderByUpdatedAtDesc(area: String, status: String): List<LearningCorpusEntity>
    fun findByStatusOrderByUpdatedAtDesc(status: String): List<LearningCorpusEntity>

    @Query("""
        SELECT c FROM LearningCorpusEntity c
        WHERE c.status = 'active'
          AND (:area IS NULL OR c.area = :area)
          AND (:subArea IS NULL OR c.subArea = :subArea)
          AND (:genre IS NULL OR c.genre = :genre)
          AND (:era IS NULL OR c.era = :era)
          AND (:field IS NULL OR c.field = :field)
          AND (:keyword IS NULL OR LOWER(c.title) LIKE :keyword OR LOWER(c.author) LIKE :keyword OR LOWER(c.topic) LIKE :keyword)
        ORDER BY c.updatedAt DESC
    """)
    fun search(
        @Param("area") area: String?,
        @Param("subArea") subArea: String?,
        @Param("genre") genre: String?,
        @Param("era") era: String?,
        @Param("field") field: String?,
        @Param("keyword") keyword: String?,
        pageable: Pageable,
    ): Page<LearningCorpusEntity>
}

interface LearningCorpusItemRepository : JpaRepository<LearningCorpusItemEntity, String> {
    fun findByCorpusIdAndStatusOrderByCreatedAtAsc(corpusId: String, status: String): List<LearningCorpusItemEntity>
    fun findByCorpusIdAndItemTypeAndStatusOrderByCreatedAtAsc(corpusId: String, itemType: String, status: String): List<LearningCorpusItemEntity>
    fun findBySourceContentId(sourceContentId: String): List<LearningCorpusItemEntity>
    fun countByCorpusIdAndStatus(corpusId: String, status: String): Long
}

interface PendingCheckpointRepository : JpaRepository<PendingCheckpointEntity, String> {
    fun findByStatusOrderByCreatedAtDesc(status: String): List<PendingCheckpointEntity>
    fun findBySourceContentId(sourceContentId: String): List<PendingCheckpointEntity>
    fun findBySourceOrgIdAndStatusOrderByCreatedAtDesc(sourceOrgId: String, status: String): List<PendingCheckpointEntity>
    fun countByStatus(status: String): Long
}
