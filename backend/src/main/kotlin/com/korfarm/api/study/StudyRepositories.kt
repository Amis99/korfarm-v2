package com.korfarm.api.study

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface StudyContentRepository : JpaRepository<StudyContentEntity, String> {

    fun findAllByStatusOrderByCreatedAtDesc(status: String): List<StudyContentEntity>

    fun findAllByOwnerOrgIdAndStatusOrderByCreatedAtDesc(
        ownerOrgId: String, status: String
    ): List<StudyContentEntity>

    @Query(
        "SELECT s FROM StudyContentEntity s " +
        "WHERE s.status = 'active' " +
        "AND (s.visibility = 'PUBLIC' OR (s.visibility = 'ORG' AND s.ownerOrgId = :orgId)) " +
        "ORDER BY s.createdAt DESC"
    )
    fun findVisibleForStudent(@Param("orgId") orgId: String?): List<StudyContentEntity>

    @Query(
        "SELECT s FROM StudyContentEntity s " +
        "WHERE s.status = 'active' AND s.visibility = 'PUBLIC' " +
        "ORDER BY s.createdAt DESC"
    )
    fun findVisibleForStudentNoOrg(): List<StudyContentEntity>
}

interface StudyQuestionRepository : JpaRepository<StudyQuestionEntity, String> {

    fun findAllByContentIdOrderByQuestionNoAsc(contentId: String): List<StudyQuestionEntity>

    fun countByContentId(contentId: String): Int

    fun deleteAllByContentId(contentId: String)
}

interface StudyAttemptRepository : JpaRepository<StudyAttemptEntity, String> {

    fun findAllByUserIdAndContentIdOrderByAttemptedAtDesc(
        userId: String, contentId: String
    ): List<StudyAttemptEntity>

    fun findAllBySessionId(sessionId: String): List<StudyAttemptEntity>

    fun countByUserIdAndContentId(userId: String, contentId: String): Int
}

interface StudyProgressRepository : JpaRepository<StudyProgressEntity, StudyProgressId> {

    @Query(
        "SELECT p FROM StudyProgressEntity p " +
        "WHERE p.userId = :userId AND p.contentId = :contentId"
    )
    fun findOne(@Param("userId") userId: String, @Param("contentId") contentId: String): StudyProgressEntity?
}
