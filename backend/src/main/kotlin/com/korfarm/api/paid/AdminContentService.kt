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
import com.korfarm.api.pro.ProChapterEntity
import com.korfarm.api.pro.ProChapterItemEntity
import com.korfarm.api.pro.ProChapterItemRepo
import com.korfarm.api.pro.ProChapterRepo
import com.korfarm.api.test.TestPaperEntity
import com.korfarm.api.files.FileRepository
import com.korfarm.api.user.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class AdminContentService(
    private val contentRepository: ContentRepository,
    private val contentVersionRepository: ContentVersionRepository,
    private val contentEditLogRepository: ContentEditLogRepository,
    private val writingSubmissionRepository: WritingSubmissionRepository,
    private val writingFeedbackRepository: WritingFeedbackRepository,
    private val testPaperRepository: TestPaperRepository,
    private val testAnswerKeyRepository: TestAnswerKeyRepository,
    private val testResultRepository: TestResultRepository,
    private val fileRepository: FileRepository,
    private val userRepository: UserRepository,
    private val proChapterRepo: ProChapterRepo,
    private val proChapterItemRepo: ProChapterItemRepo,
    private val objectMapper: ObjectMapper
) {
    private val log = LoggerFactory.getLogger(AdminContentService::class.java)

    // PRO contentType → pro_chapter_items type 매핑
    private val proContentTypeMap = mapOf(
        "PRO_READING" to "reading",
        "PRO_VOCAB" to "vocab",
        "PRO_BACKGROUND" to "background",
        "PRO_LOGIC" to "logic",
        "PRO_ANSWER" to "answer"
    )

    // 레벨별 한글 이름
    private val levelNames = mapOf(
        "saussure1" to "소쉬르1", "saussure2" to "소쉬르2", "saussure3" to "소쉬르3",
        "frege1" to "프레게1", "frege2" to "프레게2", "frege3" to "프레게3",
        "russell1" to "러셀1", "russell2" to "러셀2", "russell3" to "러셀3",
        "wittgenstein1" to "비트겐슈타인1", "wittgenstein2" to "비트겐슈타인2", "wittgenstein3" to "비트겐슈타인3"
    )

    // 레벨 순서 (globalChapterNumber 계산용)
    private val levelOrder = listOf(
        "saussure1", "saussure2", "saussure3",
        "frege1", "frege2", "frege3",
        "russell1", "russell2", "russell3",
        "wittgenstein1", "wittgenstein2", "wittgenstein3"
    )

    private fun normalizeLevelId(raw: String): String {
        return raw.lowercase().replace("_", "")
    }

    private fun autoLinkProChapter(contentId: String, contentType: String, rawLevelId: String, dayIndex: Int) {
        val itemType = proContentTypeMap[contentType] ?: return
        val levelId = normalizeLevelId(rawLevelId)

        // 챕터 조회 또는 생성
        val chapter = proChapterRepo.findByLevelIdAndChapterNumber(levelId, dayIndex)
            ?: run {
                val levelName = levelNames[levelId] ?: levelId
                val bookNumber = levelId.last().digitToIntOrNull() ?: 1
                val levelIdx = levelOrder.indexOf(levelId).takeIf { it >= 0 } ?: 0
                val globalChapterNumber = levelIdx * 20 + dayIndex

                val created = proChapterRepo.save(
                    ProChapterEntity(
                        id = IdGenerator.newId("pch"),
                        levelId = levelId,
                        bookNumber = bookNumber,
                        chapterNumber = dayIndex,
                        globalChapterNumber = globalChapterNumber,
                        title = "$levelName ${dayIndex}장"
                    )
                )
                log.info("프로 모드 챕터 자동 생성: ${created.title} (${created.id})")
                created
            }

        // 기존 같은 타입 아이템 개수 확인 → itemOrder 결정
        val existingItems = proChapterItemRepo.findByChapterIdAndType(chapter.id, itemType)
        // 같은 contentId가 이미 연결되어 있으면 스킵
        if (existingItems.any { it.contentId == contentId }) {
            log.info("이미 연결됨: contentId=$contentId → chapter=${chapter.id}, type=$itemType")
            return
        }

        val allItems = proChapterItemRepo.findByChapterIdOrderByItemOrderAsc(chapter.id)
        val nextOrder = if (allItems.isEmpty()) 1 else allItems.maxOf { it.itemOrder } + 1

        proChapterItemRepo.save(
            ProChapterItemEntity(
                id = IdGenerator.newId("pci"),
                chapterId = chapter.id,
                type = itemType,
                contentId = contentId,
                itemOrder = nextOrder
            )
        )
        log.info("프로 모드 아이템 자동 연결: contentId=$contentId → chapter=${chapter.id}, type=$itemType, order=$nextOrder")
    }
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
            existing.area = request.area ?: existing.area
            existing.subArea = request.subArea ?: existing.subArea
            existing.dayIndex = request.dayIndex ?: existing.dayIndex
            existing.moduleKey = request.moduleKey ?: existing.moduleKey
            existing.videoUrl = request.videoUrl ?: existing.videoUrl
            existing
        } else {
            ContentEntity(
                id = IdGenerator.newId("content"),
                contentType = request.contentType,
                levelId = request.levelId,
                chapterId = request.chapterId,
                area = request.area,
                subArea = request.subArea,
                dayIndex = request.dayIndex,
                moduleKey = request.moduleKey,
                title = title,
                status = "active",
                videoUrl = request.videoUrl
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

        contentEditLogRepository.save(ContentEditLogEntity(
            id = IdGenerator.newId("cel"),
            contentId = saved.id,
            editorId = userId,
            action = if (existing != null) "UPDATE" else "CREATE",
            summary = "콘텐츠 ${if (existing != null) "수정" else "생성"}: $title",
            versionId = version.id
        ))

        return AdminContentImportResult(contentId = saved.id, versionId = version.id)
    }

    @Transactional
    fun batchImportContent(request: AdminContentBatchImportRequest, userId: String): AdminContentBatchImportResult {
        val results = mutableListOf<BatchItemResult>()
        var imported = 0
        var failed = 0

        request.items.forEachIndexed { index, item ->
            try {
                val title = item.content["title"]?.toString() ?: "Imported ${item.contentType}"
                val content = ContentEntity(
                    id = IdGenerator.newId("content"),
                    contentType = item.contentType,
                    levelId = item.levelId,
                    area = item.area,
                    subArea = item.subArea,
                    dayIndex = item.dayIndex,
                    moduleKey = item.moduleKey,
                    title = title,
                    status = "active"
                )
                val saved = contentRepository.save(content)
                val version = ContentVersionEntity(
                    id = IdGenerator.newId("cv"),
                    contentId = saved.id,
                    schemaVersion = item.schemaVersion,
                    contentJson = objectMapper.writeValueAsString(item.content),
                    uploadedBy = userId,
                    approvedBy = userId,
                    approvedAt = LocalDateTime.now()
                )
                contentVersionRepository.save(version)

                contentEditLogRepository.save(ContentEditLogEntity(
                    id = IdGenerator.newId("cel"),
                    contentId = saved.id,
                    editorId = userId,
                    action = "BATCH_CREATE",
                    summary = "배치 생성: $title",
                    versionId = version.id
                ))

                // PRO_* 콘텐츠 → 프로 모드 챕터 자동 생성/연결
                if (item.contentType.startsWith("PRO_") && item.levelId != null && item.dayIndex != null) {
                    try {
                        autoLinkProChapter(saved.id, item.contentType, item.levelId, item.dayIndex)
                    } catch (proErr: Exception) {
                        log.warn("프로 모드 자동 연결 실패: contentId=${saved.id}, error=${proErr.message}")
                    }
                }

                results.add(BatchItemResult(index = index, contentId = saved.id, success = true))
                imported++
            } catch (e: Exception) {
                results.add(BatchItemResult(index = index, success = false, error = e.message ?: "알 수 없는 오류"))
                failed++
            }
        }

        return AdminContentBatchImportResult(imported = imported, failed = failed, results = results)
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
        content.area = request.area ?: content.area
        content.subArea = request.subArea ?: content.subArea
        content.dayIndex = request.dayIndex ?: content.dayIndex
        content.moduleKey = request.moduleKey ?: content.moduleKey
        content.videoUrl = request.videoUrl ?: content.videoUrl
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

        contentEditLogRepository.save(ContentEditLogEntity(
            id = IdGenerator.newId("cel"),
            contentId = contentId,
            editorId = userId,
            action = "UPDATE",
            summary = "콘텐츠 수정: $title",
            versionId = version.id
        ))

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
            moduleKey = content.moduleKey,
            levelId = content.levelId,
            chapterId = content.chapterId,
            title = content.title,
            status = content.status,
            videoUrl = content.videoUrl,
            schemaVersion = version.schemaVersion,
            content = contentMap
        )
    }

    @Transactional(readOnly = true)
    fun listManuscripts(): List<ManuscriptSummary> {
        return contentRepository.findByContentTypeAndStatus("PRO_MANUSCRIPT", "active")
            .sortedWith(compareBy({ it.levelId }, { it.dayIndex }))
            .map { c ->
                ManuscriptSummary(
                    contentId = c.id,
                    levelId = c.levelId,
                    dayIndex = c.dayIndex,
                    title = c.title
                )
            }
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
                status = content.status,
                videoUrl = content.videoUrl
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

    @Transactional(readOnly = true)
    fun getEditLogsByContent(contentId: String): List<ContentEditLogDto> {
        val userMap = userRepository.findAll().associateBy { it.id }
        val content = contentRepository.findById(contentId).orElse(null)
        return contentEditLogRepository.findByContentIdOrderByCreatedAtDesc(contentId).map { log ->
            ContentEditLogDto(
                id = log.id,
                contentId = log.contentId,
                contentTitle = content?.title,
                editorId = log.editorId,
                editorName = userMap[log.editorId]?.name,
                action = log.action,
                summary = log.summary,
                versionId = log.versionId,
                createdAt = log.createdAt
            )
        }
    }

    @Transactional(readOnly = true)
    fun getEditLogsByEditor(editorId: String): List<ContentEditLogDto> {
        val editor = userRepository.findById(editorId).orElse(null)
        val contentMap = contentRepository.findAll().associateBy { it.id }
        return contentEditLogRepository.findByEditorIdOrderByCreatedAtDesc(editorId).map { log ->
            ContentEditLogDto(
                id = log.id,
                contentId = log.contentId,
                contentTitle = contentMap[log.contentId]?.title,
                editorId = log.editorId,
                editorName = editor?.name,
                action = log.action,
                summary = log.summary,
                versionId = log.versionId,
                createdAt = log.createdAt
            )
        }
    }

    @Transactional(readOnly = true)
    fun listAdminUsers(): List<AdminUserDto> {
        val userMap = userRepository.findAll().associateBy { it.id }
        // content_edit_logs에 기록된 editor들의 목록
        val allLogs = contentEditLogRepository.findAll()
        val editorIds = allLogs.map { it.editorId }.distinct()
        return editorIds.mapNotNull { editorId ->
            val user = userMap[editorId] ?: return@mapNotNull null
            val editCount = allLogs.count { it.editorId == editorId }
            val lastEdit = allLogs.filter { it.editorId == editorId }.maxByOrNull { it.createdAt }?.createdAt
            AdminUserDto(
                userId = user.id,
                email = user.email,
                name = user.name,
                editCount = editCount,
                lastEditAt = lastEdit
            )
        }.sortedByDescending { it.editCount }
    }
}
