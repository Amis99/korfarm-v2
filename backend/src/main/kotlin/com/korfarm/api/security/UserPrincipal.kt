package com.korfarm.api.security

data class UserPrincipal(
    val userId: String,
    val roles: List<String>
)
