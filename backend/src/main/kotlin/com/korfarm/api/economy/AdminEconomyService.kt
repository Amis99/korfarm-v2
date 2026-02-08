package com.korfarm.api.economy

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.duel.DuelService
import com.korfarm.api.duel.DuelStatsView
import com.korfarm.api.learning.FarmHistoryResponse
import com.korfarm.api.learning.FarmLearningService
import com.korfarm.api.org.OrgMembershipRepository
import com.korfarm.api.security.SecurityUtils
import com.korfarm.api.test.TestHistoryItem
import com.korfarm.api.test.TestService
import com.korfarm.api.user.UserRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class AdminEconomyService(
    private val economyService: EconomyService,
    private val userSeedRepository: UserSeedRepository,
    private val userCropRepository: UserCropRepository,
    private val userFertilizerRepository: UserFertilizerRepository,
    private val economyLedgerRepository: EconomyLedgerRepository,
    private val userRepository: UserRepository,
    private val orgMembershipRepository: OrgMembershipRepository,
    private val farmLearningService: FarmLearningService,
    private val testService: TestService,
    private val duelService: DuelService
) {
    // ORG_ADMIN인 경우 해당 학생이 자기 기관 소속인지 검증
    fun validateStudentAccess(targetUserId: String) {
        val roles = SecurityUtils.currentRoles()
        if (roles.contains("HQ_ADMIN")) return

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

    fun validateUserExists(userId: String) {
        userRepository.findById(userId).orElseThrow {
            ApiException("NOT_FOUND", "사용자를 찾을 수 없습니다: " + userId, HttpStatus.NOT_FOUND)
        }
    }

    @Transactional(readOnly = true)
    fun getStudentInventory(userId: String): Inventory {
        validateUserExists(userId)
        validateStudentAccess(userId)
        return economyService.getInventory(userId)
    }

    @Transactional(readOnly = true)
    fun getStudentLedger(userId: String): List<LedgerEntry> {
        validateUserExists(userId)
        validateStudentAccess(userId)
        return economyService.getLedger(userId)
    }

    @Transactional(readOnly = true)
    fun getStudentLearningLogs(userId: String): FarmHistoryResponse {
        validateUserExists(userId)
        validateStudentAccess(userId)
        return farmLearningService.getHistory(userId)
    }

    @Transactional(readOnly = true)
    fun getStudentTestHistory(userId: String): List<TestHistoryItem> {
        validateUserExists(userId)
        validateStudentAccess(userId)
        return testService.getHistory(userId)
    }

    @Transactional(readOnly = true)
    fun getStudentDuelStats(userId: String, serverId: String): DuelStatsView {
        validateUserExists(userId)
        validateStudentAccess(userId)
        return duelService.getStats(userId, serverId)
    }

    @Transactional
    fun grantInventory(userId: String, request: AdminInventoryAdjustRequest): AdminInventoryAdjustResult {
        validateUserExists(userId)
        validateStudentAccess(userId)

        val adminUserId = SecurityUtils.currentUserId() ?: "system"
        val adminReason = "[관리자 지급] " + request.reason + " (by " + adminUserId + ")"
        val delta = request.amount

        when (request.type) {
            "seed" -> {
                val itemType = request.itemType
                    ?: throw ApiException("BAD_REQUEST", "씨앗 지급 시 itemType은 필수입니다", HttpStatus.BAD_REQUEST)
                economyService.adjustSeed(userId, itemType, delta, adminReason, "admin_grant", adminUserId)
            }
            "crop" -> {
                val itemType = request.itemType
                    ?: throw ApiException("BAD_REQUEST", "수확물 지급 시 itemType은 필수입니다", HttpStatus.BAD_REQUEST)
                economyService.adjustCrop(userId, itemType, delta, adminReason, "admin_grant", adminUserId)
            }
            "fertilizer" -> {
                adjustFertilizer(userId, delta, adminReason, "admin_grant", adminUserId)
            }
            else -> throw ApiException("BAD_REQUEST", "잘못된 type입니다: " + request.type, HttpStatus.BAD_REQUEST)
        }

        return AdminInventoryAdjustResult(
            userId = userId,
            type = request.type,
            itemType = request.itemType,
            delta = delta,
            reason = request.reason,
            inventory = economyService.getInventory(userId)
        )
    }

    @Transactional
    fun deductInventory(userId: String, request: AdminInventoryAdjustRequest): AdminInventoryAdjustResult {
        validateUserExists(userId)
        validateStudentAccess(userId)

        val adminUserId = SecurityUtils.currentUserId() ?: "system"
        val adminReason = "[관리자 차감] " + request.reason + " (by " + adminUserId + ")"
        val delta = -request.amount

        when (request.type) {
            "seed" -> {
                val itemType = request.itemType
                    ?: throw ApiException("BAD_REQUEST", "씨앗 차감 시 itemType은 필수입니다", HttpStatus.BAD_REQUEST)
                economyService.adjustSeed(userId, itemType, delta, adminReason, "admin_deduct", adminUserId)
            }
            "crop" -> {
                val itemType = request.itemType
                    ?: throw ApiException("BAD_REQUEST", "수확물 차감 시 itemType은 필수입니다", HttpStatus.BAD_REQUEST)
                economyService.adjustCrop(userId, itemType, delta, adminReason, "admin_deduct", adminUserId)
            }
            "fertilizer" -> {
                adjustFertilizer(userId, delta, adminReason, "admin_deduct", adminUserId)
            }
            else -> throw ApiException("BAD_REQUEST", "잘못된 type입니다: " + request.type, HttpStatus.BAD_REQUEST)
        }

        return AdminInventoryAdjustResult(
            userId = userId,
            type = request.type,
            itemType = request.itemType,
            delta = delta,
            reason = request.reason,
            inventory = economyService.getInventory(userId)
        )
    }

    private fun adjustFertilizer(userId: String, delta: Int, reason: String, refType: String?, refId: String?) {
        val fertilizer = userFertilizerRepository.findForUpdate(userId)
            ?: if (delta > 0) {
                UserFertilizerEntity(
                    id = IdGenerator.newId("uf"),
                    userId = userId,
                    count = 0
                )
            } else {
                throw ApiException("INSUFFICIENT_FERTILIZER", "비료가 부족합니다", HttpStatus.BAD_REQUEST)
            }
        val nextCount = fertilizer.count + delta
        if (nextCount < 0) {
            throw ApiException("INSUFFICIENT_FERTILIZER", "비료가 부족합니다 (현재: " + fertilizer.count + ", 요청: " + delta + ")", HttpStatus.BAD_REQUEST)
        }
        fertilizer.count = nextCount
        userFertilizerRepository.save(fertilizer)

        val ledger = EconomyLedgerEntity(
            id = IdGenerator.newId("lg"),
            userId = userId,
            currencyType = "fertilizer",
            itemType = "fertilizer",
            delta = delta,
            reason = reason,
            refType = refType,
            refId = refId
        )
        economyLedgerRepository.save(ledger)
    }
}
