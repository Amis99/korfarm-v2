package com.korfarm.api.paid

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.contracts.SubmitRequest
import com.korfarm.api.contracts.WritingSubmitRequest
import com.korfarm.api.learning.LearningAttemptEntity
import com.korfarm.api.learning.LearningAttemptRepository
import com.korfarm.api.learning.SubmitResult
import com.korfarm.api.learning.SeedGrant
import com.korfarm.api.learning.SeedRewardPolicy
import com.korfarm.api.economy.EconomyService
import com.korfarm.api.economy.LedgerEntry
import com.korfarm.api.economy.SeedCatalogRepository
import com.korfarm.api.user.UserRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class PaidLearningService(
    private val contentRepository: ContentRepository,
    private val contentVersionRepository: ContentVersionRepository,
    private val testPaperRepository: TestPaperRepository,
    private val writingSubmissionRepository: WritingSubmissionRepository,
    private val learningAttemptRepository: LearningAttemptRepository,
    private val economyService: EconomyService,
    private val userRepository: UserRepository,
    private val seedCatalogRepository: SeedCatalogRepository,
    private val objectMapper: ObjectMapper
) {
    @Transactional(readOnly = true)
    fun proModeLevels(): List<ProModeLevel> {
        val contents = contentRepository.findByContentTypeAndStatus("pro_mode", "active")
        return contents.groupBy { it.levelId ?: "unknown" }.map { (levelId, items) ->
            ProModeLevel(
                levelId = levelId,
                title = "Level $levelId",
                chapterCount = items.size
            )
        }
    }

    @Transactional(readOnly = true)
    fun proModeChapter(chapterId: String): ProModeChapter {
        val content = contentRepository.findById(chapterId).orElseThrow {
            ApiException("NOT_FOUND", "content not found", HttpStatus.NOT_FOUND)
        }
        val version = contentVersionRepository.findTopByContentIdOrderByCreatedAtDesc(content.id)
            ?: throw ApiException("NOT_FOUND", "content version not found", HttpStatus.NOT_FOUND)
        val contentMap: Map<String, Any> = objectMapper.readValue(version.contentJson, object : TypeReference<Map<String, Any>>() {})
        return ProModeChapter(
            chapterId = content.id,
            title = content.title,
            content = contentMap
        )
    }

    @Transactional(readOnly = true)
    fun farmModes(): List<FarmMode> {
        return contentRepository.findByContentTypeAndStatus("farm_mode", "active").map {
            FarmMode(
                modeId = it.id,
                title = it.title,
                description = null
            )
        }
    }

    @Transactional(readOnly = true)
    fun writingPrompts(): List<WritingPrompt> {
        return contentRepository.findByContentTypeAndStatus("writing", "active").map {
            WritingPrompt(
                promptId = it.id,
                title = it.title,
                prompt = it.title
            )
        }
    }

    @Transactional
    fun submitWriting(userId: String, request: WritingSubmitRequest): String {
        val promptId = contentRepository.findByContentTypeAndStatus("writing", "active")
            .firstOrNull()?.id ?: "prompt_default"
        val submission = WritingSubmissionEntity(
            id = IdGenerator.newId("ws"),
            userId = userId,
            promptId = promptId,
            content = request.content,
            status = "submitted",
            submittedAt = LocalDateTime.now()
        )
        writingSubmissionRepository.save(submission)
        return submission.id
    }

    @Transactional(readOnly = true)
    fun tests(): List<TestSummary> {
        return testPaperRepository.findByStatus("open").map {
            TestSummary(
                testId = it.id,
                title = it.title,
                status = it.status
            )
        }
    }

    @Transactional
    fun submitLearning(userId: String, contentId: String, activityType: String, request: SubmitRequest): SubmitResult {
        val score = request.answers.size
        val userLevelId = userRepository.findById(userId).orElse(null)?.levelId
        val contentLevelId = resolveContentLevelId(contentId, request)
        val seedCount = SeedRewardPolicy.seedCountFor(userLevelId, contentLevelId)
        val catalog = seedCatalogRepository.findAll()
        val seedType = SeedRewardPolicy.randomSeedType(catalog)
        val seedGrant = SeedGrant(seedType = seedType, count = seedCount)
        economyService.addSeeds(userId, seedGrant.seedType, seedGrant.count, "paid_submit", "learning", contentId)
        val attempt = LearningAttemptEntity(
            id = IdGenerator.newId("la"),
            userId = userId,
            contentId = contentId,
            activityType = activityType,
            status = "submitted",
            score = score,
            startedAt = LocalDateTime.now(),
            submittedAt = LocalDateTime.now()
        )
        learningAttemptRepository.save(attempt)
        return SubmitResult(score = score, correctCount = score, seedGrant = seedGrant)
    }

    private fun resolveContentLevelId(contentId: String, request: SubmitRequest): String? {
        val contentLevelId = contentRepository.findById(contentId).orElse(null)?.levelId
        return contentLevelId ?: request.contentLevelId
    }

    @Transactional(readOnly = true)
    fun harvestLedger(userId: String): List<LedgerEntry> {
        return economyService.getLedger(userId).filter { it.currencyType == "crop" }
    }
}
