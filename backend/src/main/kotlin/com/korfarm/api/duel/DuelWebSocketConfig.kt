package com.korfarm.api.duel

import com.korfarm.api.security.JwtService
import org.springframework.context.annotation.Configuration
import org.springframework.web.socket.config.annotation.EnableWebSocket
import org.springframework.web.socket.config.annotation.WebSocketConfigurer
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry

@Configuration
@EnableWebSocket
class DuelWebSocketConfig(
    private val handler: DuelWebSocketHandler,
    private val jwtService: JwtService
) : WebSocketConfigurer {
    override fun registerWebSocketHandlers(registry: WebSocketHandlerRegistry) {
        registry.addHandler(handler, "/v1/duel/ws")
            .addInterceptors(DuelWebSocketAuthInterceptor(jwtService))
            .setAllowedOrigins("*")
    }
}
