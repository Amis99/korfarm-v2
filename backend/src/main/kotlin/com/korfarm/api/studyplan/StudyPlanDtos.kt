package com.korfarm.api.studyplan

// ── 요청 DTO ──

data class CreateStudyPlanRequest(
    val title: String,
    val description: String? = null,
    val examScope: String? = null,
    val startDate: String,
    val endDate: String,
    val targets: List<TargetInput> = emptyList(),
    val scopes: List<ScopeInput> = emptyList(),
    val assets: List<AssetInput> = emptyList(),
    val schedules: List<ScheduleInput> = emptyList()
)

data class TargetInput(
    val targetType: String,
    val targetId: String
)

data class ScopeInput(
    val label: String,
    val sortOrder: Int = 0
)

data class AssetInput(
    val assetType: String,
    val label: String,
    val assetKind: String = "study",
    val refId: String? = null,
    val sortOrder: Int = 0,
    val configJson: String? = null
)

data class ScheduleInput(
    val scopeId: String? = null,
    val assetId: String? = null,
    val scheduledDate: String,
    val label: String? = null,
    val memo: String? = null
)

data class UpdateStudyPlanRequest(
    val title: String? = null,
    val description: String? = null,
    val examScope: String? = null,
    val startDate: String? = null,
    val endDate: String? = null
)

data class AddScopeRequest(
    val label: String,
    val sortOrder: Int = 0
)

data class UpdateScopeRequest(
    val label: String? = null,
    val sortOrder: Int? = null
)

data class ReorderRequest(
    val ids: List<String>
)

data class AddAssetRequest(
    val assetType: String,
    val label: String,
    val assetKind: String = "study",
    val refId: String? = null,
    val sortOrder: Int = 0,
    val configJson: String? = null
)

data class UpdateAssetRequest(
    val label: String? = null,
    val assetType: String? = null,
    val assetKind: String? = null,
    val refId: String? = null,
    val configJson: String? = null
)

data class ReviewCellRequest(
    val status: String,
    val adminNote: String? = null
)

data class GradeCellRequest(
    val status: String,
    val score: Int? = null,
    val adminNote: String? = null
)

data class AssignCellContentRequest(
    val cellRefId: String
)

data class UpdateCellStatusRequest(
    val status: String,
    val score: Int? = null,
    val adminNote: String? = null
)

data class SubmitCellRequest(
    val fileIds: List<String> = emptyList()
)

data class CreateScheduleRequest(
    val scopeId: String? = null,
    val assetId: String? = null,
    val scheduledDate: String,
    val label: String? = null,
    val memo: String? = null
)

data class UpdateScheduleRequest(
    val scopeId: String? = null,
    val assetId: String? = null,
    val scheduledDate: String? = null,
    val label: String? = null,
    val memo: String? = null
)

// ── 응답 DTO ──

data class StudyPlanSummaryResponse(
    val planId: String,
    val title: String,
    val description: String?,
    val examScope: String?,
    val startDate: String,
    val endDate: String,
    val status: String,
    val targetCount: Int,
    val createdAt: String
)

data class StudyPlanDetailResponse(
    val planId: String,
    val title: String,
    val description: String?,
    val examScope: String?,
    val startDate: String,
    val endDate: String,
    val status: String,
    val createdBy: String,
    val targets: List<TargetResponse>,
    val scopes: List<ScopeResponse>,
    val assets: List<AssetResponse>,
    val createdAt: String
)

data class TargetResponse(
    val id: String,
    val targetType: String,
    val targetId: String,
    val targetName: String? = null
)

data class ScopeResponse(
    val id: String,
    val label: String,
    val sortOrder: Int
)

data class AssetResponse(
    val id: String,
    val assetType: String,
    val label: String,
    val assetKind: String,
    val refId: String?,
    val sortOrder: Int,
    val configJson: String?
)

data class StudentProgressResponse(
    val userId: String,
    val userName: String?,
    val totalCells: Int,
    val completedCells: Int,
    val pendingCells: Int,
    val submittedCells: Int,
    val unassignedCells: Int,
    val inProgressCells: Int,
    val partialCells: Int
)

data class MatrixResponse(
    val scopes: List<ScopeResponse>,
    val assets: List<AssetResponse>,
    val cells: List<CellResponse>
)

data class CellResponse(
    val cellId: String,
    val scopeId: String,
    val assetId: String,
    val status: String,
    val score: Int?,
    val submissionCount: Int,
    val adminNote: String?,
    val reviewedAt: String?,
    val assetType: String? = null,
    val assetKind: String? = null,
    val refId: String? = null,
    val cellRefId: String? = null
)

data class CellFileResponse(
    val id: String,
    val fileId: String,
    val uploadedBy: String,
    val createdAt: String
)

data class ScheduleResponse(
    val id: String,
    val scopeId: String?,
    val assetId: String?,
    val scheduledDate: String,
    val label: String?,
    val memo: String?
)

data class StudentDashboardSummary(
    val activePlans: Int,
    val totalPending: Int,
    val totalSubmitted: Int,
    val totalUnassigned: Int,
    val upcomingSchedules: Int
)

data class UpcomingItemResponse(
    val assetType: String,
    val label: String,
    val scheduledDate: String?,
    val dueDate: String?,
    val planTitle: String?
)

// ── 캘린더 이벤트 응답 ──

data class CalendarEventResponse(
    val id: String,
    val eventType: String,
    val eventDate: String,
    val cellId: String?,
    val refLabel: String?,
    val memo: String?,
    val createdAt: String
)

// ── 변환 함수 ──

internal fun StudyPlanEntity.toSummary(targetCount: Int): StudyPlanSummaryResponse {
    return StudyPlanSummaryResponse(
        planId = id,
        title = title,
        description = description,
        examScope = examScope,
        startDate = startDate.toString(),
        endDate = endDate.toString(),
        status = status,
        targetCount = targetCount,
        createdAt = createdAt.toString()
    )
}

internal fun StudyPlanScopeEntity.toResponse(): ScopeResponse {
    return ScopeResponse(id = id, label = label, sortOrder = sortOrder)
}

internal fun StudyPlanAssetEntity.toResponse(): AssetResponse {
    return AssetResponse(
        id = id, assetType = assetType, label = label,
        assetKind = assetKind, refId = refId, sortOrder = sortOrder,
        configJson = configJson
    )
}

internal fun StudyPlanCellEntity.toResponse(asset: StudyPlanAssetEntity? = null): CellResponse {
    return CellResponse(
        cellId = id, scopeId = scopeId, assetId = assetId,
        status = status, score = score, submissionCount = submissionCount,
        adminNote = adminNote, reviewedAt = reviewedAt?.toString(),
        assetType = asset?.assetType, assetKind = asset?.assetKind, refId = asset?.refId,
        cellRefId = cellRefId
    )
}

internal fun StudyPlanCellFileEntity.toResponse(): CellFileResponse {
    return CellFileResponse(
        id = id, fileId = fileId, uploadedBy = uploadedBy,
        createdAt = createdAt.toString()
    )
}

internal fun StudyPlanEventEntity.toCalendarEvent(): CalendarEventResponse {
    return CalendarEventResponse(
        id = id, eventType = eventType, eventDate = eventDate.toString(),
        cellId = cellId, refLabel = refLabel, memo = memo,
        createdAt = createdAt.toString()
    )
}

internal fun StudyPlanScheduleEntity.toResponse(): ScheduleResponse {
    return ScheduleResponse(
        id = id, scopeId = scopeId, assetId = assetId,
        scheduledDate = scheduledDate.toString(), label = label, memo = memo
    )
}
