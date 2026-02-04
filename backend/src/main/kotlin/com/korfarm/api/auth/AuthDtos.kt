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
    val profileImageUrl: String? = null
)

data class AuthResponseData(
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: Long,
    val user: UserProfile
)
