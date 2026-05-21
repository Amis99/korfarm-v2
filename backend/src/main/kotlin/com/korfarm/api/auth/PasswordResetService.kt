package com.korfarm.api.auth

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.user.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.mail.javamail.MimeMessageHelper
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.security.MessageDigest
import java.security.SecureRandom
import java.time.LocalDateTime
import java.util.Base64

/**
 * N-34 (2026-05-22) — 이메일 토큰 기반 비밀번호 재설정.
 *
 * 흐름:
 *  1. POST /v1/auth/request-password-reset { loginId }
 *     → 유저 존재 여부 무관하게 응답 동일 (계정 열거 방지).
 *     → 유저가 존재하면 토큰 생성 + 이메일 발송. 미존재 시 silent skip.
 *  2. 사용자가 이메일 링크 클릭 → /reset/{rawToken} 페이지
 *  3. POST /v1/auth/reset-password { token, newPassword }
 *     → tokenHash 매치 + 만료 검사 + 사용 후 즉시 markUsed.
 *     → newPassword 갱신 + 그 사용자의 모든 refresh token revoke.
 */
@Service
class PasswordResetService(
    private val tokenRepo: PasswordResetTokenRepository,
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
    private val authService: AuthService,
    private val mailSender: JavaMailSender?,
    @Value("\${spring.mail.host:}") private val mailHost: String,
    @Value("\${app-mail.from:no-reply@googerfarm.com}") private val mailFrom: String,
    @Value("\${app-mail.from-name:국어농장}") private val mailFromName: String,
    @Value("\${app-mail.reset-link-base:https://googerfarm.com/reset}") private val resetLinkBase: String,
) {
    private val log = LoggerFactory.getLogger(PasswordResetService::class.java)
    private val random = SecureRandom()

    companion object {
        const val TOKEN_TTL_MINUTES = 30L
        const val TOKEN_BYTE_SIZE = 32 // base64url ~ 43 chars
    }

    /**
     * 토큰 발급. 유저 미존재여도 외부 응답은 동일 (계정 열거 방지).
     * 같은 유저의 미사용 토큰은 새 요청 시 만료 처리.
     */
    @Transactional
    fun requestReset(loginId: String, requestIp: String?) {
        val user = userRepository.findByEmail(loginId.trim())
        if (user == null || user.deletedAt != null) {
            log.info("password-reset: 미존재 또는 삭제된 계정 요청 — loginId 마스크 처리")
            return
        }
        // 기존 미사용 토큰 모두 만료
        val now = LocalDateTime.now()
        tokenRepo.findByUserIdAndUsedAtIsNull(user.id).forEach { it.usedAt = now }

        val rawToken = generateRawToken()
        val tokenHash = sha256(rawToken)
        val token = PasswordResetTokenEntity(
            id = IdGenerator.newId("prt"),
            userId = user.id,
            tokenHash = tokenHash,
            expiresAt = now.plusMinutes(TOKEN_TTL_MINUTES),
            requestIp = requestIp,
        )
        tokenRepo.save(token)

        // 이메일 발송 — 호스트 미설정이거나 mailSender null 이면 로그만 (개발/스테이징 fallback)
        val link = "$resetLinkBase/$rawToken"
        if (mailHost.isBlank() || mailSender == null) {
            log.info("password-reset: MAIL_HOST 미설정 — 발송 skip. 토큰 링크는 로그로만 (userId={}, link={}).", user.id, link)
            return
        }
        try {
            sendResetEmail(toEmail = user.email, userName = user.name ?: user.email, link = link)
        } catch (e: Exception) {
            log.warn("password-reset: 이메일 발송 실패 (userId={}, err={})", user.id, e.message)
            // 토큰은 남겨두고 외부 응답은 동일. 사용자가 어드민 문의로 우회 가능.
        }
    }

    /**
     * 토큰으로 비번 재설정. 1회 사용·30분 만료.
     * 성공 시 그 사용자의 모든 refresh token revoke (다른 디바이스 강제 로그아웃).
     */
    @Transactional
    fun resetPasswordWithToken(rawToken: String, newPassword: String) {
        if (newPassword.length < 8) {
            throw ApiException("BAD_REQUEST", "새 비밀번호는 8자 이상이어야 합니다.", HttpStatus.BAD_REQUEST)
        }
        if (rawToken.isBlank()) {
            throw ApiException("INVALID_TOKEN", "토큰이 유효하지 않습니다.", HttpStatus.BAD_REQUEST)
        }
        val token = tokenRepo.findByTokenHash(sha256(rawToken))
            ?: throw ApiException("INVALID_TOKEN", "토큰이 유효하지 않거나 만료되었습니다.", HttpStatus.BAD_REQUEST)
        if (token.usedAt != null) {
            throw ApiException("TOKEN_USED", "이미 사용된 토큰입니다.", HttpStatus.BAD_REQUEST)
        }
        val now = LocalDateTime.now()
        if (token.expiresAt.isBefore(now)) {
            throw ApiException("TOKEN_EXPIRED", "토큰이 만료되었습니다. 다시 요청해 주세요.", HttpStatus.BAD_REQUEST)
        }
        val user = userRepository.findById(token.userId).orElseThrow {
            ApiException("NOT_FOUND", "사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND)
        }
        if (passwordEncoder.matches(newPassword, user.passwordHash)) {
            throw ApiException("SAME_PASSWORD", "기존 비밀번호와 다른 값을 입력해 주세요.", HttpStatus.BAD_REQUEST)
        }
        user.passwordHash = passwordEncoder.encode(newPassword)
        userRepository.save(user)
        token.usedAt = now
        tokenRepo.save(token)
        authService.revokeAllRefreshTokens(user.id)
    }

    private fun generateRawToken(): String {
        val bytes = ByteArray(TOKEN_BYTE_SIZE)
        random.nextBytes(bytes)
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
    }

    private fun sha256(input: String): String {
        val md = MessageDigest.getInstance("SHA-256")
        val digest = md.digest(input.toByteArray(Charsets.UTF_8))
        return digest.joinToString("") { "%02x".format(it) }
    }

    private fun sendResetEmail(toEmail: String, userName: String, link: String) {
        val mime = mailSender!!.createMimeMessage()
        val helper = MimeMessageHelper(mime, false, "UTF-8")
        helper.setFrom("$mailFromName <$mailFrom>")
        helper.setTo(toEmail)
        helper.setSubject("[국어농장] 비밀번호 재설정 안내")
        val body = """
            <p>${userName} 님 안녕하세요.</p>
            <p>국어농장 비밀번호 재설정 링크입니다.</p>
            <p><a href="$link" target="_blank" rel="noopener">$link</a></p>
            <p>이 링크는 ${TOKEN_TTL_MINUTES}분 후 만료되며, 한 번 사용하면 다시 사용할 수 없습니다.</p>
            <p>본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다.</p>
        """.trimIndent()
        helper.setText(body, true)
        mailSender.send(mime)
    }
}
