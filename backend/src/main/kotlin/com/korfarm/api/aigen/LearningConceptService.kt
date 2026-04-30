package com.korfarm.api.aigen

import org.springframework.stereotype.Service

@Service
class LearningConceptService(
    private val repo: LearningConceptRepository,
) {
    fun listForArea(area: String, subArea: String? = null): List<LearningConceptDto> {
        val rows = if (subArea.isNullOrBlank())
            repo.findByAreaAndStatusOrderByDisplayOrderAsc(area, "active")
        else
            repo.findByAreaAndSubAreaAndStatusOrderByDisplayOrderAsc(area, subArea, "active")
                .ifEmpty { repo.findByAreaAndStatusOrderByDisplayOrderAsc(area, "active") }
        return rows.map {
            LearningConceptDto(
                id = it.id, area = it.area, subArea = it.subArea,
                name = it.name, description = it.description, displayOrder = it.displayOrder,
            )
        }
    }
}
