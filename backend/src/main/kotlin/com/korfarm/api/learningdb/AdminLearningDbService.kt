package com.korfarm.api.learningdb

import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.ApiException
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import java.io.File

/**
 * 학습 자료 DB — 영역·세부영역별 raw JSON 자료(해설서/문제은행/문제분석)를 디스크에 저장·관리.
 *
 * 저장 구조: {storage-dir}/{area}/{subArea}/{kind}/{filename}.json
 * - area: enum(LearningArea) — 7종
 * - kind: enum(LearningKind) — 3종
 * - subArea/filename: 자유 입력 (단, .. 차단 + 슬래시 차단)
 *
 * 사용자가 출제·교재 제작에 활용할 raw 자료. 학생 화면에서 직접 fetch 하지 않음.
 */
@Service
class AdminLearningDbService(
    private val objectMapper: ObjectMapper,
    @Value("\${learning-data.storage-dir:./data/learning-data}")
    private val storageDir: String
) {
    private val root: File get() = File(storageDir).also { if (!it.isDirectory) it.mkdirs() }

    fun listMeta(): LearningDataMetaDto = LearningDataMetaDto(
        areas = LearningArea.values().map { AreaMetaDto(it.key, it.label) },
        kinds = LearningKind.values().map { KindMetaDto(it.key, it.label) }
    )

    /** 트리: 영역(7) → 세부영역(자유) → 자료종류(3) → 파일들 */
    fun tree(): LearningDataNodeDto {
        val areaNodes = LearningArea.values().map { area ->
            val areaDir = File(root, area.key)
            val subAreaNodes: List<LearningDataNodeDto> = if (areaDir.isDirectory) {
                areaDir.listFiles { f -> f.isDirectory }?.sortedBy { it.name }?.map { subDir ->
                    val kindNodes = LearningKind.values().map { kind ->
                        val kindDir = File(subDir, kind.key)
                        val files = if (kindDir.isDirectory) {
                            kindDir.listFiles { f -> f.isFile && f.name.endsWith(".json") }
                                ?.sortedBy { it.name }
                                ?.map { f ->
                                    LearningDataNodeDto(
                                        type = "file",
                                        key = f.name,
                                        label = f.name.removeSuffix(".json"),
                                        path = "${area.key}/${subDir.name}/${kind.key}/${f.name}",
                                        meta = mapOf("size" to f.length())
                                    )
                                } ?: emptyList()
                        } else emptyList()
                        LearningDataNodeDto(
                            type = "kind",
                            key = kind.key,
                            label = kind.label,
                            path = "${area.key}/${subDir.name}/${kind.key}",
                            children = files,
                            meta = mapOf("count" to files.size)
                        )
                    }
                    LearningDataNodeDto(
                        type = "subArea",
                        key = subDir.name,
                        label = subDir.name,
                        path = "${area.key}/${subDir.name}",
                        children = kindNodes
                    )
                } ?: emptyList()
            } else emptyList()
            LearningDataNodeDto(
                type = "area",
                key = area.key,
                label = area.label,
                path = area.key,
                children = subAreaNodes
            )
        }
        return LearningDataNodeDto(
            type = "root",
            key = "root",
            label = "학습 자료",
            path = "",
            children = areaNodes
        )
    }

    fun readFile(path: String): Any {
        val f = safeFile(path)
        if (!f.isFile) throw ApiException("NOT_FOUND", "파일 없음: $path", HttpStatus.NOT_FOUND)
        return objectMapper.readValue(f, Any::class.java)
    }

    fun saveFile(path: String, data: Any?): FileSaveResultDto {
        val f = safeFile(path)
        val created = !f.exists()
        f.parentFile.mkdirs()
        objectMapper.writerWithDefaultPrettyPrinter().writeValue(f, data ?: emptyMap<String, Any>())
        return FileSaveResultDto(path = path, size = f.length(), created = created)
    }

    fun deleteFile(path: String): Boolean {
        val f = safeFile(path)
        return if (f.isFile) f.delete() else false
    }

    fun importBatch(request: FileImportRequestDto): FileImportResultDto {
        val ok = mutableListOf<String>()
        val errors = mutableListOf<Map<String, Any?>>()
        request.items.forEachIndexed { i, item ->
            try {
                val area = LearningArea.byKey(item.area)
                val kind = LearningKind.byKey(item.kind)
                require(item.subArea.isNotBlank()) { "subArea 비어있음" }
                require(!item.subArea.contains("/") && !item.subArea.contains("..")) { "subArea 에 슬래시·.. 금지" }
                require(!item.filename.contains("/") && !item.filename.contains("..")) { "filename 에 슬래시·.. 금지" }
                val name = if (item.filename.endsWith(".json")) item.filename else "${item.filename}.json"
                val path = "${area.key}/${item.subArea}/${kind.key}/$name"
                saveFile(path, item.data)
                ok.add(path)
            } catch (e: Exception) {
                errors.add(mapOf(
                    "index" to i,
                    "filename" to item.filename,
                    "subArea" to item.subArea,
                    "error" to (e.message ?: e::class.simpleName)
                ))
            }
        }
        return FileImportResultDto(
            total = request.items.size,
            ok = ok.size,
            failed = errors.size,
            okPaths = ok,
            errors = errors
        )
    }

    /** 경로 안전성 검증 후 File 반환 */
    private fun safeFile(path: String): File {
        val parts = path.split("/")
        if (parts.size != 4) {
            throw ApiException("BAD_REQUEST",
                "path 형식: 'area/subArea/kind/filename.json' (요청: $path)",
                HttpStatus.BAD_REQUEST)
        }
        val (area, sub, kind, filename) = parts
        try {
            LearningArea.byKey(area)
            LearningKind.byKey(kind)
        } catch (e: IllegalArgumentException) {
            throw ApiException("BAD_REQUEST", e.message ?: "invalid path", HttpStatus.BAD_REQUEST)
        }
        if (sub.isBlank() || sub.contains("..") || filename.contains("..")) {
            throw ApiException("BAD_REQUEST", "잘못된 경로: $path", HttpStatus.BAD_REQUEST)
        }
        if (!filename.endsWith(".json")) {
            throw ApiException("BAD_REQUEST", "filename 은 .json 으로 끝나야 합니다: $filename", HttpStatus.BAD_REQUEST)
        }
        return File(File(File(File(root, area), sub), kind), filename)
    }
}
