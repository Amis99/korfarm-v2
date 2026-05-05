package com.korfarm.api.security

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.springframework.http.HttpMethod
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource

@Configuration
class SecurityConfig(
    private val jwtProperties: JwtProperties,
    private val orgBillingSuspensionFilter: com.korfarm.api.billing.OrgBillingSuspensionFilter,
) {
    @Bean
    fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()

    @Bean
    fun jwtService(): JwtService = JwtService(jwtProperties)

    @Bean
    fun authenticationManager(config: AuthenticationConfiguration): AuthenticationManager {
        return config.authenticationManager
    }

    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val config = CorsConfiguration()
        config.allowedOriginPatterns = listOf(
            "http://localhost:*",
            "http://127.0.0.1:*",
            "https://gf2.hak1ad.kr"
        )
        config.allowedMethods = listOf("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
        config.allowedHeaders = listOf("*")
        config.allowCredentials = false
        config.maxAge = 3600
        val source = UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration("/**", config)
        return source
    }

    @Bean
    fun filterChain(http: HttpSecurity, jwtService: JwtService): SecurityFilterChain {
        http.csrf { it.disable() }
        http.cors { it.configurationSource(corsConfigurationSource()) }
        http.sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
        http.authorizeHttpRequests {
            it.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
            it.requestMatchers("/v1/health", "/v1/auth/**", "/v1/learning/catalog/**", "/v1/learning/content/**", "/v1/public/**", "/v1/files/*/download").permitAll()
            it.anyRequest().authenticated()
        }
        http.addFilterBefore(JwtAuthenticationFilter(jwtService), UsernamePasswordAuthenticationFilter::class.java)
        // ORG_ADMIN 미결제 정지 필터 — JWT 인증 후, 컨트롤러 진입 전
        http.addFilterAfter(orgBillingSuspensionFilter, JwtAuthenticationFilter::class.java)
        return http.build()
    }
}
