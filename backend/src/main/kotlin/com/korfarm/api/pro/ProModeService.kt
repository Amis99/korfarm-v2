package com.korfarm.api.pro

import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.economy.EconomyService
import com.korfarm.api.learning.SeedRewardPolicy
import com.korfarm.api.paid.ContentEntity
import com.korfarm.api.paid.ContentRepository
import com.korfarm.api.paid.ContentVersionEntity
import com.korfarm.api.paid.ContentVersionRepository
import com.korfarm.api.test.TestPaperRepo
import com.korfarm.api.user.UserRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class ProModeService(
    private val chapterRepo: ProChapterRepo,
    private val itemRepo: ProChapterItemRepo,
    private val progressRepo: ProProgressRepo,
    private val testSessionRepo: ProTestSessionRepo,
    private val chapterTestRepo: ProChapterTestRepo,
    private val contentRepository: ContentRepository,
    private val contentVersionRepository: ContentVersionRepository,
    private val userRepository: UserRepository,
    private val economyService: EconomyService,
    private val objectMapper: ObjectMapper,
    private val testPaperRepo: TestPaperRepo
) {
    // 학습 아이템 유형 중 기본 4개 (잠금 해제 조건)
    private val baseTypes = setOf("reading", "vocab", "background", "logic")
    // 기본 4개 완료 후 해제되는 유형
    private val advancedTypes = setOf("answer", "test")

    // 아이템 유형별 씨앗 타입 매핑
    private val itemSeedTypeMap = mapOf(
        "reading" to "seed_rice",
        "vocab" to "seed_wheat",
        "background" to "seed_corn",
        "logic" to "seed_grape"
    )

    // ─── 학생 API ───

    @Transactional(readOnly = true)
    fun listChapters(userId: String): List<ProChapterSummary> {
        val user = userRepository.findById(userId).orElseThrow {
            ApiException("NOT_FOUND", "사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND)
        }
        val levelId = user.levelId ?: "saussure1"

        val chapters = chapterRepo.findByLevelIdAndStatusOrderByGlobalChapterNumberAsc(levelId, "active")
        if (chapters.isEmpty()) return emptyList()

        val chapterIds = chapters.map { it.id }
        val allProgress = progressRepo.findByUserIdAndChapterIdIn(userId, chapterIds)
        val progressByChapter = allProgress.groupBy { it.chapterId }

        // N+1 fix — 모든 챕터 item 일괄 조회 후 groupBy
        val allItems: Map<String, List<ProChapterItemEntity>> =
            itemRepo.findByChapterIdInOrderByChapterIdAscItemOrderAsc(chapterIds)
                .groupBy { it.chapterId }

        // 테스트 통과 여부 확인
        val testSessions = chapterIds.flatMap { cid ->
            testSessionRepo.findByUserIdAndChapterIdAndStatusIn(userId, cid, listOf("passed"))
        }.groupBy { it.chapterId }

        // 관리자는 모든 챕터 무제한 접근
        val isAdmin = com.korfarm.api.security.SecurityUtils.hasAnyRole("HQ_ADMIN", "ORG_ADMIN")

        return chapters.mapIndexed { index, chapter ->
            val items = allItems[chapter.id] ?: emptyList()
            val progress = progressByChapter[chapter.id] ?: emptyList()
            val completedItemIds = progress.filter { it.completed }.map { it.itemId }.toSet()
            val totalItems = items.size
            val completedCount = items.count { completedItemIds.contains(it.id) }
            val percent = if (totalItems > 0) (completedCount * 100) / totalItems else 0
            val isTestPassed = testSessions.containsKey(chapter.id)

            // 접근 가능 여부: 관리자는 항상, 그 외에는 첫 챕터이거나 이전 챕터 테스트 통과
            val isAccessible = if (isAdmin) {
                true
            } else if (index == 0) {
                true
            } else {
                val prevChapter = chapters[index - 1]
                testSessions.containsKey(prevChapter.id)
            }

            ProChapterSummary(
                chapterId = chapter.id,
                levelId = chapter.levelId,
                bookNumber = chapter.bookNumber,
                chapterNumber = chapter.chapterNumber,
                globalChapterNumber = chapter.globalChapterNumber,
                title = chapter.title,
                description = chapter.description,
                videoUrl = chapter.videoUrl,
                progressPercent = percent,
                isTestPassed = isTestPassed,
                isAccessible = isAccessible
            )
        }
    }

    @Transactional(readOnly = true)
    fun listChapterItems(userId: String, chapterId: String): List<ProChapterItemView> {
        val items = itemRepo.findByChapterIdOrderByItemOrderAsc(chapterId)
        if (items.isEmpty()) return emptyList()

        val progressList = progressRepo.findByUserIdAndChapterId(userId, chapterId)
        val completedMap = progressList.filter { it.completed }
            .associateBy { it.itemId }

        val allBaseCompleted = checkAllBaseCompleted(items, completedMap)
        // 관리자는 모든 콘텐츠 무제한 접근
        val isAdmin = com.korfarm.api.security.SecurityUtils.hasAnyRole("HQ_ADMIN", "ORG_ADMIN")

        // 동일 type 아이템이 여러 개인 경우 자동 라벨 생성
        val typeCountMap = items.groupBy { it.type }.mapValues { it.value.size }

        return items.map { item ->
            val progress = completedMap[item.id]
            val isLocked = if (isAdmin) false
                else if (advancedTypes.contains(item.type)) !allBaseCompleted
                else false

            // 라벨: DB에 직접 설정된 값 우선, 없으면 동일 type 다중 시 자동 생성
            val label = item.label ?: run {
                val count = typeCountMap[item.type] ?: 1
                if (count > 1) {
                    val sameTypeItems = items.filter { it.type == item.type }
                    val idx = sameTypeItems.indexOf(item) + 1
                    val typeLabel = when (item.type) {
                        "reading" -> "독해 모드"
                        "vocab" -> "어휘 학습"
                        "background" -> "배경지식"
                        "logic" -> "논리 사고력"
                        "answer" -> "모범답안"
                        "test" -> "테스트"
                        else -> item.type
                    }
                    "$typeLabel ($idx/$count)"
                } else null
            }

            ProChapterItemView(
                itemId = item.id,
                type = item.type,
                contentId = item.contentId,
                order = item.itemOrder,
                label = label,
                isLocked = isLocked,
                isCompleted = progress != null,
                completedAt = progress?.completedAt,
                score = progress?.score,
                pdfFileId = item.pdfFileId
            )
        }
    }

    @Transactional
    fun completeItem(userId: String, request: ProCompleteRequest): ProCompleteResponse {
        val item = itemRepo.findById(request.itemId).orElseThrow {
            ApiException("NOT_FOUND", "학습 아이템을 찾을 수 없습니다.", HttpStatus.NOT_FOUND)
        }

        // 이미 완료 확인
        val existing = progressRepo.findByUserIdAndItemId(userId, request.itemId)
        if (existing != null && existing.completed) {
            return ProCompleteResponse(
                success = true,
                seedReward = 0,
                seedType = "",
                unlocked = emptyList()
            )
        }

        // 씨앗 보상 계산
        val user = userRepository.findById(userId).orElseThrow {
            ApiException("NOT_FOUND", "사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND)
        }
        val chapter = chapterRepo.findById(item.chapterId).orElseThrow {
            ApiException("NOT_FOUND", "챕터를 찾을 수 없습니다.", HttpStatus.NOT_FOUND)
        }

        val seedType = itemSeedTypeMap[item.type] ?: "seed_wheat"
        val seedCount = SeedRewardPolicy.seedCountFor(user.levelId, chapter.levelId)

        // 진행 기록 저장
        val now = LocalDateTime.now()
        if (existing != null) {
            existing.completed = true
            existing.completedAt = now
            existing.seedReward = seedCount
            existing.seedType = seedType
            progressRepo.save(existing)
        } else {
            progressRepo.save(
                ProProgressEntity(
                    id = IdGenerator.newId("pp"),
                    userId = userId,
                    chapterId = item.chapterId,
                    itemId = item.id,
                    completed = true,
                    completedAt = now,
                    seedReward = seedCount,
                    seedType = seedType
                )
            )
        }

        // 씨앗 보상 지급
        if (baseTypes.contains(item.type)) {
            economyService.addSeeds(userId, seedType, seedCount, "프로 모드 학습 완료", "pro_item", item.id)
        }

        // 잠금 해제 확인
        val allItems = itemRepo.findByChapterIdOrderByItemOrderAsc(item.chapterId)
        val allProgress = progressRepo.findByUserIdAndChapterId(userId, item.chapterId)
        val completedMap = allProgress.filter { it.completed }.associateBy { it.itemId }
        val newlyUnlocked = mutableListOf<String>()

        if (checkAllBaseCompleted(allItems, completedMap)) {
            allItems.filter { advancedTypes.contains(it.type) }.forEach { adv ->
                if (!completedMap.containsKey(adv.id)) {
                    newlyUnlocked.add(adv.type)
                }
            }
        }

        return ProCompleteResponse(
            success = true,
            seedReward = seedCount,
            seedType = seedType,
            unlocked = newlyUnlocked
        )
    }

    fun checkAllBaseCompleted(userId: String, chapterId: String): Boolean {
        val items = itemRepo.findByChapterIdOrderByItemOrderAsc(chapterId)
        val progress = progressRepo.findByUserIdAndChapterId(userId, chapterId)
        val completedMap = progress.filter { it.completed }.associateBy { it.itemId }
        return checkAllBaseCompleted(items, completedMap)
    }

    private fun checkAllBaseCompleted(
        items: List<ProChapterItemEntity>,
        completedMap: Map<String, ProProgressEntity>
    ): Boolean {
        val baseItems = items.filter { baseTypes.contains(it.type) }
        return baseItems.isNotEmpty() && baseItems.all { completedMap.containsKey(it.id) }
    }

    // ─── 관리자 API ───

    @Transactional
    fun createChapter(request: CreateProChapterRequest): ProChapterEntity {
        val chapter = ProChapterEntity(
            id = IdGenerator.newId("pch"),
            levelId = request.levelId,
            bookNumber = request.bookNumber,
            chapterNumber = request.chapterNumber,
            globalChapterNumber = request.globalChapterNumber,
            title = request.title,
            description = request.description,
            videoUrl = request.videoUrl
        )
        return chapterRepo.save(chapter)
    }

    @Transactional
    fun updateChapter(chapterId: String, request: UpdateProChapterRequest): ProChapterEntity {
        val chapter = chapterRepo.findById(chapterId).orElseThrow {
            ApiException("NOT_FOUND", "챕터를 찾을 수 없습니다.", HttpStatus.NOT_FOUND)
        }
        request.title?.let { chapter.title = it }
        request.description?.let { chapter.description = it }
        request.status?.let { chapter.status = it }
        request.videoUrl?.let { chapter.videoUrl = it }
        return chapterRepo.save(chapter)
    }

    @Transactional
    fun setChapterItems(chapterId: String, request: SetProChapterItemsRequest) {
        chapterRepo.findById(chapterId).orElseThrow {
            ApiException("NOT_FOUND", "챕터를 찾을 수 없습니다.", HttpStatus.NOT_FOUND)
        }
        itemRepo.deleteByChapterId(chapterId)
        request.items.forEach { input ->
            itemRepo.save(
                ProChapterItemEntity(
                    id = IdGenerator.newId("pci"),
                    chapterId = chapterId,
                    type = input.type,
                    contentId = input.contentId,
                    itemOrder = input.order,
                    label = input.label
                )
            )
        }
    }

    @Transactional(readOnly = true)
    fun listAllChapters(levelId: String?): List<ProChapterEntity> {
        return if (levelId != null) {
            chapterRepo.findByLevelIdOrderByGlobalChapterNumberAsc(levelId)
        } else {
            chapterRepo.findAll().sortedBy { it.globalChapterNumber }
        }
    }

    // ─── 관리자: 콘텐츠 현황 ───

    @Transactional(readOnly = true)
    fun getContentStatus(chapterId: String): ChapterContentStatusResponse {
        val chapter = chapterRepo.findById(chapterId).orElseThrow {
            ApiException("NOT_FOUND", "챕터를 찾을 수 없습니다.", HttpStatus.NOT_FOUND)
        }
        val items = itemRepo.findByChapterIdOrderByItemOrderAsc(chapterId)
        val contentTypes = listOf("reading", "vocab", "background", "logic", "answer")

        val contentTypeStatuses = contentTypes.map { type ->
            val typeItems = items.filter { it.type == type && it.contentId != null }
            val contents = typeItems.mapNotNull { item ->
                item.contentId?.let { cid ->
                    contentRepository.findById(cid).orElse(null)?.let { c ->
                        LinkedContentInfo(
                            contentId = c.id,
                            title = c.title,
                            updatedAt = c.updatedAt
                        )
                    }
                }
            }
            ContentTypeStatus(type = type, count = contents.size, contents = contents)
        }

        val tests = chapterTestRepo.findByChapterIdAndStatusOrderByVersionAsc(chapterId, "active")
        val paperIds = tests.map { it.testPaperId }
        val paperMap = if (paperIds.isNotEmpty()) testPaperRepo.findAllById(paperIds).associateBy { it.id } else emptyMap()
        val testVersions = tests.map { t ->
            TestVersionInfo(
                version = t.version,
                testPaperId = t.testPaperId,
                status = t.status,
                pdfFileId = paperMap[t.testPaperId]?.pdfFileId
            )
        }

        return ChapterContentStatusResponse(
            chapterId = chapter.id,
            title = chapter.title,
            levelId = chapter.levelId,
            chapterNumber = chapter.chapterNumber,
            items = contentTypeStatuses,
            testVersions = testVersions
        )
    }

    // ─── 관리자: 정답해설 조회 ───

    @Transactional(readOnly = true)
    fun getAnswerContent(chapterId: String): AdminAnswerContentResponse {
        chapterRepo.findById(chapterId).orElseThrow {
            ApiException("NOT_FOUND", "챕터를 찾을 수 없습니다.", HttpStatus.NOT_FOUND)
        }
        val answerItems = itemRepo.findByChapterIdAndType(chapterId, "answer")
        // pdfFileId 우선, 없으면 contentId fallback
        val withPdf = answerItems.firstOrNull { !it.pdfFileId.isNullOrBlank() }
        if (withPdf != null) {
            return AdminAnswerContentResponse(
                contentId = withPdf.contentId,
                title = withPdf.label,
                payload = null,
                lastUpdatedAt = withPdf.updatedAt,
                pdfFileId = withPdf.pdfFileId
            )
        }

        val answerItem = answerItems.firstOrNull { it.contentId != null }
        if (answerItem?.contentId == null) {
            return AdminAnswerContentResponse(null, null, null, null, null)
        }

        val content = contentRepository.findById(answerItem.contentId!!).orElse(null)
            ?: return AdminAnswerContentResponse(null, null, null, null, null)

        val version = contentVersionRepository.findTopByContentIdOrderByCreatedAtDesc(content.id)
        return AdminAnswerContentResponse(
            contentId = content.id,
            title = content.title,
            payload = version?.contentJson,
            lastUpdatedAt = version?.updatedAt ?: content.updatedAt,
            pdfFileId = null
        )
    }

    /** 신규 단순화 — type='answer' item 의 pdf_file_id 직접 저장. 없으면 row 생성. */
    @Transactional
    fun setAnswerPdfFileId(chapterId: String, fileId: String?) {
        val chapter = chapterRepo.findById(chapterId).orElseThrow {
            ApiException("NOT_FOUND", "챕터를 찾을 수 없습니다.", HttpStatus.NOT_FOUND)
        }
        val existing = itemRepo.findByChapterIdAndType(chapterId, "answer").firstOrNull()
        if (existing != null) {
            existing.pdfFileId = fileId
            existing.updatedAt = LocalDateTime.now()
            itemRepo.save(existing)
        } else {
            // type='answer' row 가 아예 없으면 신규 생성
            val nextOrder = (itemRepo.findByChapterIdOrderByItemOrderAsc(chapterId).maxOfOrNull { it.itemOrder + 1 }) ?: 0
            itemRepo.save(ProChapterItemEntity(
                id = IdGenerator.newId("pci"),
                chapterId = chapter.id,
                type = "answer",
                contentId = null,
                pdfFileId = fileId,
                itemOrder = nextOrder,
                label = "정답·해설"
            ))
        }
    }

    // ─── 관리자: 정답해설 저장 ───

    @Transactional
    fun updateAnswerContent(chapterId: String, request: UpdateAnswerContentRequest, userId: String): AdminAnswerContentResponse {
        val chapter = chapterRepo.findById(chapterId).orElseThrow {
            ApiException("NOT_FOUND", "챕터를 찾을 수 없습니다.", HttpStatus.NOT_FOUND)
        }
        val answerItems = itemRepo.findByChapterIdAndType(chapterId, "answer")
        val answerItem = answerItems.firstOrNull { it.contentId != null }

        val contentJson = objectMapper.writeValueAsString(request.payload)
        val now = LocalDateTime.now()

        if (answerItem?.contentId != null) {
            // 기존 answer 콘텐츠가 있으면 새 content_version 추가
            val content = contentRepository.findById(answerItem.contentId!!).orElseThrow {
                ApiException("NOT_FOUND", "콘텐츠를 찾을 수 없습니다.", HttpStatus.NOT_FOUND)
            }
            content.title = request.title
            contentRepository.save(content)

            val version = ContentVersionEntity(
                id = IdGenerator.newId("cv"),
                contentId = content.id,
                schemaVersion = "1.0",
                contentJson = contentJson,
                uploadedBy = userId,
                approvedBy = userId,
                approvedAt = now
            )
            contentVersionRepository.save(version)

            return AdminAnswerContentResponse(
                contentId = content.id,
                title = content.title,
                payload = contentJson,
                lastUpdatedAt = now
            )
        } else {
            // answer 콘텐츠 신규 생성
            val content = ContentEntity(
                id = IdGenerator.newId("content"),
                contentType = "PRO_ANSWER",
                levelId = chapter.levelId,
                title = request.title,
                status = "active"
            )
            val saved = contentRepository.save(content)

            val version = ContentVersionEntity(
                id = IdGenerator.newId("cv"),
                contentId = saved.id,
                schemaVersion = "1.0",
                contentJson = contentJson,
                uploadedBy = userId,
                approvedBy = userId,
                approvedAt = now
            )
            contentVersionRepository.save(version)

            // pro_chapter_items에 answer 아이템 추가
            val allItems = itemRepo.findByChapterIdOrderByItemOrderAsc(chapterId)
            val nextOrder = if (allItems.isEmpty()) 1 else allItems.maxOf { it.itemOrder } + 1
            itemRepo.save(
                ProChapterItemEntity(
                    id = IdGenerator.newId("pci"),
                    chapterId = chapterId,
                    type = "answer",
                    contentId = saved.id,
                    itemOrder = nextOrder
                )
            )

            return AdminAnswerContentResponse(
                contentId = saved.id,
                title = saved.title,
                payload = contentJson,
                lastUpdatedAt = now
            )
        }
    }
}
