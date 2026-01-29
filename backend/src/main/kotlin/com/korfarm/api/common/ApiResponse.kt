package com.korfarm.api.common

data class ApiError(
    val code: String? = null,
    val message: String? = null
)

data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val error: ApiError? = null,
    val requestId: String? = null
)
