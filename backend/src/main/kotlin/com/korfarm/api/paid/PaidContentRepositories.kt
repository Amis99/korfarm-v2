package com.korfarm.api.paid

import com.korfarm.api.test.TestPaperEntity
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface ContentRepository : JpaRepository<ContentEntity, String> {
    fun findByContentTypeAndStatus(contentType: String, status: String): List<ContentEntity>
    fun findFirstByContentTypeAndChapterId(contentType: String, chapterId: String): ContentEntity?
    fun findByStatus(status: String): List<ContentEntity>
    fun findByAreaAndStatus(area: String, status: String): List<ContentEntity>
    fun findByAreaAndLevelIdAndStatus(area: String, levelId: String, status: String): List<ContentEntity>
    fun findByContentTypeAndLevelIdAndStatus(contentType: String, levelId: String, status: String): List<ContentEntity>

    /** categories JSON 배열 또는 content_type 단일 값에서 다중 카테고리 검색 */
    @Query(value = """
        SELECT * FROM contents
        WHERE status = :status
          AND (content_type = :ct OR JSON_CONTAINS(categories, CONCAT('"', :ct, '"')))
    """, nativeQuery = true)
    fun findByCategoryAndStatus(ct: String, status: String): List<ContentEntity>

    @Query(value = """
        SELECT * FROM contents
        WHERE status = :status
          AND level_id = :levelId
          AND (content_type = :ct OR JSON_CONTAINS(categories, CONCAT('"', :ct, '"')))
    """, nativeQuery = true)
    fun findByCategoryAndLevelIdAndStatus(ct: String, levelId: String, status: String): List<ContentEntity>

    /** 다중 카테고리 OR 검색 — JSON_OVERLAPS로 categories 배열에 cts 중 하나라도 매칭. */
    @Query(value = """
        SELECT * FROM contents
        WHERE status = :status
          AND (content_type IN (:cts) OR JSON_OVERLAPS(categories, CAST(:ctsJson AS JSON)))
    """, nativeQuery = true)
    fun findByCategoriesInAndStatus(cts: List<String>, ctsJson: String, status: String): List<ContentEntity>

    @Query(value = """
        SELECT * FROM contents
        WHERE status = :status
          AND level_id = :levelId
          AND (content_type IN (:cts) OR JSON_OVERLAPS(categories, CAST(:ctsJson AS JSON)))
    """, nativeQuery = true)
    fun findByCategoriesInAndLevelIdAndStatus(cts: List<String>, ctsJson: String, levelId: String, status: String): List<ContentEntity>

    @Query("""
        SELECT c FROM ContentEntity c
        WHERE c.status = 'active'
          AND (c.title LIKE :keyword OR c.area LIKE :keyword OR c.subArea LIKE :keyword
               OR c.levelId LIKE :keyword OR c.moduleKey LIKE :keyword)
          AND (:contentType IS NULL OR c.contentType = :contentType)
          AND (:levelId IS NULL OR c.levelId = :levelId)
          AND (:area IS NULL OR c.area = :area)
    """)
    fun searchByKeyword(
        keyword: String,
        contentType: String?,
        levelId: String?,
        area: String?,
        pageable: Pageable
    ): Page<ContentEntity>
}

interface ContentVersionRepository : JpaRepository<ContentVersionEntity, String> {
    fun findTopByContentIdOrderByCreatedAtDesc(contentId: String): ContentVersionEntity?
    fun deleteAllByContentId(contentId: String)
    fun findByContentIdAndSchemaVersion(contentId: String, schemaVersion: String): ContentVersionEntity?

    /** 본문/문제 검색: content_json 에 query 가 포함된 최신 버전 row 들.
     *  각 content_id 별로 가장 최근(created_at DESC) 1개만 골라서 반환. */
    @org.springframework.data.jpa.repository.Query(
        """
        SELECT cv FROM ContentVersionEntity cv
        WHERE cv.contentJson LIKE CONCAT('%', :query, '%')
          AND cv.createdAt = (
              SELECT MAX(cv2.createdAt) FROM ContentVersionEntity cv2
              WHERE cv2.contentId = cv.contentId
          )
        """
    )
    fun searchLatestByJsonContent(@org.springframework.data.repository.query.Param("query") query: String): List<ContentVersionEntity>
}

interface TestPaperRepository : JpaRepository<TestPaperEntity, String> {
    fun findByStatus(status: String): List<TestPaperEntity>
}

interface TestAnswerKeyRepository : JpaRepository<TestAnswerKeyEntity, String> {
    fun findTopByTestIdOrderByCreatedAtDesc(testId: String): TestAnswerKeyEntity?
}

interface TestResultRepository : JpaRepository<TestResultEntity, String> {
    fun findByTestIdAndUserId(testId: String, userId: String): TestResultEntity?
}

interface ContentEditLogRepository : JpaRepository<ContentEditLogEntity, String> {
    fun findByContentIdOrderByCreatedAtDesc(contentId: String): List<ContentEditLogEntity>
    fun findByEditorIdOrderByCreatedAtDesc(editorId: String): List<ContentEditLogEntity>
    fun deleteAllByContentId(contentId: String)
}
