package com.korfarm.api.questionbank

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface QbCodeGroupRepository : JpaRepository<QbCodeGroupEntity, String> {
    fun findAllByOrderBySortOrder(): List<QbCodeGroupEntity>
    fun findByGroupKey(groupKey: String): QbCodeGroupEntity?
}

interface QbCodeValueRepository : JpaRepository<QbCodeValueEntity, String> {
    fun findByGroupIdOrderBySortOrder(groupId: String): List<QbCodeValueEntity>
    fun findByGroupIdAndIsActiveOrderBySortOrder(groupId: String, isActive: Boolean): List<QbCodeValueEntity>
    fun existsByGroupIdAndValue(groupId: String, value: String): Boolean
}

interface QbRecordRepository : JpaRepository<QbRecordEntity, String> {
    fun findByRecordCode(recordCode: String): QbRecordEntity?
    fun existsByRecordCode(recordCode: String): Boolean
    fun findByStatusNot(status: String): List<QbRecordEntity>

    @Query("SELECT r FROM QbRecordEntity r WHERE r.status != 'archived' ORDER BY r.updatedAt DESC")
    fun findAllActive(): List<QbRecordEntity>

    @Query("""
        SELECT r FROM QbRecordEntity r
        WHERE r.status != 'archived'
        AND (:area IS NULL OR r.area = :area)
        AND (:subArea IS NULL OR r.subArea = :subArea)
        AND (:sourceType IS NULL OR r.sourceType = :sourceType)
        AND (:status IS NULL OR r.status = :status)
        ORDER BY r.updatedAt DESC
    """)
    fun findFiltered(
        area: String?,
        subArea: String?,
        sourceType: String?,
        status: String?
    ): List<QbRecordEntity>
}

interface QbPassageRepository : JpaRepository<QbPassageEntity, String> {
    fun findByRecordIdOrderBySortOrder(recordId: String): List<QbPassageEntity>
    fun deleteByRecordId(recordId: String)
}

interface QbQuestionRepository : JpaRepository<QbQuestionEntity, String> {
    fun findByRecordIdOrderBySortOrder(recordId: String): List<QbQuestionEntity>
    fun countByRecordId(recordId: String): Long
    fun deleteByRecordId(recordId: String)
}

interface QbRecordVersionRepository : JpaRepository<QbRecordVersionEntity, String> {
    fun findByRecordIdOrderByCreatedAtDesc(recordId: String): List<QbRecordVersionEntity>
}
