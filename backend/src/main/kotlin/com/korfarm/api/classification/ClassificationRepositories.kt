package com.korfarm.api.classification

import org.springframework.data.jpa.repository.JpaRepository

interface ClassificationMasterRepository : JpaRepository<ClassificationMasterEntity, String> {
    fun findAllByActiveOrderBySortOrderAsc(active: Boolean): List<ClassificationMasterEntity>
    fun findAllByTypeAndActiveOrderBySortOrderAsc(type: String, active: Boolean): List<ClassificationMasterEntity>
}

interface ContentClassificationRepository : JpaRepository<ContentClassificationEntity, ContentClassificationId> {
    fun findByIdContentId(contentId: String): List<ContentClassificationEntity>
    fun deleteByIdContentId(contentId: String): Int
}

interface TestQuestionClassificationRepository : JpaRepository<TestQuestionClassificationEntity, TestQuestionClassificationId> {
    fun findByIdQuestionId(questionId: String): List<TestQuestionClassificationEntity>
    fun deleteByIdQuestionId(questionId: String): Int
}
