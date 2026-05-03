package com.korfarm.api.duel

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDateTime

/**
 * 대결 모드 설정 — 매치 규칙·AI 플레이어·큐·보상 정책을 JSON 한 덩어리로 보관.
 * 기본은 단일 행(id="default") 만 사용. 어드민에서 편집해 저장.
 */
@Entity
@Table(name = "duel_settings")
class DuelSettingsEntity(
    @Id
    var id: String,

    /** 매치규칙 + AI 플레이어 + 큐 + 보상 정책 등을 담은 JSON 문자열 */
    @Column(name = "settings_json", columnDefinition = "LONGTEXT", nullable = false)
    var settingsJson: String,

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_by")
    var updatedBy: String? = null
)

interface DuelSettingsRepository : JpaRepository<DuelSettingsEntity, String>
