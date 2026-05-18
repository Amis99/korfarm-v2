package com.korfarm.api.user

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.diagnostic.DiagnosticReport
import com.korfarm.api.diagnostic.DiagnosticService
import com.korfarm.api.diagnostic.SessionHistoryItem
import com.korfarm.api.diagnostic.TierInfo
import com.korfarm.api.economy.EconomyService
import com.korfarm.api.economy.Inventory
import com.korfarm.api.learning.FarmHistoryResponse
import com.korfarm.api.learning.FarmLearningService
import com.korfarm.api.test.TestHistoryItem
import com.korfarm.api.test.TestPaperSummary
import com.korfarm.api.test.TestReportResponse
import com.korfarm.api.test.TestService
import com.korfarm.api.test.WrongNoteResponse
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

data class ChildProfileView(
    val userId: String,
    val loginId: String,
    val name: String,
    val levelId: String?,
    val gradeLabel: String?,
    val school: String?,
    val region: String?,
    val studentPhone: String?,
    val parentPhone: String?,
    // 자녀 기관 소속 (org_hq 제외 active STUDENT 멤버십이 있으면 그 orgId/orgName).
    // 학부모 구독 화면이 "기관 소속이면 구독 결제 숨김" 판별에 사용.
    val orgId: String? = null,
    val orgName: String? = null,
    val orgLogoFileId: String? = null,
)

