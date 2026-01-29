package com.korfarm.api.user

import jakarta.validation.constraints.NotBlank
import java.time.LocalDateTime

data class ParentLinkRequest(
    val parentUserId: String? = null,
    val parentLoginId: String? = null,
    val studentUserId: String? = null,
    val studentLoginId: String? = null
)

data class ParentLinkRequestCodeRequest(
    val studentUserId: String? = null,
    val studentLoginId: String? = null
)

data class ParentLinkConfirmRequest(
    val parentUserId: String? = null,
    val parentLoginId: String? = null,
    @field:NotBlank val requestCode: String
)

data class ParentLinkView(
    val linkId: String,
    val parentUserId: String,
    val parentLoginId: String,
    val studentUserId: String,
    val studentLoginId: String,
    val studentName: String?,
    val status: String,
    val requestCode: String? = null,
    val requestedAt: LocalDateTime? = null,
    val approvedAt: LocalDateTime? = null,
    val approvedBy: String? = null,
    val createdAt: LocalDateTime
)
