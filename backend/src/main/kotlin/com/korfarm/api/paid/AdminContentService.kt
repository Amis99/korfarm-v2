package com.korfarm.api.paid

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.contracts.AdminContentImportRequest
import com.korfarm.api.contracts.AdminTestAnswersRequest
import com.korfarm.api.contracts.AdminTestCreateRequest
import com.korfarm.api.contracts.AdminTestGradeRequest
import com.korfarm.api.contracts.AdminWritingFeedbackRequest
import com.korfarm.api.test.TestPaperEntity
import com.korfarm.api.files.FileRepository
import com.korfarm.api.user.UserRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class AdminContentService(
    private val contentRepository: ContentRepository,
    private val contentVersionRepository: ContentVersionRepository,
    private val writingSubmissionRepository: WritingSubmissionRepository,
    private val writingFeedbackRepository: WritingFeedbackRepository,
    private val testPaperRepository: TestPaperRepository,
    private val testAnswerKeyRepository: TestAnswerKeyRepository,
    private val testResultRepository: TestResultRepository,
    private val fileRepository: FileRepository,
    private val userRepository: UserRepository,
    private val objectMapper: ObjectMapper
) {
    @Transactional
    fun importContent(request: AdminContentImportRequest, userId: String): AdminContentImportResult {
        val title = request.content["title"]?.toString() ?: "Imported ${request.contentType}"
        val existing = request.chapterId?.let {
            contentRepository.findFirstByContentTypeAndChapterId(request.contentType, it)
        }
        val content = if (existing != null) {
            existing.title = title
            existing.status = "active"
            existing.levelId = request.levelId
            existing.chapterId = request.chapterId
            existing
        } else {
            ContentEntity(
                id = IdGenerator.newId("content"),
                contentType = request.contentType,
                levelId = request.levelId,
                chapterId = request.chapterId,
                title = title,
                status = "active"
            )
        }
        val saved = contentRepository.save(content)
        val version = ContentVersionEntity(
            id = IdGenerator.newId("cv"),
            contentId = saved.id,
            schemaVersion = request.schemaVersion,
            contentJson = objectMapper.writeValueAsString(request.content),
            uploadedBy = userId,
            approvedBy = userId,
            approvedAt = LocalDateTime.now()
        )
        contentVersionRepository.save(version)
        return AdminContentImportResult(contentId = saved.id, versionId = version.id)
    }

    @Transactional
    fun updateContent(contentId: String, request: AdminContentImportRequest, userId: String): AdminContentImportResult {
        val content = contentRepository.findById(contentId).orElseThrow {
            ApiException("NOT_FOUND", "content not found", HttpStatus.NOT_FOUND)
        }
        val title = request.content["title"]?.toString() ?: content.title
        content.title = title
        content.contentType = request.contentType
        content.levelId = request.levelId
        content.chapterId = request.chapterId
        content.status = "active"
        contentRepository.save(content)

        val version = ContentVersionEntity(
            id = IdGenerator.newId("cv"),
            contentId = contentId,
            schemaVersion = request.schemaVersion,
            contentJson = objectMapper.writeValueAsString(request.content),
            uploadedBy = userId,
            approvedBy = userId,
            approvedAt = LocalDateTime.now()
        )
        contentVersionRepository.save(version)
        return AdminContentImportResult(contentId = contentId, versionId = version.id)
    }

    @Transactional(readOnly = true)
    fun previewContent(contentId: String): ContentPreview {
        val content = contentRepository.findById(contentId).orElseThrow {
            ApiException("NOT_FOUND", "content not found", HttpStatus.NOT_FOUND)
        }
        val version = contentVersionRepository.findTopByContentIdOrderByCreatedAtDesc(contentId)
            ?: throw ApiException("NOT_FOUND", "content version not found", HttpStatus.NOT_FOUND)
        val contentMap: Map<String, Any> = objectMapper.readValue(
            version.contentJson,
            object : TypeReference<Map<String, Any>>() {}
        )
        return ContentPreview(
            contentId = content.id,
            contentType = content.contentType,
            levelId = content.levelId,
            chapterId = content.chapterId,
            title = content.title,
            status = content.status,
            schemaVersion = version.schemaVersion,
            content = contentMap
        )
    }

    @Transactional(readOnly = true)
    fun listContents(): List<AdminContentSummary> {
        return contentRepository.findAll().sortedBy { it.createdAt }.map { content ->
            AdminContentSummary(
                contentId = content.id,
                contentType = content.contentType,
                levelId = content.levelId,
                chapterId = content.chapterId,
                title = content.title,
                status = content.status
            )
        }
    }

    @Transactional(readOnly = true)
    fun listWritingSubmissions(): List<AdminWritingSubmissionSummary> {
        val userMap = userRepository.findAll().associateBy { it.id }
        return writingSubmissionRepository.findAll().sortedByDescending { it.submittedAt ?: it.createdAt }.map { submission ->
            val user = userMap[submission.userId]
            AdminWritingSubmissionSummary(
                submissionId = submission.id,
                userId = submission.userId,
                studentName = user?.name ?: user?.email ?: submission.userId,
                promptId = submission.promptId,
                status = submission.status,
                submittedAt = submission.submittedAt
            )
        }
    }

    @Transactional
    fun submitWritingFeedback(
        submissionId: String,
        reviewerId: String,
        request: AdminWritingFeedbackRequest
    ): WritingFeedbackView {
        val submission = writingSubmissionRepository.findById(submissionId).orElseThrow {
            ApiException("NOT_FOUND", "submission not found", HttpStatus.NOT_FOUND)
        }
        val rubricJson = objectMapper.writeValueAsString(request.rubric)
        val existing = writingFeedbackRepository.findBySubmissionId(submission.id)
        val entity = if (existing != null) {
            existing.rubricJson = rubricJson
            existing.comment = request.comment
            existing.reviewerId = reviewerId
            existing
        } else {
            WritingFeedbackEntity(
                id = IdGenerator.newId("wf"),
                submissionId = submission.id,
                reviewerId = reviewerId,
                rubricJson = rubricJson,
                comment = request.comment
            )
        }
        val saved = writingFeedbackRepository.save(entity)
        return WritingFeedbackView(
            feedbackId = saved.id,
            submissionId = saved.submissionId,
            reviewerId = saved.reviewerId,
            comment = saved.comment,
            createdAt = saved.createdAt
        )
    }

    @Transactional
    fun createTest(request: AdminTestCreateRequest, userId: String): TestPaperView {
        val file = fileRepository.findById(request.pdfFileId).orElseThrow {
            ApiException("NOT_FOUND", "file not found", HttpStatus.NOT_FOUND)
        }
        val entity = TestPaperEntity(
            id = IdGenerator.newId("test"),
            orgId = request.orgId,
            title = request.title,
            pdfFileId = file.id,
            status = "open"
        )
        val saved = testPaperRepository.save(entity)
        return TestPaperView(testId = saved.id, title = saved.title, status = saved.status)
    }

    @Transactional
    fun saveAnswerKey(testId: String, request: AdminTestAnswersRequest, userId: String): TestAnswerKeyView {
        val test = testPaperRepository.findById(testId).orElseThrow {
            ApiException("NOT_FOUND", "test not found", HttpStatus.NOT_FOUND)
        }
        val entity = TestAnswerKeyEntity(
            id = IdGenerator.newId("tak"),
            testId = test.id,
            answersJson = objectMapper.writeValueAsString(request.answers),
            createdBy = userId
        )
        val saved = testAnswerKeyRepository.save(entity)
        return TestAnswerKeyView(testId = saved.testId, answerKeyId = saved.id, createdAt = saved.createdAt)
    }

    @Transactional
    fun gradeTest(testId: String, request: AdminTestGradeRequest): TestGradeResult {
        val test = testPaperRepository.findById(testId).orElseThrow {
            ApiException("NOT_FOUND", "test not found", HttpStatus.NOT_FOUND)
        }
        val answerKey = testAnswerKeyRepository.findTopByTestIdOrderByCreatedAtDesc(test.id)
            ?: throw ApiException("NOT_FOUND", "answer key not found", HttpStatus.NOT_FOUND)
        val keyMap: Map<String, Any> = objectMapper.readValue(
            answerKey.answersJson,
            object : TypeReference<Map<String, Any>>() {}
        )
        val submitted = request.answers
        val correct = keyMap.count { (key, expected) ->
            val actual = submitted[key] ?: return@count false
            actual.toString() == expected.toString()
        }
        val total = keyMap.size
        val statsJson = objectMapper.writeValueAsString(mapOf("total" to total, "correct" to correct))
        val now = LocalDateTime.now()
        val existing = testResultRepository.findByTestIdAndUserId(test.id, request.userId)
        val result = if (existing != null) {
            existing.score = correct
            existing.statsJson = statsJson
            existing.gradedAt = now
            existing
        } else {
            TestResultEntity(
                id = IdGenerator.newId("tr"),
                testId = test.id,
                userId = request.userId,
                score = correct,
                statsJson = statsJson,
                gradedAt = now
            )
        }
        val saved = testResultRepository.save(result)
        return TestGradeResult(
            resultId = saved.id,
            score = saved.score,
            total = total,
            correct = correct,
            gradedAt = saved.gradedAt ?: now
        )
    }
}
