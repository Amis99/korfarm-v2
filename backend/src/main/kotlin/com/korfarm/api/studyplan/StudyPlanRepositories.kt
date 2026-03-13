package com.korfarm.api.studyplan

import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDate

interface StudyPlanRepository : JpaRepository<StudyPlanEntity, String> {
    fun findByOrgIdAndStatusOrderByCreatedAtDesc(orgId: String, status: String): List<StudyPlanEntity>
    fun findByStatusOrderByCreatedAtDesc(status: String): List<StudyPlanEntity>
    fun findByOrgIdOrderByCreatedAtDesc(orgId: String): List<StudyPlanEntity>
}

interface StudyPlanTargetRepository : JpaRepository<StudyPlanTargetEntity, String> {
    fun findByPlanId(planId: String): List<StudyPlanTargetEntity>
    fun findByTargetTypeAndTargetId(targetType: String, targetId: String): List<StudyPlanTargetEntity>
    fun deleteByPlanId(planId: String)
}

interface StudyPlanScopeRepository : JpaRepository<StudyPlanScopeEntity, String> {
    fun findByPlanIdOrderBySortOrder(planId: String): List<StudyPlanScopeEntity>
    fun deleteByPlanId(planId: String)
}

interface StudyPlanAssetRepository : JpaRepository<StudyPlanAssetEntity, String> {
    fun findByPlanIdOrderBySortOrder(planId: String): List<StudyPlanAssetEntity>
    fun deleteByPlanId(planId: String)
}

interface StudyPlanCellRepository : JpaRepository<StudyPlanCellEntity, String> {
    fun findByPlanIdAndUserId(planId: String, userId: String): List<StudyPlanCellEntity>
    fun findByPlanIdInAndUserId(planIds: Collection<String>, userId: String): List<StudyPlanCellEntity>
    fun findByPlanId(planId: String): List<StudyPlanCellEntity>
    fun findByScopeId(scopeId: String): List<StudyPlanCellEntity>
    fun findByAssetId(assetId: String): List<StudyPlanCellEntity>
    fun findByUserIdAndStatus(userId: String, status: String): List<StudyPlanCellEntity>
    fun findByUserIdAndCellRefIdIn(userId: String, cellRefIds: Collection<String>): List<StudyPlanCellEntity>
    fun findByScopeIdAndAssetIdAndUserId(scopeId: String, assetId: String, userId: String): StudyPlanCellEntity?
    fun deleteByScopeId(scopeId: String)
    fun deleteByAssetId(assetId: String)
    fun deleteByPlanId(planId: String)
}

interface StudyPlanCellFileRepository : JpaRepository<StudyPlanCellFileEntity, String> {
    fun findByCellId(cellId: String): List<StudyPlanCellFileEntity>
    fun deleteByCellId(cellId: String)
    fun deleteByCellIdIn(cellIds: Collection<String>)
}

interface StudyPlanEventRepository : JpaRepository<StudyPlanEventEntity, String> {
    fun findByPlanIdAndUserIdAndEventDateBetweenOrderByEventDate(
        planId: String, userId: String, start: LocalDate, end: LocalDate
    ): List<StudyPlanEventEntity>
    fun findByPlanIdAndEventDateBetweenOrderByEventDate(
        planId: String, start: LocalDate, end: LocalDate
    ): List<StudyPlanEventEntity>
    fun findByUserIdAndEventDateBetweenOrderByEventDate(
        userId: String, start: LocalDate, end: LocalDate
    ): List<StudyPlanEventEntity>
    fun deleteByPlanId(planId: String)
}

interface StudyPlanCellDateProjection {
    fun getUserId(): String
    fun getPlanId(): String
    fun getStatus(): String
    fun getScore(): Int?
    fun getReviewedAt(): java.time.LocalDateTime?
    fun getUpdatedAt(): java.time.LocalDateTime
}

interface StudyPlanScheduleRepository : JpaRepository<StudyPlanScheduleEntity, String> {
    fun findByPlanIdOrderByScheduledDate(planId: String): List<StudyPlanScheduleEntity>
    fun findByPlanIdAndScheduledDateBetweenOrderByScheduledDate(
        planId: String, start: LocalDate, end: LocalDate
    ): List<StudyPlanScheduleEntity>
    fun findByPlanIdInAndScheduledDateBetween(
        planIds: Collection<String>, start: LocalDate, end: LocalDate
    ): List<StudyPlanScheduleEntity>
    fun deleteByPlanId(planId: String)
}
