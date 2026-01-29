package com.korfarm.api.season

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import java.time.LocalDateTime

@Service
class SeasonService(
    private val seasonRepository: SeasonRepository,
    private val seasonHarvestRankingRepository: SeasonHarvestRankingRepository,
    private val seasonDuelRankingRepository: SeasonDuelRankingRepository,
    private val seasonAwardSnapshotRepository: SeasonAwardSnapshotRepository,
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

    fun getSeasonEntity(seasonId: String): SeasonEntity {
        return seasonRepository.findById(seasonId).orElseThrow {
            ApiException("SEASON_NOT_FOUND", "season not found", HttpStatus.NOT_FOUND)
        }
    }

    fun harvestRankings(seasonId: String, levelId: String): List<HarvestRankingItem> {
        val entity = seasonHarvestRankingRepository.findFirstBySeasonIdAndLevelIdOrderByGeneratedAtDesc(seasonId, levelId)
            ?: return emptyList()
        return objectMapper.readValue(entity.rankingJson, object : TypeReference<List<HarvestRankingItem>>() {})
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
