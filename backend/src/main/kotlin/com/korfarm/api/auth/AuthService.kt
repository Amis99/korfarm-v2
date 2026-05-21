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
import com.korfarm.api.studyplan.StudyPlanService
import com.korfarm.api.user.RefreshTokenEntity
import com.korfarm.api.user.RefreshTokenRepository
import com.korfarm.api.user.UserEntity
import com.korfarm.api.user.UserRepository
import com.korfarm.api.org.OrgMembershipRepository
import com.korfarm.api.user.ParentStudentLinkEntity
import com.korfarm.api.user.ParentStudentLinkRepository
import com.korfarm.api.payment.SubscriptionRepository
import org.springframework.http.HttpStatus
import org.springframework.dao.DataAccessException
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
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
    private val parentStudentLinkRepository: ParentStudentLinkRepository,
    private val subscriptionRepository: SubscriptionRepository,
    private val studyPlanService: StudyPlanService
) {
    private val logger = LoggerFactory.getLogger(AuthService::class.java)

    companion object {
        const val ORG_HQ_ID = "org_hq"
    }

    fun signup(request: SignupRequest): AuthResponseData {
        // 1. 중복 체크 — 아이디
        if (userRepository.existsByEmail(request.loginId)) {
            throw ApiException("LOGIN_ID_EXISTS", "이미 등록된 아이디입니다", HttpStatus.CONFLICT)
        }
        // 1-1. 중복 체크 — 같은 이름+연락처 활성 사용자 있으면 차단 (2026-05-18 사용자 명시).
        //     계정 유형별로 본인 연락처가 어느 컬럼에 들어가는지 다름:
        //       student: studentPhone, parent: linkedParentPhone, org_admin: studentPhone(연락처 컬럼 재활용)
        val ownPhone = when (request.accountType?.lowercase() ?: "student") {
            "parent" -> request.linkedParentPhone
            else -> request.studentPhone
        }?.trim()?.takeIf { it.isNotBlank() }
        if (!request.name.isNullOrBlank() && !ownPhone.isNullOrBlank()) {
            // studentPhone 또는 parentPhone 어디든 같은 이름·전화 사용자 있으면 차단
            val byStudent = userRepository.findByNameAndStudentPhone(request.name, ownPhone)
            val byParent = userRepository.findByNameAndParentPhone(request.name, ownPhone)
            val match = (byStudent ?: byParent)?.takeIf { it.deletedAt == null }
            if (match != null) {
                throw ApiException(
                    "DUPLICATE_NAME_PHONE",
                    "동일한 이름과 연락처로 이미 가입된 계정이 있어요. (아이디: ${match.email})",
                    HttpStatus.CONFLICT
                )
            }
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
            levelId = request.levelId ?: "saussure1",
            studentPhone = request.studentPhone,
            parentPhone = request.parentPhone,
            diagnosticOptIn = request.diagnosticOptIn,
            learningStartDate = if (request.learningStartMode == "day1") LocalDate.now() else null,
            status = userStatus
        )
        userRepository.save(user)

        // 8. OrgMembership 생성
        val existing = orgMembershipRepository.findByOrgIdAndUserId(org.id, user.id)
        val createdRole: String = when (normalizedAccountType) {
            "parent" -> "PARENT"
            "org_admin" -> "ORG_ADMIN"
            else -> "STUDENT"
        }
        if (existing == null) {
            val now = LocalDateTime.now()
            orgMembershipRepository.save(
                OrgMembershipEntity(
                    id = IdGenerator.newId("om"),
                    orgId = org.id,
                    userId = user.id,
                    role = createdRole,
                    status = membershipStatus,
                    requestedAt = now,
                    approvedAt = if (isAutoApprove) now else null,
                    linkedStudentName = request.linkedStudentName,
                    linkedStudentPhone = request.linkedStudentPhone,
                    linkedParentPhone = request.linkedParentPhone
                )
            )
        }

        // 8-1. 학생이 active 멤버십으로 가입한 경우 기관 default 템플릿 자동 복제
        if (isAutoApprove && createdRole == "STUDENT") {
            try {
                val cloned = studyPlanService.cloneTemplatesForStudent(org.id, user.id)
                if (cloned > 0) {
                    logger.info("기관 default 템플릿 복제 완료: orgId={}, userId={}, count={}", org.id, user.id, cloned)
                }
            } catch (ex: Exception) {
                logger.warn("기관 default 템플릿 복제 실패 (가입은 정상 처리): userId={}, error={}", user.id, ex.message)
            }

            // 8-2. 학생이 plan 0개라면 (템플릿 복제도 0건이고 plan 자체가 없는 경우) 기본 plan 자동 생성
            try {
                if (studyPlanService.hasAnyPlan(user.id).not()) {
                    studyPlanService.createDefaultPlanForStudent(org.id, user.id)
                    logger.info("기본 학습 계획표 자동 생성: orgId={}, userId={}", org.id, user.id)
                }
            } catch (ex: Exception) {
                logger.warn("기본 학습 계획표 자동 생성 실패 (가입은 정상 처리): userId={}, error={}", user.id, ex.message)
            }
        }

        // 9. 학부모 가입 시 학생 매칭 성공이면 자동 연결
        if (linkedStudentId != null) {
            val existingLink = parentStudentLinkRepository.findByParentUserIdAndStudentUserId(user.id, linkedStudentId)
            if (existingLink == null || existingLink.status != "active") {
                val now = LocalDateTime.now()
                val link = existingLink ?: ParentStudentLinkEntity(
                    id = IdGenerator.newId("pl"),
                    parentUserId = user.id,
                    studentUserId = linkedStudentId,
                    status = "active"
                )
                link.status = "active"
                link.requestedAt = link.requestedAt ?: now
                link.approvedAt = now
                link.approvedBy = "system"
                parentStudentLinkRepository.save(link)
                logger.info("학부모 가입 시 학생 자동 연결 완료: parentId={}, studentId={}", user.id, linkedStudentId)
            }
        }

        // 10. 토큰 발급 (pending 상태여도 로그인 가능)
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

    /**
     * N-28 (2026-05-21) — 본인 비밀번호 변경. oldPassword 검증 후 newPassword 갱신.
     * 잘못된 oldPassword: INVALID_OLD_PASSWORD. newPassword 8자 미만: BAD_REQUEST.
     * N-33 (2026-05-22) — 변경 성공 시 그 사용자의 모든 refresh token revoke (다른 디바이스 강제 로그아웃).
     */
    @Transactional
    fun changePassword(userId: String, oldPassword: String, newPassword: String) {
        if (newPassword.length < 8) {
            throw ApiException("BAD_REQUEST", "새 비밀번호는 8자 이상이어야 합니다.", HttpStatus.BAD_REQUEST)
        }
        val user = userRepository.findById(userId).orElseThrow {
            ApiException("NOT_FOUND", "user not found", HttpStatus.NOT_FOUND)
        }
        if (!passwordEncoder.matches(oldPassword, user.passwordHash)) {
            throw ApiException("INVALID_OLD_PASSWORD", "현재 비밀번호가 일치하지 않습니다.", HttpStatus.UNAUTHORIZED)
        }
        if (passwordEncoder.matches(newPassword, user.passwordHash)) {
            throw ApiException("SAME_PASSWORD", "기존 비밀번호와 다른 값을 입력해 주세요.", HttpStatus.BAD_REQUEST)
        }
        user.passwordHash = passwordEncoder.encode(newPassword)
        userRepository.save(user)
        revokeAllRefreshTokens(userId)
    }

    /**
     * N-33 (2026-05-22) — 그 사용자의 활성 refresh token 전부 revoke.
     * 비번 변경·어드민 재설정 시 다른 디바이스 강제 로그아웃 목적.
     * access token (15분 짧음) 은 자연 만료. refresh 시점에 토큰 없어 차단.
     */
    @Transactional
    fun revokeAllRefreshTokens(userId: String) {
        val now = LocalDateTime.now()
        val tokens = refreshTokenRepository.findByUserIdAndRevokedAtIsNull(userId)
        tokens.forEach { it.revokedAt = now }
        if (tokens.isNotEmpty()) refreshTokenRepository.saveAll(tokens)
    }

    fun login(loginId: String, password: String): AuthResponseData {
        val user = userRepository.findByEmail(loginId)
            ?: throw ApiException("INVALID_CREDENTIALS", "invalid credentials", HttpStatus.UNAUTHORIZED)
        if (!passwordEncoder.matches(password, user.passwordHash)) {
            throw ApiException("INVALID_CREDENTIALS", "invalid credentials", HttpStatus.UNAUTHORIZED)
        }
        if (user.deletedAt != null) {
            throw ApiException("ACCOUNT_DELETED", "삭제된 계정입니다", HttpStatus.UNAUTHORIZED)
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
        // N-28 (2026-05-21) — 비번 변경은 별도 POST /v1/auth/change-password 만 허용.
        // updateProfile 에서 password 필드를 받으면 무시한다 (oldPassword 검증 우회 차단).
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

    /**
     * 관리자 전용 refresh token 으로 새 access token 발급 (rotate).
     * 기존 refresh 는 revoke 하고 새 refresh 도 발급해 14일 슬라이딩 윈도우 유지.
     */
    fun refresh(refreshToken: String): AuthResponseData {
        val payload = try {
            jwtService.verify(refreshToken)
        } catch (e: Exception) {
            throw ApiException("INVALID_TOKEN", "유효하지 않은 토큰입니다.", HttpStatus.UNAUTHORIZED)
        }
        val tokenHash = TokenHasher.sha256(refreshToken)
        val entity = refreshTokenRepository.findByTokenHash(tokenHash)
            ?: throw ApiException("INVALID_TOKEN", "토큰이 존재하지 않습니다.", HttpStatus.UNAUTHORIZED)
        if (entity.revokedAt != null) {
            throw ApiException("INVALID_TOKEN", "취소된 토큰입니다.", HttpStatus.UNAUTHORIZED)
        }
        if (entity.expiresAt.isBefore(LocalDateTime.now())) {
            throw ApiException("INVALID_TOKEN", "만료된 토큰입니다.", HttpStatus.UNAUTHORIZED)
        }
        val user = userRepository.findById(payload.userId).orElseThrow {
            ApiException("INVALID_TOKEN", "사용자를 찾을 수 없습니다.", HttpStatus.UNAUTHORIZED)
        }
        // 관리자 권한이 사라졌으면 refresh 거부 (보안)
        val roles = resolveRoles(user.id)
        val isAdmin = roles.any { it == "HQ_ADMIN" || it == "ORG_ADMIN" }
        if (!isAdmin) {
            entity.revokedAt = LocalDateTime.now()
            refreshTokenRepository.save(entity)
            throw ApiException("FORBIDDEN", "관리자 권한이 없습니다.", HttpStatus.FORBIDDEN)
        }
        // 기존 refresh revoke (rotate)
        entity.revokedAt = LocalDateTime.now()
        refreshTokenRepository.save(entity)
        // 새 토큰 발급
        return issueTokens(user)
    }

    /**
     * 현재 사용자의 최신 roles 로 새 access token 재발급.
     * 결제 완료(PAID 부여) 직후 sessionStorage 갱신용 — refresh token DB 검증 없이 동작.
     */
    fun refreshClaimsFor(userId: String): AuthResponseData {
        val user = userRepository.findById(userId).orElseThrow {
            ApiException("NOT_FOUND", "user not found", HttpStatus.NOT_FOUND)
        }
        return issueTokens(user)
    }

    private fun issueTokens(user: UserEntity, orgId: String? = null, pendingApproval: Boolean = false): AuthResponseData {
        val roles = resolveRoles(user.id)
        val accessToken = jwtService.createAccessToken(user.id, roles, user.name)
        // 관리자(HQ_ADMIN/ORG_ADMIN) 만 refresh token 발급. 학생/학부모는 sessionStorage 로 짧게.
        val isAdmin = roles.any { it == "HQ_ADMIN" || it == "ORG_ADMIN" }
        val refreshToken: String? = if (isAdmin) {
            val rt = jwtService.createRefreshToken(user.id)
            refreshTokenRepository.save(
                RefreshTokenEntity(
                    id = IdGenerator.newId("rt"),
                    userId = user.id,
                    tokenHash = TokenHasher.sha256(rt),
                    expiresAt = LocalDateTime.now().plusSeconds(jwtProperties.refreshTokenSeconds)
                )
            )
            rt
        } else null
        val expiresIn = if (isAdmin) jwtProperties.accessTokenSeconds
                       else jwtProperties.studentAccessTokenSeconds

        // pending 상태 확인: 파라미터로 전달받거나, 멤버십 조회
        val isPending = pendingApproval || checkPendingApproval(user.id)
        val resolvedOrgId = orgId ?: resolveOrgId(user.id)

        return AuthResponseData(
            accessToken = accessToken,
            refreshToken = refreshToken,
            expiresIn = expiresIn,
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
        val now = LocalDateTime.now()
        // 2026-05-11 정책: ORG_HQ 외 기관에 STUDENT 활성 멤버십이면 자동 PAID
        // (기관이 월 사용료 내고 학생을 운용 = 학생 = 유료 자격)
        val hasOrgStudentMembership = memberships.any { it.role == "STUDENT" && it.orgId != ORG_HQ_ID }
        if (hasOrgStudentMembership) {
            roles.add("PAID")
        }
        // 학생 본인이 유효 구독 중이면 PAID 부여 (개인 구독자)
        try {
            val ownSub = subscriptionRepository.findTopByUserIdOrderByEndAtDesc(userId)
            if (ownSub != null && ownSub.endAt.isAfter(now)
                && (ownSub.status == "active" || ownSub.status == "canceled")) {
                roles.add("PAID")
            }
        } catch (ex: DataAccessException) {
            logger.warn("Failed to resolve own subscription for userId={}", userId, ex)
        }
        // 학부모의 유료는 연결된 자녀의 구독에서 파생
        try {
            if (parentStudentLinkRepository.existsByParentUserIdAndStatus(userId, "active")) {
                roles.add("PARENT")
                val childLinks = parentStudentLinkRepository.findByParentUserIdAndStatus(userId, "active")
                val hasSubscribedChild = childLinks.any { link ->
                    val sub = subscriptionRepository.findTopByUserIdOrderByEndAtDesc(link.studentUserId)
                    sub != null && sub.endAt.isAfter(now) && (sub.status == "active" || sub.status == "canceled")
                }
                if (hasSubscribedChild) {
                    roles.add("PAID")
                }
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
