package com.korfarm.api.contracts

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size

data class LoginRequest(
    @field:NotBlank val loginId: String,
    @field:NotBlank val password: String
)

data class SignupRequest(
    @field:NotBlank val loginId: String,
    @field:NotBlank @field:Size(min = 8) val password: String,
    @field:NotBlank val name: String,
    @field:NotBlank val orgId: String,
    @field:NotBlank val region: String,
    @field:NotBlank val school: String,
    @field:NotBlank val gradeLabel: String,
    @field:NotBlank val levelId: String,
    @field:NotBlank val studentPhone: String,
    @field:NotBlank val parentPhone: String,
    val diagnosticOptIn: Boolean = false,
    val accountType: String? = "student",
    val learningStartMode: String? = "calendar"
)

data class UpdateProfileRequest(
    val name: String? = null,
    val region: String? = null,
    val school: String? = null,
    val gradeLabel: String? = null,
    val levelId: String? = null,
    val studentPhone: String? = null,
    val parentPhone: String? = null,
    val profileImageUrl: String? = null,
    val password: String? = null,
    val learningStartMode: String? = null
)

data class SubmitAnswer(
    @field:NotBlank val questionId: String,
    @field:NotBlank val answer: String
)

data class SubmitRequest(
    @field:NotNull val answers: List<SubmitAnswer>,
    val contentLevelId: String? = null,
    val contentId: String? = null
)

data class HarvestCraftRequest(
    @field:NotBlank val seedType: String,
    val useFertilizer: Boolean = false
)

data class DuelRoomCreateRequest(
    @field:NotBlank val levelId: String,
    @field:Min(2) val roomSize: Int,
    @field:Min(1) val stakeAmount: Int,
    val stakeCropType: String? = null
)

data class AssignmentSubmitRequest(
    @field:NotNull val content: Map<String, Any>
)

data class CreatePostRequest(
    @field:NotBlank val title: String,
    @field:NotBlank val content: String,
    val attachmentIds: List<String> = emptyList()
)

data class UpdatePostRequest(
    val title: String? = null,
    val content: String? = null,
    val attachmentIds: List<String> = emptyList()
)

data class CreateCommentRequest(
    @field:NotBlank val content: String
)

data class ReportRequest(
    @field:NotBlank val targetType: String,
    @field:NotBlank val targetId: String,
    @field:NotBlank val reason: String
)

data class PresignRequest(
    @field:NotBlank val purpose: String,
    @field:NotBlank val filename: String,
    @field:NotBlank val mime: String,
    @field:Min(1) val size: Long
)

data class WritingSubmitRequest(
    @field:NotBlank val content: String,
    val attachmentIds: List<String> = emptyList()
)

data class OrderItemRequest(
    @field:NotBlank val productId: String,
    @field:Min(1) val quantity: Int
)

data class OrderCreateRequest(
    @field:NotNull val items: List<OrderItemRequest>,
    @field:NotNull val address: Map<String, Any>
)

data class PaymentCheckoutRequest(
    @field:Min(1) val amount: Int,
    val orderId: String? = null,
    val subscription: Boolean? = null,
    @field:NotBlank val method: String
)

data class AdminOrgCreateRequest(
    @field:NotBlank val name: String,
    val plan: String? = null,
    val orgType: String? = null,
    val addressRegion: String? = null,
    val addressDetail: String? = null,
    val seatLimit: Int? = null,
    val status: String? = null
)

data class AdminOrgUpdateRequest(
    val name: String? = null,
    val plan: String? = null,
    val orgType: String? = null,
    val addressRegion: String? = null,
    val addressDetail: String? = null,
    val seatLimit: Int? = null,
    val status: String? = null
)

data class AdminOrgAdminCreateRequest(
    @field:NotBlank val loginId: String
)

data class AdminStudentCreateRequest(
    @field:Email @field:NotBlank val email: String,
    val name: String? = null,
    @field:NotBlank val orgId: String,
    val classIds: List<String> = emptyList()
)

data class AdminStudentUpdateRequest(
    val name: String? = null,
    val status: String? = null,
    val orgId: String? = null,
    val classIds: List<String> = emptyList(),
    val school: String? = null,
    val gradeLabel: String? = null,
    val levelId: String? = null,
    val studentPhone: String? = null,
    val parentPhone: String? = null,
    val region: String? = null
)

data class AdminSubscriptionRequest(
    val status: String,       // "active" or "free"
    val startAt: String? = null,
    val endAt: String? = null
)

data class AdminClassCreateRequest(
    @field:NotBlank val orgId: String,
    @field:NotBlank val name: String,
    val description: String? = null,
    val levelId: String? = null,
    val grade: String? = null,
    val status: String? = null,
    val startAt: String? = null
)

data class AdminClassUpdateRequest(
    val name: String? = null,
    val description: String? = null,
    val levelId: String? = null,
    val grade: String? = null,
    val status: String? = null,
    val startAt: String? = null
)

data class AdminClassStudentsRequest(
    @field:NotNull val userIds: List<String>
)

data class AdminContentImportRequest(
    @field:NotBlank val contentType: String,
    val levelId: String? = null,
    val chapterId: String? = null,
    @field:NotBlank val schemaVersion: String,
    @field:NotNull val content: Map<String, Any>
)

data class AdminAssignmentCreateRequest(
    @field:NotBlank val assignmentType: String,
    @field:NotBlank val title: String,
    @field:NotNull val payload: Map<String, Any>,
    val dueAt: String? = null,
    val targets: List<Map<String, Any>> = emptyList()
)

data class AdminAssignmentUpdateRequest(
    val title: String? = null,
    val payload: Map<String, Any>? = null,
    val dueAt: String? = null,
    val status: String? = null
)

data class AdminWritingFeedbackRequest(
    @field:NotNull val rubric: Map<String, Any>,
    val comment: String? = null
)

data class AdminTestCreateRequest(
    @field:NotBlank val orgId: String,
    @field:NotBlank val title: String,
    @field:NotBlank val pdfFileId: String
)

data class AdminTestAnswersRequest(
    @field:NotNull val answers: Map<String, Any>
)

data class AdminTestGradeRequest(
    @field:NotBlank val userId: String,
    @field:NotNull val answers: Map<String, Any>
)

data class AdminDuelSeasonRequest(
    @field:NotBlank val levelId: String,
    @field:NotBlank val name: String,
    @field:NotBlank val startAt: String,
    @field:NotBlank val endAt: String
)

data class AdminDuelSnapshotRequest(
    @field:NotBlank val seasonId: String,
    val levelId: String? = null
)

data class AdminFlagUpdateRequest(
    val enabled: Boolean? = null,
    val rolloutPercent: Int? = null,
    val description: String? = null
)

data class AdminProductRequest(
    @field:NotBlank val name: String,
    @field:Min(0) val price: Int,
    val stock: Int? = null,
    val status: String? = null
)

data class CreateWisdomPostRequest(
    @field:NotBlank val levelId: String,
    @field:NotBlank val topicKey: String,
    @field:NotBlank val topicLabel: String,
    @field:NotBlank val submissionType: String,
    val content: String? = null,
    val attachmentIds: List<String> = emptyList()
)

data class AdminWisdomFeedbackCreateRequest(
    @field:NotBlank val comment: String,
    val correction: String? = null
)

data class CreateWisdomCommentRequest(
    @field:NotBlank val content: String
)
