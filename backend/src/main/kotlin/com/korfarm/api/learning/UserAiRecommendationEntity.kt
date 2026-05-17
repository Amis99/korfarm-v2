package com.korfarm.api.learning

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDateTime

/**
 * 통합 분석표 AI 추천 학습 캐시 (2026-05-18).
 * - 최초 1회 자동 생성, 이후 "추천학습 생성" 버튼 (하루 1회) 으로 갱신.
 * - bundleJson 형식 (UnifiedReportService 응답 호환):
 *   {"competency":{"strategy":"ai","targetLabels":[...], "items":[...]},
 *    "area":{...},
 *    "levelId":"..."}
 */
@Entity
@Table(name = "user_ai_recommendations")
class UserAiRecommendationEntity(
    @Id
    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(name = "bundle_json", columnDefinition = "LONGTEXT", nullable = false)
    var bundleJson: String,

    @Column(name = "generated_at", nullable = false)
    var generatedAt: LocalDateTime = LocalDateTime.now(),
)

interface UserAiRecommendationRepository : JpaRepository<UserAiRecommendationEntity, String>
