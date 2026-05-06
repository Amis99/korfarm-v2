package com.korfarm.api.corpus

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.IdGenerator
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.io.File
import java.time.LocalDateTime

/**
 * 기존 ./data/learning-data/{area}/{subArea}/{kind}/{filename}.json 파일들을
 * learning_corpus + learning_corpus_items DB 테이블로 1회성 import.
 *
 * 변환 규칙:
 *  - kind=commentary  → 한 파일을 한 corpus 로 저장. JSON top-level 의 title/author/era/genre/topic/field 메타 흡수.
 *                       본문(passage|body|original|content|markdown 우선) → bodyMd
 *                       checkpoints[]/examPoints[]/passageNotes[] → learning_corpus_items 로 분해
 *  - kind=question-bank / question-analysis → 같은 subArea 의 corpus 가 있으면 그 corpus 의 items 로 추가,
 *                       없으면 subArea 명을 title 로 한 plain corpus 자동 생성
 *
 * 동일 (area, subArea, title) 조합이 이미 있으면 corpus 자체는 만들지 않고 items 만 누적.
 * 모든 items 의 sourceType="legacy-import" / sourceContentId=원본 파일 path 로 dedup 가능.
 */
@Service
class LearningCorpusImportService(
    private val corpusRepo: LearningCorpusRepository,
    private val itemRepo: LearningCorpusItemRepository,
    private val objectMapper: ObjectMapper,
    @Value("\${learning-data.storage-dir:./data/learning-data}")
    private val storageDir: String,
) {
    private val log = LoggerFactory.getLogger(LearningCorpusImportService::class.java)

    private val areaKeys = listOf("reading", "literature", "grammar", "vocab", "speaking", "writing", "media")
    private val kindKeys = listOf("commentary", "question-bank", "question-analysis")

    @Transactional
    fun importAll(importedBy: String, dryRun: Boolean = false): ImportResult {
        val root = File(storageDir)
        if (!root.isDirectory) {
            log.warn("learning-data 폴더 없음: {}", root.absolutePath)
            return ImportResult(scanned = 0, corpusCreated = 0, itemsAdded = 0, errors = emptyList())
        }

        var scanned = 0
        var corpusCreated = 0
        var itemsAdded = 0
        val errors = mutableListOf<Map<String, Any?>>()

        for (areaKey in areaKeys) {
            val areaDir = File(root, areaKey)
            if (!areaDir.isDirectory) continue
            for (subDir in areaDir.listFiles { f -> f.isDirectory } ?: emptyArray()) {
                val subAreaKey = subDir.name

                // 1) commentary 파일을 먼저 처리해 corpus 생성 (본문 + 메타 보유)
                val commentaryDir = File(subDir, "commentary")
                if (commentaryDir.isDirectory) {
                    for (jf in commentaryDir.listFiles { f -> f.isFile && f.name.endsWith(".json") } ?: emptyArray()) {
                        scanned++
                        try {
                            val (cCreated, iAdded) = importCommentaryFile(
                                areaKey, subAreaKey, jf, importedBy, dryRun)
                            corpusCreated += cCreated
                            itemsAdded += iAdded
                        } catch (e: Exception) {
                            log.warn("commentary import 실패 {} : {}", jf.absolutePath, e.message)
                            errors.add(mapOf(
                                "file" to jf.absolutePath,
                                "kind" to "commentary",
                                "error" to (e.message ?: e::class.simpleName)
                            ))
                        }
                    }
                }

                // 2) question-bank, question-analysis 는 items 로 누적
                for (kindKey in listOf("question-bank", "question-analysis")) {
                    val kindDir = File(subDir, kindKey)
                    if (!kindDir.isDirectory) continue
                    for (jf in kindDir.listFiles { f -> f.isFile && f.name.endsWith(".json") } ?: emptyArray()) {
                        scanned++
                        try {
                            val iAdded = importItemsFile(areaKey, subAreaKey, kindKey, jf, importedBy, dryRun)
                            itemsAdded += iAdded
                        } catch (e: Exception) {
                            log.warn("{} import 실패 {} : {}", kindKey, jf.absolutePath, e.message)
                            errors.add(mapOf(
                                "file" to jf.absolutePath,
                                "kind" to kindKey,
                                "error" to (e.message ?: e::class.simpleName)
                            ))
                        }
                    }
                }
            }
        }

        log.info("learning-data import 완료 — scanned={}, corpusCreated={}, itemsAdded={}, errors={}, dryRun={}",
            scanned, corpusCreated, itemsAdded, errors.size, dryRun)
        return ImportResult(scanned = scanned, corpusCreated = corpusCreated, itemsAdded = itemsAdded, errors = errors)
    }

    /**
     * commentary 파일 — corpus 본체 + 누적 items 분해.
     * 반환: (corpusCreated 0/1, itemsAdded N)
     */
    private fun importCommentaryFile(
        areaKey: String,
        subAreaKey: String,
        file: File,
        importedBy: String,
        dryRun: Boolean,
    ): Pair<Int, Int> {
        val data = readJson(file) ?: return Pair(0, 0)
        val baseName = file.nameWithoutExtension

        val title = (data["title"] as? String)?.takeIf { it.isNotBlank() } ?: baseName
        val source = data["source"] as? String
        val author = data["author"] as? String
        val era = data["era"] as? String
        val genre = data["genre"] as? String
        val topic = data["topic"] as? String
        val field = data["field"] as? String
        val bodyMd = listOf("passage", "body", "original", "content", "markdown")
            .firstNotNullOfOrNull { data[it] as? String }

        // meta_json: title 등 흡수한 후 나머지 메타용
        val knownKeys = setOf("title", "source", "author", "era", "genre", "topic", "field",
            "passage", "body", "original", "content", "markdown",
            "checkpoints", "examPoints", "passageNotes", "background", "characters", "vocabulary",
            "classificationCodes", "levelMin", "levelMax")
        val metaExtras = data.filterKeys { it !in knownKeys }

        @Suppress("UNCHECKED_CAST")
        val classificationCodes = (data["classificationCodes"] as? List<String>)
            ?: (data["classifications"] as? List<String>)
        val levelMin = (data["levelMin"] as? Number)?.toInt()
        val levelMax = (data["levelMax"] as? Number)?.toInt()

        // 같은 (area, subArea, title) 의 active corpus 재사용
        val existing = corpusRepo.findByAreaAndStatusOrderByUpdatedAtDesc(areaKey, "active")
            .firstOrNull { it.subArea == subAreaKey && it.title == title }

        val now = LocalDateTime.now()
        val corpus: LearningCorpusEntity = existing ?: LearningCorpusEntity(
            id = IdGenerator.newId("corp"),
            area = areaKey,
            subArea = subAreaKey,
            title = title,
            source = source,
            author = author,
            era = era,
            genre = genre,
            topic = topic,
            field = field,
            bodyMd = bodyMd,
            metaJson = if (metaExtras.isEmpty()) null else objectMapper.writeValueAsString(metaExtras),
            classificationCodes = classificationCodes?.let { objectMapper.writeValueAsString(it) },
            levelMin = levelMin,
            levelMax = levelMax,
            status = "active",
            createdAt = now,
            updatedAt = now,
            createdBy = importedBy,
        ).also { if (!dryRun) corpusRepo.save(it) }

        val corpusCreated = if (existing == null) 1 else 0

        var itemsAdded = 0
        val sourcePath = relativePath(file)

        // checkpoints[] → item_type=checkpoint
        itemsAdded += addItemsFromArray(
            corpus.id, data["checkpoints"], "checkpoint", sourcePath, importedBy, dryRun)
        // examPoints[] → item_type=exam_point
        itemsAdded += addItemsFromArray(
            corpus.id, data["examPoints"], "exam_point", sourcePath, importedBy, dryRun)
        // passageNotes[] → item_type=passage_note (start/end 옵션)
        itemsAdded += addItemsFromArray(
            corpus.id, data["passageNotes"], "passage_note", sourcePath, importedBy, dryRun)
        // background → item_type=background (string 또는 array)
        itemsAdded += addItemsFromArray(
            corpus.id, data["background"], "background", sourcePath, importedBy, dryRun)
        // characters[] → item_type=character
        itemsAdded += addItemsFromArray(
            corpus.id, data["characters"], "character", sourcePath, importedBy, dryRun)
        // vocabulary[] → item_type=vocabulary
        itemsAdded += addItemsFromArray(
            corpus.id, data["vocabulary"], "vocabulary", sourcePath, importedBy, dryRun)

        return Pair(corpusCreated, itemsAdded)
    }

    /**
     * question-bank / question-analysis 파일 — 같은 (area, subArea) 의 corpus 가 있으면 items 로 추가.
     * 없으면 subArea 명을 title 로 한 plain corpus 를 만들어 거기에 누적.
     */
    private fun importItemsFile(
        areaKey: String,
        subAreaKey: String,
        kindKey: String,
        file: File,
        importedBy: String,
        dryRun: Boolean,
    ): Int {
        val data = readJson(file) ?: return 0
        val sourcePath = relativePath(file)

        // 매칭 corpus 찾기 — 같은 (area, subArea) 의 첫 번째 active
        val matched = corpusRepo.findByAreaAndStatusOrderByUpdatedAtDesc(areaKey, "active")
            .firstOrNull { it.subArea == subAreaKey }
        val now = LocalDateTime.now()
        val corpus = matched ?: LearningCorpusEntity(
            id = IdGenerator.newId("corp"),
            area = areaKey,
            subArea = subAreaKey,
            title = "$subAreaKey (자동 생성)",
            status = "active",
            createdAt = now,
            updatedAt = now,
            createdBy = importedBy,
        ).also { if (!dryRun) corpusRepo.save(it) }

        // questions[] / items[] / 또는 top-level 파일 자체를 한 item 으로
        val itemType = if (kindKey == "question-bank") "exam_point" else "checkpoint"
        @Suppress("UNCHECKED_CAST")
        val list = (data["questions"] as? List<Any?>) ?: (data["items"] as? List<Any?>)
        return if (list != null) {
            addItemsFromArray(corpus.id, list, itemType, sourcePath, importedBy, dryRun)
        } else {
            // 단일 객체 — 통째로 한 item 으로
            addSingleItem(corpus.id, itemType, objectMapper.writeValueAsString(data), null, sourcePath, importedBy, dryRun)
            1
        }
    }

    private fun addItemsFromArray(
        corpusId: String,
        raw: Any?,
        itemType: String,
        sourcePath: String,
        importedBy: String,
        dryRun: Boolean,
    ): Int {
        if (raw == null) return 0
        // string 단일 — 한 item
        if (raw is String) {
            if (raw.isBlank()) return 0
            addSingleItem(corpusId, itemType, raw, null, sourcePath, importedBy, dryRun)
            return 1
        }
        if (raw !is List<*>) return 0
        var n = 0
        for (el in raw) {
            when (el) {
                is String -> {
                    if (el.isBlank()) continue
                    addSingleItem(corpusId, itemType, el, null, sourcePath, importedBy, dryRun)
                    n++
                }
                is Map<*, *> -> {
                    @Suppress("UNCHECKED_CAST")
                    val m = el as Map<String, Any?>
                    val text = (m["text"] as? String)
                        ?: (m["content"] as? String)
                        ?: (m["question"] as? String)
                        ?: (m["stem"] as? String)
                        ?: objectMapper.writeValueAsString(m)
                    if (text.isBlank()) continue
                    val meta = m.filterKeys { it !in setOf("text", "content", "question", "stem") }
                    val metaJson = if (meta.isEmpty()) null else objectMapper.writeValueAsString(meta)
                    addSingleItem(corpusId, itemType, text, metaJson, sourcePath, importedBy, dryRun)
                    n++
                }
                else -> { /* skip */ }
            }
        }
        return n
    }

    private fun addSingleItem(
        corpusId: String,
        itemType: String,
        text: String,
        metaJson: String?,
        sourcePath: String,
        importedBy: String,
        dryRun: Boolean,
    ) {
        val now = LocalDateTime.now()
        val ent = LearningCorpusItemEntity(
            id = IdGenerator.newId("citm"),
            corpusId = corpusId,
            itemType = itemType,
            textMd = text,
            metaJson = metaJson,
            sourceType = "legacy-import",
            sourceContentId = sourcePath,
            createdAt = now,
            updatedAt = now,
            createdBy = importedBy,
        )
        if (!dryRun) itemRepo.save(ent)
    }

    private fun readJson(file: File): Map<String, Any?>? = try {
        @Suppress("UNCHECKED_CAST")
        objectMapper.readValue(file, object : TypeReference<Map<String, Any?>>() {})
    } catch (e: Exception) {
        log.warn("JSON 파싱 실패 {} : {}", file.absolutePath, e.message)
        null
    }

    private fun relativePath(file: File): String {
        val rootPath = File(storageDir).absoluteFile.canonicalPath
        val abs = file.absoluteFile.canonicalPath
        return if (abs.startsWith(rootPath)) abs.removePrefix(rootPath).trimStart(File.separatorChar)
            else file.absolutePath
    }

    data class ImportResult(
        val scanned: Int,
        val corpusCreated: Int,
        val itemsAdded: Int,
        val errors: List<Map<String, Any?>>,
    )
}
