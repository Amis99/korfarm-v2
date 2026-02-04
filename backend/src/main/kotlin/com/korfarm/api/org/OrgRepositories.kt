package com.korfarm.api.org

import org.springframework.data.jpa.repository.JpaRepository

interface OrgRepository : JpaRepository<OrgEntity, String> {
    fun findByStatusOrderByNameAsc(status: String): List<OrgEntity>
}
interface OrgMembershipRepository : JpaRepository<OrgMembershipEntity, String> {
    fun findByUserIdAndStatus(userId: String, status: String): List<OrgMembershipEntity>
    fun findByOrgIdAndUserId(orgId: String, userId: String): OrgMembershipEntity?
    fun findByOrgIdAndStatus(orgId: String, status: String): List<OrgMembershipEntity>
    fun findByStatus(status: String): List<OrgMembershipEntity>
}

interface ClassRepository : JpaRepository<ClassEntity, String>

interface ClassMembershipRepository : JpaRepository<ClassMembershipEntity, String> {
    fun findByUserIdAndStatus(userId: String, status: String): List<ClassMembershipEntity>
    fun findByClassIdAndUserId(classId: String, userId: String): ClassMembershipEntity?
    fun findByClassIdAndStatus(classId: String, status: String): List<ClassMembershipEntity>
    fun countByClassIdAndStatus(classId: String, status: String): Int
}
