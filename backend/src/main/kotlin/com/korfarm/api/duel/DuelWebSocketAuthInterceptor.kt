package com.korfarm.api.duel

import com.korfarm.api.security.JwtService
import org.springframework.http.HttpHeaders
import org.springframework.http.server.ServerHttpRequest
import org.springframework.http.server.ServerHttpResponse
import org.springframework.web.socket.WebSocketHandler
import org.springframework.web.socket.server.HandshakeInterceptor
import java.net.URI

class DuelWebSocketAuthInterceptor(
    private val jwtService: JwtService
) : HandshakeInterceptor {
    override fun beforeHandshake(
        request: ServerHttpRequest,
        response: ServerHttpResponse,
        wsHandler: WebSocketHandler,
        attributes: MutableMap<String, Any>
    ): Boolean {
        val token = extractToken(request.headers, request.uri) ?: return false
        return try {
            val payload = jwtService.verify(token)
            attributes["userId"] = payload.userId
            attributes["roles"] = payload.roles
            true
        } catch (ex: Exception) {
            false
        }
    }

    override fun afterHandshake(
        request: ServerHttpRequest,
        response: ServerHttpResponse,
        wsHandler: WebSocketHandler,
        exception: Exception?
    ) {
        // no-op
    }

    private fun extractToken(headers: HttpHeaders, uri: URI): String? {
        val auth = headers.getFirst(HttpHeaders.AUTHORIZATION)
        if (!auth.isNullOrBlank() && auth.startsWith("Bearer ")) {
            return auth.removePrefix("Bearer ").trim()
        }
        val query = uri.query ?: return null
        val parts = query.split("&")
        val tokenPart = parts.firstOrNull { it.startsWith("token=") } ?: return null
        return tokenPart.removePrefix("token=").trim()
    }
}
