package com.korfarm.api.user

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class ParentLinkService(
    private val parentStudentLinkRepository: ParentStudentLinkRepository,
    private val userRepository: UserRepository
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
}
