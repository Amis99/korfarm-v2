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
    val endDate: String? = null,
    /** 기관 default 템플릿 표식 — true 이면 신규 학생 자동 복제 대상 */
    val isTemplate: Boolean? = null
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
    /** 콘텐츠/테스트/주제 등 외부 ref 의 id. 활동(activity) 의 경우 null 허용 */
    val cellRefId: String? = null,
    /** 자유 텍스트 라벨 — 활동·자유주제 본인 입력. ref 가 있을 때 표시명 override 도 가능 */
    val assignedLabel: String? = null,
    /** 마감 기한 (ISO yyyy-MM-ddTHH:mm:ss 또는 yyyy-MM-dd). 배정 시 필수 */
    val dueAt: String? = null
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
    val createdAt: String,
    /** 기관 default 템플릿 여부 */
    val isTemplate: Boolean = false
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
    val configJson: String?,
    /** 시험지 PDF (시험 자산 한정). 통합 PDF 정책 — testPdfFileId == answerPdfFileId */
    val testPdfFileId: String? = null,
    /** 정답·해설 PDF — 통합 PDF 인 경우 testPdfFileId 와 같은 값 */
    val answerPdfFileId: String? = null
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
    val userId: String,
    val status: String,
    val score: Int?,
    val submissionCount: Int,
    val adminNote: String?,
    val reviewedAt: String?,
    val assetType: String? = null,
    val assetKind: String? = null,
    val refId: String? = null,
    val cellRefId: String? = null,
    /** 마감 기한 (ISO LocalDateTime). 배정 후에만 값 존재 */
    val dueAt: String? = null,
    /** 배정 시점 (ISO LocalDateTime). cell.updated_at 기반 — 캘린더 표시 시작일 */
    val assignedAt: String? = null,
    /** 자유 텍스트 라벨 (활동·자유주제 학생 입력 등) */
    val assignedLabel: String? = null,
    /** 만료 여부 — dueAt < now 이면서 status NOT IN ('completed','submitted','reviewed') */
    val isOverdue: Boolean = false,
    /** 비활성 셀 여부 (V0147 / Rev.2) — true 면 진행률 분모 제외 + 화면에서 회색 처리 */
    val isDisabled: Boolean = false,
    /** 비활성화 시각 (ISO LocalDateTime) */
    val disabledAt: String? = null,
    /** 셀 클릭 시 화면 전환에 필요한 정보. asset_type 별로 다른 필드. */
    val cellAction: CellAction? = null,
    /** 국어농장 셀 복수 배정 — assignment row 들. 다른 자산 종류는 비어 있음. */
    val assignments: List<CellAssignmentResponse> = emptyList(),
    /** 시험지 PDF — cell.cellRefId(testId) 로 매핑된 test_papers.pdf_file_id. 통합 PDF. */
    val testPdfFileId: String? = null,
    /** 정답·해설 PDF — 통합 PDF 정책상 testPdfFileId 와 같은 값 */
    val answerPdfFileId: String? = null
)

data class CellAssignmentResponse(
    val id: String,
    val cellId: String,
    val refId: String,
    val assignedLabel: String?,
    val status: String,
    val score: Int?,
    val dueAt: String?,
    val completedAt: String?,
    val sortOrder: Int
)

/**
 * 셀 클릭 시 학생/어드민 화면이 어떤 동작을 해야 하는지 알려주는 응답 모델.
 * - korfarm: 국어농장 학습 콘텐츠로 이동
 * - writing: 글농장(wisdom) 글쓰기 화면으로 이동
 * - test: 테스트 응시/조회 화면으로 이동
 * - activity: 학습활동(파일 제출) 화면으로 이동 (기존 로직)
 */
data class CellAction(
    val kind: String,                 // "learn" | "write" | "test" | "activity"
    val contentId: String? = null,    // korfarm: 콘텐츠 ID
    val learningHistoryUrl: String? = null, // 어드민용 학습 이력 링크 (korfarm)
    val levelId: String? = null,      // writing: 글농장 레벨
    val topicKey: String? = null,     // writing
    val topicLabel: String? = null,   // writing
    val wisdomPostId: String? = null, // writing: 학생이 이미 작성한 경우 글 ID
    val testId: String? = null,       // test: 테스트 ID
    val hasSubmission: Boolean? = null // test: 학생 제출 존재 여부
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
    val upcomingSchedules: Int,
    /** N-9 (2026-05-21) — 24h 이내 신규 배정된 셀 수. > 0 이면 ReminderModal 강제 노출. */
    val recentlyAssignedCount: Int = 0
)

data class UpcomingItemResponse(
    val assetType: String,
    val label: String,
    val scheduledDate: String?,
    val dueDate: String?,
    val planTitle: String?
)

