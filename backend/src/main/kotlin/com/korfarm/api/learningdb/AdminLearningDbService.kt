package com.korfarm.api.learningdb

import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.aigen.AiGenLogEntity
import com.korfarm.api.aigen.AiGenLogRepository
import com.korfarm.api.aigen.GrammarCorpusEntity
import com.korfarm.api.aigen.GrammarCorpusRepository
import com.korfarm.api.aigen.LearningConceptEntity
import com.korfarm.api.aigen.LearningConceptRepository
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.learning.FarmLearningLogRepository
import com.korfarm.api.paid.AdminContentService
import com.korfarm.api.questionbank.QbRecordEntity
import com.korfarm.api.questionbank.QbRecordRepository
import com.korfarm.api.wisdom.AiFeedbackJobRepository
import com.korfarm.api.wisdom.AiPromptEntity
import com.korfarm.api.wisdom.AiPromptRepository
import com.korfarm.api.wisdom.WisdomPostEntity
import com.korfarm.api.wisdom.WisdomPostRepository
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import java.io.File
import java.time.LocalDateTime

/**
 * 학습 자료DB 통합 admin 서비스.
 * read: tree(폴더 자동 그룹핑) / item
 * write: saveItem / deleteItem / import (read-only 카테고리는 차단)
 *
 * 제외 영역(별도 메뉴 소관): contents·tests·일일학습·pro_chapters/items
 */
