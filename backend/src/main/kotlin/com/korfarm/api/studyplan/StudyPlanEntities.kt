package com.korfarm.api.studyplan

import jakarta.persistence.*
import java.time.LocalDate
import java.time.LocalDateTime

@Entity
@Table(name = "study_plans")
class StudyPlanEntity(
    @Id
    var id: String,

    @Column(name = "org_id", nullable = false)
    var orgId: String,

    @Column(nullable = false)
    var title: String,

    var description: String? = null,

    @Column(name = "exam_scope")
    var examScope: String? = null,

    @Column(name = "start_date", nullable = false)
    var startDate: LocalDate,

    @Column(name = "end_date", nullable = false)
    var endDate: LocalDate,

    @Column(nullable = false)
    var status: String = "active",

    /** 기관 default 템플릿 여부. 새 학생 가입 시 자동 복제 (V0082 신설) */
    @Column(name = "is_template", nullable = false)
    var isTemplate: Boolean = false,

    /** 학생용 복제본이라면 원본 템플릿 plan id (V0082 신설) */
    @Column(name = "template_origin_id")
    var templateOriginId: String? = null,

    @Column(name = "created_by", nullable = false)
    var createdBy: String,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    @PrePersist
    fun onCreate() {
        val now = LocalDateTime.now()
        createdAt = now
        updatedAt = now
    }

    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }
}

@Entity
@Table(name = "study_plan_targets")
class StudyPlanTargetEntity(
    @Id
    var id: String,

    @Column(name = "plan_id", nullable = false)
    var planId: String,

    @Column(name = "target_type", nullable = false)
    var targetType: String,

    @Column(name = "target_id", nullable = false)
    var targetId: String,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
) {
    @PrePersist
    fun onCreate() {
        createdAt = LocalDateTime.now()
    }
}

@Entity
@Table(name = "study_plan_scopes")
class StudyPlanScopeEntity(
    @Id
    var id: String,

    @Column(name = "plan_id", nullable = false)
    var planId: String,

    @Column(nullable = false)
    var label: String,

    @Column(name = "sort_order", nullable = false)
    var sortOrder: Int = 0,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    @PrePersist
    fun onCreate() {
        val now = LocalDateTime.now()
        createdAt = now
        updatedAt = now
    }

    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }
}

@Entity
@Table(name = "study_plan_assets")
class StudyPlanAssetEntity(
    @Id
    var id: String,

    @Column(name = "plan_id", nullable = false)
    var planId: String,

    @Column(name = "asset_type", nullable = false)
    var assetType: String,

    @Column(nullable = false)
    var label: String,

    @Column(name = "asset_kind", nullable = false)
    var assetKind: String = "study",

    @Column(name = "ref_id")
    var refId: String? = null,

    @Column(name = "sort_order", nullable = false)
    var sortOrder: Int = 0,

    @Column(name = "config_json", columnDefinition = "json")
    var configJson: String? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    @PrePersist
    fun onCreate() {
        val now = LocalDateTime.now()
        createdAt = now
        updatedAt = now
    }

    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }
}

@Entity
@Table(name = "study_plan_cells")
class StudyPlanCellEntity(
    @Id
    var id: String,

    @Column(name = "plan_id", nullable = false)
    var planId: String,

    @Column(name = "scope_id", nullable = false)
    var scopeId: String,

    @Column(name = "asset_id", nullable = false)
    var assetId: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(nullable = false)
    var status: String = "pending",

    @Column(name = "cell_ref_id")
    var cellRefId: String? = null,

    /** 셀별 마감 기한 — 배정 시 필수, 만료(회색) 판정에 사용 */
    @Column(name = "due_at")
    var dueAt: LocalDateTime? = null,

    /** 자유 텍스트 라벨 — 활동·자유주제 학생 입력 등 ref 가 없을 때 표시명 */
    @Column(name = "assigned_label")
    var assignedLabel: String? = null,

    var score: Int? = null,

    @Column(name = "submission_count", nullable = false)
    var submissionCount: Int = 0,

    @Column(name = "admin_note")
    var adminNote: String? = null,

    @Column(name = "reviewed_by")
    var reviewedBy: String? = null,

    @Column(name = "reviewed_at")
    var reviewedAt: LocalDateTime? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    @PrePersist
    fun onCreate() {
        val now = LocalDateTime.now()
        createdAt = now
        updatedAt = now
    }

    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }
}

@Entity
@Table(name = "study_plan_cell_files")
class StudyPlanCellFileEntity(
    @Id
    var id: String,

    @Column(name = "cell_id", nullable = false)
    var cellId: String,

    @Column(name = "file_id", nullable = false)
    var fileId: String,

    @Column(name = "uploaded_by", nullable = false)
    var uploadedBy: String,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
) {
    @PrePersist
    fun onCreate() {
        createdAt = LocalDateTime.now()
    }
}

@Entity
@Table(name = "study_plan_events")
class StudyPlanEventEntity(
    @Id
    var id: String,

    @Column(name = "plan_id", nullable = false)
    var planId: String,

    @Column(name = "user_id", nullable = false)
    var userId: String,

    @Column(name = "event_type", nullable = false)
    var eventType: String,

    @Column(name = "event_date", nullable = false)
    var eventDate: LocalDate,

    @Column(name = "cell_id")
    var cellId: String? = null,

    @Column(name = "ref_label")
    var refLabel: String? = null,

    var memo: String? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
) {
    @PrePersist
    fun onCreate() {
        createdAt = LocalDateTime.now()
    }
}

@Entity
@Table(name = "study_plan_schedules")
class StudyPlanScheduleEntity(
    @Id
    var id: String,

    @Column(name = "plan_id", nullable = false)
    var planId: String,

    @Column(name = "scope_id")
    var scopeId: String? = null,

    @Column(name = "asset_id")
    var assetId: String? = null,

    @Column(name = "scheduled_date", nullable = false)
    var scheduledDate: LocalDate,

    var label: String? = null,

    var memo: String? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    @PrePersist
    fun onCreate() {
        val now = LocalDateTime.now()
        createdAt = now
        updatedAt = now
    }

    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }
}
