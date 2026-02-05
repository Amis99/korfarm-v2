package com.korfarm.api.org

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
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
    private val passwordEncoder: PasswordEncoder
) {
    @Transactional(readOnly = true)
    fun listActiveOrgs(): List<OrgSummary> {
        return orgRepository.findByStatusOrderByNameAsc("active").map { org ->
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

    @Transactional(readOnly = true)
    fun listOrgsAdmin(): List<AdminOrgView> {
        val userMap = userRepository.findAll().associateBy { it.id }
        val adminMemberships = orgMembershipRepository.findByStatus("active")
            .filter { it.role == "HQ_ADMIN" || it.role == "ORG_ADMIN" }
            .groupBy { it.orgId }
        return orgRepository.findAll().sortedBy { it.name }.map { org ->
            val admins = (adminMemberships[org.id] ?: emptyList()).mapNotNull { m ->
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
                seatLimit = org.seatLimit,
                admins = admins,
                status = org.status
            )
        }
    }

    @Transactional(readOnly = true)
    fun listClassesAdmin(): List<AdminClassView> {
        val orgMap = orgRepository.findAll().associateBy { it.id }
        return classRepository.findAll().sortedBy { it.name }.map { classEntity ->
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

    @Transactional
    fun deactivateClass(classId: String) {
        val classEntity = classRepository.findById(classId).orElseThrow {
            ApiException("NOT_FOUND", "수강반을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        classEntity.status = "inactive"
        classRepository.save(classEntity)
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
        // STUDENT 역할인 사용자만 표시 (부모/관리자 제외)
        var students = userRepository.findAll()
            .filter { it.id in studentUserIds }
            .sortedBy { it.createdAt }
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
    fun createOrg(request: AdminOrgCreateRequest): OrgEntity {
        val org = OrgEntity(
            id = IdGenerator.newId("org"),
            name = request.name,
            status = request.status ?: "active",
            plan = request.plan,
            orgType = request.orgType,
            addressRegion = request.addressRegion,
            addressDetail = request.addressDetail,
            seatLimit = request.seatLimit ?: 0
        )
        return orgRepository.save(org)
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
        request.seatLimit?.let { org.seatLimit = it }
        request.status?.let { org.status = it }
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
        if (existing == null) {
            orgMembershipRepository.save(
                OrgMembershipEntity(
                    id = IdGenerator.newId("om"),
                    orgId = org.id,
                    userId = user.id,
                    role = "ORG_ADMIN",
                    status = "active"
                )
            )
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
            seatLimit = org.seatLimit,
            admins = admins,
            status = org.status
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
        val classEntity = ClassEntity(
            id = IdGenerator.newId("class"),
            orgId = request.orgId,
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
