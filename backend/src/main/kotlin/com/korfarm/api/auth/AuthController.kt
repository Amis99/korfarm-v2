package com.korfarm.api.auth

import com.korfarm.api.common.ApiResponse
import com.korfarm.api.common.ApiException
import com.korfarm.api.contracts.LoginRequest
import com.korfarm.api.contracts.SignupRequest
import com.korfarm.api.contracts.UpdateProfileRequest
import com.korfarm.api.org.OrgService
import com.korfarm.api.security.SecurityUtils
import com.korfarm.api.user.UserRepository
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import jakarta.validation.Valid

@RestController
@RequestMapping("/v1/auth")
class AuthController(
    private val authService: AuthService,
    private val userRepository: UserRepository,
    private val orgService: OrgService
) {
    @GetMapping("/check-login-id")
    fun checkLoginId(@RequestParam loginId: String): ApiResponse<Map<String, Boolean>> {
        val exists = userRepository.existsByEmail(loginId)
        return ApiResponse(success = true, data = mapOf("available" to !exists))
    }

    @PostMapping("/signup")
    fun signup(@Valid @RequestBody request: SignupRequest): ApiResponse<AuthResponseData> {
        val data = authService.signup(request)
        return ApiResponse(success = true, data = data)
    }

    @PostMapping("/login")
    fun login(@Valid @RequestBody request: LoginRequest): ApiResponse<AuthResponseData> {
        val data = authService.login(request.loginId, request.password)
        return ApiResponse(success = true, data = data)
    }

    @PostMapping("/logout")
    fun logout(): ApiResponse<Any> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        authService.logout(userId)
        return ApiResponse(success = true, data = emptyMap<String, Any>())
    }

    @GetMapping("/me")
    fun me(): ApiResponse<UserProfile> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val user = userRepository.findById(userId).orElseThrow {
            ApiException("NOT_FOUND", "user not found", HttpStatus.NOT_FOUND)
        }
        val roles = SecurityUtils.currentRoles()
        val profile = UserProfile(
            id = user.id,
            loginId = user.email,
            name = user.name,
            roles = if (roles.isEmpty()) listOf("STUDENT") else roles,
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
            profileImageUrl = user.profileImageUrl
        )
        return ApiResponse(success = true, data = profile)
    }

    @PutMapping("/me")
    fun updateMe(@Valid @RequestBody request: UpdateProfileRequest): ApiResponse<UserProfile> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val profile = authService.updateProfile(userId, request)
        return ApiResponse(success = true, data = profile)
    }

    @PostMapping("/request-password-reset")
    fun requestPasswordReset(@RequestBody body: Map<String, String>): ApiResponse<Map<String, String>> {
        val loginId = body["loginId"]
            ?: throw ApiException("BAD_REQUEST", "loginId 필수", HttpStatus.BAD_REQUEST)
        val exists = userRepository.existsByEmail(loginId)
        if (!exists) {
            throw ApiException("NOT_FOUND", "해당 아이디를 찾을 수 없습니다.", HttpStatus.NOT_FOUND)
        }
        return ApiResponse(success = true, data = mapOf(
            "message" to "비밀번호 초기화 요청이 접수되었습니다. 선생님 또는 관리자에게 문의하세요."
        ))
    }

    @GetMapping("/orgs")
    fun orgs(): ApiResponse<List<com.korfarm.api.org.OrgSummary>> {
        val data = orgService.listActiveOrgs()
        return ApiResponse(success = true, data = data)
    }
}
