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
import org.springframework.web.bind.annotation.RestController
import jakarta.validation.Valid

@RestController
@RequestMapping("/v1/auth")
class AuthController(
    private val authService: AuthService,
    private val userRepository: UserRepository,
    private val orgService: OrgService
) {
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

    @GetMapping("/orgs")
    fun orgs(): ApiResponse<List<com.korfarm.api.org.OrgSummary>> {
        val data = orgService.listActiveOrgs()
        return ApiResponse(success = true, data = data)
    }
}
