package com.korfarm.api.learning

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDateTime

/**
 * 콘텐츠 추천용 사전계산 인덱스. 매 추천 호출마다 콘텐츠 payload 를 파싱하지 않고
 * 단일 SQL 로 끝낸다 (AI 비서·튜터 양쪽 사용).
 */
@Entity
@Table(name = "content_recommendation_index")
class ContentRecommendationIndexEntity(
    @Id
    @Column(name = "content_id")
    var contentId: String,

    @Column(name = "level_id")
    var levelId: String? = null,

    @Column(name = "level_num")
    var levelNum: Int? = null,

    @Column(name = "content_kind", length = 32)
    var contentKind: String? = null,

    @Column
    var area: String? = null,

    @Column(name = "sub_area")
    var subArea: String? = null,

    @Column(name = "comp_lexical", nullable = false)
    var compLexical: Double = 0.0,

    @Column(name = "comp_sentence", nullable = false)
    var compSentence: Double = 0.0,

    @Column(name = "comp_structure", nullable = false)
    var compStructure: Double = 0.0,

    @Column(name = "comp_logic", nullable = false)
    var compLogic: Double = 0.0,

    @Column(name = "comp_grammar", nullable = false)
    var compGrammar: Double = 0.0,

    @Column(name = "comp_concept", nullable = false)
    var compConcept: Double = 0.0,

    @Column(name = "comp_korbg", nullable = false)
    var compKorbg: Double = 0.0,

    @Column(name = "comp_nonfic", nullable = false)
    var compNonfic: Double = 0.0,

    @Column(name = "comp_qanalysis", nullable = false)
    var compQanalysis: Double = 0.0,

    @Column(name = "comp_canalysis", nullable = false)
    var compCanalysis: Double = 0.0,

    @Column(name = "classification_codes", columnDefinition = "JSON")
    var classificationCodes: String? = null,

    @Column(name = "question_count", nullable = false)
    var questionCount: Int = 0,

    @Column(name = "popularity", nullable = false)
    var popularity: Double = 0.0,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),
)

interface ContentRecommendationIndexRepository : JpaRepository<ContentRecommendationIndexEntity, String>
