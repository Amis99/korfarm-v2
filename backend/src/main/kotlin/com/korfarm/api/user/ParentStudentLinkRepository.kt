package com.korfarm.api.user

import org.springframework.data.jpa.repository.JpaRepository

interface ParentStudentLinkRepository : JpaRepository<ParentStudentLinkEntity, String> {
    fun existsByParentUserIdAndStatus(parentUserId: String, status: String): Boolean
    fun findByParentUserIdAndStatus(parentUserId: String, status: String): List<ParentStudentLinkEntity>
    fun findByParentUserId(parentUserId: String): List<ParentStudentLinkEntity>
    fun findByParentUserIdAndStudentUserId(parentUserId: String, studentUserId: String): ParentStudentLinkEntity?
}
