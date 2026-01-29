package com.korfarm.api.duel

import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.contracts.AdminDuelSeasonRequest
import com.korfarm.api.contracts.AdminDuelSnapshotRequest
import com.korfarm.api.season.DuelLeaderboardItem
import com.korfarm.api.season.DuelLeaderboards
import com.korfarm.api.season.SeasonAwardSnapshotEntity
import com.korfarm.api.season.SeasonDuelRankingEntity
import com.korfarm.api.season.SeasonEntity
import com.korfarm.api.season.SeasonRepository
import com.korfarm.api.season.SeasonDuelRankingRepository
import com.korfarm.api.season.SeasonAwardSnapshotRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class AdminDuelService(
    private val seasonRepository: SeasonRepository,
    private val seasonDuelRankingRepository: SeasonDuelRankingRepository,
    private val seasonAwardSnapshotRepository: SeasonAwardSnapshotRepository,
    private val duelStatRepository: DuelStatRepository,
    private val objectMapper: ObjectMapper
) {
    @Transactional
    fun createSeason(request: AdminDuelSeasonRequest): SeasonEntity {
        val startAt = LocalDateTime.parse(request.startAt)
        val endAt = LocalDateTime.parse(request.endAt)
        val status = when {
            LocalDateTime.now().isBefore(startAt) -> "scheduled"
            LocalDateTime.now().isAfter(endAt) -> "completed"
            else -> "active"
        }
        val entity = SeasonEntity(
            id = IdGenerator.newId("season"),
            name = request.name,
            levelId = request.levelId,
            startAt = startAt,
            endAt = endAt,
            status = status
        )
        return seasonRepository.save(entity)
    }

    @Transactional
    fun snapshot(request: AdminDuelSnapshotRequest): SeasonAwardSnapshotEntity {
        val season = seasonRepository.findById(request.seasonId).orElseThrow {
            ApiException("NOT_FOUND", "season not found", HttpStatus.NOT_FOUND)
        }
        val levelId = request.levelId ?: season.levelId
        val leaderboards = buildLeaderboards(season.id, levelId)
        val awards = mapOf(
            "duel_awards" to mapOf(
                "wins" to leaderboards.wins.take(3),
                "win_rate" to leaderboards.winRate.take(3),
                "best_streak" to leaderboards.bestStreak.take(3)
            ),
            "harvest_awards" to emptyMap<String, Any>()
        )
        val snapshot = SeasonAwardSnapshotEntity(
            id = IdGenerator.newId("award"),
            seasonId = season.id,
            snapshotJson = objectMapper.writeValueAsString(awards),
            capturedAt = LocalDateTime.now()
        )
        return seasonAwardSnapshotRepository.save(snapshot)
    }

    @Transactional
    fun recalculate(seasonId: String, levelId: String): SeasonDuelRankingEntity {
        val leaderboards = buildLeaderboards(seasonId, levelId)
        val ranking = SeasonDuelRankingEntity(
            id = IdGenerator.newId("drank"),
            seasonId = seasonId,
            levelId = levelId,
            rankingJson = objectMapper.writeValueAsString(leaderboards),
            generatedAt = LocalDateTime.now()
        )
        return seasonDuelRankingRepository.save(ranking)
    }

    private fun buildLeaderboards(seasonId: String, levelId: String): DuelLeaderboards {
        val wins = duelStatRepository.findTop50BySeasonIdAndLevelIdOrderByWinsDesc(seasonId, levelId)
            .mapIndexed { index, stat ->
                DuelLeaderboardItem(rank = index + 1, userId = stat.userId, value = stat.wins.toDouble())
            }
        val winRate = duelStatRepository.findTop50BySeasonIdAndLevelIdOrderByWinRateDesc(seasonId, levelId)
            .mapIndexed { index, stat ->
                val matches = stat.wins + stat.losses
                DuelLeaderboardItem(rank = index + 1, userId = stat.userId, value = stat.winRate.toDouble(), matches = matches)
            }
        val bestStreak = duelStatRepository.findTop50BySeasonIdAndLevelIdOrderByBestStreakDesc(seasonId, levelId)
            .mapIndexed { index, stat ->
                DuelLeaderboardItem(rank = index + 1, userId = stat.userId, value = stat.bestStreak.toDouble())
            }
        return DuelLeaderboards(wins = wins, winRate = winRate, bestStreak = bestStreak)
    }
}
