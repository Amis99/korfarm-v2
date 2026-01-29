package com.korfarm.api.duel

import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.economy.EconomyService
import com.korfarm.api.season.DuelLeaderboardItem
import com.korfarm.api.season.DuelLeaderboards
import com.korfarm.api.season.SeasonService
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDateTime

@Service
class DuelService(
    private val duelRoomRepository: DuelRoomRepository,
    private val duelRoomPlayerRepository: DuelRoomPlayerRepository,
    private val duelMatchRepository: DuelMatchRepository,
    private val duelMatchPlayerRepository: DuelMatchPlayerRepository,
    private val duelQuestionRepository: DuelQuestionRepository,
    private val duelAnswerRepository: DuelAnswerRepository,
    private val duelStatRepository: DuelStatRepository,
    private val duelEscrowRepository: DuelEscrowRepository,
    private val queueStore: DuelQueueStore,
    private val seasonService: SeasonService,
    private val economyService: EconomyService,
    private val objectMapper: ObjectMapper
) {
    @Transactional(readOnly = true)
    fun listRooms(): List<DuelRoomView> {
        return duelRoomRepository.findByStatusOrderByCreatedAtDesc("open").map { toRoomView(it) }
    }

    @Transactional
    fun createRoom(userId: String, request: com.korfarm.api.contracts.DuelRoomCreateRequest): DuelRoomDetail {
        val room = DuelRoomEntity(
            id = IdGenerator.newId("room"),
            modeId = "default",
            levelId = request.levelId,
            roomSize = request.roomSize,
            stakeAmount = request.stakeAmount,
            status = "open",
            createdBy = userId
        )
        duelRoomRepository.save(room)
        val stakeSeedType = normalizeStakeSeedType(request.stakeCropType ?: "seed_wheat")
        val player = DuelRoomPlayerEntity(
            id = IdGenerator.newId("rp"),
            roomId = room.id,
            userId = userId,
            stakeCropType = stakeSeedType,
            status = "joined",
            joinedAt = LocalDateTime.now()
        )
        duelRoomPlayerRepository.save(player)
        return DuelRoomDetail(
            room = toRoomView(room),
            players = listOf(player.toView())
        )
    }

    @Transactional
    fun joinRoom(userId: String, roomId: String): DuelRoomJoinResult {
        val room = duelRoomRepository.findById(roomId).orElseThrow {
            ApiException("NOT_FOUND", "room not found", HttpStatus.NOT_FOUND)
        }
        if (room.status != "open") {
            throw ApiException("ROOM_CLOSED", "room not open", HttpStatus.CONFLICT)
        }
        val existing = duelRoomPlayerRepository.findByRoomIdAndUserId(roomId, userId)
        if (existing != null && existing.status == "joined") {
            return DuelRoomJoinResult(room = roomDetail(roomId))
        }
        val players = duelRoomPlayerRepository.findByRoomIdOrderByJoinedAtAsc(roomId)
        if (players.count { it.status == "joined" } >= room.roomSize) {
            throw ApiException("ROOM_FULL", "room full", HttpStatus.CONFLICT)
        }
        val stakeSeedType = normalizeStakeSeedType(players.firstOrNull()?.stakeCropType ?: "seed_wheat")
        val player = DuelRoomPlayerEntity(
            id = IdGenerator.newId("rp"),
            roomId = room.id,
            userId = userId,
            stakeCropType = stakeSeedType,
            status = "joined",
            joinedAt = LocalDateTime.now()
        )
        duelRoomPlayerRepository.save(player)
        val detail = roomDetail(roomId)
        val joinedCount = detail.players.count { it.status == "joined" }
        var matchId: String? = null
        if (joinedCount >= room.roomSize) {
            matchId = createMatchFromRoom(room, detail.players)
            room.status = "matched"
            duelRoomRepository.save(room)
        }
        return DuelRoomJoinResult(room = detail, matchId = matchId)
    }

    @Transactional
    fun leaveRoom(userId: String, roomId: String) {
        val player = duelRoomPlayerRepository.findByRoomIdAndUserId(roomId, userId)
            ?: return
        player.status = "left"
        duelRoomPlayerRepository.save(player)
        val remaining = duelRoomPlayerRepository.findByRoomIdOrderByJoinedAtAsc(roomId)
            .count { it.status == "joined" }
        if (remaining == 0) {
            duelRoomRepository.findById(roomId).ifPresent {
                it.status = "closed"
                duelRoomRepository.save(it)
            }
        }
    }

    @Transactional
    fun queueJoin(userId: String, levelId: String, stakeAmount: Int, stakeCropType: String, roomSize: Int): DuelQueueStatus {
        val entry = DuelQueueEntry(
            userId = userId,
            levelId = levelId,
            stakeAmount = stakeAmount,
            stakeCropType = normalizeStakeSeedType(stakeCropType),
            roomSize = roomSize
        )
        val result = queueStore.join(entry)
        if (result.matched.isNotEmpty()) {
            val matchId = createMatchFromQueue(levelId, stakeAmount, stakeCropType, result.matched)
            return DuelQueueStatus(status = "matched", matchId = matchId)
        }
        return DuelQueueStatus(status = "queued", position = result.position)
    }

    fun queueLeave(userId: String): DuelQueueStatus {
        val removed = queueStore.leave(userId)
        return DuelQueueStatus(status = if (removed) "left" else "not_found")
    }

    @Transactional(readOnly = true)
    fun getStats(userId: String, levelId: String): DuelStatsView {
        val season = seasonService.currentSeason()
        val stat = duelStatRepository.findBySeasonIdAndLevelIdAndUserId(season.seasonId, levelId, userId)
        if (stat == null) {
            return DuelStatsView(0, 0, 0.0, 0, 0, 0)
        }
        return DuelStatsView(
            wins = stat.wins,
            losses = stat.losses,
            winRate = stat.winRate.toDouble(),
            currentStreak = stat.currentStreak,
            bestStreak = stat.bestStreak,
            forfeitLosses = stat.forfeitLosses
        )
    }

    @Transactional(readOnly = true)
    fun leaderboards(levelId: String): DuelLeaderboards {
        val season = seasonService.currentSeason()
        val wins = duelStatRepository.findTop50BySeasonIdAndLevelIdOrderByWinsDesc(season.seasonId, levelId)
            .mapIndexed { index, stat ->
                DuelLeaderboardItem(rank = index + 1, userId = stat.userId, value = stat.wins.toDouble())
            }
        val winRates = duelStatRepository.findTop50BySeasonIdAndLevelIdOrderByWinRateDesc(season.seasonId, levelId)
            .mapIndexed { index, stat ->
                val matches = stat.wins + stat.losses
                DuelLeaderboardItem(rank = index + 1, userId = stat.userId, value = stat.winRate.toDouble(), matches = matches)
            }
        val streaks = duelStatRepository.findTop50BySeasonIdAndLevelIdOrderByBestStreakDesc(season.seasonId, levelId)
            .mapIndexed { index, stat ->
                DuelLeaderboardItem(rank = index + 1, userId = stat.userId, value = stat.bestStreak.toDouble())
            }
        return DuelLeaderboards(wins = wins, winRate = winRates, bestStreak = streaks)
    }

    @Transactional
    fun recordAnswer(matchId: String, userId: String, questionId: String, answer: String) {
        val answerJson = objectMapper.writeValueAsString(mapOf("answer" to answer))
        val existing = duelAnswerRepository.findByMatchIdAndUserId(matchId, userId)
            .firstOrNull { it.questionId == questionId }
        val entity = if (existing != null) {
            existing.answerJson = answerJson
            existing.submittedAt = LocalDateTime.now()
            existing
        } else {
            DuelAnswerEntity(
                id = IdGenerator.newId("ans"),
                matchId = matchId,
                questionId = questionId,
                userId = userId,
                answerJson = answerJson,
                isCorrect = null,
                submittedAt = LocalDateTime.now()
            )
        }
        duelAnswerRepository.save(entity)
    }

    @Transactional
    fun finishMatch(matchId: String) {
        val match = duelMatchRepository.findById(matchId).orElse(null) ?: return
        if (match.status == "finished") {
            return
        }
        val players = duelMatchPlayerRepository.findByMatchId(matchId)
        if (players.isEmpty()) {
            return
        }
        val answers = duelAnswerRepository.findByMatchId(matchId)
        val scores = players.associate { player ->
            val count = answers.count { it.userId == player.userId }
            player.userId to count
        }
        val maxScore = scores.values.maxOrNull() ?: 0
        val winners = scores.filterValues { it == maxScore }.keys
        val now = LocalDateTime.now()
        players.forEach { player ->
            val result = if (winners.size == 1 && winners.contains(player.userId)) "win" else "lose"
            player.result = result
            player.rankPosition = if (result == "win") 1 else 2
            duelMatchPlayerRepository.save(player)
            updateStats(match.seasonId, match.levelId, player.userId, result == "win")
        }
        match.status = "finished"
        match.endedAt = now
        duelMatchRepository.save(match)
        settleEscrow(matchId, winners.toList())
    }

    @Transactional(readOnly = true)
    fun getMatchQuestions(matchId: String): List<DuelQuestionEntity> {
        return duelQuestionRepository.findByMatchIdOrderByOrderIndexAsc(matchId)
    }

    @Transactional(readOnly = true)
    fun getMatchPlayers(matchId: String): List<DuelMatchPlayerEntity> {
        return duelMatchPlayerRepository.findByMatchId(matchId)
    }

    @Transactional(readOnly = true)
    fun getAnswerCount(matchId: String, userId: String): Int {
        return duelAnswerRepository.findByMatchIdAndUserId(matchId, userId).size
    }

    @Transactional(readOnly = true)
    fun getMatchResults(matchId: String): List<DuelMatchResultView> {
        return duelMatchPlayerRepository.findByMatchId(matchId).map {
            DuelMatchResultView(
                userId = it.userId,
                result = it.result,
                rankPosition = it.rankPosition
            )
        }
    }

    @Transactional
    fun createMatchFromRoom(room: DuelRoomEntity, players: List<DuelRoomPlayerView>): String {
        val entries = players.map {
            DuelQueueEntry(
                userId = it.userId,
                levelId = room.levelId,
                stakeAmount = room.stakeAmount,
                stakeCropType = normalizeStakeSeedType(it.stakeCropType),
                roomSize = room.roomSize
            )
        }
        return createMatch(
            room.levelId,
            room.stakeAmount,
            players.firstOrNull()?.stakeCropType ?: "seed_wheat",
            entries
        )
    }

    private fun createMatchFromQueue(
        levelId: String,
        stakeAmount: Int,
        stakeCropType: String,
        entries: List<DuelQueueEntry>
    ): String {
        return createMatch(levelId, stakeAmount, stakeCropType, entries)
    }

    private fun createMatch(
        levelId: String,
        stakeAmount: Int,
        stakeCropType: String,
        entries: List<DuelQueueEntry>
    ): String {
        val season = seasonService.currentSeason()
        val stakeSeedType = normalizeStakeSeedType(stakeCropType)
        val match = DuelMatchEntity(
            id = IdGenerator.newId("match"),
            seasonId = season.seasonId,
            levelId = levelId,
            status = "ongoing",
            startedAt = LocalDateTime.now()
        )
        duelMatchRepository.save(match)
        entries.forEach { entry ->
            val player = DuelMatchPlayerEntity(
                id = IdGenerator.newId("mp"),
                matchId = match.id,
                userId = entry.userId,
                result = "pending",
                rankPosition = null,
                stakeCropType = stakeSeedType,
                stakeAmount = stakeAmount
            )
            duelMatchPlayerRepository.save(player)
            economyService.adjustSeed(entry.userId, stakeSeedType, -stakeAmount, "duel_stake", "duel_match", match.id)
            duelEscrowRepository.save(
                DuelEscrowEntity(
                    id = IdGenerator.newId("esc"),
                    matchId = match.id,
                    userId = entry.userId,
                    cropType = stakeSeedType,
                    amount = stakeAmount,
                    status = "locked"
                )
            )
        }
        val questions = listOf("q1", "q2", "q3").mapIndexed { index, questionId ->
            DuelQuestionEntity(
                id = IdGenerator.newId("dq"),
                matchId = match.id,
                questionId = questionId,
                orderIndex = index + 1
            )
        }
        duelQuestionRepository.saveAll(questions)
        return match.id
    }

    private fun settleEscrow(matchId: String, winners: List<String>) {
        val escrows = duelEscrowRepository.findByMatchId(matchId)
        if (escrows.isEmpty()) {
            return
        }
        if (winners.size == 1) {
            val total = escrows.sumOf { it.amount }
            val seedType = escrows.first().cropType
            economyService.adjustSeed(winners.first(), seedType, total, "duel_reward", "duel_match", matchId)
            escrows.forEach {
                it.status = if (winners.contains(it.userId)) "won" else "lost"
                duelEscrowRepository.save(it)
            }
            return
        }
        escrows.forEach {
            economyService.adjustSeed(it.userId, it.cropType, it.amount, "duel_refund", "duel_match", matchId)
            it.status = "refunded"
            duelEscrowRepository.save(it)
        }
    }

    private fun normalizeStakeSeedType(stakeType: String): String {
        return if (stakeType.startsWith("crop_")) {
            stakeType.replaceFirst("crop_", "seed_")
        } else {
            stakeType
        }
    }

    private fun updateStats(seasonId: String, levelId: String, userId: String, win: Boolean) {
        val existing = duelStatRepository.findBySeasonIdAndLevelIdAndUserId(seasonId, levelId, userId)
        val stat = existing ?: DuelStatEntity(
            id = IdGenerator.newId("ds"),
            seasonId = seasonId,
            levelId = levelId,
            userId = userId,
            wins = 0,
            losses = 0,
            winRate = BigDecimal.ZERO,
            currentStreak = 0,
            bestStreak = 0,
            forfeitLosses = 0
        )
        if (win) {
            stat.wins += 1
            stat.currentStreak += 1
            if (stat.currentStreak > stat.bestStreak) {
                stat.bestStreak = stat.currentStreak
            }
        } else {
            stat.losses += 1
            stat.currentStreak = 0
        }
        val matches = stat.wins + stat.losses
        stat.winRate = if (matches == 0) {
            BigDecimal.ZERO
        } else {
            BigDecimal(stat.wins).divide(BigDecimal(matches), 4, java.math.RoundingMode.HALF_UP)
        }
        duelStatRepository.save(stat)
    }

    private fun toRoomView(room: DuelRoomEntity): DuelRoomView {
        val playerCount = duelRoomPlayerRepository.countByRoomIdAndStatus(room.id, "joined").toInt()
        return DuelRoomView(
            roomId = room.id,
            levelId = room.levelId,
            roomSize = room.roomSize,
            stakeAmount = room.stakeAmount,
            status = room.status,
            playerCount = playerCount,
            createdAt = room.createdAt
        )
    }

    private fun roomDetail(roomId: String): DuelRoomDetail {
        val room = duelRoomRepository.findById(roomId).orElseThrow {
            ApiException("NOT_FOUND", "room not found", HttpStatus.NOT_FOUND)
        }
        val players = duelRoomPlayerRepository.findByRoomIdOrderByJoinedAtAsc(roomId).map { it.toView() }
        return DuelRoomDetail(room = toRoomView(room), players = players)
    }

    private fun DuelRoomPlayerEntity.toView(): DuelRoomPlayerView {
        return DuelRoomPlayerView(
            userId = userId,
            status = status,
            stakeCropType = stakeCropType,
            joinedAt = joinedAt
        )
    }
}