@Service
class AdminLearningDbService(
    private val objectMapper: ObjectMapper,
    private val grammarCorpusRepository: GrammarCorpusRepository,
    private val learningConceptRepository: LearningConceptRepository,
    private val qbRecordRepository: QbRecordRepository,
    private val wisdomPostRepository: WisdomPostRepository,
    private val farmLearningLogRepository: FarmLearningLogRepository,
    private val aiGenLogRepository: AiGenLogRepository,
    private val aiPromptRepository: AiPromptRepository,
    private val aiFeedbackJobRepository: AiFeedbackJobRepository,
    private val adminContentService: AdminContentService
) {
    private val pageSize = 300

    /** wisdom-topics 파일 폴더 (frontend/public/wisdom-topics) — 1차는 정적 파일 read */
    private val wisdomTopicsDir = File(
        System.getProperty("learning-db.wisdom-topics-dir")
            ?: "../frontend/public/wisdom-topics"
    )

    fun listCategories(): List<CategoryMetaDto> =
        LearningDbCategory.values().map {
            CategoryMetaDto(it.key, it.label, it.storage, it.readOnly)
        }

    // ───────────────────────── tree ─────────────────────────

    fun tree(category: LearningDbCategory): TreeNodeDto {
        val children: List<TreeNodeDto> = when (category) {
            LearningDbCategory.CORPUS -> groupBy(
                grammarCorpusRepository.findAll(
                    PageRequest.of(0, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"))
                ).content,
                groupKey = { it.topic.ifBlank { "(미분류)" } },
                folderLabel = { it },
                rowLabel = { e -> e.title },
                rowIdSuffix = { e -> e.id },
                category = category
            )

            LearningDbCategory.QB -> groupBy(
                qbRecordRepository.findAll(
                    PageRequest.of(0, pageSize, Sort.by(Sort.Direction.DESC, "updatedAt"))
                ).content,
                groupKey = { it.area ?: "(미분류)" },
                folderLabel = { it },
                rowLabel = { e -> "${e.recordCode}${e.title?.let { " — $it" } ?: ""}" },
                rowIdSuffix = { e -> e.id },
                category = category
            )

            LearningDbCategory.WISDOM_POSTS -> groupBy(
                wisdomPostRepository.findAll(
                    PageRequest.of(0, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"))
                ).content,
                groupKey = { it.levelId },
                folderLabel = { it },
                rowLabel = { e -> "[${e.topicLabel}] ${e.userId}" },
                rowIdSuffix = { e -> e.id },
                category = category
            )

            LearningDbCategory.WISDOM_TOPICS -> listJsonFiles(wisdomTopicsDir, category)

            LearningDbCategory.AI_LOG -> groupBy(
                aiGenLogRepository.findAll(
                    PageRequest.of(0, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"))
                ).content,
                groupKey = { it.kind },
                folderLabel = { it },
                rowLabel = { e -> "[${e.model}] ${e.userId} (${e.status})" },
                rowIdSuffix = { e -> e.id },
                category = category
            )

            LearningDbCategory.AI_PROMPT -> groupBy(
                aiPromptRepository.findAll(Sort.by(Sort.Direction.DESC, "updatedAt")),
                groupKey = { it.promptKey },
                folderLabel = { it },
                rowLabel = { e -> "${e.promptKey} [${e.levelGroup.ifBlank { "공통" }}]" },
                rowIdSuffix = { e -> e.id },
                category = category
            )

            LearningDbCategory.AI_FEEDBACK -> groupBy(
                aiFeedbackJobRepository.findAll(
                    PageRequest.of(0, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"))
                ).content,
                groupKey = { it.status },
                folderLabel = { it },
                rowLabel = { e -> "${e.id.take(16)}…" },
                rowIdSuffix = { e -> e.id },
                category = category
            )

            LearningDbCategory.FARM_LOG -> groupBy(
                farmLearningLogRepository.findAll(
                    PageRequest.of(0, pageSize, Sort.by(Sort.Direction.DESC, "startedAt"))
                ).content,
                groupKey = { it.contentType },
                folderLabel = { it },
                rowLabel = { e -> "${e.contentId} · ${e.userId}" },
                rowIdSuffix = { e -> e.id },
                category = category
            )

            LearningDbCategory.MANUSCRIPT -> groupBy(
                adminContentService.listManuscripts(),
                groupKey = { it.levelId ?: "(미지정)" },
                folderLabel = { it },
                rowLabel = { ms -> ms.title },
                rowIdSuffix = { ms -> ms.contentId },
                category = category
            )

            LearningDbCategory.CONCEPT -> {
                val all = learningConceptRepository.findAll(
                    Sort.by(Sort.Direction.ASC, "area", "displayOrder")
                )
                val byArea = all.groupBy { it.area }
                byArea.entries.sortedBy { it.key }.map { (area, list) ->
                    val bySub = list.groupBy { it.subArea ?: "(기본)" }
                    TreeNodeDto(
                        id = "${category.key}/folder/${area}",
                        type = "folder",
                        storage = "DB",
                        label = area,
                        children = bySub.entries.sortedBy { it.key }.map { (sub, items) ->
                            TreeNodeDto(
                                id = "${category.key}/folder/${area}/${sub}",
                                type = "folder",
                                storage = "DB",
                                label = sub,
                                children = items.map { e ->
                                    TreeNodeDto(
                                        id = "${category.key}/${e.id}",
                                        type = "db-row",
                                        storage = "DB",
                                        label = e.name,
                                        meta = mapOf("id" to e.id, "status" to e.status)
                                    )
                                }
                            )
                        }
                    )
                }
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

    /** 단일 카테고리 안의 동일 그룹핑 helper */
    private fun <T> groupBy(
        list: List<T>,
        groupKey: (T) -> String,
        folderLabel: (String) -> String,
        rowLabel: (T) -> String,
        rowIdSuffix: (T) -> String,
        category: LearningDbCategory
    ): List<TreeNodeDto> {
        val grouped = list.groupBy(groupKey)
        return grouped.entries.sortedBy { it.key }.map { (key, items) ->
            TreeNodeDto(
                id = "${category.key}/folder/${key}",
                type = "folder",
                storage = category.storage,
                label = folderLabel(key),
                meta = mapOf("count" to items.size),
                children = items.map { item ->
                    TreeNodeDto(
                        id = "${category.key}/${rowIdSuffix(item)}",
                        type = if (category.storage == "FILE") "file" else "db-row",
                        storage = category.storage,
                        label = rowLabel(item),
                        meta = mapOf("id" to rowIdSuffix(item))
                    )
                }
            )
        }
    }

    private fun listJsonFiles(dir: File, category: LearningDbCategory): List<TreeNodeDto> {
        if (!dir.isDirectory) return emptyList()
        return dir.listFiles { f -> f.isFile && f.name.endsWith(".json") }.orEmpty()
            .sortedBy { it.name }
            .map { f ->
                TreeNodeDto(
                    id = "${category.key}/${f.name}",
                    type = "file",
                    storage = "FILE",
                    label = f.name,
                    meta = mapOf("path" to f.name, "size" to f.length())
                )
            }
    }

    // ───────────────────────── item (read) ─────────────────────────

    fun item(category: LearningDbCategory, id: String): ItemDto {
        val data: Any = when (category) {
            LearningDbCategory.CORPUS -> entityToMap(
                grammarCorpusRepository.findById(id).orElseThrow { notFound(category, id) }
            )

            LearningDbCategory.QB -> entityToMap(
                qbRecordRepository.findById(id).orElseThrow { notFound(category, id) }
            )

            LearningDbCategory.WISDOM_POSTS -> entityToMap(
                wisdomPostRepository.findById(id).orElseThrow { notFound(category, id) }
            )

            LearningDbCategory.WISDOM_TOPICS -> readJsonFile(wisdomTopicsDir, id)

            LearningDbCategory.AI_LOG -> entityToMap(
                aiGenLogRepository.findById(id).orElseThrow { notFound(category, id) }
            )

            LearningDbCategory.AI_PROMPT -> entityToMap(
                aiPromptRepository.findById(id).orElseThrow { notFound(category, id) }
            )

            LearningDbCategory.AI_FEEDBACK -> entityToMap(
                aiFeedbackJobRepository.findById(id).orElseThrow { notFound(category, id) }
            )

            LearningDbCategory.FARM_LOG -> entityToMap(
                farmLearningLogRepository.findById(id).orElseThrow { notFound(category, id) }
            )

            LearningDbCategory.MANUSCRIPT -> adminContentService.previewContent(id)

            LearningDbCategory.CONCEPT -> entityToMap(
                learningConceptRepository.findById(id).orElseThrow { notFound(category, id) }
            )
        }
        return ItemDto(category.key, id, category.storage, data)
    }

    // ───────────────────────── save (create/update) ─────────────────────────

    fun saveItem(category: LearningDbCategory, idOrNull: String?, data: Map<String, Any?>): SaveResultDto {
        if (category.readOnly) {
            throw ApiException("FORBIDDEN", "카테고리 '${category.label}' 는 읽기 전용입니다", HttpStatus.FORBIDDEN)
        }
        return when (category) {
            LearningDbCategory.CORPUS -> saveCorpus(idOrNull, data)
            LearningDbCategory.QB -> saveQb(idOrNull, data)
            LearningDbCategory.WISDOM_POSTS -> saveWisdomPost(idOrNull, data)
            LearningDbCategory.AI_PROMPT -> saveAiPrompt(idOrNull, data)
            LearningDbCategory.CONCEPT -> saveConcept(idOrNull, data)
            else -> throw ApiException("NOT_IMPLEMENTED", "카테고리 '${category.label}' 저장 미구현", HttpStatus.NOT_IMPLEMENTED)
        }
    }

    fun deleteItem(category: LearningDbCategory, id: String) {
        if (category.readOnly) {
            throw ApiException("FORBIDDEN", "카테고리 '${category.label}' 는 읽기 전용입니다", HttpStatus.FORBIDDEN)
        }
        when (category) {
            LearningDbCategory.CORPUS -> grammarCorpusRepository.deleteById(id)
            LearningDbCategory.QB -> qbRecordRepository.deleteById(id)
            LearningDbCategory.WISDOM_POSTS -> wisdomPostRepository.deleteById(id)
            LearningDbCategory.AI_PROMPT -> aiPromptRepository.deleteById(id)
            LearningDbCategory.CONCEPT -> learningConceptRepository.deleteById(id)
            else -> throw ApiException("NOT_IMPLEMENTED", "카테고리 '${category.label}' 삭제 미구현", HttpStatus.NOT_IMPLEMENTED)
        }
    }

    fun importBatch(category: LearningDbCategory, request: ImportRequestDto): ImportResultDto {
        if (category.readOnly) {
            throw ApiException("FORBIDDEN", "카테고리 '${category.label}' 는 읽기 전용입니다", HttpStatus.FORBIDDEN)
        }
        val results = request.items.mapIndexed { i, it ->
            try {
                val before = it.id != null && existsById(category, it.id)
                val r = saveItem(category, it.id, it.data)
                ImportRowResultDto(i, r.id, success = true, created = !before)
            } catch (e: Exception) {
                ImportRowResultDto(i, it.id, success = false, error = e.message)
            }
        }
        return ImportResultDto(
            total = results.size,
            ok = results.count { it.success },
            failed = results.count { !it.success },
            results = results
        )
    }

    private fun existsById(category: LearningDbCategory, id: String): Boolean = when (category) {
        LearningDbCategory.CORPUS -> grammarCorpusRepository.existsById(id)
        LearningDbCategory.QB -> qbRecordRepository.existsById(id)
        LearningDbCategory.WISDOM_POSTS -> wisdomPostRepository.existsById(id)
        LearningDbCategory.AI_PROMPT -> aiPromptRepository.existsById(id)
        LearningDbCategory.CONCEPT -> learningConceptRepository.existsById(id)
        else -> false
    }

    // ───────────────────────── 카테고리별 save 구현 ─────────────────────────

    private fun saveCorpus(idOrNull: String?, data: Map<String, Any?>): SaveResultDto {
        val now = LocalDateTime.now()
        val existing = idOrNull?.let { grammarCorpusRepository.findById(it).orElse(null) }
        val id = existing?.id ?: idOrNull?.takeIf { it.isNotBlank() } ?: IdGenerator.newId("gc")
        val updated = objectMapper.convertValue(data, GrammarCorpusEntity::class.java).apply {
            this.id = id
            this.createdAt = existing?.createdAt ?: now
            this.updatedAt = now
        }
        grammarCorpusRepository.save(updated)
        return SaveResultDto(LearningDbCategory.CORPUS.key, id, created = existing == null)
    }

    private fun saveQb(idOrNull: String?, data: Map<String, Any?>): SaveResultDto {
        val now = LocalDateTime.now()
        val existing = idOrNull?.let { qbRecordRepository.findById(it).orElse(null) }
        val id = existing?.id ?: idOrNull?.takeIf { it.isNotBlank() } ?: IdGenerator.newId("qbr")
        val updated = objectMapper.convertValue(data, QbRecordEntity::class.java).apply {
            this.id = id
            this.createdAt = existing?.createdAt ?: now
            this.updatedAt = now
        }
        qbRecordRepository.save(updated)
        return SaveResultDto(LearningDbCategory.QB.key, id, created = existing == null)
    }

    private fun saveWisdomPost(idOrNull: String?, data: Map<String, Any?>): SaveResultDto {
        val now = LocalDateTime.now()
        val existing = idOrNull?.let { wisdomPostRepository.findById(it).orElse(null) }
        val id = existing?.id ?: idOrNull?.takeIf { it.isNotBlank() } ?: IdGenerator.newId("wp")
        val updated = objectMapper.convertValue(data, WisdomPostEntity::class.java).apply {
            this.id = id
            this.createdAt = existing?.createdAt ?: now
            this.updatedAt = now
        }
        wisdomPostRepository.save(updated)
        return SaveResultDto(LearningDbCategory.WISDOM_POSTS.key, id, created = existing == null)
    }

    private fun saveAiPrompt(idOrNull: String?, data: Map<String, Any?>): SaveResultDto {
        val existing = idOrNull?.let { aiPromptRepository.findById(it).orElse(null) }
        val id = existing?.id ?: idOrNull?.takeIf { it.isNotBlank() } ?: IdGenerator.newId("aip")
        val updated = objectMapper.convertValue(data, AiPromptEntity::class.java).apply {
            this.id = id
        }
        aiPromptRepository.save(updated)
        return SaveResultDto(LearningDbCategory.AI_PROMPT.key, id, created = existing == null)
    }

    private fun saveConcept(idOrNull: String?, data: Map<String, Any?>): SaveResultDto {
        val now = LocalDateTime.now()
        val existing = idOrNull?.let { learningConceptRepository.findById(it).orElse(null) }
        val id = existing?.id ?: idOrNull?.takeIf { it.isNotBlank() } ?: IdGenerator.newId("lc")
        val updated = objectMapper.convertValue(data, LearningConceptEntity::class.java).apply {
            this.id = id
            this.createdAt = existing?.createdAt ?: now
            this.updatedAt = now
        }
        learningConceptRepository.save(updated)
        return SaveResultDto(LearningDbCategory.CONCEPT.key, id, created = existing == null)
    }

    // ───────────────────────── helpers ─────────────────────────

    private fun readJsonFile(dir: File, name: String): Any {
        // 안전성: name 에 .. 또는 / 차단
        require(!name.contains("..") && !name.contains('/') && !name.contains('\\')) {
            "invalid file name: $name"
        }
        val f = File(dir, name)
        if (!f.isFile) throw ApiException("NOT_FOUND", "파일 없음: $name", HttpStatus.NOT_FOUND)
        return objectMapper.readValue(f, Map::class.java) as Map<String, Any?>
    }

    private fun entityToMap(any: Any): Map<String, Any?> {
        @Suppress("UNCHECKED_CAST")
        return objectMapper.convertValue(any, Map::class.java) as Map<String, Any?>
    }

    private fun notFound(category: LearningDbCategory, id: String): ApiException =
        ApiException("NOT_FOUND", "${category.label} item not found: $id", HttpStatus.NOT_FOUND)
}
