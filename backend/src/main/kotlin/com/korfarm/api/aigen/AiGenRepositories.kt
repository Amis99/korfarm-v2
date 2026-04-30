package com.korfarm.api.aigen

import org.springframework.data.jpa.repository.JpaRepository

interface GrammarCorpusRepository : JpaRepository<GrammarCorpusEntity, String> {
    fun findByTopicAndStatusOrderByCreatedAtDesc(topic: String, status: String): List<GrammarCorpusEntity>
    fun findByStatusOrderByCreatedAtDesc(status: String): List<GrammarCorpusEntity>
}

interface LearningConceptRepository : JpaRepository<LearningConceptEntity, String> {
    fun findByAreaAndStatusOrderByDisplayOrderAsc(area: String, status: String): List<LearningConceptEntity>
    fun findByAreaAndSubAreaAndStatusOrderByDisplayOrderAsc(
        area: String, subArea: String, status: String
    ): List<LearningConceptEntity>
}

interface AiGenLogRepository : JpaRepository<AiGenLogEntity, String>
