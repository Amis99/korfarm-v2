package com.korfarm.api.security

import com.korfarm.api.common.ApiException
import org.springframework.http.HttpStatus

object AdminGuard {
    fun requireAnyRole(vararg roles: String) {
        if (!SecurityUtils.hasAnyRole(*roles)) {
            throw ApiException("FORBIDDEN", "forbidden", HttpStatus.FORBIDDEN)
        }
    }
}
