package com.korfarm.api.billing

import org.springframework.data.jpa.repository.JpaRepository

interface OrgBillingRepository : JpaRepository<OrgBillingEntity, String> {
    fun findByOrgIdOrderByYearMonthDesc(orgId: String): List<OrgBillingEntity>
    fun findByOrgIdAndYearMonth(orgId: String, yearMonth: String): OrgBillingEntity?
    fun findByOrgIdAndStatus(orgId: String, status: String): List<OrgBillingEntity>
    fun findByStatus(status: String): List<OrgBillingEntity>
    fun existsByOrgIdAndStatus(orgId: String, status: String): Boolean
}
