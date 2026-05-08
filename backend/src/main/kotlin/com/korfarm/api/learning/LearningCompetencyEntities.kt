package com.korfarm.api.learning

import jakarta.persistence.*
import org.hibernate.annotations.CreationTimestamp
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.io.Serializable
import java.time.LocalDateTime

/* ──────────────────────────────────────────────────────────
   학습/테스트 단위 누적 시계열 (모두 보존, 슬라이딩 윈도우 표시)
   ────────────────────────────────────────────────────────── */
@Entity
@Table(name = "learning_competency_log")
class LearningCompetencyLogEntity(
    @Id
    var id: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(name = "content_id", nullable = false)
    var contentId: String,

    /** chapter_test / test_paper / daily_quiz / farm_learning / pro_learning */
    @Column(nullable = false, length = 32)
    var source: String,

    @Column(nullable = false)
    var weight: Double,

    /** 이 학습의 역량별 정답률 (0~1) JSON */
    @Column(name = "vector_json", nullable = false, columnDefinition = "TEXT")
    var vectorJson: String,

    /** 이 학습이 측정한 역량 (1=측정함, 0=측정 안 함) JSON */
    @Column(name = "measured_json", nullable = false, columnDefinition = "TEXT")
    var measuredJson: String,

    @Column(name = "in_window", nullable = false)
    var inWindow: Boolean = true,

    @Column(name = "completed_at", nullable = false)
    var completedAt: LocalDateTime = LocalDateTime.now(),
)

interface LearningCompetencyLogRepository : JpaRepository<LearningCompetencyLogEntity, String> {
    fun existsByUserIdAndContentId(userId: String, contentId: String): Boolean

    @Query("""
        SELECT l FROM LearningCompetencyLogEntity l
        WHERE l.userId = :userId AND l.inWindow = true
        ORDER BY l.completedAt DESC
    """)
    fun findInWindowDesc(@Param("userId") userId: String): List<LearningCompetencyLogEntity>

    @Query("""
        SELECT l FROM LearningCompetencyLogEntity l
        WHERE l.userId = :userId AND l.inWindow = true
        ORDER BY l.completedAt ASC
    """)
    fun findInWindowAsc(@Param("userId") userId: String): List<LearningCompetencyLogEntity>

    @Query("SELECT COUNT(l) FROM LearningCompetencyLogEntity l WHERE l.userId = :userId AND l.inWindow = true")
    fun countInWindow(@Param("userId") userId: String): Long

    /** 학생 한 명의 누적 로그 전체 삭제 (admin backfill 용) */
    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM LearningCompetencyLogEntity l WHERE l.userId = :userId")
    fun deleteAllByUserId(@Param("userId") userId: String): Int
}

/* ──────────────────────────────────────────────────────────
   사용자별 역량 누적 캐시 (윈도우 내 가중평균 결과)
   ────────────────────────────────────────────────────────── */
@Entity
@Table(name = "user_competency_summary")
@IdClass(UserCompetencySummaryId::class)
class UserCompetencySummaryEntity(
    @Id
    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Id
    @Column(nullable = false, length = 64)
    var competency: String,

    @Column(name = "earned_total", nullable = false)
    var earnedTotal: Double = 0.0,

    @Column(name = "max_total", nullable = false)
    var maxTotal: Double = 0.0,

    @Column(name = "ratio_score", nullable = false)
    var ratioScore: Double = 0.0,

    @Column(name = "sample_count", nullable = false)
    var sampleCount: Int = 0,

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),
)

class UserCompetencySummaryId(
    var userId: String = "",
    var competency: String = "",
) : Serializable

interface UserCompetencySummaryRepository : JpaRepository<UserCompetencySummaryEntity, UserCompetencySummaryId> {
    fun findByUserId(userId: String): List<UserCompetencySummaryEntity>

    /** admin backfill 용 — 학생 한 명의 캐시 row 전체 삭제 */
    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM UserCompetencySummaryEntity s WHERE s.userId = :userId")
    fun deleteAllByUserId(@Param("userId") userId: String): Int
}
