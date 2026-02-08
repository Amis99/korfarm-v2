package com.korfarm.api.org

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface OrgRepository : JpaRepository<OrgEntity, String> {
    fun findByStatusOrderByNameAsc(status: String): List<OrgEntity>

    // org_hq를 맨 위로, 나머지는 이름순 정렬
    @Query("SELECT o FROM OrgEntity o WHERE o.status = :status ORDER BY CASE WHEN o.id = 'org_hq' THEN 0 ELSE 1 END, o.name ASC")
    fun findByStatusOrderByHqFirstThenNameAsc(status: String): List<OrgEntity>
}
interface OrgMembershipRepository : JpaRepository<OrgMembershipEntity, String> {
    fun findByUserIdAndStatus(userId: String, status: String): List<OrgMembershipEntity>
    fun findByOrgIdAndUserId(orgId: String, userId: String): OrgMembershipEntity?
    fun findByOrgIdAndStatus(orgId: String, status: String): List<OrgMembershipEntity>
    fun findByStatus(status: String): List<OrgMembershipEntity>

    // 승인 대기 목록 조회 (기관별)
    fun findByOrgIdAndStatusOrderByRequestedAtDesc(orgId: String, status: String): List<OrgMembershipEntity>

    // 전체 승인 대기 목록 조회 (본사용)
    fun findByStatusOrderByRequestedAtDesc(status: String): List<OrgMembershipEntity>

    // 승인 대기 건수 (전체)
    fun countByStatus(status: String): Long

    // 승인 대기 건수 (특정 기관)
    fun countByOrgIdAndStatus(orgId: String, status: String): Long
}

interface ClassRepository : JpaRepository<ClassEntity, String>

interface ClassMembershipRepository : JpaRepository<ClassMembershipEntity, String> {
    fun findByUserIdAndStatus(userId: String, status: String): List<ClassMembershipEntity>
    fun findByClassIdAndUserId(classId: String, userId: String): ClassMembershipEntity?
    fun findByClassIdAndStatus(classId: String, status: String): List<ClassMembershipEntity>
    fun countByClassIdAndStatus(classId: String, status: String): Int
}