@Service
class ParentLinkService(
    private val parentStudentLinkRepository: ParentStudentLinkRepository,
    private val userRepository: UserRepository,
    private val economyService: EconomyService,
    private val farmLearningService: FarmLearningService,
    private val testService: TestService,
    private val diagnosticService: DiagnosticService,
    private val orgMembershipRepository: com.korfarm.api.org.OrgMembershipRepository,
    private val orgRepository: com.korfarm.api.org.OrgRepository,
) {
    /** 학생 ID 들을 받아 각 학생이 속한 active orgId 들의 map 반환 */
    @Transactional(readOnly = true)
    fun getStudentOrgMap(studentIds: List<String>): Map<String, Set<String>> {
        if (studentIds.isEmpty()) return emptyMap()
        val memberships = orgMembershipRepository.findAll()
            .filter { it.userId in studentIds && it.status == "active" }
        return memberships.groupBy { it.userId }.mapValues { (_, ms) -> ms.map { it.orgId }.toSet() }
    }
    @Transactional
    fun createLink(request: ParentLinkRequest, reviewerId: String): ParentLinkView {
        val parent = resolveUser(request.parentUserId, request.parentLoginId, "parent")
        val student = resolveUser(request.studentUserId, request.studentLoginId, "student")
        if (parent.id == student.id) {
            throw ApiException("INVALID_LINK", "parent and student cannot be the same", HttpStatus.BAD_REQUEST)
        }

        val existing = parentStudentLinkRepository.findByParentUserIdAndStudentUserId(parent.id, student.id)
        if (existing != null && existing.status == "active") {
            throw ApiException("LINK_EXISTS", "link already exists", HttpStatus.CONFLICT)
        }

        val now = LocalDateTime.now()
        val link = existing ?: ParentStudentLinkEntity(
            id = IdGenerator.newId("pl"),
            parentUserId = parent.id,
            studentUserId = student.id,
            status = "active"
        )
        link.status = "active"
        link.requestCode = null
        link.requestedAt = link.requestedAt ?: now
        link.approvedAt = now
        link.approvedBy = reviewerId
        parentStudentLinkRepository.save(link)

        return link.toView(parent, student)
    }

    @Transactional(readOnly = true)
    fun listForParent(parentUserId: String): List<ParentLinkView> {
        val parent = userRepository.findById(parentUserId).orElse(null)
            ?: throw ApiException("NOT_FOUND", "parent not found", HttpStatus.NOT_FOUND)
        val links = parentStudentLinkRepository.findByParentUserId(parent.id)
        if (links.isEmpty()) {
            return emptyList()
        }
        val students = userRepository.findAllById(links.map { it.studentUserId }).associateBy { it.id }
        return links.mapNotNull { link ->
            val student = students[link.studentUserId] ?: return@mapNotNull null
            link.toView(parent, student)
        }
    }

    @Transactional(readOnly = true)
    fun listAll(): List<ParentLinkView> {
        val links = parentStudentLinkRepository.findAll()
        if (links.isEmpty()) {
            return emptyList()
        }
        val parentIds = links.map { it.parentUserId }.distinct()
        val studentIds = links.map { it.studentUserId }.distinct()
        val users = userRepository.findAllById(parentIds + studentIds).associateBy { it.id }
        return links.mapNotNull { link ->
            val parent = users[link.parentUserId] ?: return@mapNotNull null
            val student = users[link.studentUserId] ?: return@mapNotNull null
            link.toView(parent, student)
        }
    }

    // requestLink/confirmLink/approveLink: 자동 연결 정책 도입 후 폐기.
    // 학부모는 회원가입 시 학생 이름·휴대폰 일치하면 즉시 active 연결됨.

    // rejectLink 폐기.

    /**
     * 학부모 본인이 자녀를 직접 연결 — 학생 아이디(loginId) + 학생 이름이 모두 일치할 때 link 생성.
     * 회원가입 시 자동 연결과 동일한 신뢰 수준 (이름·휴대폰 일치 → 즉시 active).
     */
    @Transactional
    fun selfLinkChild(parentUserId: String, studentLoginId: String, studentName: String): ParentLinkView {
        if (studentLoginId.isBlank() || studentName.isBlank()) {
            throw ApiException("INVALID_REQUEST", "학생 아이디와 이름을 모두 입력해 주세요.", HttpStatus.BAD_REQUEST)
        }
        val parent = userRepository.findById(parentUserId).orElseThrow {
            ApiException("NOT_FOUND", "학부모 정보를 찾을 수 없습니다.", HttpStatus.NOT_FOUND)
        }
        val student = userRepository.findByEmail(studentLoginId.trim())
            ?: throw ApiException("STUDENT_NOT_FOUND", "해당 아이디의 학생을 찾을 수 없습니다.", HttpStatus.NOT_FOUND)
        if (parent.id == student.id) {
            throw ApiException("INVALID_LINK", "자기 자신은 자녀로 연결할 수 없습니다.", HttpStatus.BAD_REQUEST)
        }
        val inputName = studentName.trim().replace(" ", "")
        val actualName = (student.name ?: "").trim().replace(" ", "")
        if (inputName != actualName) {
            throw ApiException("NAME_MISMATCH", "학생 아이디와 이름이 일치하지 않습니다.", HttpStatus.BAD_REQUEST)
        }
        val existing = parentStudentLinkRepository.findByParentUserIdAndStudentUserId(parent.id, student.id)
        if (existing != null && existing.status == "active") {
            throw ApiException("LINK_EXISTS", "이미 연결된 자녀입니다.", HttpStatus.CONFLICT)
        }
        val now = LocalDateTime.now()
        val link = existing ?: ParentStudentLinkEntity(
            id = IdGenerator.newId("pl"),
            parentUserId = parent.id,
            studentUserId = student.id,
            status = "active",
        )
        link.status = "active"
        link.requestCode = null
        link.requestedAt = link.requestedAt ?: now
        link.approvedAt = now
        link.approvedBy = parent.id  // self-link
        parentStudentLinkRepository.save(link)
        return link.toView(parent, student)
    }

    @Transactional
    fun deactivate(linkId: String) {
        val link = parentStudentLinkRepository.findById(linkId).orElseThrow {
            ApiException("NOT_FOUND", "link not found", HttpStatus.NOT_FOUND)
        }
        link.status = "inactive"
        link.updatedAt = LocalDateTime.now()
        parentStudentLinkRepository.save(link)
    }

    private fun resolveUser(userId: String?, loginId: String?, label: String): UserEntity {
        if (!userId.isNullOrBlank()) {
            return userRepository.findById(userId).orElseThrow {
                ApiException("NOT_FOUND", "$label not found", HttpStatus.NOT_FOUND)
            }
        }
        if (!loginId.isNullOrBlank()) {
            return userRepository.findByEmail(loginId)
                ?: throw ApiException("NOT_FOUND", "$label not found", HttpStatus.NOT_FOUND)
        }
        throw ApiException("INVALID_REQUEST", "$label identifier required", HttpStatus.BAD_REQUEST)
    }

    private fun ParentStudentLinkEntity.toView(parent: UserEntity, student: UserEntity): ParentLinkView {
        return ParentLinkView(
            linkId = id,
            parentUserId = parent.id,
            parentLoginId = parent.email,
            parentName = parent.name,
            parentPhone = parent.parentPhone ?: parent.studentPhone,
            studentUserId = student.id,
            studentLoginId = student.email,
            studentName = student.name,
            studentPhone = student.studentPhone,
            status = status,
            requestedAt = requestedAt,
            approvedAt = approvedAt,
            approvedBy = approvedBy,
            createdAt = createdAt
        )
    }

    /**
     * 부모가 자녀의 프로필을 조회할 수 있는지 검증하고, 자녀 프로필 반환
     */
    @Transactional(readOnly = true)
    fun getChildProfile(parentUserId: String, studentUserId: String): ChildProfileView {
        val link = parentStudentLinkRepository.findByParentUserIdAndStudentUserId(parentUserId, studentUserId)
            ?: throw ApiException("NOT_LINKED", "자녀와 연결되어 있지 않습니다", HttpStatus.FORBIDDEN)
        if (link.status != "active") {
            throw ApiException("LINK_INACTIVE", "자녀 연결이 활성 상태가 아닙니다", HttpStatus.FORBIDDEN)
        }
        val student = userRepository.findById(studentUserId).orElseThrow {
            ApiException("NOT_FOUND", "학생을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        // 자녀의 active STUDENT 멤버십 중 org_hq 가 아닌 첫 기관 → 기관 소속 판정용.
        val orgMembership = orgMembershipRepository.findByUserIdAndStatus(studentUserId, "active")
            .firstOrNull { it.role == "STUDENT" && it.orgId != "org_hq" }
        val orgEntity = orgMembership?.orgId?.let { orgRepository.findById(it).orElse(null) }
        return ChildProfileView(
            userId = student.id,
            loginId = student.email,
            name = student.name ?: "",
            levelId = student.levelId,
            gradeLabel = student.gradeLabel,
            school = student.school,
            region = student.region,
            studentPhone = student.studentPhone,
            parentPhone = student.parentPhone,
            orgId = orgMembership?.orgId,
            orgName = orgEntity?.name,
            orgLogoFileId = orgEntity?.logoFileId,
        )
    }

    /**
     * 부모가 자녀의 인벤토리(씨앗, 작물, 비료)를 조회
     */
    @Transactional(readOnly = true)
    fun getChildInventory(parentUserId: String, studentUserId: String): Inventory {
        val link = parentStudentLinkRepository.findByParentUserIdAndStudentUserId(parentUserId, studentUserId)
            ?: throw ApiException("NOT_LINKED", "자녀와 연결되어 있지 않습니다", HttpStatus.FORBIDDEN)
        if (link.status != "active") {
            throw ApiException("LINK_INACTIVE", "자녀 연결이 활성 상태가 아닙니다", HttpStatus.FORBIDDEN)
        }
        return economyService.getInventory(studentUserId)
    }

    /**
     * 부모-자녀 연결 여부 검증 (다른 서비스에서 사용)
     */
    @Transactional(readOnly = true)
    fun verifyParentChildLink(parentUserId: String, studentUserId: String): Boolean {
        val link = parentStudentLinkRepository.findByParentUserIdAndStudentUserId(parentUserId, studentUserId)
        return link != null && link.status == "active"
    }

    /**
     * 부모가 자녀의 경제 원장(씨앗/작물/비료 내역) 조회
     */
    @Transactional(readOnly = true)
    fun getChildLedger(parentUserId: String, studentUserId: String): List<com.korfarm.api.economy.LedgerEntry> {
        val link = parentStudentLinkRepository.findByParentUserIdAndStudentUserId(parentUserId, studentUserId)
            ?: throw ApiException("NOT_LINKED", "자녀와 연결되어 있지 않습니다", HttpStatus.FORBIDDEN)
        if (link.status != "active") {
            throw ApiException("LINK_INACTIVE", "자녀 연결이 활성 상태가 아닙니다", HttpStatus.FORBIDDEN)
        }
        return economyService.getLedger(studentUserId)
    }

    /**
     * 부모가 자녀의 학습 히스토리 조회
     */
    @Transactional(readOnly = true)
    fun getChildFarmHistory(parentUserId: String, studentUserId: String): FarmHistoryResponse {
        val link = parentStudentLinkRepository.findByParentUserIdAndStudentUserId(parentUserId, studentUserId)
            ?: throw ApiException("NOT_LINKED", "자녀와 연결되어 있지 않습니다", HttpStatus.FORBIDDEN)
        if (link.status != "active") {
            throw ApiException("LINK_INACTIVE", "자녀 연결이 활성 상태가 아닙니다", HttpStatus.FORBIDDEN)
        }
        return farmLearningService.getHistory(studentUserId)
    }

    /**
     * 부모가 자녀의 테스트 목록 조회
     */
    @Transactional(readOnly = true)
    fun getChildTestList(parentUserId: String, studentUserId: String, levelId: String?, source: String?): List<TestPaperSummary> {
        val link = parentStudentLinkRepository.findByParentUserIdAndStudentUserId(parentUserId, studentUserId)
            ?: throw ApiException("NOT_LINKED", "자녀와 연결되어 있지 않습니다", HttpStatus.FORBIDDEN)
        if (link.status != "active") {
            throw ApiException("LINK_INACTIVE", "자녀 연결이 활성 상태가 아닙니다", HttpStatus.FORBIDDEN)
        }
        return testService.listTests(studentUserId, levelId, source)
    }

    /**
     * 부모가 자녀의 테스트 응시 히스토리 조회
     */
    @Transactional(readOnly = true)
    fun getChildTestHistory(parentUserId: String, studentUserId: String): List<TestHistoryItem> {
        val link = parentStudentLinkRepository.findByParentUserIdAndStudentUserId(parentUserId, studentUserId)
            ?: throw ApiException("NOT_LINKED", "자녀와 연결되어 있지 않습니다", HttpStatus.FORBIDDEN)
        if (link.status != "active") {
            throw ApiException("LINK_INACTIVE", "자녀 연결이 활성 상태가 아닙니다", HttpStatus.FORBIDDEN)
        }
        return testService.getHistory(studentUserId)
    }

    /**
     * 부모가 자녀의 시험 성적표 조회
     */
    @Transactional(readOnly = true)
    fun getChildTestReport(parentUserId: String, studentUserId: String, testId: String): TestReportResponse {
        val link = parentStudentLinkRepository.findByParentUserIdAndStudentUserId(parentUserId, studentUserId)
            ?: throw ApiException("NOT_LINKED", "자녀와 연결되어 있지 않습니다", HttpStatus.FORBIDDEN)
        if (link.status != "active") {
            throw ApiException("LINK_INACTIVE", "자녀 연결이 활성 상태가 아닙니다", HttpStatus.FORBIDDEN)
        }
        return testService.getReport(testId, studentUserId)
    }

    /**
     * 부모가 자녀의 시험 오답 노트 조회
     */
    @Transactional(readOnly = true)
    fun getChildTestWrongNote(parentUserId: String, studentUserId: String, testId: String): WrongNoteResponse {
        val link = parentStudentLinkRepository.findByParentUserIdAndStudentUserId(parentUserId, studentUserId)
            ?: throw ApiException("NOT_LINKED", "자녀와 연결되어 있지 않습니다", HttpStatus.FORBIDDEN)
        if (link.status != "active") {
            throw ApiException("LINK_INACTIVE", "자녀 연결이 활성 상태가 아닙니다", HttpStatus.FORBIDDEN)
        }
        return testService.getWrongNote(testId, studentUserId)
    }

    /**
     * 부모가 자녀의 진단 tier 목록 조회
     */
    @Transactional(readOnly = true)
    fun getChildDiagnosticTiers(parentUserId: String, studentUserId: String): List<TierInfo> {
        verifyLink(parentUserId, studentUserId)
        return diagnosticService.getTiers(studentUserId)
    }

    /**
     * 부모가 자녀의 진단 이력 조회
     */
    @Transactional(readOnly = true)
    fun getChildDiagnosticHistory(parentUserId: String, studentUserId: String): List<SessionHistoryItem> {
        verifyLink(parentUserId, studentUserId)
        return diagnosticService.getHistory(studentUserId)
    }

    /**
     * 부모가 자녀의 진단 리포트 조회
     */
    @Transactional(readOnly = true)
    fun getChildDiagnosticReport(parentUserId: String, studentUserId: String, sessionId: String): DiagnosticReport {
        verifyLink(parentUserId, studentUserId)
        return diagnosticService.getReportForStudent(sessionId, studentUserId)
    }

    private fun verifyLink(parentUserId: String, studentUserId: String) {
        val link = parentStudentLinkRepository.findByParentUserIdAndStudentUserId(parentUserId, studentUserId)
            ?: throw ApiException("NOT_LINKED", "자녀와 연결되어 있지 않습니다", HttpStatus.FORBIDDEN)
        if (link.status != "active") {
            throw ApiException("LINK_INACTIVE", "자녀 연결이 활성 상태가 아닙니다", HttpStatus.FORBIDDEN)
        }
    }
}
