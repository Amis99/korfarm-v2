package com.korfarm.api.questionbank

import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class QuestionBankService(
    private val codeGroupRepo: QbCodeGroupRepository,
    private val codeValueRepo: QbCodeValueRepository,
    private val recordRepo: QbRecordRepository,
    private val passageRepo: QbPassageRepository,
    private val questionRepo: QbQuestionRepository,
    private val versionRepo: QbRecordVersionRepository,
    private val objectMapper: ObjectMapper
) {

    // ── 코드표 ──

    fun getAllCodes(): List<CodeGroupView> {
        val groups = codeGroupRepo.findAllByOrderBySortOrder()
        return groups.map { g ->
            val values = codeValueRepo.findByGroupIdOrderBySortOrder(g.id)
            CodeGroupView(
                id = g.id,
                group_key = g.groupKey,
                label = g.label,
                sort_order = g.sortOrder,
                values = values.map { v ->
                    CodeValueView(v.id, v.groupId, v.value, v.label, v.sortOrder, v.isActive)
                }
            )
        }
    }

    @Transactional
    fun createCodeGroup(req: CreateCodeGroupRequest): CodeGroupView {
        if (codeGroupRepo.findByGroupKey(req.group_key) != null) {
            throw ApiException("DUPLICATE", "이미 존재하는 그룹 키: ${req.group_key}", HttpStatus.CONFLICT)
        }
        val entity = QbCodeGroupEntity(
            id = IdGenerator.newId("qbcg"),
            groupKey = req.group_key,
            label = req.label,
            sortOrder = req.sort_order ?: 0
        )
        codeGroupRepo.save(entity)
        return CodeGroupView(entity.id, entity.groupKey, entity.label, entity.sortOrder, emptyList())
    }

    @Transactional
    fun updateCodeGroup(id: String, req: UpdateCodeGroupRequest): CodeGroupView {
        val entity = codeGroupRepo.findById(id).orElseThrow {
            ApiException("NOT_FOUND", "코드 그룹을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        req.label?.let { entity.label = it }
        req.sort_order?.let { entity.sortOrder = it }
        codeGroupRepo.save(entity)
        val values = codeValueRepo.findByGroupIdOrderBySortOrder(entity.id)
        return CodeGroupView(entity.id, entity.groupKey, entity.label, entity.sortOrder,
            values.map { CodeValueView(it.id, it.groupId, it.value, it.label, it.sortOrder, it.isActive) })
    }

    @Transactional
    fun createCodeValue(req: CreateCodeValueRequest): CodeValueView {
        if (!codeGroupRepo.existsById(req.group_id)) {
            throw ApiException("NOT_FOUND", "코드 그룹을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        if (codeValueRepo.existsByGroupIdAndValue(req.group_id, req.value)) {
            throw ApiException("DUPLICATE", "이미 존재하는 값: ${req.value}", HttpStatus.CONFLICT)
        }
        val entity = QbCodeValueEntity(
            id = IdGenerator.newId("qbcv"),
            groupId = req.group_id,
            value = req.value,
            label = req.label,
            sortOrder = req.sort_order ?: 0
        )
        codeValueRepo.save(entity)
        return CodeValueView(entity.id, entity.groupId, entity.value, entity.label, entity.sortOrder, entity.isActive)
    }

    @Transactional
    fun updateCodeValue(id: String, req: UpdateCodeValueRequest): CodeValueView {
        val entity = codeValueRepo.findById(id).orElseThrow {
            ApiException("NOT_FOUND", "코드 값을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        req.label?.let { entity.label = it }
        req.sort_order?.let { entity.sortOrder = it }
        req.is_active?.let { entity.isActive = it }
        codeValueRepo.save(entity)
        return CodeValueView(entity.id, entity.groupId, entity.value, entity.label, entity.sortOrder, entity.isActive)
    }

    @Transactional
    fun deactivateCodeValue(id: String) {
        val entity = codeValueRepo.findById(id).orElseThrow {
            ApiException("NOT_FOUND", "코드 값을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        entity.isActive = false
        codeValueRepo.save(entity)
    }

    // ── 레코드 CRUD ──

    fun listRecords(area: String?, subArea: String?, sourceType: String?, status: String?): List<RecordSummaryView> {
        val records = if (area == null && subArea == null && sourceType == null && status == null) {
            recordRepo.findAllActive()
        } else {
            recordRepo.findFiltered(area, subArea, sourceType, status)
        }
        return records.map { r ->
            val qCount = questionRepo.countByRecordId(r.id)
            RecordSummaryView(
                id = r.id,
                record_code = r.recordCode,
                source_type = r.sourceType,
                exam_org = r.examOrg,
                exam_year = r.examYear,
                area = r.area,
                sub_area = r.subArea,
                title = r.title,
                difficulty = r.difficulty,
                author = r.author,
                reviewer = r.reviewer,
                review_status = r.reviewStatus,
                reviewed_at = r.reviewedAt,
                status = r.status,
                question_count = qCount,
                created_at = r.createdAt,
                updated_at = r.updatedAt
            )
        }
    }

    fun getRecordDetail(id: String): RecordDetailView {
        val r = recordRepo.findById(id).orElseThrow {
            ApiException("NOT_FOUND", "레코드를 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        val passages = passageRepo.findByRecordIdOrderBySortOrder(id)
        val questions = questionRepo.findByRecordIdOrderBySortOrder(id)

        return RecordDetailView(
            id = r.id,
            record_code = r.recordCode,
            source_type = r.sourceType,
            exam_org = r.examOrg,
            exam_year = r.examYear,
            exam_month = r.examMonth,
            area = r.area,
            sub_area = r.subArea,
            title = r.title,
            target_grades = parseJsonSafe(r.targetGrades),
            difficulty = r.difficulty,
            tags = parseJsonSafe(r.tags),
            author = r.author,
            reviewer = r.reviewer,
            review_status = r.reviewStatus,
            reviewed_at = r.reviewedAt,
            status = r.status,
            meta_json = parseJsonSafe(r.metaJson),
            passages = passages.map { p ->
                PassageView(
                    id = p.id, passage_code = p.passageCode, ref_type = p.refType,
                    title = p.title, body_text = p.bodyText,
                    sub_passages = parseJsonSafe(p.subPassages),
                    box_items = parseJsonSafe(p.boxItems),
                    sort_order = p.sortOrder
                )
            },
            questions = questions.map { q ->
                QuestionView(
                    id = q.id, question_number = q.questionNumber,
                    passage_refs = parseJsonSafe(q.passageRefs),
                    question_format = q.questionFormat, answer_type = q.answerType,
                    question_type = q.questionType, stem = q.stem,
                    box_items = parseJsonSafe(q.boxItems),
                    choices = parseJsonSafe(q.choices),
                    correct_answer = q.correctAnswer, difficulty = q.difficulty,
                    explanation = q.explanation,
                    applied_concepts = parseJsonSafe(q.appliedConcepts),
                    choice_pattern = q.choicePattern,
                    scoring_criteria = parseJsonSafe(q.scoringCriteria),
                    points = q.points, sort_order = q.sortOrder
                )
            },
            created_at = r.createdAt,
            updated_at = r.updatedAt
        )
    }

    @Transactional
    fun updateRecord(id: String, req: UpdateRecordRequest, userId: String): RecordDetailView {
        val r = recordRepo.findById(id).orElseThrow {
            ApiException("NOT_FOUND", "레코드를 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        req.source_type?.let { r.sourceType = it }
        req.exam_org?.let { r.examOrg = it }
        req.exam_year?.let { r.examYear = it }
        req.exam_month?.let { r.examMonth = it }
        req.area?.let { r.area = it }
        req.sub_area?.let { r.subArea = it }
        req.title?.let { r.title = it }
        req.target_grades?.let { r.targetGrades = objectMapper.writeValueAsString(it) }
        req.difficulty?.let { r.difficulty = it }
        req.tags?.let { r.tags = objectMapper.writeValueAsString(it) }
        req.author?.let { r.author = it }
        req.reviewer?.let { r.reviewer = it.ifBlank { null } }
        req.review_status?.let {
            val oldStatus = r.reviewStatus
            r.reviewStatus = it
            if (it == "done" && oldStatus != "done") {
                r.reviewedAt = java.time.LocalDateTime.now()
            } else if (it == "none") {
                r.reviewedAt = null
            }
        }
        req.status?.let { r.status = it }
        req.meta?.let { r.metaJson = objectMapper.writeValueAsString(it) }
        recordRepo.save(r)

        // 지문 교체
        req.passages?.let { newPassages ->
            passageRepo.deleteByRecordId(id)
            newPassages.forEachIndexed { idx, p ->
                val pe = QbPassageEntity(
                    id = IdGenerator.newId("qbp"),
                    recordId = id,
                    passageCode = p.passage_code ?: "PAS-${idx + 1}",
                    refType = p.ref_type,
                    title = p.title,
                    bodyText = p.body_text,
                    subPassages = p.sub_passages?.let { objectMapper.writeValueAsString(it) },
                    boxItems = p.box_items?.let { objectMapper.writeValueAsString(it) },
                    sortOrder = idx
                )
                passageRepo.save(pe)
            }
        }

        // 문제 교체
        req.questions?.let { newQuestions ->
            questionRepo.deleteByRecordId(id)
            newQuestions.forEachIndexed { idx, q ->
                val qe = QbQuestionEntity(
                    id = IdGenerator.newId("qbq"),
                    recordId = id,
                    questionNumber = q.question_number,
                    passageRefs = q.passage_refs?.let { objectMapper.writeValueAsString(it) },
                    questionFormat = q.question_format,
                    answerType = q.answer_type,
                    questionType = q.question_type,
                    stem = q.stem,
                    boxItems = q.box_items?.let { objectMapper.writeValueAsString(it) },
                    choices = q.choices?.let { objectMapper.writeValueAsString(it) },
                    correctAnswer = q.correct_answer,
                    difficulty = q.difficulty,
                    explanation = q.explanation,
                    appliedConcepts = q.applied_concepts?.let { objectMapper.writeValueAsString(it) },
                    choicePattern = q.choice_pattern,
                    scoringCriteria = q.scoring_criteria?.let { objectMapper.writeValueAsString(it) },
                    points = q.points,
                    sortOrder = idx
                )
                questionRepo.save(qe)
            }
        }

        return getRecordDetail(id)
    }

    @Transactional
    fun archiveRecord(id: String) {
        val r = recordRepo.findById(id).orElseThrow {
            ApiException("NOT_FOUND", "레코드를 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        r.status = "archived"
        recordRepo.save(r)
    }

    // ── 임포트 ──

    @Transactional
    fun importRecords(req: QbImportRequest, userId: String): QbImportResult {
        val results = mutableListOf<QbImportItemResult>()
        var imported = 0
        var failed = 0

        req.records.forEachIndexed { idx, rec ->
            try {
                val recordCode = rec.record_code ?: "REC-${System.currentTimeMillis()}-${idx}"

                if (recordRepo.existsByRecordCode(recordCode)) {
                    throw ApiException("DUPLICATE", "중복 레코드 코드: $recordCode", HttpStatus.CONFLICT)
                }

                val recordId = IdGenerator.newId("qbr")
                val entity = QbRecordEntity(
                    id = recordId,
                    recordCode = recordCode,
                    sourceType = rec.source_type,
                    examOrg = rec.exam_org,
                    examYear = rec.exam_year,
                    examMonth = rec.exam_month,
                    area = rec.area,
                    subArea = rec.sub_area,
                    title = rec.title,
                    targetGrades = rec.target_grades?.let { objectMapper.writeValueAsString(it) },
                    difficulty = rec.difficulty,
                    tags = rec.tags?.let { objectMapper.writeValueAsString(it) },
                    author = rec.author,
                    status = "draft"
                )
                if (rec.meta != null) {
                    entity.metaJson = objectMapper.writeValueAsString(rec.meta)
                }
                recordRepo.save(entity)

                // 지문 저장
                rec.passages?.forEachIndexed { pIdx, p ->
                    val pe = QbPassageEntity(
                        id = IdGenerator.newId("qbp"),
                        recordId = recordId,
                        passageCode = p.passage_code ?: "PAS-${pIdx + 1}",
                        refType = p.ref_type,
                        title = p.title,
                        bodyText = p.body_text,
                        subPassages = p.sub_passages?.let { objectMapper.writeValueAsString(it) },
                        boxItems = p.box_items?.let { objectMapper.writeValueAsString(it) },
                        sortOrder = pIdx
                    )
                    passageRepo.save(pe)
                }

                // 문제 저장
                rec.questions?.forEachIndexed { qIdx, q ->
                    val qe = QbQuestionEntity(
                        id = IdGenerator.newId("qbq"),
                        recordId = recordId,
                        questionNumber = q.question_number,
                        passageRefs = q.passage_refs?.let { objectMapper.writeValueAsString(it) },
                        questionFormat = q.question_format,
                        answerType = q.answer_type,
                        questionType = q.question_type,
                        stem = q.stem,
                        boxItems = q.box_items?.let { objectMapper.writeValueAsString(it) },
                        choices = q.choices?.let { objectMapper.writeValueAsString(it) },
                        correctAnswer = q.correct_answer,
                        difficulty = q.difficulty,
                        explanation = q.explanation,
                        appliedConcepts = q.applied_concepts?.let { objectMapper.writeValueAsString(it) },
                        choicePattern = q.choice_pattern,
                        scoringCriteria = q.scoring_criteria?.let { objectMapper.writeValueAsString(it) },
                        points = q.points,
                        sortOrder = qIdx
                    )
                    questionRepo.save(qe)
                }

                // 원본 JSON 버전 저장
                val version = QbRecordVersionEntity(
                    id = IdGenerator.newId("qbv"),
                    recordId = recordId,
                    schemaVersion = req.schema_version ?: "1.0",
                    fullJson = objectMapper.writeValueAsString(rec),
                    uploadedBy = userId
                )
                versionRepo.save(version)

                imported++
                results.add(QbImportItemResult(idx, recordId, recordCode, true))
            } catch (e: Exception) {
                failed++
                results.add(QbImportItemResult(idx, null, null, false, e.message))
            }
        }

        return QbImportResult(imported, failed, results)
    }

    // ── 내보내기 ──

    fun exportRecords(recordIds: List<String>): List<Map<String, Any?>> {
        return recordIds.mapNotNull { id ->
            try {
                val detail = getRecordDetail(id)
                objectMapper.convertValue(detail, Map::class.java) as Map<String, Any?>
            } catch (e: Exception) {
                null
            }
        }
    }

    // ── 유틸 ──

    private fun parseJsonSafe(json: String?): Any? {
        if (json.isNullOrBlank()) return null
        return try {
            objectMapper.readValue(json, Any::class.java)
        } catch (e: Exception) {
            json
        }
    }
}
