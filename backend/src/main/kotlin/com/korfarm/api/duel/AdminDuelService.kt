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
    private val themeSubServerRepository: ThemeSubServerRepository,
    private val seasonService: com.korfarm.api.season.SeasonService,
    private val userRepository: com.korfarm.api.user.UserRepository,
    private val objectMapper: ObjectMapper
) {
    /**
     * 테마 대결 랭킹 — 기관 통합(같은 orgId 의 모든 서브 서버 합산) + 서브 서버별.
     * 시즌 미지정 시 현재 시즌 사용.
     */
    fun themeRankings(orgId: String, seasonId: String?): Map<String, Any?> {
        val sid = seasonId ?: seasonService.currentSeason().seasonId
        val subs = themeSubServerRepository.findByOrgIdOrderByCreatedAtDesc(orgId)
        val ids = subs.map { it.id }
        if (ids.isEmpty()) {
            return mapOf(
                "orgId" to orgId,
                "seasonId" to sid,
                "aggregated" to emptyList<Any>(),
                "perServer" to emptyList<Any>()
            )
        }
        val allStats = duelStatRepository.findBySeasonIdAndServerIdIn(sid, ids)
        // 사용자 메타 일괄 조회
        val userIds = allStats.map { it.userId }.distinct()
        val userMap = userRepository.findAllById(userIds).associateBy { it.id }
        fun displayName(userId: String): String {
            val u = userMap[userId] ?: return userId
            val name = u.name?.takeIf { it.isNotBlank() } ?: u.email
            val school = u.school?.takeIf { it.isNotBlank() }
            val grade = u.gradeLabel?.takeIf { it.isNotBlank() }
            val parts = listOfNotNull(school, grade).joinToString(" ")
            return if (parts.isNotBlank()) "$name ($parts)" else name
        }

        // 통합 랭킹 — userId 별 합산
        val aggregated = allStats.groupBy { it.userId }.map { (userId, list) ->
            val wins = list.sumOf { it.wins }
            val losses = list.sumOf { it.losses }
            val matches = wins + losses
            val winRate = if (matches > 0) wins.toDouble() / matches else 0.0
            val bestStreak = list.maxOfOrNull { it.bestStreak } ?: 0
            mapOf<String, Any?>(
                "userId" to userId,
                "displayName" to displayName(userId),
                "wins" to wins,
                "losses" to losses,
                "matches" to matches,
                "winRate" to winRate,
                "bestStreak" to bestStreak
            )
        }.sortedWith(
            compareByDescending<Map<String, Any?>> { it["wins"] as Int }
                .thenByDescending { it["winRate"] as Double }
        ).take(50)

        // 서브 서버별
        val perServer = subs.map { sub ->
            val subStats = allStats.filter { it.serverId == sub.id }
                .sortedByDescending { it.wins }
                .take(50)
                .mapIndexed { idx, s ->
                    val matches = s.wins + s.losses
                    mapOf<String, Any?>(
                        "rank" to idx + 1,
                        "userId" to s.userId,
                        "displayName" to displayName(s.userId),
                        "wins" to s.wins,
                        "losses" to s.losses,
                        "matches" to matches,
                        "winRate" to s.winRate.toDouble(),
                        "bestStreak" to s.bestStreak
                    )
                }
            mapOf<String, Any?>(
                "serverId" to sub.id,
                "subName" to sub.subName,
                "status" to sub.status,
                "expireAt" to sub.expireAt?.toString(),
                "leaderboard" to subStats
            )
        }
        return mapOf(
            "orgId" to orgId,
            "seasonId" to sid,
            "aggregated" to aggregated,
            "perServer" to perServer
        )
    }

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
        val serverId = request.levelId ?: season.levelId
        val leaderboards = buildLeaderboards(season.id, serverId)
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
    fun recalculate(seasonId: String, serverId: String): SeasonDuelRankingEntity {
        val leaderboards = buildLeaderboards(seasonId, serverId)
        val ranking = SeasonDuelRankingEntity(
            id = IdGenerator.newId("drank"),
            seasonId = seasonId,
            levelId = serverId,
            rankingJson = objectMapper.writeValueAsString(leaderboards),
            generatedAt = LocalDateTime.now()
        )
        return seasonDuelRankingRepository.save(ranking)
    }

    /**
     * 시즌·서버별 가장 최근 ranking snapshot 을 가져와 leaderboards 로 파싱.
     * snapshot 이 없으면 null 응답.
     */
    fun latestRankingSnapshot(seasonId: String, serverId: String): Map<String, Any?> {
        val snapshots = seasonDuelRankingRepository.findAll()
            .filter { it.seasonId == seasonId && it.levelId == serverId }
            .sortedByDescending { it.generatedAt }
        val latest = snapshots.firstOrNull()
        if (latest != null) {
            @Suppress("UNCHECKED_CAST")
            val parsed = objectMapper.readValue(latest.rankingJson, Map::class.java) as Map<String, Any?>
            val enriched = enrichSnapshotMap(parsed)
            return mapOf(
                "seasonId" to seasonId,
                "serverId" to serverId,
                "generatedAt" to latest.generatedAt.toString(),
                "leaderboards" to enriched
            )
        }
        // snapshot 이 없으면 즉석 계산 (read-only, save 안 함)
        val live = buildLeaderboards(seasonId, serverId)
        return mapOf(
            "seasonId" to seasonId,
            "serverId" to serverId,
            "generatedAt" to null,
            "leaderboards" to mapOf(
                "wins" to live.wins,
                "winRate" to live.winRate,
                "bestStreak" to live.bestStreak
            ),
            "live" to true
        )
    }

    /** userId 들에 대해 한 번에 user lookup. AI 는 fallback 표기. */
    private fun lookupUsers(userIds: Collection<String>): Map<String, Map<String, String?>> {
        val realIds = userIds.filter { !it.startsWith("ai_player_") }.distinct()
        val userMap = if (realIds.isEmpty()) emptyMap()
                      else userRepository.findAllById(realIds).associateBy { it.id }
        return userIds.distinct().associateWith { uid ->
            if (uid.startsWith("ai_player_")) {
                mapOf("displayName" to "AI ${uid.removePrefix("ai_player_")}", "name" to null, "school" to null, "grade" to null)
            } else {
                val u = userMap[uid]
                if (u == null) {
                    mapOf("displayName" to uid, "name" to null, "school" to null, "grade" to null)
                } else {
                    val name = u.name?.takeIf { it.isNotBlank() } ?: u.email
                    val school = u.school?.takeIf { it.isNotBlank() }
                    val grade = u.gradeLabel?.takeIf { it.isNotBlank() }
                    val parts = listOfNotNull(school, grade).joinToString(" ")
                    val display = if (parts.isNotBlank()) "$name ($parts)" else name
                    mapOf("displayName" to display, "name" to name, "school" to school, "grade" to grade)
                }
            }
        }
    }

    private fun enrichItem(item: DuelLeaderboardItem, lookup: Map<String, Map<String, String?>>): DuelLeaderboardItem {
        val meta = lookup[item.userId] ?: return item
        return item.copy(
            displayName = meta["displayName"],
            name = meta["name"],
            school = meta["school"],
            grade = meta["grade"]
        )
    }

    private fun buildLeaderboards(seasonId: String, serverId: String): DuelLeaderboards {
        val winsStats = duelStatRepository.findTop50BySeasonIdAndServerIdOrderByWinsDesc(seasonId, serverId)
        val winRateStats = duelStatRepository.findTop50BySeasonIdAndServerIdOrderByWinRateDesc(seasonId, serverId)
        val bestStreakStats = duelStatRepository.findTop50BySeasonIdAndServerIdOrderByBestStreakDesc(seasonId, serverId)
        val allIds = (winsStats + winRateStats + bestStreakStats).map { it.userId }
        val lookup = lookupUsers(allIds)

        val wins = winsStats.mapIndexed { index, stat ->
            DuelLeaderboardItem(rank = index + 1, userId = stat.userId, value = stat.wins.toDouble())
        }.map { enrichItem(it, lookup) }
        val winRate = winRateStats.mapIndexed { index, stat ->
            val matches = stat.wins + stat.losses
            DuelLeaderboardItem(rank = index + 1, userId = stat.userId, value = stat.winRate.toDouble(), matches = matches)
        }.map { enrichItem(it, lookup) }
        val bestStreak = bestStreakStats.mapIndexed { index, stat ->
            DuelLeaderboardItem(rank = index + 1, userId = stat.userId, value = stat.bestStreak.toDouble())
        }.map { enrichItem(it, lookup) }
        return DuelLeaderboards(wins = wins, winRate = winRate, bestStreak = bestStreak)
    }

    /** 옛 snapshot JSON 에는 displayName 이 없으므로, 응답 직전에 user lookup 으로 채워넣는다. */
    private fun enrichSnapshotMap(parsed: Map<*, *>): Map<String, List<Map<String, Any?>>> {
        val result = mutableMapOf<String, List<Map<String, Any?>>>()
        val collectIds = mutableListOf<String>()
        for ((_, listVal) in parsed) {
            if (listVal is List<*>) {
                for (item in listVal) {
                    if (item is Map<*, *>) {
                        (item["userId"] as? String)?.let { collectIds += it }
                    }
                }
            }
        }
        val lookup = lookupUsers(collectIds)
        for ((key, listVal) in parsed) {
            val k = key as? String ?: continue
            if (listVal !is List<*>) { result[k] = emptyList(); continue }
            result[k] = listVal.mapNotNull { item ->
                if (item !is Map<*, *>) return@mapNotNull null
                val merged = mutableMapOf<String, Any?>()
                for ((mk, mv) in item) merged[mk as String] = mv
                val uid = merged["userId"] as? String
                if (uid != null) {
                    val meta = lookup[uid]
                    if (meta != null) {
                        merged["displayName"] = meta["displayName"]
                        merged["name"] = meta["name"]
                        merged["school"] = meta["school"]
                        merged["grade"] = meta["grade"]
                    }
                }
                merged
            }
        }
        return result
    }
}
