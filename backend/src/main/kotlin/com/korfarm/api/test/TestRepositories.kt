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

interface TestPaperStatisticsRepo : JpaRepository<TestPaperStatisticsEntity, String>


interface TestSubmissionRepo : JpaRepository<TestSubmissionEntity, String> {
    // 다중 응시 도입 후 — 가장 최근 응시(attempt_no 최대) 1건 반환. 단일 응시 시대 코드 호환용 helper.
    fun findFirstByTestIdAndUserIdOrderByAttemptNoDesc(testId: String, userId: String): TestSubmissionEntity?
    // 다중 응시 — 한 학생의 한 시험 응시 이력 (최신순)
    fun findByTestIdAndUserIdOrderByAttemptNoDesc(testId: String, userId: String): List<TestSubmissionEntity>
    // 최대 attempt_no 조회 (새 응시 번호 부여)
    @org.springframework.data.jpa.repository.Query(
        "SELECT COALESCE(MAX(s.attemptNo), 0) FROM TestSubmissionEntity s WHERE s.testId = :testId AND s.userId = :userId"
    )
    fun maxAttemptNo(testId: String, userId: String): Int
    fun findByUserId(userId: String): List<TestSubmissionEntity>
    fun findByTestId(testId: String): List<TestSubmissionEntity>
    fun findByUserIdAndCreatedAtBetween(userId: String, start: java.time.LocalDateTime, end: java.time.LocalDateTime): List<TestSubmissionEntity>

    // 최근 N일 이내 테스트 응시 건수 (전체)
    fun countByCreatedAtAfter(since: java.time.LocalDateTime): Long

    // 최근 N일 이내 테스트 응시 건수 (특정 기관 시험지만)
    @org.springframework.data.jpa.repository.Query(
        "SELECT COUNT(s) FROM TestSubmissionEntity s " +
        "WHERE s.createdAt >= :since " +
        "AND s.testId IN (SELECT t.id FROM TestPaperEntity t WHERE t.orgId = :orgId)"
    )
    fun countByCreatedAtAfterAndOrgId(since: java.time.LocalDateTime, orgId: String): Long

    fun findByTestIdIn(testIds: List<String>): List<TestSubmissionEntity>
}
