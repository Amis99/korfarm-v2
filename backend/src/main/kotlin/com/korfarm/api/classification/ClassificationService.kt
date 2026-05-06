package com.korfarm.api.classification

import com.korfarm.api.common.ApiException
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class ClassificationService(
    private val masterRepository: ClassificationMasterRepository,
    private val contentRepository: ContentClassificationRepository,
    private val testQuestionRepository: TestQuestionClassificationRepository,
) {
    // ─── 마스터 카탈로그 ────────────────────────

    @Transactional(readOnly = true)
    fun getTree(): ClassificationTree {
        val all = masterRepository.findAllByActiveOrderBySortOrderAsc(true)
        val areas = all.filter { it.type == "area" }
        val subAreas = all.filter { it.type == "sub_area" }.groupBy { it.parentCode ?: "" }
        val themes = all.filter { it.type == "theme" }.groupBy { it.parentCode ?: "" }

        return ClassificationTree(
            areas = areas.map { area ->
                AreaNode(
                    code = area.code,
                    labelKo = area.labelKo,
                    sortOrder = area.sortOrder,
                    subAreas = (subAreas[area.code] ?: emptyList()).map { sub ->
                        SubAreaNode(
                            code = sub.code,
                            labelKo = sub.labelKo,
                            sortOrder = sub.sortOrder,
                            // 주제는 sub_area 또는 area 가 parent 일 수 있음 (화법·작문·매체는 영역에 직접)
                            themes = (themes[sub.code] ?: emptyList()).map { it.toLeaf() },
                        )
                    },
                    // 영역 직속 주제 (화법·작문·매체)
                    themesAtArea = (themes[area.code] ?: emptyList()).map { it.toLeaf() },
                )
            },
        )
    }

    private fun ClassificationMasterEntity.toLeaf(): ThemeLeaf =
        ThemeLeaf(code = code, labelKo = labelKo, sortOrder = sortOrder)

    @Transactional(readOnly = true)
    fun listAll(): List<ClassificationMasterEntity> =
        masterRepository.findAllByActiveOrderBySortOrderAsc(true)

    // ─── 콘텐츠 매핑 ────────────────────────

    @Transactional(readOnly = true)
    fun getContentClassifications(contentId: String): List<ContentClassificationView> {
        val mappings = contentRepository.findByIdContentId(contentId)
        if (mappings.isEmpty()) return emptyList()
        val codes = mappings.map { it.id.classificationCode }
        val masters = masterRepository.findAllById(codes).associateBy { it.code }
        return mappings.map { m ->
            val master = masters[m.id.classificationCode]
            ContentClassificationView(
                code = m.id.classificationCode,
                type = m.classificationType,
                isPrimary = m.isPrimary,
                labelKo = master?.labelKo ?: m.id.classificationCode,
                parentCode = master?.parentCode,
            )
        }
    }

    /** 콘텐츠의 분류를 한 번에 전체 교체 (delete-then-insert). */
    @Transactional
    fun replaceContentClassifications(contentId: String, items: List<ClassificationItemRequest>) {
        // 검증 — 모든 code 가 master 에 존재하는가
        val codes = items.map { it.code }.distinct()
        val foundMasters = masterRepository.findAllById(codes).associateBy { it.code }
        items.forEach { item ->
            val master = foundMasters[item.code]
                ?: throw ApiException("INVALID_CODE", "분류 코드 없음: ${item.code}", HttpStatus.BAD_REQUEST)
            // type 자동 채움 (요청에 type 안 보내도 OK)
        }

        contentRepository.deleteByIdContentId(contentId)
        contentRepository.flush()

        val now = LocalDateTime.now()
        val entities = items.distinctBy { it.code }.map { item ->
            val master = foundMasters[item.code]!!
            ContentClassificationEntity(
                id = ContentClassificationId(contentId = contentId, classificationCode = item.code),
                classificationType = master.type,
                isPrimary = item.isPrimary,
                createdAt = now,
            )
        }
        if (entities.isNotEmpty()) contentRepository.saveAll(entities)
    }

    // ─── 시험 문항 매핑 ────────────────────────

    @Transactional(readOnly = true)
    fun getTestQuestionClassifications(questionId: String): List<ContentClassificationView> {
        val mappings = testQuestionRepository.findByIdQuestionId(questionId)
        if (mappings.isEmpty()) return emptyList()
        val codes = mappings.map { it.id.classificationCode }
        val masters = masterRepository.findAllById(codes).associateBy { it.code }
        return mappings.map { m ->
            val master = masters[m.id.classificationCode]
            ContentClassificationView(
                code = m.id.classificationCode,
                type = m.classificationType,
                isPrimary = m.isPrimary,
                labelKo = master?.labelKo ?: m.id.classificationCode,
                parentCode = master?.parentCode,
            )
        }
    }

    @Transactional
    fun replaceTestQuestionClassifications(questionId: String, items: List<ClassificationItemRequest>) {
        val codes = items.map { it.code }.distinct()
        val foundMasters = masterRepository.findAllById(codes).associateBy { it.code }
        items.forEach { item ->
            foundMasters[item.code]
                ?: throw ApiException("INVALID_CODE", "분류 코드 없음: ${item.code}", HttpStatus.BAD_REQUEST)
        }
        testQuestionRepository.deleteByIdQuestionId(questionId)
        testQuestionRepository.flush()

        val now = LocalDateTime.now()
        val entities = items.distinctBy { it.code }.map { item ->
            val master = foundMasters[item.code]!!
            TestQuestionClassificationEntity(
                id = TestQuestionClassificationId(questionId = questionId, classificationCode = item.code),
                classificationType = master.type,
                isPrimary = item.isPrimary,
                createdAt = now,
            )
        }
        if (entities.isNotEmpty()) testQuestionRepository.saveAll(entities)
    }
}

// ─── DTOs ────────────────────────

data class ClassificationTree(val areas: List<AreaNode>)
data class AreaNode(
    val code: String, val labelKo: String, val sortOrder: Int,
    val subAreas: List<SubAreaNode>,
    val themesAtArea: List<ThemeLeaf>,           // 화법·작문·매체용 — 영역 직속 주제
)
data class SubAreaNode(
    val code: String, val labelKo: String, val sortOrder: Int,
    val themes: List<ThemeLeaf>,
)
data class ThemeLeaf(
    val code: String, val labelKo: String, val sortOrder: Int,
)
data class ContentClassificationView(
    val code: String, val type: String,
    val isPrimary: Boolean, val labelKo: String, val parentCode: String?,
)
data class ClassificationItemRequest(
    val code: String, val isPrimary: Boolean = false,
)
