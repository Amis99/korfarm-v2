package com.korfarm.api.user

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.economy.EconomyService
import com.korfarm.api.economy.Inventory
import com.korfarm.api.learning.FarmHistoryResponse
import com.korfarm.api.learning.FarmLearningService
import com.korfarm.api.test.TestHistoryItem
import com.korfarm.api.test.TestPaperSummary
import com.korfarm.api.test.TestService
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
    val parentPhone: String?
)

@Service
class ParentLinkService(
    private val parentStudentLinkRepository: ParentStudentLinkRepository,
    private val userRepository: UserRepository,
    private val economyService: EconomyService,
    private val farmLearningService: FarmLearningService,
    private val testService: TestService
) {
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

    @Transactional
    fun requestLink(parentUserId: String, request: ParentLinkRequestCodeRequest): ParentLinkView {
        val parent = userRepository.findById(parentUserId).orElseThrow {
            ApiException("NOT_FOUND", "parent not found", HttpStatus.NOT_FOUND)
        }
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
            status = "pending"
        )
        link.status = "pending"
        link.requestCode = generateRequestCode()
        link.requestedAt = now
        link.approvedAt = null
        link.approvedBy = null
        parentStudentLinkRepository.save(link)
        return link.toView(parent, student)
    }

    @Transactional
    fun confirmLink(studentUserId: String, request: ParentLinkConfirmRequest): ParentLinkView {
        val student = userRepository.findById(studentUserId).orElseThrow {
            ApiException("NOT_FOUND", "student not found", HttpStatus.NOT_FOUND)
        }
        val parent = resolveUser(request.parentUserId, request.parentLoginId, "parent")
        val link = parentStudentLinkRepository.findByParentUserIdAndStudentUserId(parent.id, student.id)
            ?: throw ApiException("NOT_FOUND", "link not found", HttpStatus.NOT_FOUND)
        if (link.status != "pending") {
            throw ApiException("INVALID_STATUS", "link is not pending", HttpStatus.BAD_REQUEST)
        }
        if (link.requestCode != request.requestCode) {
            throw ApiException("INVALID_CODE", "invalid request code", HttpStatus.BAD_REQUEST)
        }
        link.status = "active"
        link.requestCode = null
        link.approvedAt = LocalDateTime.now()
        link.approvedBy = student.id
        parentStudentLinkRepository.save(link)
        return link.toView(parent, student)
    }

    @Transactional
    fun approveLink(linkId: String, reviewerId: String): ParentLinkView {
        val link = parentStudentLinkRepository.findById(linkId).orElseThrow {
            ApiException("NOT_FOUND", "link not found", HttpStatus.NOT_FOUND)
        }
        val parent = userRepository.findById(link.parentUserId).orElseThrow {
            ApiException("NOT_FOUND", "parent not found", HttpStatus.NOT_FOUND)
        }
        val student = userRepository.findById(link.studentUserId).orElseThrow {
            ApiException("NOT_FOUND", "student not found", HttpStatus.NOT_FOUND)
        }
        link.status = "active"
        link.requestCode = null
        link.approvedAt = LocalDateTime.now()
        link.approvedBy = reviewerId
        parentStudentLinkRepository.save(link)
        return link.toView(parent, student)
    }

    @Transactional
    fun rejectLink(linkId: String, reviewerId: String): ParentLinkView {
        val link = parentStudentLinkRepository.findById(linkId).orElseThrow {
            ApiException("NOT_FOUND", "link not found", HttpStatus.NOT_FOUND)
        }
        val parent = userRepository.findById(link.parentUserId).orElseThrow {
            ApiException("NOT_FOUND", "parent not found", HttpStatus.NOT_FOUND)
        }
        val student = userRepository.findById(link.studentUserId).orElseThrow {
            ApiException("NOT_FOUND", "student not found", HttpStatus.NOT_FOUND)
        }
        link.status = "rejected"
        link.requestCode = null
        link.approvedAt = LocalDateTime.now()
        link.approvedBy = reviewerId
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

    private fun generateRequestCode(): String {
        val value = (100000..999999).random()
        return value.toString()
    }

    private fun ParentStudentLinkEntity.toView(parent: UserEntity, student: UserEntity): ParentLinkView {
        return ParentLinkView(
            linkId = id,
            parentUserId = parent.id,
            parentLoginId = parent.email,
            studentUserId = student.id,
            studentLoginId = student.email,
            studentName = student.name,
            status = status,
            requestCode = requestCode,
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
        return ChildProfileView(
            userId = student.id,
            loginId = student.email,
            name = student.name ?: "",
            levelId = student.levelId,
            gradeLabel = student.gradeLabel,
            school = student.school,
            region = student.region,
            studentPhone = student.studentPhone,
            parentPhone = student.parentPhone
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
}
