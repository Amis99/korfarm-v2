package com.korfarm.api.pro

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.economy.EconomyService
import com.korfarm.api.learning.SeedRewardPolicy
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
    private val userRepository: UserRepository,
    private val economyService: EconomyService
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
        val levelId = user.levelId ?: return emptyList()

        val chapters = chapterRepo.findByLevelIdAndStatusOrderByGlobalChapterNumberAsc(levelId, "active")
        if (chapters.isEmpty()) return emptyList()

        val chapterIds = chapters.map { it.id }
        val allProgress = progressRepo.findByUserIdAndChapterIdIn(userId, chapterIds)
        val progressByChapter = allProgress.groupBy { it.chapterId }

        // 각 챕터별 아이템 조회
        val allItems = chapterIds.associateWith { cid ->
            itemRepo.findByChapterIdOrderByItemOrderAsc(cid)
        }

        // 테스트 통과 여부 확인
        val testSessions = chapterIds.flatMap { cid ->
            testSessionRepo.findByUserIdAndChapterIdAndStatusIn(userId, cid, listOf("passed"))
        }.groupBy { it.chapterId }

        return chapters.mapIndexed { index, chapter ->
            val items = allItems[chapter.id] ?: emptyList()
            val progress = progressByChapter[chapter.id] ?: emptyList()
            val completedItemIds = progress.filter { it.completed }.map { it.itemId }.toSet()
            val totalItems = items.size
            val completedCount = items.count { completedItemIds.contains(it.id) }
            val percent = if (totalItems > 0) (completedCount * 100) / totalItems else 0
            val isTestPassed = testSessions.containsKey(chapter.id)

            // 접근 가능 여부: 첫 챕터이거나 이전 챕터 테스트 통과
            val isAccessible = if (index == 0) {
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

        return items.map { item ->
            val progress = completedMap[item.id]
            val isLocked = if (advancedTypes.contains(item.type)) !allBaseCompleted else false

            ProChapterItemView(
                itemId = item.id,
                type = item.type,
                contentId = item.contentId,
                order = item.itemOrder,
                isLocked = isLocked,
                isCompleted = progress != null,
                completedAt = progress?.completedAt,
                score = progress?.score
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
            description = request.description
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
                    itemOrder = input.order
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
}
