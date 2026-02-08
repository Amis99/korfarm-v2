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

    // 최근 N일 이내 테스트 응시 건수 (전체)
    fun countByCreatedAtAfter(since: java.time.LocalDateTime): Long

    // 최근 N일 이내 테스트 응시 건수 (특정 기관 시험지만)
    @org.springframework.data.jpa.repository.Query(
        "SELECT COUNT(s) FROM TestSubmissionEntity s " +
        "WHERE s.createdAt >= :since " +
        "AND s.testId IN (SELECT t.id FROM TestPaperEntity t WHERE t.orgId = :orgId)"
    )
    fun countByCreatedAtAfterAndOrgId(since: java.time.LocalDateTime, orgId: String): Long
}
