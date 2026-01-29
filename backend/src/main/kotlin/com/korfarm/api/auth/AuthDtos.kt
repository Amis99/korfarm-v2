package com.korfarm.api.auth

data class UserProfile(
    val id: String,
    val loginId: String,
    val name: String?,
    val roles: List<String>,
    val status: String
)

data class AuthResponseData(
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: Long,
    val user: UserProfile
)
