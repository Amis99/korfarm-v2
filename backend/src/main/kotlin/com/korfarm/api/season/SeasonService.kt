package com.korfarm.api.season

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.economy.EconomyLedgerRepository
import com.korfarm.api.economy.SeasonScoreCalculator
import com.korfarm.api.economy.UserCropRepository
import com.korfarm.api.economy.UserSeedRepository
import com.korfarm.api.user.UserRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import java.time.LocalDateTime

@Service
class SeasonService(
    private val seasonRepository: SeasonRepository,
    private val seasonHarvestRankingRepository: SeasonHarvestRankingRepository,
    private val seasonDuelRankingRepository: SeasonDuelRankingRepository,
    private val seasonAwardSnapshotRepository: SeasonAwardSnapshotRepository,
    private val economyLedgerRepository: EconomyLedgerRepository,
    private val userCropRepository: UserCropRepository,
    private val userSeedRepository: UserSeedRepository,
    private val userRepository: UserRepository,
    private val objectMapper: ObjectMapper
) {
    fun currentSeason(): Season {
        val season = seasonRepository.findFirstByStatusOrderByStartAtDesc("active")
            ?: createDefaultSeason()
        return Season(
            seasonId = season.id,
            levelId = season.levelId,
            name = season.name,
            startAt = season.startAt.toString(),
            endAt = season.endAt.toString(),
            status = season.status
        )
    }

    fun allSeasons(): List<Season> {
        return seasonRepository.findAll()
            .sortedByDescending { it.startAt }
            .map { season ->
                Season(
                    seasonId = season.id,
                    levelId = season.levelId,
                    name = season.name,
                    startAt = season.startAt.toString(),
                    endAt = season.endAt.toString(),
                    status = season.status
                )
            }
    }

    fun getSeasonEntity(seasonId: String): SeasonEntity {
        return seasonRepository.findById(seasonId).orElseThrow {
            ApiException("SEASON_NOT_FOUND", "season not found", HttpStatus.NOT_FOUND)
        }
    }

    fun harvestRankings(seasonId: String, levelId: String): List<HarvestRankingItem> {
        // 시즌 점수 공식 적용 — 작물합×50 + 최소작물×500 + 총씨앗
        // (학생이 보는 자기 시즌 점수와 동일한 척도)
        val allCrops = userCropRepository.findAll()
        val allSeeds = userSeedRepository.findAll()

        val cropsByUser = allCrops.groupBy { it.userId }
        val seedsByUser = allSeeds.groupBy { it.userId }

        val userIds = (cropsByUser.keys + seedsByUser.keys).toSet()
        if (userIds.isEmpty()) return emptyList()

        val userMap = userRepository.findAllById(userIds).associateBy { it.id }

        // 각 사용자 시즌 점수 계산 + 0점 초과만 노출
        val ranked = userIds.map { userId ->
            val cropsMap = cropsByUser[userId]?.associate { it.cropType to it.count } ?: emptyMap()
            val totalSeeds = seedsByUser[userId]?.sumOf { it.count } ?: 0
            val score = SeasonScoreCalculator.calculate(cropsMap, totalSeeds)
            Triple(userId, score, userMap[userId]?.name ?: "?")
        }
            .filter { it.second > 0 }
            .sortedByDescending { it.second }

        return ranked.mapIndexed { idx, (userId, score, name) ->
            HarvestRankingItem(
                rank = idx + 1,
                userId = userId,
                userName = name,
                value = score
            )
        }
    }

    fun duelRankings(seasonId: String, levelId: String): DuelLeaderboards {
        val entity = seasonDuelRankingRepository.findFirstBySeasonIdAndLevelIdOrderByGeneratedAtDesc(seasonId, levelId)
            ?: return DuelLeaderboards(wins = emptyList(), winRate = emptyList(), bestStreak = emptyList())
        return objectMapper.readValue(entity.rankingJson, DuelLeaderboards::class.java)
    }

    fun awards(seasonId: String): SeasonAwards {
        val entity = seasonAwardSnapshotRepository.findFirstBySeasonIdOrderByCapturedAtDesc(seasonId)
            ?: return SeasonAwards(harvestAwards = emptyMap(), duelAwards = emptyMap())
        val map: Map<String, Any> = objectMapper.readValue(entity.snapshotJson, object : TypeReference<Map<String, Any>>() {})
        val harvestAwards = map["harvest_awards"] as? Map<String, Any> ?: emptyMap()
        val duelAwards = map["duel_awards"] as? Map<String, Any> ?: emptyMap()
        return SeasonAwards(harvestAwards = harvestAwards, duelAwards = duelAwards)
    }

    private fun createDefaultSeason(): SeasonEntity {
        val now = LocalDateTime.now()
        val season = SeasonEntity(
            id = IdGenerator.newId("season"),
            name = "Default Season",
            levelId = "frege1",
            startAt = now,
            endAt = now.plusMonths(1),
            status = "active"
        )
        return seasonRepository.save(season)
    }
}
