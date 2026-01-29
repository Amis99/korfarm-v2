package com.korfarm.api.security

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.filter.OncePerRequestFilter

class JwtAuthenticationFilter(
    private val jwtService: JwtService
) : OncePerRequestFilter() {
    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val authHeader = request.getHeader("Authorization")
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            val token = authHeader.removePrefix("Bearer ").trim()
            try {
                val payload = jwtService.verify(token)
                val authorities = payload.roles.map { SimpleGrantedAuthority("ROLE_$it") }
                val principal = UserPrincipal(payload.userId, payload.roles)
                val authentication = UsernamePasswordAuthenticationToken(principal, null, authorities)
                SecurityContextHolder.getContext().authentication = authentication
            } catch (_: Exception) {
                SecurityContextHolder.clearContext()
            }
        }
        filterChain.doFilter(request, response)
    }
}
