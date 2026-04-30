package com.korfarm.api.study

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.economy.EconomyService
import com.korfarm.api.learning.FarmLearningLogEntity
import com.korfarm.api.learning.FarmLearningLogRepository
import com.korfarm.api.org.OrgMembershipRepository
import com.korfarm.api.org.OrgRepository
import com.korfarm.api.security.SecurityUtils
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import kotlin.math.min
import kotlin.math.roundToInt

@Service
class StudyContentService(
    private val studyContentRepository: StudyContentRepository,
    private val studyPageRepository: StudyPageRepository,
    private val studyQuestionRepository: StudyQuestionRepository,
    private val studyAttemptRepository: StudyAttemptRepository,
    private val studyProgressRepository: StudyProgressRepository,
    private val orgMembershipRepository: OrgMembershipRepository,
    private val orgRepository: OrgRepository,
    private val farmLearningLogRepository: FarmLearningLogRepository,
    private val economyService: EconomyService,
    private val competencyService: com.korfarm.api.learning.LearningCompetencyService,
    private val objectMapper: ObjectMapper
) {
    private val log = LoggerFactory.getLogger(StudyContentService::class.java)
    private val fmt = DateTimeFormatter.ISO_LOCAL_DATE_TIME

    companion object {
        const val MIN_QUESTIONS = 5
        const val MAX_QUESTIONS = 2000
        const val SESSION_TARGET = 20
        const val SEEDS_PASS_THRESHOLD = 70 // 정확도 % 이상이면 씨앗 지급
        const val CONTENT_TYPE = "STUDY_CONTENT"
        const val SEED_TYPE = "seed_rice"
        const val SEEDS_BASE = 3
    }

    // ─────────────────────────────────────────────
    // 권한 헬퍼
    // ─────────────────────────────────────────────
    private fun currentUserOrgId(userId: String): String? {
        return orgMembershipRepository.findByUserIdAndStatus(userId, "active")
            .firstOrNull { it.orgId != "org_hq" }
            ?.orgId
            ?: orgMembershipRepository.findByUserIdAndStatus(userId, "active").firstOrNull()?.orgId
    }

    private fun isHqAdmin(): Boolean = SecurityUtils.hasAnyRole("HQ_ADMIN")
    private fun isOrgAdmin(): Boolean = SecurityUtils.hasAnyRole("ORG_ADMIN")

    // ─────────────────────────────────────────────
    // JSON 파서 헬퍼
    // ─────────────────────────────────────────────
    private fun stringListFromJson(json: String): List<String> = try {
        objectMapper.readValue(json, object : TypeReference<List<String>>() {})
    } catch (e: Exception) { emptyList() }

    private fun intListFromJson(json: String?): List<Int> = try {
        if (json.isNullOrBlank()) emptyList()
        else objectMapper.readValue(json, object : TypeReference<List<Int>>() {})
    } catch (e: Exception) { emptyList() }

    private fun choicesFromJson(json: String?): List<StudyChoiceDto> = try {
        if (json.isNullOrBlank()) emptyList()
        else objectMapper.readValue(json, object : TypeReference<List<StudyChoiceDto>>() {})
    } catch (e: Exception) { emptyList() }

    private fun fillBlanksFromJson(json: String?): List<StudyFillBlankDto> = try {
        if (json.isNullOrBlank()) emptyList()
        else objectMapper.readValue(json, object : TypeReference<List<StudyFillBlankDto>>() {})
    } catch (e: Exception) { emptyList() }

    private fun toJson(value: Any?): String = objectMapper.writeValueAsString(value ?: emptyList<Any>())

    // ─────────────────────────────────────────────
    // 매핑
    // ─────────────────────────────────────────────
    private fun vectorFromJson(json: String?): Map<String, Double>? = try {
        if (json.isNullOrBlank()) null
        else objectMapper.readValue(json, object : TypeReference<Map<String, Double>>() {})
    } catch (e: Exception) { null }

    private fun checkpointsFromJson(json: String?): List<StudyCheckpointDto> = try {
        if (json.isNullOrBlank()) emptyList()
        else objectMapper.readValue(json, object : TypeReference<List<StudyCheckpointDto>>() {})
    } catch (e: Exception) { emptyList() }

    private fun stringListFromJsonOrNull(json: String?): List<String>? = try {
        if (json.isNullOrBlank()) null
        else objectMapper.readValue(json, object : TypeReference<List<String>>() {})
    } catch (e: Exception) { null }

    private fun toQuestionDto(q: StudyQuestionEntity): StudyQuestionDto {
        return StudyQuestionDto(
            id = q.id,
            questionNo = q.questionNo,
            questionType = q.questionType,
            stem = q.stem,
            boxContent = q.boxContent,
            conditionContent = q.conditionContent,
            choices = if (q.choices.isNullOrBlank()) null else choicesFromJson(q.choices),
            modelAnswer = q.modelAnswer,
            fillBlanks = if (q.fillBlanks.isNullOrBlank()) null else fillBlanksFromJson(q.fillBlanks),
            distractorSyllables = stringListFromJsonOrNull(q.distractorSyllables),
            evalPointIdx = intListFromJson(q.evalPointIdx).map { it as Any },
            difficulty = q.difficulty,
            competencyVector = vectorFromJson(q.competencyVector),
            wrongVector = vectorFromJson(q.wrongVector)
        )
    }

    private fun toContentDetail(c: StudyContentEntity, qs: List<StudyQuestionEntity>): StudyContentDetail {
        return StudyContentDetail(
            id = c.id,
            title = c.title,
            description = c.description,
            levelId = c.levelId,
            area = c.area,
            subArea = c.subArea,
            visibility = c.visibility,
            ownerOrgId = c.ownerOrgId,
            creatorId = c.creatorId,
            markdown = c.markdown,
            evalPoints = stringListFromJson(c.evalPoints),
            errorPatterns = stringListFromJson(c.errorPatterns),
            questionCount = c.questionCount,
            status = c.status,
            questions = qs.map { toQuestionDto(it) },
            sourceType = c.sourceType,
            sourceFileUrl = c.sourceFileUrl,
            sourceFileName = c.sourceFileName,
            sourceFileSizeBytes = c.sourceFileSizeBytes,
            createdAt = c.createdAt.format(fmt),
            updatedAt = c.updatedAt.format(fmt)
        )
    }

    private fun toContentSummary(c: StudyContentEntity, orgNameMap: Map<String, String>): StudyContentSummary {
        return StudyContentSummary(
            id = c.id,
            title = c.title,
            description = c.description,
            levelId = c.levelId,
            area = c.area,
            subArea = c.subArea,
            visibility = c.visibility,
            ownerOrgId = c.ownerOrgId,
            ownerOrgName = c.ownerOrgId?.let { orgNameMap[it] },
            creatorId = c.creatorId,
            questionCount = c.questionCount,
            status = c.status,
            sourceType = c.sourceType,
            createdAt = c.createdAt.format(fmt),
            updatedAt = c.updatedAt.format(fmt)
        )
    }

    // ─────────────────────────────────────────────
    // 관리자 — 목록
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    fun listForAdmin(userId: String): List<StudyContentSummary> {
        val contents = if (isHqAdmin()) {
            studyContentRepository.findAllByStatusOrderByCreatedAtDesc("active")
        } else if (isOrgAdmin()) {
            val orgId = currentUserOrgId(userId)
                ?: throw ApiException("FORBIDDEN", "기관 정보를 찾을 수 없습니다", HttpStatus.FORBIDDEN)
            studyContentRepository.findAllByOwnerOrgIdAndStatusOrderByCreatedAtDesc(orgId, "active")
        } else {
            throw ApiException("FORBIDDEN", "forbidden", HttpStatus.FORBIDDEN)
        }
        val orgIds = contents.mapNotNull { it.ownerOrgId }.distinct()
        val orgNameMap = if (orgIds.isNotEmpty()) {
            orgRepository.findAllById(orgIds).associate { it.id to it.name }
        } else emptyMap()
        return contents.map { toContentSummary(it, orgNameMap) }
    }

    // ─────────────────────────────────────────────
    // 관리자 — 상세 조회
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    fun getForAdmin(contentId: String, userId: String): StudyContentDetail {
        val c = studyContentRepository.findById(contentId).orElse(null)
            ?: throw ApiException("NOT_FOUND", "콘텐츠 없음", HttpStatus.NOT_FOUND)
        ensureAdminCanAccess(c, userId)
        val qs = studyQuestionRepository.findAllByContentIdOrderByQuestionNoAsc(contentId)
        return toContentDetail(c, qs)
    }

    private fun ensureAdminCanAccess(c: StudyContentEntity, userId: String) {
        if (isHqAdmin()) return
        if (isOrgAdmin()) {
            val orgId = currentUserOrgId(userId)
            if (orgId != null && c.ownerOrgId == orgId) return
        }
        throw ApiException("FORBIDDEN", "접근 권한 없음", HttpStatus.FORBIDDEN)
    }

    // ─────────────────────────────────────────────
    // 관리자 — 신규 콘텐츠 생성 (markdown + 체크리스트, 문제는 별도 호출)
    // ─────────────────────────────────────────────
    @Transactional
    fun createContent(request: StudyContentCreateRequest, userId: String): StudyContentDetail {
        if (!isHqAdmin() && !isOrgAdmin()) {
            throw ApiException("FORBIDDEN", "forbidden", HttpStatus.FORBIDDEN)
        }
        if (request.title.isBlank()) throw ApiException("INVALID", "제목 필수", HttpStatus.BAD_REQUEST)
        if (request.markdown.isBlank()) throw ApiException("INVALID", "본문 필수", HttpStatus.BAD_REQUEST)

        // visibility 강제
        val visibility = if (isHqAdmin()) {
            request.visibility.uppercase().also {
                if (it !in setOf("PUBLIC", "ORG")) throw ApiException("INVALID", "visibility 잘못됨", HttpStatus.BAD_REQUEST)
            }
        } else {
            "ORG"
        }

        val ownerOrgId: String? = when (visibility) {
            "PUBLIC" -> null
            "ORG" -> {
                if (isHqAdmin()) {
                    request.ownerOrgId ?: throw ApiException("INVALID", "ownerOrgId 필수", HttpStatus.BAD_REQUEST)
                } else {
                    currentUserOrgId(userId)
                        ?: throw ApiException("FORBIDDEN", "기관 정보를 찾을 수 없습니다", HttpStatus.FORBIDDEN)
                }
            }
            else -> null
        }

        val entity = StudyContentEntity(
            id = IdGenerator.newId("study"),
            title = request.title,
            description = request.description,
            levelId = request.levelId,
            area = request.area,
            subArea = request.subArea,
            sourceType = request.sourceType.ifBlank { "manual" },
            sourceFileUrl = request.sourceFileUrl,
            sourceFileName = request.sourceFileName,
            sourceFileHash = request.sourceFileHash,
            sourceFileSizeBytes = request.sourceFileSizeBytes,
            visibility = visibility,
            ownerOrgId = ownerOrgId,
            creatorId = userId,
            markdown = request.markdown,
            evalPoints = toJson(request.evalPoints),
            errorPatterns = toJson(request.errorPatterns),
            questionCount = 0,
            status = "active"
        )
        studyContentRepository.save(entity)
        return toContentDetail(entity, emptyList())
    }

    // ─────────────────────────────────────────────
    // 관리자 — 콘텐츠 메타·본문·체크리스트 수정
    // ─────────────────────────────────────────────
    @Transactional
    fun updateContent(contentId: String, request: StudyContentUpdateRequest, userId: String): StudyContentDetail {
        val c = studyContentRepository.findById(contentId).orElse(null)
            ?: throw ApiException("NOT_FOUND", "콘텐츠 없음", HttpStatus.NOT_FOUND)
        ensureAdminCanAccess(c, userId)

        request.title?.let { if (it.isNotBlank()) c.title = it }
        request.description?.let { c.description = it }
        request.levelId?.let { c.levelId = it }
        request.area?.let { c.area = it.takeIf { v -> v.isNotBlank() } }
        request.subArea?.let { c.subArea = it.takeIf { v -> v.isNotBlank() } }
        request.markdown?.let { if (it.isNotBlank()) c.markdown = it }
        request.evalPoints?.let { c.evalPoints = toJson(it) }
        request.errorPatterns?.let { c.errorPatterns = toJson(it) }
        request.status?.let { c.status = it }

        // visibility 변경은 HQ_ADMIN만
        if (request.visibility != null) {
            if (!isHqAdmin()) throw ApiException("FORBIDDEN", "visibility 변경은 본사 관리자만", HttpStatus.FORBIDDEN)
            val v = request.visibility.uppercase()
            if (v !in setOf("PUBLIC", "ORG")) throw ApiException("INVALID", "visibility 잘못됨", HttpStatus.BAD_REQUEST)
            c.visibility = v
            if (v == "PUBLIC") c.ownerOrgId = null
            else c.ownerOrgId = request.ownerOrgId ?: c.ownerOrgId
        }

        studyContentRepository.save(c)
        val qs = studyQuestionRepository.findAllByContentIdOrderByQuestionNoAsc(contentId)
        return toContentDetail(c, qs)
    }

    // ─────────────────────────────────────────────
    // 관리자 — 콘텐츠 삭제
    // ─────────────────────────────────────────────
    @Transactional
    fun deleteContent(contentId: String, userId: String) {
        val c = studyContentRepository.findById(contentId).orElse(null)
            ?: throw ApiException("NOT_FOUND", "콘텐츠 없음", HttpStatus.NOT_FOUND)
        ensureAdminCanAccess(c, userId)
        // CASCADE로 study_questions도 삭제
        studyContentRepository.delete(c)
    }

    // ─────────────────────────────────────────────
    // 관리자 — 문제 일괄 업로드 (전체 교체)
    // ─────────────────────────────────────────────
    @Transactional
    fun replaceQuestions(contentId: String, request: StudyQuestionsBulkRequest, userId: String): StudyContentDetail {
        val c = studyContentRepository.findById(contentId).orElse(null)
            ?: throw ApiException("NOT_FOUND", "콘텐츠 없음", HttpStatus.NOT_FOUND)
        ensureAdminCanAccess(c, userId)

        val list = request.questions
        if (list.size < MIN_QUESTIONS) {
            throw ApiException("INVALID", "최소 ${MIN_QUESTIONS}문제 필요", HttpStatus.BAD_REQUEST)
        }
        if (list.size > MAX_QUESTIONS) {
            throw ApiException("INVALID", "최대 ${MAX_QUESTIONS}문제까지", HttpStatus.BAD_REQUEST)
        }

        val evalPointsSize = stringListFromJson(c.evalPoints).size
        val errorPatternsSize = stringListFromJson(c.errorPatterns).size
        validateQuestions(list, evalPointsSize, errorPatternsSize)

        studyQuestionRepository.deleteAllByContentId(contentId)
        studyQuestionRepository.flush()

        val now = LocalDateTime.now()
        val entities = list.mapIndexed { idx, q ->
            StudyQuestionEntity(
                id = IdGenerator.newId("sq"),
                contentId = contentId,
                questionNo = q.questionNo.takeIf { it > 0 } ?: (idx + 1),
                questionType = q.questionType.uppercase(),
                stem = q.stem,
                choices = q.choices?.let { toJson(it) },
                modelAnswer = q.modelAnswer,
                fillBlanks = q.fillBlanks?.let { toJson(it) },
                evalPointIdx = toJson(q.evalPointIdx ?: emptyList<Any>()),
                difficulty = q.difficulty,
                competencyVector = q.competencyVector?.let { toJson(it) },
                wrongVector = q.wrongVector?.let { toJson(it) },
                createdAt = now,
                updatedAt = now
            )
        }
        studyQuestionRepository.saveAll(entities)
        c.questionCount = entities.size
        studyContentRepository.save(c)

        return toContentDetail(c, entities)
    }

    private fun validateQuestions(qs: List<StudyQuestionDto>, evalPointsSize: Int, errorPatternsSize: Int) {
        qs.forEachIndexed { i, q ->
            val tag = "문제 ${i + 1}"
            val type = q.questionType.uppercase()
            if (type !in setOf("MULTI_CHOICE", "OX", "SHORT_ANSWER", "ESSAY")) {
                throw ApiException("INVALID", "$tag: 알 수 없는 type=${q.questionType}", HttpStatus.BAD_REQUEST)
            }
            if (q.stem.isBlank()) throw ApiException("INVALID", "$tag: stem 비어있음", HttpStatus.BAD_REQUEST)
            // evalPointIdx — evalPoints 가 비어있는 새 시스템 콘텐츠에서는 그냥 무시.
            // 채워져 있으면 Int 만 범위 검증, String/checkpoint id 는 무시 (옛 시스템 호환)
            if (evalPointsSize > 0) {
                (q.evalPointIdx ?: emptyList()).forEach { v ->
                    val idx = (v as? Number)?.toInt() ?: return@forEach
                    if (idx < 0 || idx >= evalPointsSize) {
                        throw ApiException("INVALID", "$tag: evalPointIdx $idx 가 evalPoints 범위 초과", HttpStatus.BAD_REQUEST)
                    }
                }
            }
            when (type) {
                "MULTI_CHOICE", "OX" -> {
                    val choices = q.choices ?: throw ApiException("INVALID", "$tag: choices 없음", HttpStatus.BAD_REQUEST)
                    if (type == "MULTI_CHOICE" && choices.size < 2) {
                        throw ApiException("INVALID", "$tag: MULTI_CHOICE는 선택지 2개 이상", HttpStatus.BAD_REQUEST)
                    }
                    if (type == "OX" && choices.size != 2) {
                        throw ApiException("INVALID", "$tag: OX는 선택지 정확히 2개", HttpStatus.BAD_REQUEST)
                    }
                    if (choices.none { it.isCorrect }) {
                        throw ApiException("INVALID", "$tag: 정답 선택지 없음", HttpStatus.BAD_REQUEST)
                    }
                    // errorPatternIdx — errorPatterns 가 비어있는 새 시스템 콘텐츠에서는 그냥 무시
                    if (errorPatternsSize > 0) {
                        choices.forEach { ch ->
                            if (ch.errorPatternIdx != null) {
                                if (ch.errorPatternIdx < 0 || ch.errorPatternIdx >= errorPatternsSize) {
                                    throw ApiException("INVALID", "$tag: errorPatternIdx ${ch.errorPatternIdx} 범위 초과", HttpStatus.BAD_REQUEST)
                                }
                            }
                        }
                    }
                }
                "SHORT_ANSWER" -> {
                    if (q.modelAnswer.isNullOrBlank()) {
                        throw ApiException("INVALID", "$tag: SHORT_ANSWER 는 modelAnswer(정답) 필수", HttpStatus.BAD_REQUEST)
                    }
                }
                "ESSAY" -> {
                    if (q.modelAnswer.isNullOrBlank()) {
                        throw ApiException("INVALID", "$tag: ESSAY는 modelAnswer 필수", HttpStatus.BAD_REQUEST)
                    }
                }
            }
        }
    }

    // ─────────────────────────────────────────────
    // 페이지 CRUD (V0076 이후) — 페이지별 마크다운 + 출제 포인트 + 문제
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    fun listPages(contentId: String, userId: String): List<StudyPageDto> {
        val c = studyContentRepository.findById(contentId).orElse(null)
            ?: throw ApiException("NOT_FOUND", "콘텐츠 없음", HttpStatus.NOT_FOUND)
        ensureAdminCanAccess(c, userId)
        val pages = studyPageRepository.findAllByContentIdOrderByPageNoAsc(contentId)
        val allQuestions = studyQuestionRepository.findAllByContentIdOrderByQuestionNoAsc(contentId)
            .groupBy { it.pageId }
        return pages.map { p ->
            StudyPageDto(
                id = p.id,
                pageNo = p.pageNo,
                title = p.title,
                markdown = p.markdown,
                checkpoints = checkpointsFromJson(p.checkpoints),
                questions = (allQuestions[p.id] ?: emptyList()).map { toQuestionDto(it) },
                createdAt = p.createdAt.format(fmt),
                updatedAt = p.updatedAt.format(fmt)
            )
        }
    }

    @Transactional
    fun createPage(contentId: String, request: StudyPageCreateRequest, userId: String): StudyPageDto {
        val c = studyContentRepository.findById(contentId).orElse(null)
            ?: throw ApiException("NOT_FOUND", "콘텐츠 없음", HttpStatus.NOT_FOUND)
        ensureAdminCanAccess(c, userId)
        val existing = studyPageRepository.findAllByContentIdOrderByPageNoAsc(contentId)
        val nextNo = request.pageNo ?: ((existing.maxOfOrNull { it.pageNo } ?: 0) + 1)
        // 같은 page_no 가 있으면 뒤로 밀기
        existing.filter { it.pageNo >= nextNo }.forEach {
            it.pageNo = it.pageNo + 1
            studyPageRepository.save(it)
        }
        val entity = StudyPageEntity(
            id = IdGenerator.newId("sp"),
            contentId = contentId,
            pageNo = nextNo,
            title = request.title,
            markdown = request.markdown,
            checkpoints = null
        )
        studyPageRepository.save(entity)
        return StudyPageDto(
            id = entity.id, pageNo = entity.pageNo, title = entity.title,
            markdown = entity.markdown, checkpoints = emptyList(), questions = emptyList(),
            createdAt = entity.createdAt.format(fmt), updatedAt = entity.updatedAt.format(fmt)
        )
    }

    @Transactional
    fun updatePage(
        contentId: String, pageId: String, request: StudyPageUpdateRequest, userId: String
    ): StudyPageDto {
        val c = studyContentRepository.findById(contentId).orElse(null)
            ?: throw ApiException("NOT_FOUND", "콘텐츠 없음", HttpStatus.NOT_FOUND)
        ensureAdminCanAccess(c, userId)
        val page = studyPageRepository.findById(pageId).orElse(null)
            ?: throw ApiException("NOT_FOUND", "페이지 없음", HttpStatus.NOT_FOUND)
        if (page.contentId != contentId) {
            throw ApiException("INVALID", "페이지가 콘텐츠에 속하지 않습니다", HttpStatus.BAD_REQUEST)
        }
        request.title?.let { page.title = it.takeIf { v -> v.isNotBlank() } }
        request.markdown?.let { if (it.isNotBlank()) page.markdown = it }
        request.checkpoints?.let { page.checkpoints = toJson(it) }
        // 페이지 순서 변경
        if (request.pageNo != null && request.pageNo != page.pageNo) {
            reorderPage(contentId, page, request.pageNo)
        }
        studyPageRepository.save(page)
        val questions = studyQuestionRepository.findAllByPageIdOrderByQuestionNoAsc(pageId)
        return StudyPageDto(
            id = page.id, pageNo = page.pageNo, title = page.title,
            markdown = page.markdown, checkpoints = checkpointsFromJson(page.checkpoints),
            questions = questions.map { toQuestionDto(it) },
            createdAt = page.createdAt.format(fmt), updatedAt = page.updatedAt.format(fmt)
        )
    }

    private fun reorderPage(contentId: String, page: StudyPageEntity, newNo: Int) {
        val pages = studyPageRepository.findAllByContentIdOrderByPageNoAsc(contentId)
            .filter { it.id != page.id }
            .toMutableList()
        val target = newNo.coerceIn(1, pages.size + 1)
        pages.add(target - 1, page)
        pages.forEachIndexed { idx, p ->
            if (p.pageNo != idx + 1) {
                p.pageNo = idx + 1
                studyPageRepository.save(p)
            }
        }
    }

    @Transactional
    fun deletePage(contentId: String, pageId: String, userId: String) {
        val c = studyContentRepository.findById(contentId).orElse(null)
            ?: throw ApiException("NOT_FOUND", "콘텐츠 없음", HttpStatus.NOT_FOUND)
        ensureAdminCanAccess(c, userId)
        val page = studyPageRepository.findById(pageId).orElse(null)
            ?: throw ApiException("NOT_FOUND", "페이지 없음", HttpStatus.NOT_FOUND)
        if (page.contentId != contentId) {
            throw ApiException("INVALID", "페이지가 콘텐츠에 속하지 않습니다", HttpStatus.BAD_REQUEST)
        }
        // 해당 페이지의 문제도 삭제
        studyQuestionRepository.deleteAllByPageId(pageId)
        studyPageRepository.delete(page)
        // 남은 페이지 번호 정렬
        val remaining = studyPageRepository.findAllByContentIdOrderByPageNoAsc(contentId)
        remaining.forEachIndexed { idx, p ->
            if (p.pageNo != idx + 1) {
                p.pageNo = idx + 1
                studyPageRepository.save(p)
            }
        }
        // questionCount 재계산
        c.questionCount = studyQuestionRepository.countByContentId(contentId)
        studyContentRepository.save(c)
    }

    /** 페이지별 문제 일괄 교체 (페이지당 최대 30) */
    @Transactional
    fun replacePageQuestions(
        contentId: String, pageId: String,
        request: StudyPageQuestionsBulkRequest, userId: String
    ): StudyPageDto {
        val c = studyContentRepository.findById(contentId).orElse(null)
            ?: throw ApiException("NOT_FOUND", "콘텐츠 없음", HttpStatus.NOT_FOUND)
        ensureAdminCanAccess(c, userId)
        val page = studyPageRepository.findById(pageId).orElse(null)
            ?: throw ApiException("NOT_FOUND", "페이지 없음", HttpStatus.NOT_FOUND)
        if (page.contentId != contentId) {
            throw ApiException("INVALID", "페이지가 콘텐츠에 속하지 않습니다", HttpStatus.BAD_REQUEST)
        }
        val list = request.questions
        if (list.size > 30) {
            throw ApiException("TOO_MANY", "페이지당 최대 30문제까지 저장 가능합니다", HttpStatus.BAD_REQUEST)
        }
        val evalPointsSize = stringListFromJson(c.evalPoints).size
        val errorPatternsSize = stringListFromJson(c.errorPatterns).size
        if (list.isNotEmpty()) {
            validateQuestions(list, evalPointsSize, errorPatternsSize)
        }
        studyQuestionRepository.deleteAllByPageId(pageId)
        studyQuestionRepository.flush()

        val now = LocalDateTime.now()
        val entities = list.mapIndexed { idx, q ->
            StudyQuestionEntity(
                id = IdGenerator.newId("sq"),
                contentId = contentId,
                pageId = pageId,
                questionNo = q.questionNo.takeIf { it > 0 } ?: (idx + 1),
                questionType = q.questionType.uppercase(),
                stem = q.stem,
                boxContent = q.boxContent?.takeIf { it.isNotBlank() },
                conditionContent = q.conditionContent?.takeIf { it.isNotBlank() },
                choices = q.choices?.let { toJson(it) },
                modelAnswer = q.modelAnswer,
                fillBlanks = q.fillBlanks?.let { toJson(it) },
                distractorSyllables = q.distractorSyllables?.let { toJson(it) },
                evalPointIdx = toJson(q.evalPointIdx ?: emptyList<Any>()),
                difficulty = q.difficulty,
                competencyVector = q.competencyVector?.let { toJson(it) },
                wrongVector = q.wrongVector?.let { toJson(it) },
                createdAt = now,
                updatedAt = now
            )
        }
        studyQuestionRepository.saveAll(entities)
        // 콘텐츠 전체 questionCount 재계산
        c.questionCount = studyQuestionRepository.countByContentId(contentId)
        studyContentRepository.save(c)

        return StudyPageDto(
            id = page.id, pageNo = page.pageNo, title = page.title,
            markdown = page.markdown, checkpoints = checkpointsFromJson(page.checkpoints),
            questions = entities.map { toQuestionDto(it) },
            createdAt = page.createdAt.format(fmt), updatedAt = page.updatedAt.format(fmt)
        )
    }

    // ─────────────────────────────────────────────
    // 학생 — 카탈로그
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    fun listForStudent(userId: String): List<StudyContentStudentItem> {
        // 본사·기관 관리자는 학생 화면에서 모든 active 콘텐츠 열람 (미리보기 / 검수)
        val isAdmin = isHqAdmin() || isOrgAdmin()
        val orgId = if (!isAdmin) currentUserOrgId(userId) else null
        val contents = if (isAdmin) {
            studyContentRepository.findAllByStatusOrderByCreatedAtDesc("active")
        } else {
            if (orgId != null) {
                studyContentRepository.findVisibleForStudent(orgId)
            } else {
                studyContentRepository.findVisibleForStudentNoOrg()
            }
        }
        return contents.map { c ->
            val progress = studyProgressRepository.findOne(userId, c.id)
            val seenCount = if (progress != null) stringListFromJson(progress.seenQuestionIds).size else 0
            val accuracy = if (progress != null && progress.totalAttempted > 0) {
                progress.totalCorrect.toDouble() / progress.totalAttempted
            } else 0.0
            val seenRatio = if (c.questionCount > 0) seenCount.toDouble() / c.questionCount else 0.0
            StudyContentStudentItem(
                id = c.id,
                title = c.title,
                description = c.description,
                levelId = c.levelId,
                area = c.area,
                subArea = c.subArea,
                visibility = c.visibility,
                questionCount = c.questionCount,
                seenRatio = seenRatio,
                accuracy = accuracy,
                totalSessions = progress?.totalSessions ?: 0
            )
        }
    }

    // ─────────────────────────────────────────────
    // 학생 — 콘텐츠 본문 조회 (마크다운)
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    fun getForStudent(contentId: String, userId: String): StudyContentStudentDetail {
        val c = studyContentRepository.findById(contentId).orElse(null)
            ?: throw ApiException("NOT_FOUND", "콘텐츠 없음", HttpStatus.NOT_FOUND)
        ensureStudentCanAccess(c, userId)
        return StudyContentStudentDetail(
            id = c.id,
            title = c.title,
            description = c.description,
            levelId = c.levelId,
            area = c.area,
            subArea = c.subArea,
            markdown = c.markdown,
            questionCount = c.questionCount
        )
    }

    /**
     * V0076 이후 학생용 — 콘텐츠의 모든 페이지(본문 + 정답 마스킹된 문제) 일괄 + 세션 시작.
     * 시험지 디자인 학습 화면용. 페이지 순서대로 본문 읽고 페이지별 문제를 모달에서 푸는 흐름.
     */
    @Transactional
    fun getFullForStudent(contentId: String, userId: String): StudyContentFullStudentDto {
        val c = studyContentRepository.findById(contentId).orElse(null)
            ?: throw ApiException("NOT_FOUND", "콘텐츠 없음", HttpStatus.NOT_FOUND)
        ensureStudentCanAccess(c, userId)

        val pages = studyPageRepository.findAllByContentIdOrderByPageNoAsc(contentId)
        val allQuestions = studyQuestionRepository.findAllByContentIdOrderByQuestionNoAsc(contentId)
            .groupBy { it.pageId }

        // 세션 시작 — farm_learning_logs 에 STARTED 기록
        val now = LocalDateTime.now()
        val logEntity = FarmLearningLogEntity(
            id = IdGenerator.newId("fl"),
            userId = userId,
            contentId = contentId,
            contentType = CONTENT_TYPE,
            status = "STARTED",
            startedAt = now
        )
        farmLearningLogRepository.save(logEntity)
        val sessionId = IdGenerator.newId("ss")

        return StudyContentFullStudentDto(
            id = c.id,
            title = c.title,
            description = c.description,
            levelId = c.levelId,
            area = c.area,
            subArea = c.subArea,
            sessionId = sessionId,
            logId = logEntity.id,
            pages = pages.map { p ->
                val pageQs = allQuestions[p.id] ?: emptyList()
                StudyPageStudentDto(
                    id = p.id,
                    pageNo = p.pageNo,
                    title = p.title,
                    markdown = p.markdown,
                    questions = pageQs.map { q -> toStudentQuestionDto(q) }
                )
            }
        )
    }

    /** 정답 마스킹 + 음절 카드 / 모범답안 ___ 생성 */
    private fun toStudentQuestionDto(q: StudyQuestionEntity): StudyPageStudentQuestionDto {
        val type = q.questionType.uppercase()
        val choices = if (type == "MULTI_CHOICE" || type == "OX") {
            choicesFromJson(q.choices).map { StudyPageStudentChoiceDto(it.id, it.text) }
        } else null

        var answerLength: Int? = null
        var syllableCards: List<String>? = null
        if (type == "SHORT_ANSWER") {
            val answer = (q.modelAnswer ?: "").replace("\\s+".toRegex(), "")
            answerLength = answer.length
            if (answer.isNotEmpty()) {
                val saved = stringListFromJsonOrNull(q.distractorSyllables)
                syllableCards = buildSyllableCards(answer, saved)
            }
        }

        var modelAnswerMasked: String? = null
        var fillBlanksCount: Int? = null
        var fillBlanksChoices: List<List<String>>? = null
        if (type == "ESSAY") {
            val ans = q.modelAnswer ?: ""
            val blanks = fillBlanksFromJson(q.fillBlanks)
            fillBlanksCount = blanks.size
            // 각 phrase 를 동일 글자수의 ___ 로 치환 (반복 phrase 도 모두)
            var masked = ans
            for (b in blanks) {
                val replacement = "_".repeat(b.phrase.length.coerceAtLeast(3))
                masked = masked.replace(b.phrase, replacement)
            }
            modelAnswerMasked = masked
            // 각 빈칸의 선택지 (정답+오답) 셔플
            fillBlanksChoices = blanks.map { b ->
                val opts = (b.choices ?: listOf(b.phrase)).distinct().toMutableList()
                if (b.phrase !in opts) opts.add(0, b.phrase)
                opts.shuffled()
            }
        }

        return StudyPageStudentQuestionDto(
            id = q.id,
            questionNo = q.questionNo,
            questionType = type,
            stem = q.stem,
            boxContent = q.boxContent,
            conditionContent = q.conditionContent,
            choices = choices,
            answerLength = answerLength,
            syllableCards = syllableCards,
            modelAnswerMasked = modelAnswerMasked,
            fillBlanksCount = fillBlanksCount,
            fillBlanksChoices = fillBlanksChoices
        )
    }

    /**
     * 정답 글자 + 더미 음절 셔플 = 글자수 × 2 카드 풀.
     *
     * @param answer 정답 (공백 제거된 글자열)
     * @param savedDistractors 어드민/AI 가 저장한 오답 음절. 우선 사용. 부족하면 무작위 풀에서 보충.
     *
     * 규칙:
     *  - 정답 글자와 더미 글자 모두 중복 금지 (음절 풀에 같은 글자 두 번 안 나옴)
     *  - 더미 개수 = 정답 글자수 (총 글자수 × 2 카드)
     */
    private fun buildSyllableCards(answer: String, savedDistractors: List<String>?): List<String> {
        val chars = answer.toCharArray().map { it.toString() }
        val targetDummyCount = chars.size
        val used = chars.toMutableSet()
        val dummies = mutableListOf<String>()

        // 1차: 저장된 오답 음절 사용 (정답·자기 자신과 중복 X)
        savedDistractors?.forEach { raw ->
            val s = raw.trim()
            if (s.length == 1 && s !in used) {
                dummies.add(s)
                used.add(s)
                if (dummies.size >= targetDummyCount) return@forEach
            }
        }

        // 2차: 부족하면 무작위 한글 음절 풀에서 보충 (중복 금지)
        if (dummies.size < targetDummyCount) {
            val pool = ("가나다라마바사아자차카타파하" +
                "거너더러머버서어저처커터퍼허" +
                "고노도로모보소오조초코토포호" +
                "구누두루무부수우주추쿠투푸후" +
                "기니디리미비시이지치키티피히")
                .toCharArray().map { it.toString() }
                .filter { it !in used }
                .shuffled()
            val need = targetDummyCount - dummies.size
            for (s in pool) {
                if (need <= 0) break
                if (s in used) continue
                dummies.add(s)
                used.add(s)
                if (dummies.size >= targetDummyCount) break
            }
        }

        val cards = (chars + dummies).toMutableList()
        // Fisher-Yates 셔플
        for (i in cards.size - 1 downTo 1) {
            val j = (0..i).random()
            val tmp = cards[i]; cards[i] = cards[j]; cards[j] = tmp
        }
        return cards
    }

    private fun ensureStudentCanAccess(c: StudyContentEntity, userId: String) {
        if (c.status != "active") {
            throw ApiException("FORBIDDEN", "비활성 콘텐츠", HttpStatus.FORBIDDEN)
        }
        // 본사·기관 관리자는 학생 화면에서도 visibility 무관하게 접근 (미리보기·검수)
        if (isHqAdmin() || isOrgAdmin()) return
        when (c.visibility) {
            "PUBLIC" -> return
            "ORG" -> {
                val orgId = currentUserOrgId(userId)
                if (orgId != null && c.ownerOrgId == orgId) return
                throw ApiException("FORBIDDEN", "이 콘텐츠는 소속 기관 학생만 학습할 수 있습니다", HttpStatus.FORBIDDEN)
            }
            else -> throw ApiException("FORBIDDEN", "알 수 없는 가시성", HttpStatus.FORBIDDEN)
        }
    }

    // ─────────────────────────────────────────────
    // 학생 — 학습 세션 시작 (알고리즘으로 20문제 선별)
    // ─────────────────────────────────────────────
    @Transactional
    fun startSession(contentId: String, userId: String, target: Int = SESSION_TARGET): StudySessionStartResponse {
        val c = studyContentRepository.findById(contentId).orElse(null)
            ?: throw ApiException("NOT_FOUND", "콘텐츠 없음", HttpStatus.NOT_FOUND)
        ensureStudentCanAccess(c, userId)

        val all = studyQuestionRepository.findAllByContentIdOrderByQuestionNoAsc(contentId)
        if (all.size < MIN_QUESTIONS) {
            throw ApiException("INVALID", "이 콘텐츠는 등록된 문제가 ${MIN_QUESTIONS}개 미만입니다", HttpStatus.BAD_REQUEST)
        }

        val selected = selectQuestions(userId, c, all, target)

        // farm_learning_logs에 세션 시작 기록
        val now = LocalDateTime.now()
        val logEntity = FarmLearningLogEntity(
            id = IdGenerator.newId("fl"),
            userId = userId,
            contentId = contentId,
            contentType = CONTENT_TYPE,
            status = "STARTED",
            startedAt = now
        )
        farmLearningLogRepository.save(logEntity)

        val sessionId = IdGenerator.newId("ss")
        return StudySessionStartResponse(
            sessionId = sessionId,
            logId = logEntity.id,
            questions = selected.map { q ->
                StudySessionQuestionDto(
                    id = q.id,
                    questionNo = q.questionNo,
                    questionType = q.questionType,
                    stem = q.stem,
                    choices = if (q.questionType == "ESSAY") null
                              else choicesFromJson(q.choices).map { StudySessionChoiceDto(id = it.id, text = it.text) },
                    fillBlanks = if (q.questionType == "ESSAY") fillBlanksFromJson(q.fillBlanks) else null,
                    modelAnswerHint = if (q.questionType == "ESSAY") q.modelAnswer else null
                )
            }
        )
    }

    // 약점 알고리즘
    private fun selectQuestions(
        userId: String,
        content: StudyContentEntity,
        all: List<StudyQuestionEntity>,
        target: Int
    ): List<StudyQuestionEntity> {
        val total = all.size
        if (total <= target) {
            return all.shuffled()
        }

        val progress = studyProgressRepository.findOne(userId, content.id)
        val seenIds: Set<String> = if (progress != null) {
            try { objectMapper.readValue(progress.seenQuestionIds, object : TypeReference<List<String>>() {}).toSet() }
            catch (e: Exception) { emptySet() }
        } else emptySet()
        val seenRatio = seenIds.size.toDouble() / total

        val unseen = all.filter { it.id !in seenIds }

        val newCount: Int
        val weakCount: Int
        if (seenRatio < 0.8) {
            // 1회독 미만: 새 문제 70%
            newCount = min((target * 0.7).roundToInt(), unseen.size)
            weakCount = target - newCount
        } else {
            // 1회독 80% 이상: 약점 위주, 새 문제 20%
            newCount = min((target * 0.2).roundToInt(), unseen.size)
            weakCount = target - newCount
        }

        val newPick = unseen.shuffled().take(newCount)

        // 약점 evalPoint 인덱스 계산
        val evalCorrect = intListFromJson(progress?.evalPointCorrect)
        val evalAttempted = intListFromJson(progress?.evalPointAttempted)
        val evalPointsSize = stringListFromJson(content.evalPoints).size
        // 정확도가 낮은 evalPoint 인덱스 정렬 (시도가 있는 것 중)
        val weakEvalSet = (0 until evalPointsSize)
            .map { idx ->
                val attempted = evalAttempted.getOrNull(idx) ?: 0
                val correct = evalCorrect.getOrNull(idx) ?: 0
                val acc = if (attempted > 0) correct.toDouble() / attempted else 1.0
                Triple(idx, attempted, acc)
            }
            .filter { it.second > 0 }
            .sortedWith(compareBy({ it.third }, { -it.second }))
            .take(5)
            .map { it.first }
            .toSet()

        val pickedIds = newPick.map { it.id }.toMutableSet()
        val weakCandidates = all.filter { q ->
            if (q.id in pickedIds) return@filter false
            val ev = intListFromJson(q.evalPointIdx)
            ev.any { it in weakEvalSet }
        }
        val weakPick = weakCandidates.shuffled().take(weakCount).toMutableList()

        if (weakPick.size < weakCount) {
            val needed = weakCount - weakPick.size
            val rest = all.filter { it.id !in pickedIds && it !in weakPick }
            weakPick.addAll(rest.shuffled().take(needed))
        }

        val result = (newPick + weakPick).shuffled()
        return result.take(target)
    }

    // ─────────────────────────────────────────────
    // 학생 — 단일 답안 제출 (즉시 채점 + 진도 갱신)
    // ─────────────────────────────────────────────
    @Transactional
    fun submitAttempt(contentId: String, userId: String, request: StudyAttemptSubmitRequest): StudyAttemptSubmitResponse {
        val q = studyQuestionRepository.findById(request.questionId).orElse(null)
            ?: throw ApiException("NOT_FOUND", "문제 없음", HttpStatus.NOT_FOUND)
        if (q.contentId != contentId) {
            throw ApiException("INVALID", "문제와 콘텐츠가 일치하지 않음", HttpStatus.BAD_REQUEST)
        }
        val c = studyContentRepository.findById(contentId).orElse(null)
            ?: throw ApiException("NOT_FOUND", "콘텐츠 없음", HttpStatus.NOT_FOUND)
        ensureStudentCanAccess(c, userId)

        // 채점
        val type = q.questionType
        var isCorrect = false
        var correctChoiceId: String? = null
        var triggeredErr: List<Int>? = null

        when (type) {
            "MULTI_CHOICE", "OX" -> {
                val choices = choicesFromJson(q.choices)
                val correct = choices.firstOrNull { it.isCorrect }
                correctChoiceId = correct?.id
                val selected = choices.firstOrNull { it.id == request.selectedChoiceId }
                isCorrect = selected != null && selected.isCorrect
                if (!isCorrect && selected?.errorPatternIdx != null) {
                    triggeredErr = listOf(selected.errorPatternIdx)
                }
            }
            "SHORT_ANSWER" -> {
                // 학생이 음절 카드 순서대로 클릭한 결과를 userAnswer 로 받음.
                // 공백 제거 후 정답(modelAnswer) 과 정확히 일치해야 정답.
                val expected = (q.modelAnswer ?: "").replace("\\s+".toRegex(), "")
                val ans = (request.userAnswer ?: "").replace("\\s+".toRegex(), "")
                isCorrect = expected.isNotEmpty() && expected == ans
            }
            "ESSAY" -> {
                // 학생이 빈칸 선택지에서 고른 결과를 합친 텍스트.
                // 정답 phrase 가 모두 포함되면 정답 (한 빈칸이라도 다른 선택지를 골랐으면 빠짐).
                val blanks = fillBlanksFromJson(q.fillBlanks)
                val ans = (request.userAnswer ?: "").replace("\\s+".toRegex(), "")
                isCorrect = blanks.isNotEmpty() && blanks.all { b ->
                    ans.contains(b.phrase.replace("\\s+".toRegex(), ""))
                }
            }
        }

        // study_attempts 기록
        val attempt = StudyAttemptEntity(
            id = IdGenerator.newId("sa"),
            userId = userId,
            contentId = contentId,
            questionId = q.id,
            sessionId = request.sessionId,
            isCorrect = isCorrect,
            selectedChoiceIdx = null, // 선택지 인덱스보다 ID로 관리
            userAnswer = request.userAnswer,
            triggeredErrorPatternIdx = triggeredErr?.let { toJson(it) },
            attemptedAt = LocalDateTime.now()
        )
        studyAttemptRepository.save(attempt)

        // study_progress UPSERT
        upsertProgress(userId, c, q, isCorrect, triggeredErr)

        return StudyAttemptSubmitResponse(
            isCorrect = isCorrect,
            correctChoiceId = correctChoiceId,
            correctAnswer = if (type == "ESSAY") q.modelAnswer else null,
            triggeredErrorPatternIdx = triggeredErr,
            explanation = null
        )
    }

    private fun upsertProgress(
        userId: String,
        content: StudyContentEntity,
        question: StudyQuestionEntity,
        isCorrect: Boolean,
        triggeredErr: List<Int>?
    ) {
        val evalPointsSize = stringListFromJson(content.evalPoints).size
        val errorPatternsSize = stringListFromJson(content.errorPatterns).size
        val existing = studyProgressRepository.findOne(userId, content.id)

        val progress = existing ?: StudyProgressEntity(
            userId = userId,
            contentId = content.id,
            seenQuestionIds = "[]",
            evalPointCorrect = toJson(List(evalPointsSize) { 0 }),
            evalPointAttempted = toJson(List(evalPointsSize) { 0 }),
            errorPatternCount = toJson(List(errorPatternsSize) { 0 })
        )

        // seen
        val seen = try {
            objectMapper.readValue(progress.seenQuestionIds, object : TypeReference<MutableList<String>>() {})
        } catch (e: Exception) { mutableListOf() }
        if (question.id !in seen) seen.add(question.id)
        progress.seenQuestionIds = toJson(seen)

        // evalPoint stats (배열 길이가 변경된 경우 대비 padding)
        val evalCorrect = intListFromJson(progress.evalPointCorrect).toMutableList()
        val evalAttempted = intListFromJson(progress.evalPointAttempted).toMutableList()
        while (evalCorrect.size < evalPointsSize) evalCorrect.add(0)
        while (evalAttempted.size < evalPointsSize) evalAttempted.add(0)

        val qEvalIdx = intListFromJson(question.evalPointIdx)
        qEvalIdx.forEach { idx ->
            if (idx in 0 until evalPointsSize) {
                evalAttempted[idx] = evalAttempted[idx] + 1
                if (isCorrect) evalCorrect[idx] = evalCorrect[idx] + 1
            }
        }
        progress.evalPointCorrect = toJson(evalCorrect)
        progress.evalPointAttempted = toJson(evalAttempted)

        // errorPattern stats
        val errCount = intListFromJson(progress.errorPatternCount).toMutableList()
        while (errCount.size < errorPatternsSize) errCount.add(0)
        triggeredErr?.forEach { idx ->
            if (idx in 0 until errorPatternsSize) {
                errCount[idx] = errCount[idx] + 1
            }
        }
        progress.errorPatternCount = toJson(errCount)

        progress.totalAttempted = progress.totalAttempted + 1
        if (isCorrect) progress.totalCorrect = progress.totalCorrect + 1
        progress.lastSessionAt = LocalDateTime.now()
        progress.updatedAt = LocalDateTime.now()

        studyProgressRepository.save(progress)
    }

    // ─────────────────────────────────────────────
    // 학생 — 세션 종료 (씨앗 정산)
    // ─────────────────────────────────────────────
    @Transactional
    fun completeSession(
        contentId: String,
        userId: String,
        request: StudySessionCompleteRequest,
        logId: String
    ): StudySessionCompleteResponse {
        val c = studyContentRepository.findById(contentId).orElse(null)
            ?: throw ApiException("NOT_FOUND", "콘텐츠 없음", HttpStatus.NOT_FOUND)
        ensureStudentCanAccess(c, userId)

        val attempts = studyAttemptRepository.findAllBySessionId(request.sessionId)
            .filter { it.userId == userId }
        val totalAttempted = attempts.size
        val totalCorrect = attempts.count { it.isCorrect }
        val accuracyPct = if (totalAttempted > 0) (totalCorrect.toDouble() / totalAttempted * 100).roundToInt() else 0

        var earnedSeed = 0
        if (accuracyPct >= SEEDS_PASS_THRESHOLD && totalAttempted > 0) {
            earnedSeed = SEEDS_BASE
            if (accuracyPct == 100) earnedSeed *= 2
        }

        // farm_learning_logs 마무리
        val logEntity = farmLearningLogRepository.findById(logId).orElse(null)
        if (logEntity != null && logEntity.userId == userId) {
            logEntity.status = "COMPLETED"
            logEntity.score = totalCorrect
            logEntity.accuracy = accuracyPct
            logEntity.earnedSeed = earnedSeed
            logEntity.earnedSeedType = SEED_TYPE
            logEntity.completedAt = LocalDateTime.now()
            farmLearningLogRepository.save(logEntity)
        }

        if (earnedSeed > 0) {
            economyService.addSeeds(
                userId, SEED_TYPE, earnedSeed,
                "study_content_session", "farm_learning_log",
                logId
            )
        }

        // study_progress 세션 카운트 증가
        val progress = studyProgressRepository.findOne(userId, contentId)
        if (progress != null) {
            progress.totalSessions = progress.totalSessions + 1
            progress.lastSessionAt = LocalDateTime.now()
            progress.updatedAt = LocalDateTime.now()
            studyProgressRepository.save(progress)
        }

        // 약점 코멘트 (정확도가 낮은 evalPoint 이름)
        val weaknessHint = mutableListOf<String>()
        if (progress != null) {
            val evalPoints = stringListFromJson(c.evalPoints)
            val evalCorrect = intListFromJson(progress.evalPointCorrect)
            val evalAttempted = intListFromJson(progress.evalPointAttempted)
            val weak = (evalPoints.indices)
                .filter { (evalAttempted.getOrNull(it) ?: 0) > 0 }
                .map { idx ->
                    val attempted = evalAttempted[idx]
                    val correct = evalCorrect.getOrNull(idx) ?: 0
                    val acc = correct.toDouble() / attempted
                    Triple(idx, acc, attempted)
                }
                .filter { it.second < 0.7 }
                .sortedBy { it.second }
                .take(3)
            weak.forEach { (idx, _, _) -> weaknessHint.add(evalPoints[idx]) }
        }

        // 10대 역량 벡터 누적 (해당 학습 최초 1회만)
        try {
            val sessionAttempts = attempts
            val results = sessionAttempts.mapNotNull { att ->
                val q = studyQuestionRepository.findById(att.questionId).orElse(null) ?: return@mapNotNull null
                val correctVec = vectorFromJson(q.competencyVector) ?: emptyMap()
                val chosenWrong: Map<String, Double>? = if (!att.isCorrect) {
                    when (q.questionType.uppercase()) {
                        "MULTI_CHOICE", "OX" -> {
                            val choices = choicesFromJson(q.choices)
                            val selected = choices.firstOrNull { it.id == att.userAnswer || it.text == att.userAnswer }
                            selected?.wrongVector ?: emptyMap()
                        }
                        else -> vectorFromJson(q.wrongVector) ?: emptyMap()
                    }
                } else null
                if (correctVec.isEmpty() && chosenWrong.isNullOrEmpty()) return@mapNotNull null
                com.korfarm.api.learning.QuestionResult(
                    correctVector = correctVec,
                    chosenWrongVector = chosenWrong,
                    isCorrect = att.isCorrect
                )
            }
            if (results.isNotEmpty()) {
                competencyService.recordVector(userId, contentId, "farm_learning", results)
            }
        } catch (ex: Exception) {
            log.warn("study competency 누적 실패 contentId={}, userId={}: {}", contentId, userId, ex.message)
        }

        return StudySessionCompleteResponse(
            totalAttempted = totalAttempted,
            totalCorrect = totalCorrect,
            accuracy = if (totalAttempted > 0) totalCorrect.toDouble() / totalAttempted else 0.0,
            earnedSeed = earnedSeed,
            seedType = SEED_TYPE,
            weaknessHint = weaknessHint
        )
    }
}
