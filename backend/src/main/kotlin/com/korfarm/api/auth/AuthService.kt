package com.korfarm.api.auth

import com.korfarm.api.contracts.UpdateProfileRequest
import com.korfarm.api.contracts.SignupRequest
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

    companion object {
        const val ORG_HQ_ID = "org_hq"
    }

    fun signup(request: SignupRequest): AuthResponseData {
        // 1. 중복 체크
        if (userRepository.existsByEmail(request.loginId)) {
            throw ApiException("LOGIN_ID_EXISTS", "이미 등록된 아이디입니다", HttpStatus.CONFLICT)
        }

        // 2. 계정 유형 검증
        val normalizedAccountType = request.accountType?.lowercase() ?: "student"
        if (normalizedAccountType !in listOf("student", "parent", "org_admin")) {
            throw ApiException("INVALID_ACCOUNT_TYPE", "잘못된 계정 유형입니다", HttpStatus.BAD_REQUEST)
        }

        // 3. 기관 검증
        val org = orgRepository.findById(request.orgId).orElseThrow {
            ApiException("ORG_NOT_FOUND", "기관을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        if (org.status != "active") {
            throw ApiException("ORG_INACTIVE", "비활성화된 기관입니다", HttpStatus.BAD_REQUEST)
        }

        // 4. 유형별 필수 필드 검증
        when (normalizedAccountType) {
            "student" -> {
                if (request.region.isNullOrBlank()) throw ApiException("VALIDATION_ERROR", "지역을 선택해 주세요", HttpStatus.BAD_REQUEST)
                if (request.school.isNullOrBlank()) throw ApiException("VALIDATION_ERROR", "학교를 입력해 주세요", HttpStatus.BAD_REQUEST)
                if (request.gradeLabel.isNullOrBlank()) throw ApiException("VALIDATION_ERROR", "학년을 선택해 주세요", HttpStatus.BAD_REQUEST)
                if (request.levelId.isNullOrBlank()) throw ApiException("VALIDATION_ERROR", "레벨을 선택해 주세요", HttpStatus.BAD_REQUEST)
                if (request.studentPhone.isNullOrBlank()) throw ApiException("VALIDATION_ERROR", "학생 전화번호를 입력해 주세요", HttpStatus.BAD_REQUEST)
                if (request.parentPhone.isNullOrBlank()) throw ApiException("VALIDATION_ERROR", "학부모 전화번호를 입력해 주세요", HttpStatus.BAD_REQUEST)
            }
            "parent" -> {
                if (request.linkedStudentName.isNullOrBlank()) throw ApiException("VALIDATION_ERROR", "연결할 학생 이름을 입력해 주세요", HttpStatus.BAD_REQUEST)
                if (request.linkedStudentPhone.isNullOrBlank()) throw ApiException("VALIDATION_ERROR", "학생 전화번호를 입력해 주세요", HttpStatus.BAD_REQUEST)
                if (request.linkedParentPhone.isNullOrBlank()) throw ApiException("VALIDATION_ERROR", "학부모 전화번호를 입력해 주세요", HttpStatus.BAD_REQUEST)
            }
            "org_admin" -> {
                // 기관 관리자는 기본 정보만 필요
            }
        }

        // 5. 학부모인 경우 학생 매칭 시도 (실패해도 가입 허용)
        var linkedStudentId: String? = null
        if (normalizedAccountType == "parent" && !request.linkedStudentName.isNullOrBlank() && !request.linkedStudentPhone.isNullOrBlank()) {
            val matchedStudent = if (!request.linkedParentPhone.isNullOrBlank()) {
                userRepository.findByNameAndStudentPhoneAndParentPhone(
                    request.linkedStudentName,
                    request.linkedStudentPhone,
                    request.linkedParentPhone
                )
            } else {
                userRepository.findByNameAndStudentPhone(request.linkedStudentName, request.linkedStudentPhone)
            }
            linkedStudentId = matchedStudent?.id
            if (matchedStudent != null) {
                logger.info("학부모 가입 시 학생 매칭 성공: parentLoginId={}, studentId={}", request.loginId, matchedStudent.id)
            } else {
                logger.info("학부모 가입 시 학생 매칭 실패: parentLoginId={}, linkedStudentName={}", request.loginId, request.linkedStudentName)
            }
        }

        // 6. 상태 결정: 국어농장(org_hq) 선택 시 자동 활성화
        val isAutoApprove = (request.orgId == ORG_HQ_ID)
        val userStatus = "active" // 유저는 항상 active (로그인은 가능해야 함)
        val membershipStatus = if (isAutoApprove) "active" else "pending"

        // 7. UserEntity 생성
        val user = UserEntity(
            id = IdGenerator.newId("u"),
            email = request.loginId,
            passwordHash = passwordEncoder.encode(request.password),
            name = request.name,
            region = request.region,
            school = request.school,
            gradeLabel = request.gradeLabel,
            levelId = request.levelId,
            studentPhone = request.studentPhone,
            parentPhone = request.parentPhone,
            diagnosticOptIn = request.diagnosticOptIn,
            learningStartDate = if (request.learningStartMode == "day1") LocalDate.now() else null,
            status = userStatus
        )
        userRepository.save(user)

        // 8. OrgMembership 생성
        val existing = orgMembershipRepository.findByOrgIdAndUserId(org.id, user.id)
        if (existing == null) {
            val role = when (normalizedAccountType) {
                "parent" -> "PARENT"
                "org_admin" -> "ORG_ADMIN"
                else -> "STUDENT"
            }
            val now = LocalDateTime.now()
            orgMembershipRepository.save(
                OrgMembershipEntity(
                    id = IdGenerator.newId("om"),
                    orgId = org.id,
                    userId = user.id,
                    role = role,
                    status = membershipStatus,
                    requestedAt = now,
                    approvedAt = if (isAutoApprove) now else null,
                    linkedStudentName = request.linkedStudentName,
                    linkedStudentPhone = request.linkedStudentPhone,
                    linkedParentPhone = request.linkedParentPhone
                )
            )
        }

        // 9. 토큰 발급 (pending 상태여도 로그인 가능)
        return issueTokens(user, org.id, membershipStatus == "pending")
    }

    // 기존 signup 메서드 유지 (하위 호환성)
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
        return signup(SignupRequest(
            loginId = loginId,
            password = password,
            name = name,
            orgId = orgId,
            region = region,
            school = school,
            gradeLabel = gradeLabel,
            levelId = levelId,
            studentPhone = studentPhone,
            parentPhone = parentPhone,
            diagnosticOptIn = diagnosticOptIn,
            accountType = accountType,
            learningStartMode = learningStartMode
        ))
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
        request.shippingName?.let { user.shippingName = it }
        request.shippingPhone?.let { user.shippingPhone = it }
        request.shippingZipCode?.let { user.shippingZipCode = it }
        request.shippingAddress?.let { user.shippingAddress = it }
        request.shippingAddressDetail?.let { user.shippingAddressDetail = it }
        request.password?.let {
            if (it.length >= 8) user.passwordHash = passwordEncoder.encode(it)
        }
        request.learningStartMode?.let {
            user.learningStartDate = if (it == "day1") LocalDate.now() else null
        }
        userRepository.save(user)
        val roles = resolveRoles(user.id)
        val isPending = checkPendingApproval(user.id)
        val resolvedOrgId = resolveOrgId(user.id)
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
            shippingName = user.shippingName,
            shippingPhone = user.shippingPhone,
            shippingZipCode = user.shippingZipCode,
            shippingAddress = user.shippingAddress,
            shippingAddressDetail = user.shippingAddressDetail,
            profileImageUrl = user.profileImageUrl,
            pendingApproval = isPending,
            orgId = resolvedOrgId
        )
    }

    fun logout(userId: String) {
        val tokens = refreshTokenRepository.findByUserIdAndRevokedAtIsNull(userId)
        val now = LocalDateTime.now()
        tokens.forEach { it.revokedAt = now }
        refreshTokenRepository.saveAll(tokens)
    }

    private fun issueTokens(user: UserEntity, orgId: String? = null, pendingApproval: Boolean = false): AuthResponseData {
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

        // pending 상태 확인: 파라미터로 전달받거나, 멤버십 조회
        val isPending = pendingApproval || checkPendingApproval(user.id)
        val resolvedOrgId = orgId ?: resolveOrgId(user.id)

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
                shippingName = user.shippingName,
                shippingPhone = user.shippingPhone,
                shippingZipCode = user.shippingZipCode,
                shippingAddress = user.shippingAddress,
                shippingAddressDetail = user.shippingAddressDetail,
                profileImageUrl = user.profileImageUrl,
                pendingApproval = isPending,
                orgId = resolvedOrgId
            )
        )
    }

    private fun checkPendingApproval(userId: String): Boolean {
        val memberships = orgMembershipRepository.findByUserIdAndStatus(userId, "pending")
        return memberships.isNotEmpty()
    }

    private fun resolveOrgId(userId: String): String? {
        val memberships = orgMembershipRepository.findByUserIdAndStatus(userId, "active")
        if (memberships.isNotEmpty()) return memberships.first().orgId
        val pendingMemberships = orgMembershipRepository.findByUserIdAndStatus(userId, "pending")
        return pendingMemberships.firstOrNull()?.orgId
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
