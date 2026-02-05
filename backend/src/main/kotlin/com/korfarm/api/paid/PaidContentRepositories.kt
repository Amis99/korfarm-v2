package com.korfarm.api.paid

import com.korfarm.api.test.TestPaperEntity
import org.springframework.data.jpa.repository.JpaRepository

interface ContentRepository : JpaRepository<ContentEntity, String> {
    fun findByContentTypeAndStatus(contentType: String, status: String): List<ContentEntity>
    fun findFirstByContentTypeAndChapterId(contentType: String, chapterId: String): ContentEntity?
}

interface ContentVersionRepository : JpaRepository<ContentVersionEntity, String> {
    fun findTopByContentIdOrderByCreatedAtDesc(contentId: String): ContentVersionEntity?
}

interface TestPaperRepository : JpaRepository<TestPaperEntity, String> {
    fun findByStatus(status: String): List<TestPaperEntity>
}

interface WritingSubmissionRepository : JpaRepository<WritingSubmissionEntity, String>

interface WritingFeedbackRepository : JpaRepository<WritingFeedbackEntity, String> {
    fun findBySubmissionId(submissionId: String): WritingFeedbackEntity?
}

interface TestAnswerKeyRepository : JpaRepository<TestAnswerKeyEntity, String> {
    fun findTopByTestIdOrderByCreatedAtDesc(testId: String): TestAnswerKeyEntity?
}

interface TestResultRepository : JpaRepository<TestResultEntity, String> {
    fun findByTestIdAndUserId(testId: String, userId: String): TestResultEntity?
}
