package com.korfarm.api.season

import com.korfarm.api.economy.EconomyLedgerRepository
import com.korfarm.api.economy.SeasonScoreCalculator
import com.korfarm.api.org.OrgMembershipRepository
import com.korfarm.api.user.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * 누적 (평생) 랭킹 서비스 — 2026-05-16 사용자 결정.
 *
 * 시즌과 무관하게 economy_ledger 의 양수 적립(`delta > 0`) 합산으로 평생 누적 점수 계산.
 * - currency_type='seed' + 양수 → 평생 누적 씨앗
 * - currency_type='crop' + 양수 → 평생 누적 작물 (item_type 별 5종)
 *
 * 시즌 점수 공식과 동일 (SeasonScoreCalculator) 적용.
 * 학생(STUDENT)만, 관리자·학부모 제외.
 */
@Service
class LifetimeRankingService(
    private val economyLedgerRepository: EconomyLedgerRepository,
    private val userRepository: UserRepository,
    private val orgMembershipRepository: OrgMembershipRepository,
) {
    @Transactional(readOnly = true)
    fun rankings(levelId: String?): List<HarvestRankingItem> {
        // 학생 권한자만
        val studentUserIds = orgMembershipRepository.findByStatus("active")
            .filter { it.role == "STUDENT" }
            .map { it.userId }
            .toSet()
        if (studentUserIds.isEmpty()) return emptyList()

        // 모든 적립 ledger row 조회 — 양수 delta 만
        // (음수=차감 ledger 는 무시. 결제·교환 모두 평생 누적 점수에 영향 X)
        val allLedgers = economyLedgerRepository.findAll()
            .filter { it.delta > 0 && it.userId in studentUserIds }
            .filter { it.currencyType == "seed" || it.currencyType == "crop" }

        if (allLedgers.isEmpty()) return emptyList()

        // 사용자별 합산
        data class Acc(var totalSeeds: Int = 0, val crops: MutableMap<String, Int> = mutableMapOf())
        val accByUser = mutableMapOf<String, Acc>()
        for (l in allLedgers) {
            val acc = accByUser.getOrPut(l.userId) { Acc() }
            when (l.currencyType) {
                "seed" -> acc.totalSeeds += l.delta
                "crop" -> {
                    val cropType = l.itemType ?: "crop_wheat"
                    acc.crops[cropType] = (acc.crops[cropType] ?: 0) + l.delta
                }
            }
        }

        val userMap = userRepository.findAllById(accByUser.keys).associateBy { it.id }
        val levelFiltered = if (levelId.isNullOrBlank()) {
            accByUser.keys
        } else {
            accByUser.keys.filter { userMap[it]?.levelId == levelId }
        }
        if (levelFiltered.isEmpty()) return emptyList()

        data class RankRow(val userId: String, val score: Int, val name: String, val img: String?)
        val ranked = levelFiltered.map { uid ->
            val acc = accByUser[uid]!!
            val score = SeasonScoreCalculator.calculate(acc.crops, acc.totalSeeds)
            val u = userMap[uid]
            RankRow(uid, score, u?.name ?: "?", u?.profileImageUrl)
        }
            .filter { it.score > 0 }
            .sortedByDescending { it.score }

        return ranked.mapIndexed { idx, row ->
            HarvestRankingItem(
                rank = idx + 1,
                userId = row.userId,
                userName = row.name,
                value = row.score,
                profileImageUrl = row.img,
            )
        }
    }
}
