package com.korfarm.api.org

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.security.OrgScopeResolver
import com.korfarm.api.security.SecurityUtils
import com.korfarm.api.contracts.AdminClassCreateRequest
import com.korfarm.api.contracts.AdminClassStudentsRequest
import com.korfarm.api.contracts.AdminClassUpdateRequest
import com.korfarm.api.contracts.AdminOrgCreateRequest
import com.korfarm.api.contracts.AdminOrgUpdateRequest
import com.korfarm.api.contracts.AdminOrgAdminCreateRequest
import com.korfarm.api.contracts.AdminStudentCreateRequest
import com.korfarm.api.contracts.AdminStudentUpdateRequest
import com.korfarm.api.contracts.AdminSubscriptionRequest
import com.korfarm.api.payment.SubscriptionEntity
import com.korfarm.api.payment.SubscriptionRepository
import com.korfarm.api.user.UserEntity
import com.korfarm.api.user.UserRepository
import org.springframework.http.HttpStatus
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalDateTime
import java.util.UUID

@Service
class OrgService(
    private val orgRepository: OrgRepository,
    private val orgMembershipRepository: OrgMembershipRepository,
    private val classRepository: ClassRepository,
    private val classMembershipRepository: ClassMembershipRepository,
    private val userRepository: UserRepository,
    private val subscriptionRepository: SubscriptionRepository,
    private val passwordEncoder: PasswordEncoder,
    private val orgScopeResolver: OrgScopeResolver,
) {
    // ORG_ADMIN인 경우 대상 학생이 자기 기관 소속인지 검증 (HQ_ADMIN은 통과)
    fun verifyOrgAdminAccessForStudent(targetUserId: String) {
        if (SecurityUtils.hasAnyRole("HQ_ADMIN")) return
        val adminUserId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "인증되지 않은 요청입니다", HttpStatus.UNAUTHORIZED)
        val adminOrgs = orgMembershipRepository.findByUserIdAndStatus(adminUserId, "active")
            .filter { it.role == "ORG_ADMIN" }
            .map { it.orgId }
            .toSet()
        if (adminOrgs.isEmpty()) {
            throw ApiException("FORBIDDEN", "기관 관리자 권한이 없습니다", HttpStatus.FORBIDDEN)
        }
        val studentOrgs = orgMembershipRepository.findByUserIdAndStatus(targetUserId, "active")
            .map { it.orgId }
            .toSet()
        if (adminOrgs.intersect(studentOrgs).isEmpty()) {
            throw ApiException("FORBIDDEN", "해당 학생에 대한 접근 권한이 없습니다", HttpStatus.FORBIDDEN)
        }
    }

    // ORG_ADMIN인 경우 대상 클래스가 자기 기관 소속인지 검증 (HQ_ADMIN은 통과)
    fun verifyOrgAdminAccessForClass(targetClassId: String) {
        if (SecurityUtils.hasAnyRole("HQ_ADMIN")) return
        val adminUserId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "인증되지 않은 요청입니다", HttpStatus.UNAUTHORIZED)
        val adminOrgs = orgMembershipRepository.findByUserIdAndStatus(adminUserId, "active")
            .filter { it.role == "ORG_ADMIN" }
            .map { it.orgId }
            .toSet()
        if (adminOrgs.isEmpty()) {
            throw ApiException("FORBIDDEN", "기관 관리자 권한이 없습니다", HttpStatus.FORBIDDEN)
        }
        val classEntity = classRepository.findById(targetClassId).orElseThrow {
            ApiException("NOT_FOUND", "수강반을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        if (!adminOrgs.contains(classEntity.orgId)) {
            throw ApiException("FORBIDDEN", "해당 수강반에 대한 접근 권한이 없습니다", HttpStatus.FORBIDDEN)
        }
    }

    @Transactional(readOnly = true)
    fun listActiveOrgs(): List<OrgSummary> {
        // org_hq(국어농장)를 맨 위로, 나머지는 이름순 정렬
        return orgRepository.findByStatusOrderByHqFirstThenNameAsc("active").map { org ->
            OrgSummary(id = org.id, name = org.name)
        }
    }

    @Transactional(readOnly = true)
    fun listUserOrgs(userId: String): List<OrgSummary> {
        val memberships = orgMembershipRepository.findByUserIdAndStatus(userId, "active")
        val orgIds = memberships.map { it.orgId }.distinct()
        return orgRepository.findAllById(orgIds).map { org ->
            OrgSummary(id = org.id, name = org.name)
        }
    }

    /**
     * 호출자(ORG_ADMIN) 가 운영 권한을 가진 기관 orgId set.
     * `org_hq` 멤버십은 본사 운영용이므로 제외(본사 ORG_ADMIN 이라도 운영 화면에서는 본사 데이터로 잡지 않음).
     * HQ_ADMIN 케이스는 호출자가 별도 분기 필요.
     */
    @Transactional(readOnly = true)
    fun callerOrgAdminOrgIds(userId: String): Set<String> =
        orgMembershipRepository.findByUserIdAndStatus(userId, "active")
            .filter { it.role == "ORG_ADMIN" && it.orgId != "org_hq" }
            .map { it.orgId }
            .toSet()

    @Transactional(readOnly = true)
    fun listOrgsAdmin(): List<AdminOrgView> {
        val adminMemberships = orgMembershipRepository.findByStatus("active")
            .filter { it.role == "HQ_ADMIN" || it.role == "ORG_ADMIN" }
        // 관리자 사용자만 조회 (전체 사용자 로드 방지)
        val adminUserIds = adminMemberships.map { it.userId }.distinct()
        val userMap = if (adminUserIds.isNotEmpty()) {
            userRepository.findAllById(adminUserIds).associateBy { it.id }
        } else emptyMap()
        val membershipsByOrg = adminMemberships.groupBy { it.orgId }
        // org_hq(국어농장)를 맨 위로, 나머지는 이름순 정렬
        return orgRepository.findAll().sortedWith(compareBy({ if (it.id == "org_hq") 0 else 1 }, { it.name })).map { org ->
            val admins = (membershipsByOrg[org.id] ?: emptyList()).mapNotNull { m ->
                val u = userMap[m.userId] ?: return@mapNotNull null
                AdminOrgAdminView(
                    userId = u.id,
                    loginId = u.email,
                    name = u.name,
                    phone = u.studentPhone,
                    role = m.role
                )
            }
            AdminOrgView(
                orgId = org.id,
                name = org.name,
                plan = org.plan,
                orgType = org.orgType,
                addressRegion = org.addressRegion,
                addressDetail = org.addressDetail,
                logoFileId = org.logoFileId,
                monthlyBaseFeeOverride = org.monthlyBaseFeeOverride,
                billingSuspended = org.billingSuspended,
                seatLimit = org.seatLimit,
                admins = admins,
                status = org.status
            )
        }
    }

    @Transactional(readOnly = true)
    fun listClassesAdmin(): List<AdminClassView> {
        // ORG_ADMIN 은 자기 기관 반만(`org_hq` 제외), HQ_ADMIN 은 전체
        val isHq = SecurityUtils.currentRoles().contains("HQ_ADMIN")
        val all = classRepository.findAll()
        val classes = if (isHq) {
            all
        } else {
            val currentUserId = SecurityUtils.currentUserId()
            val myOrgIds = if (currentUserId != null) callerOrgAdminOrgIds(currentUserId) else emptySet()
            all.filter { it.orgId in myOrgIds }
        }
        val orgIds = classes.map { it.orgId }.distinct()
        val orgMap = if (orgIds.isNotEmpty()) {
            orgRepository.findAllById(orgIds).associateBy { it.id }
        } else emptyMap()
        return classes.sortedBy { it.name }.map { classEntity ->
            val orgName = orgMap[classEntity.orgId]?.name
            val seatCount = classMembershipRepository.countByClassIdAndStatus(classEntity.id, "active")
            AdminClassView(
                classId = classEntity.id,
                name = classEntity.name,
                description = classEntity.description,
                orgId = classEntity.orgId,
                orgName = orgName,
                seatCount = seatCount,
                status = classEntity.status
            )
        }
    }

    @Transactional(readOnly = true)
    fun getClassView(classId: String): AdminClassView {
        val classEntity = classRepository.findById(classId).orElseThrow {
            ApiException("NOT_FOUND", "수강반을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        val orgName = orgRepository.findById(classEntity.orgId).orElse(null)?.name
        val seatCount = classMembershipRepository.countByClassIdAndStatus(classId, "active")
        return AdminClassView(
            classId = classEntity.id,
            name = classEntity.name,
            description = classEntity.description,
            orgId = classEntity.orgId,
            orgName = orgName,
            seatCount = seatCount,
            status = classEntity.status
        )
    }

    @Transactional(readOnly = true)
    fun listClassStudents(classId: String): List<AdminStudentView> {
        classRepository.findById(classId).orElseThrow {
            ApiException("NOT_FOUND", "수강반을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        val memberships = classMembershipRepository.findByClassIdAndStatus(classId, "active")
        val orgMap = orgRepository.findAll().associateBy { it.id }
        val classMap = classRepository.findAll().associateBy { it.id }
        return memberships.mapNotNull { cm ->
            val user = userRepository.findById(cm.userId).orElse(null) ?: return@mapNotNull null
            val orgMembership = orgMembershipRepository.findByUserIdAndStatus(user.id, "active")
                .firstOrNull { it.role == "STUDENT" }
            val orgId = orgMembership?.orgId
            val orgName = orgId?.let { orgMap[it]?.name }
            val userClassMemberships = classMembershipRepository.findByUserIdAndStatus(user.id, "active")
            val classIds = userClassMemberships.map { it.classId }
            val classNames = userClassMemberships.mapNotNull { classMap[it.classId]?.name }
            val subscription = subscriptionRepository.findTopByUserIdOrderByEndAtDesc(user.id)
            AdminStudentView(
                userId = user.id,
                loginId = user.email,
                name = user.name ?: user.email,
                gradeLabel = user.gradeLabel,
                levelId = user.levelId,
                school = user.school,
                region = user.region,
                studentPhone = user.studentPhone,
                parentPhone = user.parentPhone,
                orgId = orgId,
                orgName = orgName,
                classIds = classIds,
                classNames = classNames,
                subscriptionStatus = subscription?.status,
                subscriptionEndAt = subscription?.endAt?.toString(),
                status = user.status
            )
        }
    }

    @Transactional
    fun removeStudentFromClass(classId: String, userId: String) {
        val membership = classMembershipRepository.findByClassIdAndUserId(classId, userId)
            ?: throw ApiException("NOT_FOUND", "해당 학생의 수강반 멤버십을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        membership.status = "inactive"
        classMembershipRepository.save(membership)
    }

    /** ORG_ADMIN 이 특정 orgId 에 대한 권한이 있는지 검증 (HQ_ADMIN 은 통과). */
    fun verifyOrgAdminAccess(targetOrgId: String) {
        if (SecurityUtils.hasAnyRole("HQ_ADMIN")) return
        val adminUserId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "인증되지 않은 요청입니다", HttpStatus.UNAUTHORIZED)
        val adminOrgs = orgMembershipRepository.findByUserIdAndStatus(adminUserId, "active")
            .filter { it.role == "ORG_ADMIN" }
            .map { it.orgId }
            .toSet()
        if (targetOrgId !in adminOrgs) {
            throw ApiException("FORBIDDEN", "해당 기관에 대한 권한이 없습니다", HttpStatus.FORBIDDEN)
        }
    }

    /**
     * 학생을 기관에서 탈퇴시키고 본사(ORG_HQ) 무료 회원으로 자동 이전.
     * - 기존 기관 멤버십 → status=inactive
     * - 본사 ORG_HQ 멤버십 → 신규 active 생성 (이미 있으면 active 로 복구)
     * - 결과: resolveRoles 가 PAID 미부여 → 무료 학생으로 자동 전환
     */
    @Transactional
    fun transferStudentToHq(orgId: String, userId: String): Map<String, Any?> {
        if (orgId == "org_hq") {
            return mapOf("status" to "noop", "message" to "이미 본사 소속입니다")
        }
        val membership = orgMembershipRepository.findByOrgIdAndUserId(orgId, userId)
            ?: throw ApiException("NOT_FOUND", "해당 학생의 기관 멤버십을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        if (membership.role != "STUDENT") {
            throw ApiException("BAD_REQUEST", "학생만 본사 이전이 가능합니다 (현재 역할: ${membership.role})", HttpStatus.BAD_REQUEST)
        }
        membership.status = "inactive"
        orgMembershipRepository.save(membership)

        // 본사 ORG_HQ 멤버십 신설 또는 active 복구
        val now = LocalDateTime.now()
        val hqMembership = orgMembershipRepository.findByOrgIdAndUserId("org_hq", userId)
        if (hqMembership != null) {
            hqMembership.status = "active"
            hqMembership.approvedAt = hqMembership.approvedAt ?: now
            orgMembershipRepository.save(hqMembership)
        } else {
            orgMembershipRepository.save(
                OrgMembershipEntity(
                    id = IdGenerator.newId("om"),
                    orgId = "org_hq",
                    userId = userId,
                    role = "STUDENT",
                    status = "active",
                    requestedAt = now,
                    approvedAt = now,
                )
            )
        }

        // 수강반 멤버십도 함께 정리 — 기존 기관의 모든 active 반에서 빠짐
        classMembershipRepository.findByUserIdAndStatus(userId, "active").forEach { cm ->
            val cls = classRepository.findById(cm.classId).orElse(null)
            if (cls != null && cls.orgId == orgId) {
                cm.status = "inactive"
                classMembershipRepository.save(cm)
            }
        }

        return mapOf(
            "status" to "transferred",
            "previousOrgId" to orgId,
            "newOrgId" to "org_hq",
            "userId" to userId,
            "message" to "학생이 본사 무료 회원으로 이전되었습니다",
        )
    }

    /**
     * 2026-05-18 — 학생을 다른 기관으로 이동.
     *
     * - 현재 active 인 STUDENT 멤버십을 모두 inactive
     * - toOrgId 에 active 멤버십 신설/복구
     * - 옛 기관의 수강반 멤버십 모두 inactive
     * - toOrgId == "org_hq" 면 transferStudentToHq 와 동등 (자동 위임)
     */
    @Transactional
    fun transferStudent(userId: String, toOrgId: String): Map<String, Any?> {
        val target = orgRepository.findById(toOrgId).orElse(null)
            ?: throw ApiException("NOT_FOUND", "대상 기관을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        if (target.status != "active" && toOrgId != "org_hq") {
            throw ApiException("BAD_REQUEST", "정지된 기관으로는 이동할 수 없습니다", HttpStatus.BAD_REQUEST)
        }

        val current = orgMembershipRepository.findByUserIdAndStatus(userId, "active")
            .filter { it.role == "STUDENT" }
        if (current.any { it.orgId == toOrgId }) {
            return mapOf("status" to "noop", "message" to "이미 해당 기관 소속입니다")
        }

        val now = LocalDateTime.now()
        val previousOrgIds = current.map { it.orgId }

        // 모든 active STUDENT 멤버십 inactive
        current.forEach {
            it.status = "inactive"
            orgMembershipRepository.save(it)
        }

        // toOrgId 멤버십 신설/복구
        val existing = orgMembershipRepository.findByOrgIdAndUserId(toOrgId, userId)
        if (existing != null) {
            existing.status = "active"
            existing.role = "STUDENT"
            existing.approvedAt = existing.approvedAt ?: now
            orgMembershipRepository.save(existing)
        } else {
            orgMembershipRepository.save(
                OrgMembershipEntity(
                    id = IdGenerator.newId("om"),
                    orgId = toOrgId,
                    userId = userId,
                    role = "STUDENT",
                    status = "active",
                    requestedAt = now,
                    approvedAt = now,
                )
            )
        }

        // 옛 기관의 수강반 멤버십 inactive
        classMembershipRepository.findByUserIdAndStatus(userId, "active").forEach { cm ->
            val cls = classRepository.findById(cm.classId).orElse(null)
            if (cls != null && cls.orgId in previousOrgIds) {
                cm.status = "inactive"
                classMembershipRepository.save(cm)
            }
        }

        return mapOf(
            "status" to "transferred",
            "previousOrgIds" to previousOrgIds,
            "newOrgId" to toOrgId,
            "userId" to userId,
            "message" to "학생이 ${target.name} (으)로 이동되었습니다",
        )
    }

    @Transactional
    fun deactivateClass(classId: String) {
        val classEntity = classRepository.findById(classId).orElseThrow {
            ApiException("NOT_FOUND", "수강반을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        classEntity.status = "inactive"
        classRepository.save(classEntity)
    }

    /** 회원 통합 조회 — HQ_ADMIN 전용. role: STUDENT / PARENT / ORG_ADMIN. */
    @Transactional(readOnly = true)
    fun listMembersAdmin(role: String): List<AdminMemberView> {
        val orgMap = orgRepository.findAll().associateBy { it.id }
        val memberships = orgMembershipRepository.findByStatus("active")
            .filter { it.role == role }
        val userIds = memberships.map { it.userId }.toSet()
        val users = userRepository.findAllById(userIds).filter { it.deletedAt == null }
            .associateBy { it.id }
        // 학부모면 자녀 자동 연결 정보 — userId 별 linkedStudentName 들 모음
        val linkedNamesByParentUserId: Map<String, List<String>> = if (role == "PARENT") {
            memberships.groupBy { it.userId }.mapValues { (_, ms) ->
                ms.mapNotNull { it.linkedStudentName?.takeIf { n -> n.isNotBlank() } }
            }
        } else emptyMap()

        return memberships.mapNotNull { m ->
            val user = users[m.userId] ?: return@mapNotNull null
            val org = orgMap[m.orgId]
            AdminMemberView(
                userId = user.id,
                loginId = user.email,
                name = user.name,
                role = m.role,
                orgId = m.orgId,
                orgName = org?.name,
                phone = when (role) {
                    "STUDENT" -> user.studentPhone
                    "PARENT" -> user.parentPhone
                    else -> user.studentPhone
                },
                email = if (user.email.contains("@")) user.email else null,
                membershipStatus = m.status,
                createdAt = user.createdAt.toString(),
                levelId = if (role == "STUDENT") user.levelId else null,
                gradeLabel = if (role == "STUDENT") user.gradeLabel else null,
                school = if (role == "STUDENT") user.school else null,
                region = if (role == "STUDENT") user.region else null,
                linkedStudentNames = linkedNamesByParentUserId[user.id] ?: emptyList(),
            )
        }.sortedByDescending { it.createdAt }
    }

    @Transactional(readOnly = true)
    fun listStudentsAdmin(filterOrgId: String? = null): List<AdminStudentView> {
        val orgMap = orgRepository.findAll().associateBy { it.id }
        val classMap = classRepository.findAll().associateBy { it.id }
        val allMemberships = orgMembershipRepository.findByStatus("active")
        val studentMemberships = allMemberships.filter { it.role == "STUDENT" }
        val studentUserIds = studentMemberships.map { it.userId }.toSet()
        val orgByUser = studentMemberships.groupBy { it.userId }.mapValues { it.value.first().orgId }
        val allClassMemberships = classMembershipRepository.findAll()
            .filter { it.status == "active" }
            .groupBy { it.userId }
        // STUDENT 역할인 사용자만 표시 (부모/관리자 제외, soft deleted 제외)
        // 가입일 최신 순 (기본 정렬) — frontend 가 추가 정렬 옵션 지원 가능.
        var students = userRepository.findAll()
            .filter { it.id in studentUserIds && it.deletedAt == null }
            .sortedByDescending { it.createdAt }
        // 기관 필터: ORG_ADMIN인 경우 해당 기관 소속 학생만
        if (filterOrgId != null) {
            val orgStudentIds = studentMemberships
                .filter { it.orgId == filterOrgId }
                .map { it.userId }.toSet()
            students = students.filter { it.id in orgStudentIds }
        }
        return students.map { user ->
            val orgId = orgByUser[user.id]
            val orgName = orgId?.let { orgMap[it]?.name }
            val userClassMemberships = allClassMemberships[user.id] ?: emptyList()
            val classIds = userClassMemberships.map { it.classId }
            val classNames = userClassMemberships.mapNotNull { classMap[it.classId]?.name }
            // 구독 표시 정책: 학생이 비-`org_hq` 기관에 active STUDENT 멤버십이 있으면 자동 "active"(유료).
            // 기관 가입 승인 = 유료 자동 전환. 별도 SubscriptionEntity 안 봄.
            val isPaidByOrgMembership = studentMemberships.any {
                it.userId == user.id && it.orgId != "org_hq"
            }
            val autoSubscriptionStatus = if (isPaidByOrgMembership) "active" else "free"
            AdminStudentView(
                userId = user.id,
                loginId = user.email,
                name = user.name ?: user.email,
                gradeLabel = user.gradeLabel,
                levelId = user.levelId,
                school = user.school,
                region = user.region,
                studentPhone = user.studentPhone,
                parentPhone = user.parentPhone,
                orgId = orgId,
                orgName = orgName,
                classIds = classIds,
                classNames = classNames,
                subscriptionStatus = autoSubscriptionStatus,
                subscriptionEndAt = null,
                status = user.status,
                createdAt = user.createdAt.toString(),
            )
        }
    }

    @Transactional
    fun createOrg(request: AdminOrgCreateRequest): com.korfarm.api.contracts.AdminOrgCreateResult {
        // 1. orgs INSERT (사업자 정보 포함)
        val org = OrgEntity(
            id = IdGenerator.newId("org"),
            name = request.name,
            status = request.status ?: "active",
            plan = request.plan,
            orgType = request.orgType,
            addressRegion = request.addressRegion,
            addressDetail = request.addressDetail,
            seatLimit = request.seatLimit ?: 0,
            businessNumber = request.businessNumber?.takeIf { it.isNotBlank() },
            representativeName = request.representativeName?.takeIf { it.isNotBlank() },
            contactPhone = request.contactPhone?.takeIf { it.isNotBlank() },
            contactEmail = request.contactEmail?.takeIf { it.isNotBlank() },
            taxEmail = request.taxEmail?.takeIf { it.isNotBlank() },
        )
        val savedOrg = orgRepository.save(org)

        // 2. ORG_ADMIN 동시 등록 (선택) — 닭-달걀 구조 제거
        var adminCreated: com.korfarm.api.contracts.AdminCreatedView? = null
        val adminLoginId = request.adminLoginId?.trim()?.takeIf { it.isNotBlank() }
        val adminName = request.adminName?.trim()?.takeIf { it.isNotBlank() }
        if (adminLoginId != null && adminName != null) {
            // 중복 검사
            if (userRepository.existsByEmail(adminLoginId)) {
                throw ApiException(
                    "LOGIN_ID_EXISTS",
                    "이미 사용 중인 아이디입니다: $adminLoginId",
                    HttpStatus.CONFLICT
                )
            }
            val tempPwd = generateTemporaryPassword()
            val user = userRepository.save(
                UserEntity(
                    id = IdGenerator.newId("u"),
                    email = adminLoginId,
                    passwordHash = passwordEncoder.encode(tempPwd),
                    name = adminName,
                    studentPhone = request.adminPhone?.takeIf { it.isNotBlank() },
                    levelId = null,
                    status = "active",
                )
            )
            orgMembershipRepository.save(
                OrgMembershipEntity(
                    id = IdGenerator.newId("om"),
                    orgId = savedOrg.id,
                    userId = user.id,
                    role = "ORG_ADMIN",
                    status = "active",
                    approvedAt = LocalDateTime.now(),
                )
            )
            adminCreated = com.korfarm.api.contracts.AdminCreatedView(
                userId = user.id,
                loginId = adminLoginId,
                name = adminName,
                temporaryPassword = tempPwd,
            )
        }

        return com.korfarm.api.contracts.AdminOrgCreateResult(
            org = getOrgView(savedOrg.id),  // 기존 함수 — admins · 모든 필드 자동 채움
            admin = adminCreated,
        )
    }

    /** 임시 비밀번호 — 12자 영대소문자+숫자 (헷갈리는 0/O/I/l 제외). */
    private fun generateTemporaryPassword(): String {
        val chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"
        return (1..12).map { chars.random() }.joinToString("")
    }

    /** 학생 일괄 등록 — orgScopeResolver 적용. 행 단위 성공/실패 결과 + 임시 비밀번호 반환. */
    @Transactional
    fun bulkCreateStudents(request: com.korfarm.api.contracts.AdminStudentBulkCreateRequest):
        com.korfarm.api.contracts.AdminBulkCreateResult {
        val callerId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "인증되지 않은 요청입니다", HttpStatus.UNAUTHORIZED)
        val orgId = orgScopeResolver.resolveCallerOrgId(callerId, request.orgId)
            ?: throw ApiException("BAD_REQUEST", "기관 ID 가 필요합니다", HttpStatus.BAD_REQUEST)
        val org = orgRepository.findById(orgId).orElseThrow {
            ApiException("NOT_FOUND", "기관을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        val results = request.students.map { row ->
            val loginId = row.loginId.trim()
            val name = row.name.trim()
            try {
                if (loginId.isBlank() || name.isBlank()) {
                    return@map com.korfarm.api.contracts.BulkStudentResult(
                        loginId = loginId, name = name, success = false,
                        error = "아이디·이름이 비어 있습니다"
                    )
                }
                if (userRepository.existsByEmail(loginId)) {
                    return@map com.korfarm.api.contracts.BulkStudentResult(
                        loginId = loginId, name = name, success = false,
                        error = "이미 사용 중인 아이디"
                    )
                }
                val tempPwd = generateTemporaryPassword()
                val user = userRepository.save(
                    UserEntity(
                        id = IdGenerator.newId("u"),
                        email = loginId,
                        passwordHash = passwordEncoder.encode(tempPwd),
                        name = name,
                        studentPhone = row.studentPhone?.takeIf { it.isNotBlank() },
                        parentPhone = row.parentPhone?.takeIf { it.isNotBlank() },
                        gradeLabel = row.gradeLabel?.takeIf { it.isNotBlank() },
                        levelId = row.levelId?.takeIf { it.isNotBlank() },
                        school = row.school?.takeIf { it.isNotBlank() },
                        region = row.region?.takeIf { it.isNotBlank() },
                        status = "active",
                    )
                )
                orgMembershipRepository.save(
                    OrgMembershipEntity(
                        id = IdGenerator.newId("om"),
                        orgId = orgId,
                        userId = user.id,
                        role = "STUDENT",
                        status = "active",
                        approvedAt = LocalDateTime.now(),
                    )
                )
                com.korfarm.api.contracts.BulkStudentResult(
                    loginId = loginId, name = name, success = true,
                    userId = user.id, temporaryPassword = tempPwd,
                )
            } catch (e: Exception) {
                com.korfarm.api.contracts.BulkStudentResult(
                    loginId = loginId, name = name, success = false,
                    error = e.message ?: "알 수 없는 오류"
                )
            }
        }
        return com.korfarm.api.contracts.AdminBulkCreateResult(
            orgId = orgId,
            orgName = org.name,
            successCount = results.count { it.success },
            failCount = results.count { !it.success },
            students = results,
        )
    }

    @Transactional
    fun updateOrg(orgId: String, request: AdminOrgUpdateRequest): OrgEntity {
        val org = orgRepository.findById(orgId).orElseThrow {
            ApiException("NOT_FOUND", "org not found", HttpStatus.NOT_FOUND)
        }
        request.name?.let { org.name = it }
        request.plan?.let { org.plan = it }
        request.orgType?.let { org.orgType = it }
        request.addressRegion?.let { org.addressRegion = it }
        request.addressDetail?.let { org.addressDetail = it }
        // logoFileId 는 빈 문자열 → null (로고 제거) 처리
        request.logoFileId?.let { org.logoFileId = it.takeIf { v -> v.isNotBlank() } }
        request.seatLimit?.let { org.seatLimit = it }
        request.status?.let { org.status = it }
        request.businessNumber?.let { org.businessNumber = it.takeIf { v -> v.isNotBlank() } }
        request.representativeName?.let { org.representativeName = it.takeIf { v -> v.isNotBlank() } }
        request.contactPhone?.let { org.contactPhone = it.takeIf { v -> v.isNotBlank() } }
        request.contactEmail?.let { org.contactEmail = it.takeIf { v -> v.isNotBlank() } }
        request.taxEmail?.let { org.taxEmail = it.takeIf { v -> v.isNotBlank() } }
        return orgRepository.save(org)
    }

    @Transactional
    fun deactivateOrg(orgId: String) {
        val org = orgRepository.findById(orgId).orElseThrow {
            ApiException("NOT_FOUND", "org not found", HttpStatus.NOT_FOUND)
        }
        org.status = "inactive"
        orgRepository.save(org)
    }

    @Transactional(readOnly = true)
    fun listOrgAdmins(orgId: String): List<AdminOrgAdminView> {
        val memberships = orgMembershipRepository.findByOrgIdAndStatus(orgId, "active")
            .filter { it.role == "HQ_ADMIN" || it.role == "ORG_ADMIN" }
        return memberships.mapNotNull { m ->
            val user = userRepository.findById(m.userId).orElse(null) ?: return@mapNotNull null
            AdminOrgAdminView(
                userId = user.id,
                loginId = user.email,
                name = user.name,
                phone = user.studentPhone,
                role = m.role
            )
        }
    }

    @Transactional
    fun removeOrgAdmin(orgId: String, userId: String) {
        val membership = orgMembershipRepository.findByOrgIdAndUserId(orgId, userId)
            ?: throw ApiException("NOT_FOUND", "membership not found", HttpStatus.NOT_FOUND)
        membership.status = "inactive"
        orgMembershipRepository.save(membership)
    }

    @Transactional
    fun createOrgAdmin(orgId: String, request: AdminOrgAdminCreateRequest): AdminOrgView {
        val org = orgRepository.findById(orgId).orElseThrow {
            ApiException("NOT_FOUND", "기관을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        val user = userRepository.findByEmail(request.loginId)
            ?: throw ApiException("NOT_FOUND", "해당 국어농장 아이디의 계정을 찾을 수 없습니다: ${request.loginId}", HttpStatus.NOT_FOUND)
        val existing = orgMembershipRepository.findByOrgIdAndUserId(org.id, user.id)
        val now = LocalDateTime.now()
        if (existing == null) {
            orgMembershipRepository.save(
                OrgMembershipEntity(
                    id = IdGenerator.newId("om"),
                    orgId = org.id,
                    userId = user.id,
                    role = "ORG_ADMIN",
                    status = "active",
                    approvedAt = now
                )
            )
        } else {
            // 버그 수정 (2026-05-16): 기존 멤버십이 inactive·pending·rejected 여도
            // ORG_ADMIN 으로 강제 복구. 본사가 명시적으로 추가 호출했으므로 의도 분명.
            // 박종찬 케이스 — pending 멤버십이 있어 createOrgAdmin 이 silent no-op 하던 버그.
            existing.role = "ORG_ADMIN"
            existing.status = "active"
            existing.approvedAt = existing.approvedAt ?: now
            existing.rejectionReason = null
            existing.updatedAt = now
            orgMembershipRepository.save(existing)
        }
        return getOrgView(orgId)
    }

    @Transactional(readOnly = true)
    fun getOrgView(orgId: String): AdminOrgView {
        val org = orgRepository.findById(orgId).orElseThrow {
            ApiException("NOT_FOUND", "기관을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        val admins = listOrgAdmins(orgId)
        return AdminOrgView(
            orgId = org.id,
            name = org.name,
            plan = org.plan,
            orgType = org.orgType,
            addressRegion = org.addressRegion,
            addressDetail = org.addressDetail,
            logoFileId = org.logoFileId,
            monthlyBaseFeeOverride = org.monthlyBaseFeeOverride,
            billingSuspended = org.billingSuspended,
            seatLimit = org.seatLimit,
            admins = admins,
            status = org.status,
            businessNumber = org.businessNumber,
            representativeName = org.representativeName,
            contactPhone = org.contactPhone,
            contactEmail = org.contactEmail,
            taxEmail = org.taxEmail,
        )
    }

    @Transactional
    fun createStudent(request: AdminStudentCreateRequest): UserEntity {
        val org = orgRepository.findById(request.orgId).orElseThrow {
            ApiException("NOT_FOUND", "org not found", HttpStatus.NOT_FOUND)
        }
        val user = userRepository.findByEmail(request.email) ?: run {
            val tempPassword = UUID.randomUUID().toString()
            userRepository.save(
                UserEntity(
                    id = IdGenerator.newId("u"),
                    email = request.email,
                    passwordHash = passwordEncoder.encode(tempPassword),
                    name = request.name,
                    status = "active"
                )
            )
        }
        val existing = orgMembershipRepository.findByOrgIdAndUserId(org.id, user.id)
        if (existing == null) {
            orgMembershipRepository.save(
                OrgMembershipEntity(
                    id = IdGenerator.newId("om"),
                    orgId = org.id,
                    userId = user.id,
                    role = "STUDENT",
                    status = "active"
                )
            )
        }
        request.classIds.forEach { classId ->
            addStudentToClass(classId, user.id)
        }
        return user
    }

    @Transactional
    fun updateStudent(userId: String, request: AdminStudentUpdateRequest): UserEntity {
        val user = userRepository.findById(userId).orElseThrow {
            ApiException("NOT_FOUND", "user not found", HttpStatus.NOT_FOUND)
        }
        request.name?.let { user.name = it }
        request.status?.let { user.status = it }
        request.school?.let { user.school = it }
        request.gradeLabel?.let { user.gradeLabel = it }
        request.levelId?.let { user.levelId = it }
        request.studentPhone?.let { user.studentPhone = it }
        request.parentPhone?.let { user.parentPhone = it }
        request.region?.let { user.region = it }
        userRepository.save(user)
        request.orgId?.let { orgId ->
            val existing = orgMembershipRepository.findByOrgIdAndUserId(orgId, user.id)
            if (existing == null) {
                orgMembershipRepository.save(
                    OrgMembershipEntity(
                        id = IdGenerator.newId("om"),
                        orgId = orgId,
                        userId = user.id,
                        role = "STUDENT",
                        status = "active"
                    )
                )
            }
        }
        request.classIds.forEach { classId ->
            addStudentToClass(classId, user.id)
        }
        return user
    }

    @Transactional(readOnly = true)
    fun getStudentView(userId: String): AdminStudentView {
        val user = userRepository.findById(userId).orElseThrow {
            ApiException("NOT_FOUND", "user not found", HttpStatus.NOT_FOUND)
        }
        val orgMap = orgRepository.findAll().associateBy { it.id }
        val classMap = classRepository.findAll().associateBy { it.id }
        val orgMembership = orgMembershipRepository.findByUserIdAndStatus(userId, "active")
            .firstOrNull { it.role == "STUDENT" }
        val orgId = orgMembership?.orgId
        val orgName = orgId?.let { orgMap[it]?.name }
        val userClassMemberships = classMembershipRepository.findByUserIdAndStatus(userId, "active")
        val classIds = userClassMemberships.map { it.classId }
        val classNames = userClassMemberships.mapNotNull { classMap[it.classId]?.name }
        val subscription = subscriptionRepository.findTopByUserIdOrderByEndAtDesc(userId)
        return AdminStudentView(
            userId = user.id,
            loginId = user.email,
            name = user.name ?: user.email,
            gradeLabel = user.gradeLabel,
            levelId = user.levelId,
            school = user.school,
            region = user.region,
            studentPhone = user.studentPhone,
            parentPhone = user.parentPhone,
            orgId = orgId,
            orgName = orgName,
            classIds = classIds,
            classNames = classNames,
            subscriptionStatus = subscription?.status,
            subscriptionEndAt = subscription?.endAt?.toString(),
            status = user.status
        )
    }

    @Transactional
    fun updateSubscription(userId: String, request: AdminSubscriptionRequest) {
        userRepository.findById(userId).orElseThrow {
            ApiException("NOT_FOUND", "user not found", HttpStatus.NOT_FOUND)
        }
        val existing = subscriptionRepository.findTopByUserIdOrderByEndAtDesc(userId)
        if (request.status == "active") {
            val startAt = request.startAt?.let { LocalDateTime.parse(it + "T00:00:00") } ?: LocalDateTime.now()
            val endAt = request.endAt?.let { LocalDateTime.parse(it + "T23:59:59") }
                ?: startAt.plusYears(1)
            if (existing != null) {
                existing.status = "active"
                existing.startAt = startAt
                existing.endAt = endAt
                existing.canceledAt = null
                subscriptionRepository.save(existing)
            } else {
                subscriptionRepository.save(
                    SubscriptionEntity(
                        id = IdGenerator.newId("sub"),
                        userId = userId,
                        status = "active",
                        startAt = startAt,
                        endAt = endAt
                    )
                )
            }
        } else {
            // "free" — expire subscription
            if (existing != null) {
                existing.status = "expired"
                existing.canceledAt = LocalDateTime.now()
                subscriptionRepository.save(existing)
            }
        }
    }

    @Transactional
    fun createClass(request: AdminClassCreateRequest): ClassEntity {
        // orgId 위장 방어: HQ_ADMIN 자유 / ORG_ADMIN 본인 active 멤버십 강제
        val callerId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "인증되지 않은 요청입니다", HttpStatus.UNAUTHORIZED)
        val orgId = orgScopeResolver.resolveCallerOrgId(callerId, request.orgId)
            ?: throw ApiException("BAD_REQUEST", "기관 ID 가 필요합니다.", HttpStatus.BAD_REQUEST)
        val classEntity = ClassEntity(
            id = IdGenerator.newId("class"),
            orgId = orgId,
            name = request.name,
            description = request.description,
            levelId = request.levelId,
            grade = request.grade,
            status = request.status ?: "active",
            startAt = request.startAt?.let { LocalDate.parse(it) }
        )
        return classRepository.save(classEntity)
    }

    @Transactional
    fun updateClass(classId: String, request: AdminClassUpdateRequest): ClassEntity {
        val classEntity = classRepository.findById(classId).orElseThrow {
            ApiException("NOT_FOUND", "class not found", HttpStatus.NOT_FOUND)
        }
        request.name?.let { classEntity.name = it }
        request.description?.let { classEntity.description = it }
        request.levelId?.let { classEntity.levelId = it }
        request.grade?.let { classEntity.grade = it }
        request.status?.let { classEntity.status = it }
        request.startAt?.let { classEntity.startAt = LocalDate.parse(it) }
        return classRepository.save(classEntity)
    }

    @Transactional
    fun addStudentsToClass(classId: String, request: AdminClassStudentsRequest) {
        request.userIds.forEach { userId ->
            addStudentToClass(classId, userId)
        }
    }

    private fun addStudentToClass(classId: String, userId: String) {
        val existing = classMembershipRepository.findByClassIdAndUserId(classId, userId)
        if (existing == null) {
            classMembershipRepository.save(
                ClassMembershipEntity(
                    id = IdGenerator.newId("cm"),
                    classId = classId,
                    userId = userId,
                    status = "active"
                )
            )
        }
    }
}
