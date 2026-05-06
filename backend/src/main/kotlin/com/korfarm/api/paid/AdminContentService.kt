package com.korfarm.api.paid

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.contracts.AdminContentImportRequest
import com.korfarm.api.contracts.AdminTestAnswersRequest
import com.korfarm.api.contracts.AdminTestCreateRequest
import com.korfarm.api.contracts.AdminTestGradeRequest
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
import java.time.format.DateTimeFormatter

@Service
class AdminContentService(
    private val contentRepository: ContentRepository,
    private val contentVersionRepository: ContentVersionRepository,
    private val contentEditLogRepository: ContentEditLogRepository,
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
    /** categories 헬퍼: List<String> ↔ JSON array string 변환.
     *  ContentEntity.categories는 다중 분류 array를 JSON 문자열로 저장한다.
     *  content_type 컬럼은 array의 첫 항목(primary)을 단일 값으로 저장 (학생 API 호환). */
    private fun serializeCategories(categories: List<String>): String =
        objectMapper.writeValueAsString(categories)

    private fun parseCategories(content: ContentEntity): List<String> {
        val raw = content.categories
        if (raw.isNullOrBlank()) {
            // categories 없으면 contentType 단일 값을 array로 wrapping (fallback)
            return listOf(content.contentType)
        }
        return try {
            objectMapper.readValue(raw, object : TypeReference<List<String>>() {})
        } catch (e: Exception) {
            log.warn("categories JSON 파싱 실패 contentId=${content.id}, raw=$raw")
            listOf(content.contentType)
        }
    }

    @Transactional
    fun importContent(request: AdminContentImportRequest, userId: String): AdminContentImportResult {
        if (request.contentType.isEmpty()) {
            throw ApiException("INVALID_REQUEST", "contentType array는 비어있을 수 없습니다", HttpStatus.BAD_REQUEST)
        }
        val primaryType = request.contentType.first()
        val categoriesJson = serializeCategories(request.contentType)
        val title = request.content["title"]?.toString() ?: "Imported $primaryType"
        val existing = request.chapterId?.let {
            contentRepository.findFirstByContentTypeAndChapterId(primaryType, it)
        }
        val content = if (existing != null) {
            existing.title = title
            existing.status = "active"
            existing.contentType = primaryType
            existing.categories = categoriesJson
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
                contentType = primaryType,
                categories = categoriesJson,
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
                if (item.contentType.isEmpty()) {
                    throw IllegalArgumentException("contentType array는 비어있을 수 없습니다")
                }
                val primaryType = item.contentType.first()
                val categoriesJson = serializeCategories(item.contentType)
                val title = item.content["title"]?.toString() ?: "Imported $primaryType"
                val content = ContentEntity(
                    id = IdGenerator.newId("content"),
                    contentType = primaryType,
                    categories = categoriesJson,
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

                // PRO_* 콘텐츠 → 프로 모드 챕터 자동 생성/연결 (primary type 기준)
                if (primaryType.startsWith("PRO_") && item.levelId != null && item.dayIndex != null) {
                    try {
                        autoLinkProChapter(saved.id, primaryType, item.levelId, item.dayIndex)
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
        if (request.contentType.isEmpty()) {
            throw ApiException("INVALID_REQUEST", "contentType array는 비어있을 수 없습니다", HttpStatus.BAD_REQUEST)
        }
        val content = contentRepository.findById(contentId).orElseThrow {
            ApiException("NOT_FOUND", "content not found", HttpStatus.NOT_FOUND)
        }
        val title = request.content["title"]?.toString() ?: content.title
        content.title = title
        content.contentType = request.contentType.first()
        content.categories = serializeCategories(request.contentType)
        content.levelId = request.levelId
        content.chapterId = request.chapterId
        content.area = request.area ?: content.area
        content.subArea = request.subArea ?: content.subArea
        content.dayIndex = request.dayIndex ?: content.dayIndex
        content.moduleKey = request.moduleKey ?: content.moduleKey
        content.videoUrl = request.videoUrl ?: content.videoUrl
        content.status = "active"
        contentRepository.save(content)

        // 새 버전 INSERT (이력 보존). 기존 버전은 그대로 두고 항상 새 row 생성.
        // findTopByContentIdOrderByCreatedAtDesc로 최신 버전을 조회하면 새로 만든 것이 반환됨.
        // 단, content_versions 테이블에는 (content_id, schema_version) unique 제약이 있으므로,
        // 동일 schemaVersion 기존 행이 있으면 백업 suffix를 붙여 unique 충돌을 회피한다.
        val existingSameSchema = contentVersionRepository.findByContentIdAndSchemaVersion(
            contentId, request.schemaVersion
        )
        if (existingSameSchema != null) {
            val ts = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"))
            existingSameSchema.schemaVersion = "${existingSameSchema.schemaVersion}-bak-$ts"
            contentVersionRepository.saveAndFlush(existingSameSchema)
        }
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

    @Transactional
    fun deleteContent(contentId: String) {
        val content = contentRepository.findById(contentId).orElseThrow {
            ApiException("NOT_FOUND", "content not found", HttpStatus.NOT_FOUND)
        }
        contentVersionRepository.deleteAllByContentId(contentId)
        contentEditLogRepository.deleteAllByContentId(contentId)
        contentRepository.delete(content)
    }

    /**
     * 일일퀴즈 1번 문제(어휘) 의 본문 텍스트 키들을 단일 "보기" 키로 통합.
     * 모든 dq- contents 의 latest content_versions 의 questions[0] 에서
     * passage / prompt / 보기 / examples / example / additionalInfo 텍스트들을 우선순위 순으로
     * 빈 줄(\n\n) 로 join 하여 "보기" 키에 저장. 다른 키는 비움/제거.
     * 기존 row UPDATE (이력 보존 목적이 아닌 1회성 정리 — UNIQUE(content_id, schema_version) 제약 우회).
     */
    @Transactional
    fun mergeDailyQuizQ1Bogi(userId: String): Map<String, Any?> {
        val all = contentRepository.findAll()
            .filter { it.id.startsWith("dq-") && it.status == "active" }
        var processed = 0
        var updated = 0
        var skipped = 0
        var emptyBogi = 0
        val errors = mutableListOf<String>()

        all.forEach { content ->
            try {
                val latest = contentVersionRepository.findTopByContentIdOrderByCreatedAtDesc(content.id)
                    ?: run { skipped++; return@forEach }

                @Suppress("UNCHECKED_CAST")
                val root = (objectMapper.readValue(latest.contentJson, Map::class.java) as Map<String, Any?>).toMutableMap()
                @Suppress("UNCHECKED_CAST")
                val payload = (root["payload"] as? Map<String, Any?>)?.toMutableMap()
                    ?: run { skipped++; return@forEach }
                @Suppress("UNCHECKED_CAST")
                val questions = (payload["questions"] as? List<Map<String, Any?>>)?.toMutableList()
                    ?: run { skipped++; return@forEach }
                if (questions.isEmpty()) { skipped++; return@forEach }

                val q1 = questions[0].toMutableMap()

                // 우선순위 순으로 텍스트 키 수집 (중복 제거)
                val keys = listOf("보기", "examples", "example", "additionalInfo", "passage", "prompt")
                val parts = mutableListOf<String>()
                for (k in keys) {
                    val raw = q1[k]
                    val s = (raw as? String)?.trim() ?: continue
                    if (s.isNotEmpty() && parts.none { it == s }) parts.add(s)
                }
                val combined = parts.joinToString("\n\n")
                if (combined.isEmpty()) emptyBogi++

                q1["보기"] = combined
                q1["passage"] = ""
                q1.remove("prompt")
                q1.remove("examples")
                q1.remove("example")
                q1.remove("additionalInfo")

                questions[0] = q1
                payload["questions"] = questions
                root["payload"] = payload

                latest.contentJson = objectMapper.writeValueAsString(root)
                latest.uploadedBy = userId
                latest.approvedBy = userId
                latest.approvedAt = LocalDateTime.now()
                contentVersionRepository.save(latest)

                contentEditLogRepository.save(ContentEditLogEntity(
                    id = IdGenerator.newId("cel"),
                    contentId = content.id,
                    editorId = userId,
                    action = "MERGE_Q1_BOGI"
                ))

                updated++
            } catch (e: Exception) {
                skipped++
                errors.add("${content.id}: ${e.message ?: e::class.simpleName}")
            }
            processed++
        }

        return mapOf(
            "totalContents" to all.size,
            "processed" to processed,
            "updated" to updated,
            "skipped" to skipped,
            "emptyBogiCount" to emptyBogi,
            "errors" to errors.take(20)
        )
    }

    /**
     * 일일퀴즈 10번 문제 backfill — 최신 contentJson 의 payload.questions[9] 를 q10 으로 교체한 신규 version INSERT.
     * 이력 보존 (옛 version 그대로). 응답으로 oldVersionId / newVersionId 반환.
     */
    @Transactional
    fun backfillDailyQuizQ10(contentId: String, q10: Map<String, Any?>, userId: String): Map<String, Any?> {
        contentRepository.findById(contentId).orElseThrow {
            ApiException("NOT_FOUND", "content not found: $contentId", HttpStatus.NOT_FOUND)
        }
        val latest = contentVersionRepository.findTopByContentIdOrderByCreatedAtDesc(contentId)
            ?: throw ApiException("NOT_FOUND", "content version not found: $contentId", HttpStatus.NOT_FOUND)

        @Suppress("UNCHECKED_CAST")
        val root = objectMapper.readValue(latest.contentJson, Map::class.java) as Map<String, Any?>
        val mutableRoot = root.toMutableMap()

        @Suppress("UNCHECKED_CAST")
        val payload = (mutableRoot["payload"] as? Map<String, Any?>)?.toMutableMap()
            ?: throw ApiException("BAD_REQUEST", "payload missing in $contentId", HttpStatus.BAD_REQUEST)

        @Suppress("UNCHECKED_CAST")
        val questions = (payload["questions"] as? List<Map<String, Any?>>)?.toMutableList()
            ?: throw ApiException("BAD_REQUEST", "payload.questions missing in $contentId", HttpStatus.BAD_REQUEST)

        if (questions.size < 10) {
            throw ApiException("BAD_REQUEST", "questions.length < 10 (got ${questions.size}) in $contentId", HttpStatus.BAD_REQUEST)
        }
        val oldQ10 = questions[9]
        questions[9] = q10
        payload["questions"] = questions
        mutableRoot["payload"] = payload

        val newJson = objectMapper.writeValueAsString(mutableRoot)
        val sizeBefore = latest.contentJson.length
        // (content_id, schema_version) UNIQUE 제약 → 신 row INSERT 대신 기존 row UPDATE.
        // 이력은 ContentEditLog 로 남김.
        latest.contentJson = newJson
        latest.uploadedBy = userId
        latest.approvedBy = userId
        latest.approvedAt = LocalDateTime.now()
        contentVersionRepository.save(latest)

        contentEditLogRepository.save(ContentEditLogEntity(
            id = IdGenerator.newId("cel"),
            contentId = contentId,
            editorId = userId,
            action = "BACKFILL_Q10"
        ))

        return mapOf(
            "contentId" to contentId,
            "versionId" to latest.id,
            "oldQ10Id" to (oldQ10?.get("id") as? String),
            "newQ10Id" to (q10["id"] as? String),
            "sizeBefore" to sizeBefore,
            "sizeAfter" to newJson.length
        )
    }

    /**
     * 일일퀴즈 1~9번 역량 벡터 일괄 backfill.
     *
     * 정책: 사용자 결정 — Q1~9 가 10대 역량 1~9 와 1:1 매칭.
     *  Q1=어휘력, Q2=문장 독해력, Q3=구조 독해력, Q4=논리 사고력,
     *  Q5=어법·문법 능력, Q6=국어 개념 적용 능력, Q7=국어 관련 배경지식,
     *  Q8=비문학 배경지식, Q9=문제 분석 및 전략 수립 능력
     *  Q10 (선택지 분석 및 전략 수립 능력) 은 이미 CHOICE_COMPLEX_OX 로 박혀 있으므로 건드리지 않음.
     *
     * 보호: 각 question 에 competencyVector 또는 competency 가 이미 있으면 skip (수동 작성 보호).
     */
    @Transactional
    fun backfillDailyQuizQ1to9Competency(userId: String): Map<String, Any?> {
        // 일일퀴즈 콘텐츠 — content_type='DAILY_QUIZ' 또는 categories 에 'DAILY_QUIZ' 포함
        val ctsJson = "[\"DAILY_QUIZ\"]"
        val targets = contentRepository.findByCategoriesInAndStatus(listOf("DAILY_QUIZ"), ctsJson, "active")

        val q1to9Mapping = listOf(
            "어휘력", "문장 독해력", "구조 독해력", "논리 사고력", "어법·문법 능력",
            "국어 개념 적용 능력", "국어 관련 배경지식", "비문학 배경지식", "문제 분석 및 전략 수립 능력",
        )

        var processedContents = 0
        var modifiedContents = 0
        var addedFields = 0
        var skippedExisting = 0
        val errors = mutableListOf<Map<String, String>>()

        for (content in targets) {
            processedContents++
            try {
                val latest = contentVersionRepository.findTopByContentIdOrderByCreatedAtDesc(content.id) ?: continue

                @Suppress("UNCHECKED_CAST")
                val root = (objectMapper.readValue(latest.contentJson, Map::class.java) as Map<String, Any?>).toMutableMap()
                @Suppress("UNCHECKED_CAST")
                val payload = (root["payload"] as? Map<String, Any?>)?.toMutableMap() ?: continue
                @Suppress("UNCHECKED_CAST")
                val questions = (payload["questions"] as? List<Map<String, Any?>>)?.toMutableList() ?: continue

                if (questions.size < 9) continue

                var changed = false
                for (i in 0..8) {
                    val q = questions[i].toMutableMap()
                    // 이미 벡터/단일 competency 있으면 보호
                    val hasVector = q["competencyVector"] != null
                    val hasSingle = (q["competency"] as? String)?.isNotBlank() == true
                    if (hasVector || hasSingle) {
                        skippedExisting++
                        continue
                    }
                    q["competency"] = q1to9Mapping[i]
                    questions[i] = q
                    changed = true
                    addedFields++
                }

                if (!changed) continue

                payload["questions"] = questions
                root["payload"] = payload
                latest.contentJson = objectMapper.writeValueAsString(root)
                latest.uploadedBy = userId
                latest.approvedBy = userId
                latest.approvedAt = LocalDateTime.now()
                contentVersionRepository.save(latest)

                contentEditLogRepository.save(
                    ContentEditLogEntity(
                        id = IdGenerator.newId("cel"),
                        contentId = content.id,
                        editorId = userId,
                        action = "BACKFILL_Q1TO9_COMPETENCY",
                    )
                )
                modifiedContents++
            } catch (e: Exception) {
                errors.add(mapOf("contentId" to content.id, "error" to (e.message ?: "unknown")))
            }
        }

        return mapOf(
            "totalDailyQuizContents" to processedContents,
            "modifiedContents" to modifiedContents,
            "addedFields" to addedFields,
            "skippedExisting" to skippedExisting,
            "errors" to errors,
        )
    }

    /**
     * 농장·프로·논리 콘텐츠 default competency 매핑 backfill.
     *
     * 정책 (사용자 결정 기반 type/area 1:1):
     *  - 일일독해 비문학 → 비문학 배경지식 0.5 + 구조 독해력 0.5
     *  - 일일독해 문학  → 국어 관련 배경지식 0.5 + 문장 독해력 0.5
     *  - 프로 어휘     → 어휘력 1.0
     *  - 프로 문법     → 어법·문법 능력 1.0
     *  - 프로 독해 비문학 → 비문학 배경지식 0.4 + 구조 독해력 0.4 + 문제 분석 및 전략 수립 능력 0.2
     *  - 프로 독해 문학  → 국어 관련 배경지식 0.4 + 문장 독해력 0.4 + 문제 분석 및 전략 수립 능력 0.2
     *  - 논리 (LOGIC_REASONING_QUIZ / PRO_LOGIC) → 논리 사고력 1.0
     *
     * 보호: 이미 questions[].competencyVector 또는 competency 가 있는 문항은 skip.
     */
    @Transactional
    fun backfillDefaultCompetencyVector(userId: String): Map<String, Any?> {
        val all = contentRepository.findByStatus("active")
        var processed = 0
        var modified = 0
        var addedFields = 0
        var skippedExisting = 0
        var skippedKind = 0
        val errors = mutableListOf<Map<String, String>>()

        for (content in all) {
            processed++
            try {
                val ct = content.contentType.uppercase()
                // 학습 콘텐츠 아닌 것은 skip
                if (ct.contains("TEST") || ct.contains("ANSWER_EXPLANATION") || ct.contains("MANUSCRIPT")) {
                    skippedKind++; continue
                }
                // 일일퀴즈는 별도 backfill (Q1~9 매핑) 이 이미 있으므로 skip
                if (ct.contains("DAILY_QUIZ")) { skippedKind++; continue }

                val area = (content.area ?: "").lowercase()
                val defaultVector = resolveDefaultVector(ct, area) ?: run {
                    skippedKind++; return@run null
                } ?: continue

                val latest = contentVersionRepository.findTopByContentIdOrderByCreatedAtDesc(content.id) ?: continue
                @Suppress("UNCHECKED_CAST")
                val root = (objectMapper.readValue(latest.contentJson, Map::class.java) as Map<String, Any?>).toMutableMap()
                @Suppress("UNCHECKED_CAST")
                val payload = (root["payload"] as? Map<String, Any?>)?.toMutableMap() ?: continue
                @Suppress("UNCHECKED_CAST")
                val questions = (payload["questions"] as? List<Map<String, Any?>>)?.toMutableList() ?: continue
                if (questions.isEmpty()) continue

                var changed = false
                for (i in questions.indices) {
                    val q = questions[i].toMutableMap()
                    val hasVector = q["competencyVector"] != null
                    val hasSingle = (q["competency"] as? String)?.isNotBlank() == true
                    if (hasVector || hasSingle) {
                        skippedExisting++; continue
                    }
                    q["competencyVector"] = defaultVector
                    questions[i] = q
                    changed = true
                    addedFields++
                }
                if (!changed) continue

                payload["questions"] = questions
                root["payload"] = payload
                latest.contentJson = objectMapper.writeValueAsString(root)
                latest.uploadedBy = userId
                latest.approvedBy = userId
                latest.approvedAt = LocalDateTime.now()
                contentVersionRepository.save(latest)
                contentEditLogRepository.save(
                    ContentEditLogEntity(
                        id = IdGenerator.newId("cel"),
                        contentId = content.id,
                        editorId = userId,
                        action = "BACKFILL_DEFAULT_VEC",
                    )
                )
                modified++
            } catch (e: Exception) {
                errors.add(mapOf("contentId" to content.id, "error" to (e.message ?: "unknown")))
            }
        }

        return mapOf(
            "processed" to processed,
            "modified" to modified,
            "addedFields" to addedFields,
            "skippedExisting" to skippedExisting,
            "skippedKind" to skippedKind,
            "errors" to errors,
        )
    }

    private fun resolveDefaultVector(ct: String, area: String): Map<String, Double>? {
        return when {
            ct.contains("LOGIC") -> mapOf("논리 사고력" to 1.0)
            ct.contains("PRO_VOCAB") -> mapOf("어휘력" to 1.0)
            ct.contains("PRO_GRAMMAR") -> mapOf("어법·문법 능력" to 1.0)
            ct.contains("PRO_READING") -> {
                if (area.contains("fiction") && !area.contains("non")) {
                    mapOf("국어 관련 배경지식" to 0.4, "문장 독해력" to 0.4, "문제 분석 및 전략 수립 능력" to 0.2)
                } else {
                    mapOf("비문학 배경지식" to 0.4, "구조 독해력" to 0.4, "문제 분석 및 전략 수립 능력" to 0.2)
                }
            }
            ct.contains("DAILY_READING") || ct.contains("FARM") -> {
                if (area.contains("fiction") && !area.contains("non")) {
                    mapOf("국어 관련 배경지식" to 0.5, "문장 독해력" to 0.5)
                } else {
                    mapOf("비문학 배경지식" to 0.5, "구조 독해력" to 0.5)
                }
            }
            ct.contains("STUDY_CONTENT") || ct.contains("STUDY") -> {
                // 내용 숙지 학습 — 영역 정보로 추정
                if (area.contains("fiction")) {
                    mapOf("국어 관련 배경지식" to 0.5, "문장 독해력" to 0.5)
                } else if (area.contains("grammar")) {
                    mapOf("어법·문법 능력" to 1.0)
                } else if (area.contains("vocab")) {
                    mapOf("어휘력" to 1.0)
                } else {
                    mapOf("비문학 배경지식" to 0.4, "구조 독해력" to 0.4, "국어 개념 적용 능력" to 0.2)
                }
            }
            else -> null
        }
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
            contentType = parseCategories(content),
            moduleKey = content.moduleKey,
            levelId = content.levelId,
            chapterId = content.chapterId,
            area = content.area,
            subArea = content.subArea,
            dayIndex = content.dayIndex,
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
        // content_id 별 가장 최근 editor_id — 어드민이 페이지에서 "수정 후 저장" 한 경우(action="UPDATE")만 인정.
        // 일괄 import / backfill / migration 같은 자동 작업(BATCH_CREATE / BACKFILL_Q10 / MERGE_Q1_BOGI 등)은
        // 화면 기호 표시에서 무시하고 status-dot(초록 원) 으로 되돌린다.
        val latestEditorByContent: Map<String, String> = contentEditLogRepository.findAll()
            .filter { it.action == "UPDATE" }
            .groupBy { it.contentId }
            .mapValues { (_, logs) -> logs.maxByOrNull { it.createdAt }?.editorId ?: "" }
            .filterValues { it.isNotEmpty() }
        // editor user 메타 일괄 조회 (이름 표시용)
        val editorIds = latestEditorByContent.values.toSet()
        val editorNameMap = if (editorIds.isEmpty()) emptyMap()
        else userRepository.findAllById(editorIds).associate { it.id to (it.name?.takeIf { n -> n.isNotBlank() } ?: it.email) }

        return contentRepository.findAll().sortedBy { it.createdAt }.map { content ->
            val editorId = latestEditorByContent[content.id]
            AdminContentSummary(
                contentId = content.id,
                contentType = parseCategories(content),
                levelId = content.levelId,
                chapterId = content.chapterId,
                dayIndex = content.dayIndex,
                area = content.area,
                subArea = content.subArea,
                title = content.title,
                status = content.status,
                videoUrl = content.videoUrl,
                lastEditorId = editorId,
                lastEditorName = editorId?.let { editorNameMap[it] }
            )
        }
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
