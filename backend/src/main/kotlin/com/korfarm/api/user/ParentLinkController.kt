package com.korfarm.api.user

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.diagnostic.DiagnosticReport
import com.korfarm.api.diagnostic.SessionHistoryItem
import com.korfarm.api.diagnostic.TierInfo
import com.korfarm.api.economy.Inventory
import com.korfarm.api.economy.LedgerEntry
import com.korfarm.api.learning.FarmHistoryResponse
import com.korfarm.api.test.TestHistoryItem
import com.korfarm.api.test.TestPaperSummary
import com.korfarm.api.test.TestReportResponse
import com.korfarm.api.test.WrongNoteResponse
import com.korfarm.api.security.AdminGuard
import com.korfarm.api.security.SecurityUtils
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1")
class ParentLinkController(
    private val parentLinkService: ParentLinkService,
    private val orgService: com.korfarm.api.org.OrgService,
    private val parentStudentLinkRepository: ParentStudentLinkRepository
) {
    @PostMapping("/admin/parents/links")
    fun createLink(@Valid @RequestBody request: ParentLinkRequest): ApiResponse<ParentLinkView> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val reviewerId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        // request.studentUserId 가 자기 기관 학생인지 검증 (HQ_ADMIN 은 통과)
        request.studentUserId?.let { orgService.verifyOrgAdminAccessForStudent(it) }
        val data = parentLinkService.createLink(request, reviewerId)
        return ApiResponse(success = true, data = data)
    }

    @GetMapping("/admin/parents/links")
    fun listLinks(
        @org.springframework.web.bind.annotation.RequestParam(required = false) studentUserId: String?,
        @org.springframework.web.bind.annotation.RequestParam(required = false) parentUserId: String?,
    ): ApiResponse<List<ParentLinkView>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        val all = parentLinkService.listAll()
        val isHq = SecurityUtils.hasAnyRole("HQ_ADMIN")
        var data = if (isHq) all else {
            // ORG_ADMIN — 자기 기관 학생 연결만 (`org_hq` 멤버십은 제외해야 본사+기관 동시 ORG_ADMIN 케이스에서 타 기관 새지 않음)
            val uid = SecurityUtils.currentUserId() ?: return ApiResponse(success = true, data = emptyList())
            val myOrgIds = orgService.callerOrgAdminOrgIds(uid)
            if (myOrgIds.isEmpty()) emptyList() else {
                val studentIds = all.map { it.studentUserId }.distinct()
                val studentOrgMap = parentLinkService.getStudentOrgMap(studentIds)
                all.filter { (studentOrgMap[it.studentUserId] ?: emptySet()).any { o -> o in myOrgIds } }
            }
        }
        // 쿼리 파라미터 — 한 학생 또는 한 학부모의 link 만 보고 싶을 때
        studentUserId?.let { sid -> data = data.filter { it.studentUserId == sid } }
        parentUserId?.let { pid -> data = data.filter { it.parentUserId == pid } }
        return ApiResponse(success = true, data = data)
    }

    @GetMapping("/parents/links")
    fun myLinks(): ApiResponse<List<ParentLinkView>> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        val data = parentLinkService.listForParent(userId)
        return ApiResponse(success = true, data = data)
    }

    /**
     * 학부모 셀프 자녀 연결 — 학생 아이디·이름 일치 시 즉시 active.
     * 가입 후 자동 연결이 안 된 케이스에서 학부모가 직접 추가하기.
     */
    @PostMapping("/parents/links/self-link")
    fun selfLink(@Valid @RequestBody request: SelfLinkRequest): ApiResponse<ParentLinkView> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        if (!SecurityUtils.hasAnyRole("PARENT")) {
            throw ApiException("FORBIDDEN", "학부모 권한이 필요합니다.", HttpStatus.FORBIDDEN)
        }
        val data = parentLinkService.selfLinkChild(userId, request.studentLoginId, request.studentName)
        return ApiResponse(success = true, data = data)
    }

    // 폐기됨: /v1/parents/links/request, /v1/students/links/confirm,
    //         /v1/admin/parents/links/{id}/approve, /v1/admin/parents/links/{id}/reject
    // 학부모 회원가입 시 학생 정보(이름·휴대폰) 일치하면 자동 연결되는 정책으로 통일.

    @DeleteMapping("/admin/parents/links/{linkId}")
    fun deleteLink(@PathVariable linkId: String): ApiResponse<Map<String, String>> {
        AdminGuard.requireAnyRole("HQ_ADMIN", "ORG_ADMIN")
        // 연결 학생이 자기 기관 학생인지 검증
        val link = parentStudentLinkRepository.findById(linkId).orElse(null)
        if (link != null) orgService.verifyOrgAdminAccessForStudent(link.studentUserId)
        parentLinkService.deactivate(linkId)
        return ApiResponse(success = true, data = mapOf("status" to "inactive"))
    }

    /**
     * 부모가 연결된 자녀의 프로필 조회
     */
    @GetMapping("/parents/children/{studentId}/profile")
    fun getChildProfile(@PathVariable studentId: String): ApiResponse<ChildProfileView> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        if (!SecurityUtils.hasAnyRole("PARENT")) {
            throw ApiException("FORBIDDEN", "부모 권한이 필요합니다", HttpStatus.FORBIDDEN)
        }
        val data = parentLinkService.getChildProfile(userId, studentId)
        return ApiResponse(success = true, data = data)
    }

    /**
     * 부모가 연결된 자녀의 인벤토리 조회
     */
    @GetMapping("/parents/children/{studentId}/inventory")
    fun getChildInventory(@PathVariable studentId: String): ApiResponse<Inventory> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        if (!SecurityUtils.hasAnyRole("PARENT")) {
            throw ApiException("FORBIDDEN", "부모 권한이 필요합니다", HttpStatus.FORBIDDEN)
        }
        val data = parentLinkService.getChildInventory(userId, studentId)
        return ApiResponse(success = true, data = data)
    }

    /**
     * 부모가 연결된 자녀의 경제 원장(씨앗/작물/비료 내역) 조회
     */
    @GetMapping("/parents/children/{studentId}/ledger")
    fun getChildLedger(@PathVariable studentId: String): ApiResponse<List<LedgerEntry>> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        if (!SecurityUtils.hasAnyRole("PARENT")) {
            throw ApiException("FORBIDDEN", "부모 권한이 필요합니다", HttpStatus.FORBIDDEN)
        }
        val data = parentLinkService.getChildLedger(userId, studentId)
        return ApiResponse(success = true, data = data)
    }

    /**
     * 부모가 연결된 자녀의 학습 히스토리(수확 장부) 조회
     */
    @GetMapping("/parents/children/{studentId}/farm/history")
    fun getChildFarmHistory(@PathVariable studentId: String): ApiResponse<FarmHistoryResponse> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        if (!SecurityUtils.hasAnyRole("PARENT")) {
            throw ApiException("FORBIDDEN", "부모 권한이 필요합니다", HttpStatus.FORBIDDEN)
        }
        val data = parentLinkService.getChildFarmHistory(userId, studentId)
        return ApiResponse(success = true, data = data)
    }

    /**
     * 부모가 연결된 자녀의 테스트 목록 조회
     */
    @GetMapping("/parents/children/{studentId}/test-storage")
    fun getChildTestList(
        @PathVariable studentId: String,
        @RequestParam(required = false) levelId: String?,
        @RequestParam(required = false) source: String?
    ): ApiResponse<List<TestPaperSummary>> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        if (!SecurityUtils.hasAnyRole("PARENT")) {
            throw ApiException("FORBIDDEN", "부모 권한이 필요합니다", HttpStatus.FORBIDDEN)
        }
        val data = parentLinkService.getChildTestList(userId, studentId, levelId, source)
        return ApiResponse(success = true, data = data)
    }

    /**
     * 부모가 연결된 자녀의 테스트 응시 히스토리 조회
     */
    @GetMapping("/parents/children/{studentId}/test-storage/history")
    fun getChildTestHistory(@PathVariable studentId: String): ApiResponse<List<TestHistoryItem>> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        if (!SecurityUtils.hasAnyRole("PARENT")) {
            throw ApiException("FORBIDDEN", "부모 권한이 필요합니다", HttpStatus.FORBIDDEN)
        }
        val data = parentLinkService.getChildTestHistory(userId, studentId)
        return ApiResponse(success = true, data = data)
    }

    /**
     * 부모가 연결된 자녀의 시험 성적표 조회
     */
    @GetMapping("/parents/children/{studentId}/test-storage/{testId}/report")
    fun getChildTestReport(
        @PathVariable studentId: String,
        @PathVariable testId: String
    ): ApiResponse<TestReportResponse> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        if (!SecurityUtils.hasAnyRole("PARENT")) {
            throw ApiException("FORBIDDEN", "부모 권한이 필요합니다", HttpStatus.FORBIDDEN)
        }
        val data = parentLinkService.getChildTestReport(userId, studentId, testId)
        return ApiResponse(success = true, data = data)
    }

    /**
     * 부모가 연결된 자녀의 시험 오답 노트 조회
     */
    @GetMapping("/parents/children/{studentId}/test-storage/{testId}/wrong-note")
    fun getChildTestWrongNote(
        @PathVariable studentId: String,
        @PathVariable testId: String
    ): ApiResponse<WrongNoteResponse> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        if (!SecurityUtils.hasAnyRole("PARENT")) {
            throw ApiException("FORBIDDEN", "부모 권한이 필요합니다", HttpStatus.FORBIDDEN)
        }
        val data = parentLinkService.getChildTestWrongNote(userId, studentId, testId)
        return ApiResponse(success = true, data = data)
    }

    @GetMapping("/parents/children/{studentId}/diagnostic/tiers")
    fun getChildDiagnosticTiers(@PathVariable studentId: String): ApiResponse<List<TierInfo>> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        if (!SecurityUtils.hasAnyRole("PARENT")) {
            throw ApiException("FORBIDDEN", "부모 권한이 필요합니다", HttpStatus.FORBIDDEN)
        }
        val data = parentLinkService.getChildDiagnosticTiers(userId, studentId)
        return ApiResponse(success = true, data = data)
    }

    @GetMapping("/parents/children/{studentId}/diagnostic/history")
    fun getChildDiagnosticHistory(@PathVariable studentId: String): ApiResponse<List<SessionHistoryItem>> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        if (!SecurityUtils.hasAnyRole("PARENT")) {
            throw ApiException("FORBIDDEN", "부모 권한이 필요합니다", HttpStatus.FORBIDDEN)
        }
        val data = parentLinkService.getChildDiagnosticHistory(userId, studentId)
        return ApiResponse(success = true, data = data)
    }

    @GetMapping("/parents/children/{studentId}/diagnostic/{sessionId}/report")
    fun getChildDiagnosticReport(
        @PathVariable studentId: String,
        @PathVariable sessionId: String
    ): ApiResponse<DiagnosticReport> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        if (!SecurityUtils.hasAnyRole("PARENT")) {
            throw ApiException("FORBIDDEN", "부모 권한이 필요합니다", HttpStatus.FORBIDDEN)
        }
        val data = parentLinkService.getChildDiagnosticReport(userId, studentId, sessionId)
        return ApiResponse(success = true, data = data)
    }
}
