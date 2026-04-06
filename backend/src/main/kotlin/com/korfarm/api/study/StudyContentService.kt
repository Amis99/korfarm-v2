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
    private val studyQuestionRepository: StudyQuestionRepository,
    private val studyAttemptRepository: StudyAttemptRepository,
    private val studyProgressRepository: StudyProgressRepository,
    private val orgMembershipRepository: OrgMembershipRepository,
    private val orgRepository: OrgRepository,
    private val farmLearningLogRepository: FarmLearningLogRepository,
    private val economyService: EconomyService,
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
    private fun toQuestionDto(q: StudyQuestionEntity): StudyQuestionDto {
        return StudyQuestionDto(
            id = q.id,
            questionNo = q.questionNo,
            questionType = q.questionType,
            stem = q.stem,
            choices = if (q.choices.isNullOrBlank()) null else choicesFromJson(q.choices),
            modelAnswer = q.modelAnswer,
            fillBlanks = if (q.fillBlanks.isNullOrBlank()) null else fillBlanksFromJson(q.fillBlanks),
            evalPointIdx = intListFromJson(q.evalPointIdx),
            difficulty = q.difficulty
        )
    }

    private fun toContentDetail(c: StudyContentEntity, qs: List<StudyQuestionEntity>): StudyContentDetail {
        return StudyContentDetail(
            id = c.id,
            title = c.title,
            description = c.description,
            levelId = c.levelId,
            area = c.area,
            visibility = c.visibility,
            ownerOrgId = c.ownerOrgId,
            creatorId = c.creatorId,
            markdown = c.markdown,
            evalPoints = stringListFromJson(c.evalPoints),
            errorPatterns = stringListFromJson(c.errorPatterns),
            questionCount = c.questionCount,
            status = c.status,
            questions = qs.map { toQuestionDto(it) },
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
            visibility = c.visibility,
            ownerOrgId = c.ownerOrgId,
            ownerOrgName = c.ownerOrgId?.let { orgNameMap[it] },
            creatorId = c.creatorId,
            questionCount = c.questionCount,
            status = c.status,
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
            area = "CONTENT",
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
                evalPointIdx = toJson(q.evalPointIdx),
                difficulty = q.difficulty,
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
            if (type !in setOf("MULTI_CHOICE", "OX", "ESSAY")) {
                throw ApiException("INVALID", "$tag: 알 수 없는 type=${q.questionType}", HttpStatus.BAD_REQUEST)
            }
            if (q.stem.isBlank()) throw ApiException("INVALID", "$tag: stem 비어있음", HttpStatus.BAD_REQUEST)
            q.evalPointIdx.forEach { idx ->
                if (idx < 0 || idx >= evalPointsSize) {
                    throw ApiException("INVALID", "$tag: evalPointIdx $idx 가 evalPoints 범위 초과", HttpStatus.BAD_REQUEST)
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
                    choices.forEach { ch ->
                        if (ch.errorPatternIdx != null) {
                            if (ch.errorPatternIdx < 0 || ch.errorPatternIdx >= errorPatternsSize) {
                                throw ApiException("INVALID", "$tag: errorPatternIdx ${ch.errorPatternIdx} 범위 초과", HttpStatus.BAD_REQUEST)
                            }
                        }
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
    // 학생 — 카탈로그
    // ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    fun listForStudent(userId: String): List<StudyContentStudentItem> {
        val orgId = currentUserOrgId(userId)
        val contents = if (orgId != null) {
            studyContentRepository.findVisibleForStudent(orgId)
        } else {
            studyContentRepository.findVisibleForStudentNoOrg()
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
            markdown = c.markdown,
            questionCount = c.questionCount
        )
    }

    private fun ensureStudentCanAccess(c: StudyContentEntity, userId: String) {
        if (c.status != "active") {
            throw ApiException("FORBIDDEN", "비활성 콘텐츠", HttpStatus.FORBIDDEN)
        }
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
            "ESSAY" -> {
                // 모범답안의 fillBlanks 핵심 문구가 학생 답안에 모두 포함되면 정답
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
