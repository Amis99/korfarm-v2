package com.korfarm.api.duel

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDateTime

/**
 * 테마 대결 — 기관별 서브 서버 메타.
 * 한 기관 안에 별도 문제은행을 가진 서브 서버(A1~A10) 를 최대 10개 운영.
 * id 는 duel_question_pool / duel_rooms / duel_matches / duel_stats 의 server_id 와 동일.
 * 예: "theme_org_seoul_001_a1"
 */
@Entity
@Table(name = "theme_sub_servers")
class ThemeSubServerEntity(
    @Id
    var id: String,

    @Column(name = "org_id", nullable = false)
    var orgId: String,

    /** 서브 서버 이름 (학생/어드민 화면에 표시) */
    @Column(name = "sub_name", nullable = false)
    var subName: String,

    /** 운영 시한 (NULL=무기한). 지나면 status="expired" 로 자동 처리 */
    @Column(name = "expire_at")
    var expireAt: LocalDateTime? = null,

    /** active / expired / closed */
    @Column(nullable = false)
    var status: String = "active",

    @Column(name = "created_by", nullable = false)
    var createdBy: String,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
)

interface ThemeSubServerRepository : JpaRepository<ThemeSubServerEntity, String> {
    fun findByOrgIdOrderByCreatedAtDesc(orgId: String): List<ThemeSubServerEntity>
    fun findByOrgIdAndStatusOrderByCreatedAtDesc(orgId: String, status: String): List<ThemeSubServerEntity>
}
