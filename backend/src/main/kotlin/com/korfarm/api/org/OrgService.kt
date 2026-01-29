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
import com.korfarm.api.user.UserEntity
import com.korfarm.api.user.UserRepository
import org.springframework.http.HttpStatus
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.util.UUID

@Service
class OrgService(
    private val orgRepository: OrgRepository,
    private val orgMembershipRepository: OrgMembershipRepository,
    private val classRepository: ClassRepository,
    private val classMembershipRepository: ClassMembershipRepository,
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder
) {
    @Transactional(readOnly = true)
    fun listActiveOrgs(): List<OrgSummary> {
        return orgRepository.findByStatusOrderByNameAsc("active").map { org ->
            OrgSummary(id = org.id, name = org.name)
        }
    }

    @Transactional(readOnly = true)
    fun listOrgsAdmin(): List<AdminOrgView> {
        return orgRepository.findAll().sortedBy { it.name }.map { org ->
            AdminOrgView(
                orgId = org.id,
                name = org.name,
                plan = org.plan,
                seatLimit = org.seatLimit,
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
                levelId = classEntity.levelId,
                grade = classEntity.grade,
                orgId = classEntity.orgId,
                orgName = orgName,
                seatCount = seatCount,
                status = classEntity.status
            )
        }
    }

    @Transactional(readOnly = true)
    fun listStudentsAdmin(): List<AdminStudentView> {
        val orgMap = orgRepository.findAll().associateBy { it.id }
        val memberships = orgMembershipRepository.findByStatus("active").filter { it.role == "STUDENT" }
        val orgByUser = memberships.groupBy { it.userId }.mapValues { it.value.first().orgId }
        return userRepository.findAll().sortedBy { it.createdAt }.map { user ->
            val orgId = orgByUser[user.id]
            val orgName = orgId?.let { orgMap[it]?.name }
            AdminStudentView(
                userId = user.id,
                loginId = user.email,
                name = user.name ?: user.email,
                gradeLabel = user.gradeLabel,
                levelId = user.levelId,
                orgId = orgId,
                orgName = orgName,
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

    @Transactional
    fun createOrgAdmin(orgId: String, request: AdminOrgAdminCreateRequest): UserEntity {
        val org = orgRepository.findById(orgId).orElseThrow {
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
                    role = "ORG_ADMIN",
                    status = "active"
                )
            )
        }
        return user
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

    @Transactional
    fun createClass(request: AdminClassCreateRequest): ClassEntity {
        val classEntity = ClassEntity(
            id = IdGenerator.newId("class"),
            orgId = request.orgId,
            name = request.name,
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
