package com.korfarm.api.chat

import com.korfarm.api.security.JwtService
import org.springframework.context.annotation.Configuration
import org.springframework.web.socket.config.annotation.EnableWebSocket
import org.springframework.web.socket.config.annotation.WebSocketConfigurer
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry

@Configuration
@EnableWebSocket
class ChatWebSocketConfig(
    private val handler: ChatWebSocketHandler,
    private val jwtService: JwtService
) : WebSocketConfigurer {
    override fun registerWebSocketHandlers(registry: WebSocketHandlerRegistry) {
        registry.addHandler(handler, "/v1/community/ws")
            .addInterceptors(ChatWebSocketAuthInterceptor(jwtService))
            .setAllowedOrigins(
                "http://localhost:5173",
                "http://localhost:8080",
                "https://gf2.hak1ad.kr",
                "https://googerfarm.com",
                "https://www.googerfarm.com"
            )
    }
}
