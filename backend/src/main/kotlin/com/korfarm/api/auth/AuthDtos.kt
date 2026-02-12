package com.korfarm.api.auth

data class UserProfile(
    val id: String,
    val loginId: String,
    val name: String?,
    val roles: List<String>,
    val status: String,
    val levelId: String? = null,
    val gradeLabel: String? = null,
    val learningStartDate: String? = null,
    val region: String? = null,
    val school: String? = null,
    val studentPhone: String? = null,
    val parentPhone: String? = null,
    val shippingName: String? = null,
    val shippingPhone: String? = null,
    val shippingZipCode: String? = null,
    val shippingAddress: String? = null,
    val shippingAddressDetail: String? = null,
    val profileImageUrl: String? = null,
    val pendingApproval: Boolean = false,
    val orgId: String? = null
)

data class AuthResponseData(
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: Long,
    val user: UserProfile
)
