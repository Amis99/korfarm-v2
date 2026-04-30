package com.korfarm.api.security

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import java.time.Instant
import java.util.Date

data class JwtPayload(
    val userId: String,
    val roles: List<String>
)

class JwtService(private val props: JwtProperties) {
    private val algorithm = Algorithm.HMAC256(props.secret)

    fun createAccessToken(userId: String, roles: List<String>): String {
        val now = Instant.now()
        // 관리자(HQ_ADMIN/ORG_ADMIN) 는 길게, 학생/학부모는 짧게.
        val isAdmin = roles.any { it == "HQ_ADMIN" || it == "ORG_ADMIN" }
        val ttl = if (isAdmin) props.accessTokenSeconds else props.studentAccessTokenSeconds
        val exp = now.plusSeconds(ttl)
        return JWT.create()
            .withIssuer(props.issuer)
            .withSubject(userId)
            .withClaim("roles", roles)
            .withIssuedAt(Date.from(now))
            .withExpiresAt(Date.from(exp))
            .sign(algorithm)
    }

    fun createRefreshToken(userId: String): String {
        val now = Instant.now()
        val exp = now.plusSeconds(props.refreshTokenSeconds)
        return JWT.create()
            .withIssuer(props.issuer)
            .withSubject(userId)
            .withIssuedAt(Date.from(now))
            .withExpiresAt(Date.from(exp))
            .sign(algorithm)
    }

    fun verify(token: String): JwtPayload {
        val verifier = JWT.require(algorithm).withIssuer(props.issuer).build()
        val decoded = verifier.verify(token)
        val roles = decoded.getClaim("roles").asList(String::class.java) ?: emptyList()
        return JwtPayload(decoded.subject, roles)
    }
}
