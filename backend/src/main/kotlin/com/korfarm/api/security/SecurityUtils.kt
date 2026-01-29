package com.korfarm.api.security

import org.springframework.security.core.context.SecurityContextHolder

object SecurityUtils {
    fun currentUserId(): String? {
        val auth = SecurityContextHolder.getContext().authentication ?: return null
        val principal = auth.principal as? UserPrincipal ?: return null
        return principal.userId
    }

    fun currentRoles(): List<String> {
        val auth = SecurityContextHolder.getContext().authentication ?: return emptyList()
        val principal = auth.principal as? UserPrincipal ?: return emptyList()
        return principal.roles
    }

    fun hasAnyRole(vararg roles: String): Boolean {
        val current = currentRoles().toSet()
        return roles.any { current.contains(it) }
    }
}
