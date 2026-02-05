package com.korfarm.api.test

import org.springframework.data.jpa.repository.JpaRepository

interface TestPaperRepo : JpaRepository<TestPaperEntity, String> {
    fun findByStatus(status: String): List<TestPaperEntity>
    fun findByLevelId(levelId: String): List<TestPaperEntity>
    fun findByLevelIdAndStatus(levelId: String, status: String): List<TestPaperEntity>
}

interface TestQuestionRepo : JpaRepository<TestQuestionEntity, String> {
    fun findByTestIdOrderByNumberAsc(testId: String): List<TestQuestionEntity>
    fun deleteByTestId(testId: String)
}

interface TestSubmissionRepo : JpaRepository<TestSubmissionEntity, String> {
    fun findByTestIdAndUserId(testId: String, userId: String): TestSubmissionEntity?
    fun findByUserId(userId: String): List<TestSubmissionEntity>
    fun findByTestId(testId: String): List<TestSubmissionEntity>
}
