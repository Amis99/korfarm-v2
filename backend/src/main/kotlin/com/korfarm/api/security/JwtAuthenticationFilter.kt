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
        val token = extractToken(request)
        if (token != null) {
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

    private fun extractToken(request: HttpServletRequest): String? {
        // 1차: Authorization 헤더 (표준 경로)
        val authHeader = request.getHeader("Authorization")
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.removePrefix("Bearer ").trim()
        }
        // 2차: query parameter `token` — Authorization 헤더를 부착할 수 없는 경로에만 허용.
        //   허용: WebSocket(브라우저 API 가 헤더 부착 X) + 파일 다운로드(window.open / <a target=_blank> 가 헤더 부착 X)
        //   다른 임의 endpoint 에 query token 으로 인증 우회·referer 누설 방지.
        val path = request.requestURI ?: ""
        val queryAllowed = path.endsWith("/ws") ||
            (path.startsWith("/v1/files/") && path.endsWith("/download"))
        if (queryAllowed) {
            val queryToken = request.getParameter("token")
            if (!queryToken.isNullOrBlank()) {
                return queryToken.trim()
            }
        }
        return null
    }
}
