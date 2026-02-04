package com.korfarm.api.auth

import com.korfarm.api.contracts.UpdateProfileRequest
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.common.TokenHasher
import com.korfarm.api.org.OrgRepository
import com.korfarm.api.org.OrgMembershipEntity
import com.korfarm.api.security.JwtProperties
import com.korfarm.api.security.JwtService
import com.korfarm.api.user.RefreshTokenEntity
import com.korfarm.api.user.RefreshTokenRepository
import com.korfarm.api.user.UserEntity
import com.korfarm.api.user.UserRepository
import com.korfarm.api.org.OrgMembershipRepository
import com.korfarm.api.user.ParentStudentLinkRepository
import org.springframework.http.HttpStatus
import org.springframework.dao.DataAccessException
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.slf4j.LoggerFactory
import java.time.LocalDate
import java.time.LocalDateTime

@Service
class AuthService(
    private val userRepository: UserRepository,
    private val refreshTokenRepository: RefreshTokenRepository,
    private val passwordEncoder: PasswordEncoder,
    private val jwtService: JwtService,
    private val jwtProperties: JwtProperties,
    private val orgMembershipRepository: OrgMembershipRepository,
    private val orgRepository: OrgRepository,
    private val parentStudentLinkRepository: ParentStudentLinkRepository
) {
    private val logger = LoggerFactory.getLogger(AuthService::class.java)

    fun signup(
        loginId: String,
        password: String,
        name: String,
        orgId: String,
        region: String,
        school: String,
        gradeLabel: String,
        levelId: String,
        studentPhone: String,
        parentPhone: String,
        diagnosticOptIn: Boolean,
        accountType: String?,
        learningStartMode: String?
    ): AuthResponseData {
        if (userRepository.existsByEmail(loginId)) {
            throw ApiException("LOGIN_ID_EXISTS", "login id already registered", HttpStatus.CONFLICT)
        }
        val normalizedAccountType = accountType?.lowercase() ?: "student"
        if (normalizedAccountType != "student" && normalizedAccountType != "parent") {
            throw ApiException("INVALID_ACCOUNT_TYPE", "invalid account type", HttpStatus.BAD_REQUEST)
        }
        val org = orgRepository.findById(orgId).orElseThrow {
            ApiException("ORG_NOT_FOUND", "org not found", HttpStatus.NOT_FOUND)
        }
        if (org.status != "active") {
            throw ApiException("ORG_INACTIVE", "org inactive", HttpStatus.BAD_REQUEST)
        }
        val user = UserEntity(
            id = IdGenerator.newId("u"),
            email = loginId,
            passwordHash = passwordEncoder.encode(password),
            name = name,
            region = region,
            school = school,
            gradeLabel = gradeLabel,
            levelId = levelId,
            studentPhone = studentPhone,
            parentPhone = parentPhone,
            diagnosticOptIn = diagnosticOptIn,
            learningStartDate = if (learningStartMode == "day1") LocalDate.now() else null,
            status = "active"
        )
        userRepository.save(user)
        val existing = orgMembershipRepository.findByOrgIdAndUserId(org.id, user.id)
        if (existing == null) {
            val role = if (normalizedAccountType == "parent") "PARENT" else "STUDENT"
            orgMembershipRepository.save(
                OrgMembershipEntity(
                    id = IdGenerator.newId("om"),
                    orgId = org.id,
                    userId = user.id,
                    role = role,
                    status = "active"
                )
            )
        }
        return issueTokens(user)
    }

    fun login(loginId: String, password: String): AuthResponseData {
        val user = userRepository.findByEmail(loginId)
            ?: throw ApiException("INVALID_CREDENTIALS", "invalid credentials", HttpStatus.UNAUTHORIZED)
        if (!passwordEncoder.matches(password, user.passwordHash)) {
            throw ApiException("INVALID_CREDENTIALS", "invalid credentials", HttpStatus.UNAUTHORIZED)
        }
        val now = LocalDateTime.now()
        try {
            userRepository.updateLastLoginAt(user.id, now, now)
        } catch (ex: DataAccessException) {
            logger.warn("Failed to update last login for userId={}", user.id, ex)
        }
        return issueTokens(user)
    }

    fun updateProfile(userId: String, request: UpdateProfileRequest): UserProfile {
        val user = userRepository.findById(userId).orElseThrow {
            ApiException("NOT_FOUND", "user not found", HttpStatus.NOT_FOUND)
        }
        request.name?.let { user.name = it }
        request.region?.let { user.region = it }
        request.school?.let { user.school = it }
        request.gradeLabel?.let { user.gradeLabel = it }
        request.levelId?.let { user.levelId = it }
        request.studentPhone?.let { user.studentPhone = it }
        request.parentPhone?.let { user.parentPhone = it }
        request.profileImageUrl?.let { user.profileImageUrl = it }
        request.password?.let {
            if (it.length >= 8) user.passwordHash = passwordEncoder.encode(it)
        }
        request.learningStartMode?.let {
            user.learningStartDate = if (it == "day1") LocalDate.now() else null
        }
        userRepository.save(user)
        val roles = resolveRoles(user.id)
        return UserProfile(
            id = user.id,
            loginId = user.email,
            name = user.name,
            roles = roles,
            status = user.status,
            levelId = user.levelId,
            gradeLabel = user.gradeLabel,
            learningStartDate = user.learningStartDate?.toString(),
            region = user.region,
            school = user.school,
            studentPhone = user.studentPhone,
            parentPhone = user.parentPhone,
            profileImageUrl = user.profileImageUrl
        )
    }

    fun logout(userId: String) {
        val tokens = refreshTokenRepository.findByUserIdAndRevokedAtIsNull(userId)
        val now = LocalDateTime.now()
        tokens.forEach { it.revokedAt = now }
        refreshTokenRepository.saveAll(tokens)
    }

    private fun issueTokens(user: UserEntity): AuthResponseData {
        val roles = resolveRoles(user.id)
        val accessToken = jwtService.createAccessToken(user.id, roles)
        val refreshToken = jwtService.createRefreshToken(user.id)
        val refreshEntity = RefreshTokenEntity(
            id = IdGenerator.newId("rt"),
            userId = user.id,
            tokenHash = TokenHasher.sha256(refreshToken),
            expiresAt = LocalDateTime.now().plusSeconds(jwtProperties.refreshTokenSeconds)
        )
        refreshTokenRepository.save(refreshEntity)
        return AuthResponseData(
            accessToken = accessToken,
            refreshToken = refreshToken,
            expiresIn = jwtProperties.accessTokenSeconds,
            user = UserProfile(
                id = user.id,
                loginId = user.email,
                name = user.name,
                roles = roles,
                status = user.status,
                levelId = user.levelId,
                gradeLabel = user.gradeLabel,
                learningStartDate = user.learningStartDate?.toString(),
                region = user.region,
                school = user.school,
                studentPhone = user.studentPhone,
                parentPhone = user.parentPhone,
                profileImageUrl = user.profileImageUrl
            )
        )
    }

    private fun resolveRoles(userId: String): List<String> {
        val memberships = orgMembershipRepository.findByUserIdAndStatus(userId, "active")
        val roles = memberships.map { it.role }.distinct().toMutableSet()
        try {
            if (parentStudentLinkRepository.existsByParentUserIdAndStatus(userId, "active")) {
                roles.add("PARENT")
            }
        } catch (ex: DataAccessException) {
            logger.warn("Failed to resolve parent role for userId={}", userId, ex)
        }
        if (roles.isEmpty()) {
            roles.add("STUDENT")
        }
        return roles.toList()
    }
}