data class SubmissionResponse(
    val cellId: String,
    val userId: String,
    val userName: String,
    val scopeLabel: String,
    val assetLabel: String,
    val assetType: String,
    val status: String,
    val submissionCount: Int,
    val score: Int?,
    val adminNote: String?,
    val updatedAt: String?
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

internal fun StudyPlanAssetEntity.toResponse(
    testPdfFileId: String? = null,
    answerPdfFileId: String? = null
): AssetResponse {
    return AssetResponse(
        id = id, assetType = assetType, label = label,
        assetKind = assetKind, refId = refId, sortOrder = sortOrder,
        configJson = configJson,
        testPdfFileId = testPdfFileId,
        answerPdfFileId = answerPdfFileId
    )
}

internal fun StudyPlanCellEntity.toResponse(
    asset: StudyPlanAssetEntity? = null,
    cellAction: CellAction? = null,
    assignments: List<CellAssignmentResponse> = emptyList(),
    testPdfFileId: String? = null
): CellResponse {
    val now = java.time.LocalDateTime.now()
    val disabled = status == "disabled"
    val overdue = !disabled && dueAt != null && dueAt!!.isBefore(now) &&
        status !in setOf("completed", "submitted", "reviewed")
    return CellResponse(
        cellId = id, scopeId = scopeId, assetId = assetId, userId = userId,
        status = status, score = score, submissionCount = submissionCount,
        adminNote = adminNote, reviewedAt = reviewedAt?.toString(),
        assetType = asset?.assetType, assetKind = asset?.assetKind, refId = asset?.refId,
        cellRefId = cellRefId,
        dueAt = dueAt?.toString(),
        // V0148 / N-3 — cell.assignedAt 우선 사용. NULL 이면 기존 updatedAt fallback (백필 없는 잔재 호환).
        assignedAt = assignedAt?.toString() ?: if (status != "unassigned") updatedAt.toString() else null,
        assignedLabel = assignedLabel,
        isOverdue = overdue,
        isDisabled = disabled,
        disabledAt = disabledAt?.toString(),
        cellAction = cellAction,
        assignments = assignments,
        testPdfFileId = testPdfFileId,
        answerPdfFileId = testPdfFileId
    )
}

internal fun StudyPlanCellAssignmentEntity.toResponse(): CellAssignmentResponse {
    return CellAssignmentResponse(
        id = id, cellId = cellId, refId = refId,
        assignedLabel = assignedLabel, status = status, score = score,
        dueAt = dueAt?.toString(), completedAt = completedAt?.toString(),
        sortOrder = sortOrder
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

// ── Phase B: 기본 plan 자동 생성 backfill 응답 ──
data class BackfillDefaultPlanResponse(
    val created: Int,
    val alreadyHas: Int
)

// ── Phase C: 행/열·셀 일괄 적용 (Rev.2 2026-05-20 — appendOrMergeCells) ──
//
// 정책 (사용자 확정):
//  - 라벨이 다르면 새 scope/asset 추가, 같으면 기존 재사용 + 셀 병합
//  - sourceScopes + sourceAssets 둘 다 지정 시 그 교차 셀의 학습 내용까지 복제
//  - 마감일 그대로, 결과·산출물 제외 (보고서 8.6/8.7/8.8)
//
// conflictPolicy 필드는 더 이상 사용하지 않음. 들어와도 무시됨.
data class PropagateDeltaRequest(
    val targetScope: String,                  // "org" | "class" | "users"
    val classId: String? = null,
    val userIds: List<String>? = null,
    val scopeIds: List<String>? = null,       // 복제할 scope id 들 (planId 기준)
    val assetIds: List<String>? = null,       // 복제할 asset id 들 (planId 기준)
    @Deprecated("Rev.2 정책 변경으로 무시됨 — 호환 위해 남김")
    val conflictPolicy: String? = null
)

data class PropagateConflict(
    val userId: String,
    val userName: String?,
    val kind: String,    // "scope" | "asset"
    val label: String
)

data class PropagateUserResult(
    val userId: String,
    val applied: Boolean
)

data class PropagateDeltaResponse(
    val conflicts: List<PropagateConflict> = emptyList(),
    val appliedCount: Int = 0,
    val skippedCount: Int = 0,
    val overwrittenCount: Int = 0,
    val results: List<PropagateUserResult> = emptyList(),
    // Rev.2 P-4C — 디버깅 카운터 (사용자가 "0건" 의 원인을 알 수 있도록)
    /** 대상 학생 수 (source 학생 제외 후) */
    val eligibleUsers: Int = 0,
    /** 그 중 plan 보유 학생 수 (자동 plan 생성 포함) */
    val usersWithPlan: Int = 0,
    /** plan 자동 생성도 실패해 skip 된 학생 수 */
    val skippedNoPlan: Int = 0
)

// ── Phase D: 통합 리스트 4 API ──

// 1) 제출물 통합
data class AdminSubmissionListResponse(
    val items: List<AdminSubmissionItem>,
    val total: Int,
    val page: Int,
    val limit: Int,
    val hasMore: Boolean
)

data class AdminSubmissionItem(
    val cellId: String,
    val planId: String,
    val planTitle: String,
    val scopeId: String,
    val scopeLabel: String,
    val assetId: String,
    val assetLabel: String,
    val assetType: String,
    val userId: String,
    val userName: String,
    val classId: String?,
    val className: String?,
    val status: String,
    val submissionCount: Int,
    val score: Int?,
    val reviewedBy: String?,
    val reviewedAt: String?,
    val updatedAt: String,
    val adminNote: String?
)

// 2) 글쓰기 통합
data class AdminIntegratedWisdomResponse(
    val items: List<AdminIntegratedWisdomItem>,
    val total: Int,
    val page: Int,
    val limit: Int,
    val hasMore: Boolean
)

data class AdminIntegratedWisdomItem(
    val postId: String,
    val levelId: String,
    val topicKey: String,
    val topicLabel: String,
    val userId: String,
    val userName: String,
    val classId: String?,
    val className: String?,
    val submissionType: String,
    val status: String,
    val planCellId: String?,
    val planTitle: String?,
    val hasFeedback: Boolean,
    val feedbackBy: String?,
    val feedbackAt: String?,
    val createdAt: String
)

// 3) 테스트 통합
data class AdminTestAssetListResponse(
    val items: List<AdminTestAssetItem>,
    val total: Int,
    val page: Int,
    val limit: Int,
    val hasMore: Boolean
)

data class AdminTestAssetItem(
    val assetId: String,
    val planId: String,
    val planTitle: String,
    val testTitle: String?,
    val testId: String?,
    val dueAt: String?,
    val totalAssigned: Int,
    val completed: Int,
    val pending: Int,
    val avgScore: Double?
)

data class AdminTestAssetStudentListResponse(
    val students: List<AdminTestAssetStudent>
)

data class AdminTestAssetStudent(
    val userId: String,
    val userName: String?,
    val className: String?,
    val status: String,
    val score: Int?,
    val attemptedAt: String?
)

// 4) 캘린더 통합
data class AdminCalendarResponse(
    val days: List<AdminCalendarDay>
)

data class AdminCalendarDay(
    val date: String,
    val count: Int,
    val items: List<AdminCalendarItem>
)

data class AdminCalendarItem(
    val type: String,        // "schedule" | "asset"
    val refId: String,
    val label: String,
    val totalAssigned: Int,
    val pending: Int,
    val completed: Int,
    /** 자산 종류 (korfarm/test/writing/activity) — 자산 단위 그룹일 때만 채워짐 */
    val assetType: String? = null
)

data class AdminCalendarDateDetailResponse(
    val actions: List<AdminCalendarAction>
)

data class AdminCalendarAction(
    val assetId: String,
    val label: String,
    val assetType: String,
    val dueAt: String?,
    val totalAssigned: Int,
    val students: List<AdminCalendarActionStudent>
)

data class AdminCalendarActionStudent(
    val userId: String,
    val userName: String?,
    val className: String?,
    val status: String,
    val isOverdue: Boolean = false,
    val cellId: String,
    val cellRefId: String? = null,
    val score: Int? = null,
    val submissionCount: Int = 0
)

// ── 통합 분석표 추천 학습 일괄 등록 ──

data class BulkFromRecommendationsRequest(
    /** 대상 학생 ID. 생략 시 호출자 본인. 학부모/관리자만 다른 학생 명시 가능. */
    val studentId: String? = null,
    /** 추천 콘텐츠 ID 리스트. 모두 활성 학습 콘텐츠여야 함. */
    val contentIds: List<String>,
    /** 마감일 — "yyyy-MM-dd" 또는 ISO LocalDateTime. 생략 시 등록일 + 7일 23:59 */
    val dueAt: String? = null
)

data class BulkFromRecommendationsResponse(
    val planId: String,
    val cellId: String,
    val dueAt: String,
    /** 새로 추가된 assignment 수 */
    val createdAssignments: Int,
    /** 이미 등록되어 있어 건너뛴 콘텐츠 수 */
    val skippedAssignments: Int,
    /** plan 이 새로 자동 생성되었는지 */
    val planCreated: Boolean
)
