package com.korfarm.api.user

import jakarta.validation.constraints.NotBlank
import java.time.LocalDateTime

data class ParentLinkRequest(
    val parentUserId: String? = null,
    val parentLoginId: String? = null,
    val studentUserId: String? = null,
    val studentLoginId: String? = null
)

/** 학부모 셀프 자녀 연결 요청 */
data class SelfLinkRequest(
    @field:NotBlank
    val studentLoginId: String,
    @field:NotBlank
    val studentName: String,
)

data class ParentLinkView(
    val linkId: String,
    val parentUserId: String,
    val parentLoginId: String,
    val studentUserId: String,
    val studentLoginId: String,
    val studentName: String?,
    val status: String,
    val requestedAt: LocalDateTime? = null,
    val approvedAt: LocalDateTime? = null,
    val approvedBy: String? = null,
    val createdAt: LocalDateTime
)
