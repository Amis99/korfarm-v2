package com.korfarm.api.learningdb

import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.aigen.GrammarCorpusRepository
import com.korfarm.api.aigen.LearningConceptRepository
import com.korfarm.api.common.ApiException
import com.korfarm.api.learning.FarmLearningLogRepository
import com.korfarm.api.paid.AdminContentService
import com.korfarm.api.pro.ProChapterItemRepo
import com.korfarm.api.pro.ProChapterRepo
import com.korfarm.api.questionbank.QbRecordRepository
import com.korfarm.api.wisdom.WisdomPostRepository
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service

/**
 * 학습 자료DB 통합 read 서비스. 카테고리별로 기존 Repository/Service 에 위임.
 * 1차: read-only (tree/item). write/import/file 은 후속.
 */
@Service
class AdminLearningDbService(
    private val objectMapper: ObjectMapper,
    private val grammarCorpusRepository: GrammarCorpusRepository,
    private val learningConceptRepository: LearningConceptRepository,
    private val qbRecordRepository: QbRecordRepository,
    private val wisdomPostRepository: WisdomPostRepository,
    private val farmLearningLogRepository: FarmLearningLogRepository,
    private val proChapterRepo: ProChapterRepo,
    private val proChapterItemRepo: ProChapterItemRepo,
    private val adminContentService: AdminContentService
) {
    private val pageSize = 200

    fun listCategories(): List<CategoryMetaDto> =
        LearningDbCategory.values().map { CategoryMetaDto(it.key, it.label, it.storage) }

    fun tree(category: LearningDbCategory): TreeNodeDto {
        val children: List<TreeNodeDto> = when (category) {
            LearningDbCategory.CORPUS -> grammarCorpusRepository
                .findAll(PageRequest.of(0, pageSize, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map { e ->
                    TreeNodeDto(
                        id = "${category.key}/${e.id}",
                        type = "db-row",
                        storage = "DB",
                        label = "[${e.topic}] ${e.title}",
                        meta = mapOf("id" to e.id, "status" to e.status)
                    )
                }
                .content

            LearningDbCategory.QB -> qbRecordRepository
                .findAll(PageRequest.of(0, pageSize, Sort.by(Sort.Direction.DESC, "updatedAt")))
                .map { e ->
                    TreeNodeDto(
                        id = "${category.key}/${e.id}",
                        type = "db-row",
                        storage = "DB",
                        label = "${e.recordCode}${e.title?.let { " — $it" } ?: ""}",
                        meta = mapOf("id" to e.id, "status" to e.status)
                    )
                }
                .content

            LearningDbCategory.WISDOM -> wisdomPostRepository
                .findAll(PageRequest.of(0, pageSize, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map { e ->
                    TreeNodeDto(
                        id = "${category.key}/${e.id}",
                        type = "db-row",
                        storage = "DB",
                        label = "[${e.levelId}] ${e.topicLabel}",
                        meta = mapOf("id" to e.id, "status" to e.status)
                    )
                }
                .content

            LearningDbCategory.FARM_LOG -> farmLearningLogRepository
                .findAll(PageRequest.of(0, pageSize, Sort.by(Sort.Direction.DESC, "startedAt")))
                .map { e ->
                    TreeNodeDto(
                        id = "${category.key}/${e.id}",
                        type = "db-row",
                        storage = "DB",
                        label = "[${e.contentType}] ${e.contentId}",
                        meta = mapOf("id" to e.id, "userId" to e.userId, "status" to e.status)
                    )
                }
                .content

            LearningDbCategory.PRO -> {
                // 챕터 → 자식 아이템 폴더 트리
                val chapters = proChapterRepo.findAll(
                    Sort.by(Sort.Direction.ASC, "levelId", "globalChapterNumber")
                )
                val itemsByChapter = proChapterItemRepo.findAll().groupBy { it.chapterId }
                chapters.map { ch ->
                    TreeNodeDto(
                        id = "${category.key}/chapter/${ch.id}",
                        type = "folder",
                        storage = "DB",
                        label = "[${ch.levelId}] ${ch.title}",
                        meta = mapOf("id" to ch.id, "kind" to "chapter"),
                        children = itemsByChapter[ch.id].orEmpty().map { it ->
                            TreeNodeDto(
                                id = "${category.key}/item/${it.id}",
                                type = "db-row",
                                storage = "DB",
                                label = "[${it.type}] ${it.label ?: it.contentId ?: it.id}",
                                meta = mapOf("id" to it.id, "kind" to "chapter-item")
                            )
                        }
                    )
                }
            }

            LearningDbCategory.MANUSCRIPT -> adminContentService.listManuscripts().map { ms ->
                TreeNodeDto(
                    id = "${category.key}/${ms.contentId}",
                    type = "db-row",
                    storage = "DB",
                    label = "${ms.title}${ms.levelId?.let { " [$it]" } ?: ""}",
                    meta = mapOf("id" to ms.contentId)
                )
            }

            LearningDbCategory.MISC -> learningConceptRepository
                .findAll(Sort.by(Sort.Direction.ASC, "area", "displayOrder"))
                .map { e ->
                    TreeNodeDto(
                        id = "${category.key}/${e.id}",
                        type = "db-row",
                        storage = "DB",
                        label = "[${e.area}] ${e.name}",
                        meta = mapOf("id" to e.id, "subArea" to e.subArea, "status" to e.status)
                    )
                }
        }

        return TreeNodeDto(
            id = category.key,
            type = "category",
            storage = category.storage,
            label = category.label,
            children = children
        )
    }

    fun item(category: LearningDbCategory, id: String): ItemDto {
        val data: Any = when (category) {
            LearningDbCategory.CORPUS -> grammarCorpusRepository.findById(id)
                .orElseThrow { notFound(category, id) }
                .let { entityToMap(it) }

            LearningDbCategory.QB -> qbRecordRepository.findById(id)
                .orElseThrow { notFound(category, id) }
                .let { entityToMap(it) }

            LearningDbCategory.WISDOM -> wisdomPostRepository.findById(id)
                .orElseThrow { notFound(category, id) }
                .let { entityToMap(it) }

            LearningDbCategory.FARM_LOG -> farmLearningLogRepository.findById(id)
                .orElseThrow { notFound(category, id) }
                .let { entityToMap(it) }

            LearningDbCategory.PRO -> {
                // id 형식: "chapter/<id>" 또는 "item/<id>"
                val (kind, realId) = id.split("/", limit = 2).let {
                    if (it.size != 2) throw ApiException("BAD_REQUEST", "invalid pro id: $id", HttpStatus.BAD_REQUEST)
                    it[0] to it[1]
                }
                when (kind) {
                    "chapter" -> proChapterRepo.findById(realId).orElseThrow { notFound(category, id) }
                    "item" -> proChapterItemRepo.findById(realId).orElseThrow { notFound(category, id) }
                    else -> throw ApiException("BAD_REQUEST", "invalid pro kind: $kind", HttpStatus.BAD_REQUEST)
                }.let { entityToMap(it) }
            }

            LearningDbCategory.MANUSCRIPT -> adminContentService.previewContent(id)

            LearningDbCategory.MISC -> learningConceptRepository.findById(id)
                .orElseThrow { notFound(category, id) }
                .let { entityToMap(it) }
        }
        return ItemDto(
            category = category.key,
            id = id,
            storage = category.storage,
            data = data
        )
    }

    private fun entityToMap(any: Any): Map<String, Any?> {
        @Suppress("UNCHECKED_CAST")
        return objectMapper.convertValue(any, Map::class.java) as Map<String, Any?>
    }

    private fun notFound(category: LearningDbCategory, id: String): ApiException =
        ApiException(
            "NOT_FOUND",
            "${category.label} item not found: $id",
            HttpStatus.NOT_FOUND
        )
}
