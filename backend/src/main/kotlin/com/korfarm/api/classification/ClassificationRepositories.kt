package com.korfarm.api.classification

import org.springframework.data.jpa.repository.JpaRepository

interface ClassificationMasterRepository : JpaRepository<ClassificationMasterEntity, String> {
    fun findAllByActiveOrderBySortOrderAsc(active: Boolean): List<ClassificationMasterEntity>
    fun findAllByTypeAndActiveOrderBySortOrderAsc(type: String, active: Boolean): List<ClassificationMasterEntity>
}

interface ContentClassificationRepository : JpaRepository<ContentClassificationEntity, ContentClassificationId> {
    fun findByIdContentId(contentId: String): List<ContentClassificationEntity>
    fun deleteByIdContentId(contentId: String): Int

    /** 분류 코드별 매핑된 콘텐츠 ID 만 즉시 추출 — AI 비서 추천에서 사용 (전체 row 적재 X). */
    @org.springframework.data.jpa.repository.Query(
        "SELECT c.id.contentId FROM ContentClassificationEntity c WHERE c.id.classificationCode = :code"
    )
    fun findContentIdsByCode(code: String): List<String>
}

interface TestQuestionClassificationRepository : JpaRepository<TestQuestionClassificationEntity, TestQuestionClassificationId> {
    fun findByIdQuestionId(questionId: String): List<TestQuestionClassificationEntity>
    fun deleteByIdQuestionId(questionId: String): Int
}
