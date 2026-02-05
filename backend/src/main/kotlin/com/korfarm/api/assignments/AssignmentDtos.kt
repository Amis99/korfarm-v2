package com.korfarm.api.assignments

import java.time.LocalDateTime

data class AssignmentSummary(
    val assignmentId: String,
    val title: String,
    val assignmentType: String,
    val dueAt: String?,
    val status: String
)

data class AssignmentDetail(
    val assignmentId: String,
    val title: String,
    val assignmentType: String,
    val dueAt: String?,
    val status: String,
    val payload: Map<String, Any>
)

data class AssignmentProgress(
    val completed: Boolean,
    val progressRate: Double
)

data class AssignmentSubmitResponse(
    val submissionId: String,
    val seedGrant: SeedGrant?
)

data class SeedGrant(
    val seedType: String,
    val count: Int
)

internal fun AssignmentEntity.toSummary(): AssignmentSummary {
    return AssignmentSummary(
        assignmentId = id,
        title = title,
        assignmentType = assignmentType,
        dueAt = dueAt?.toString(),
        status = status
    )
}

internal fun AssignmentEntity.toDetail(payload: Map<String, Any>): AssignmentDetail {
    return AssignmentDetail(
        assignmentId = id,
        title = title,
        assignmentType = assignmentType,
        dueAt = dueAt?.toString(),
        status = status,
        payload = payload
    )
}
