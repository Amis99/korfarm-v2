package com.korfarm.api.duel

import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.economy.EconomyService
import com.korfarm.api.economy.UserSeedRepository
import com.korfarm.api.season.DuelLeaderboardItem
import com.korfarm.api.season.DuelLeaderboards
import com.korfarm.api.season.SeasonService
import com.korfarm.api.user.UserRepository
import org.slf4j.LoggerFactory
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
    private val seasonService: SeasonService,
    private val economyService: EconomyService,
    private val userSeedRepository: UserSeedRepository,
    private val userRepository: UserRepository,
    private val questionPoolService: DuelQuestionPoolService,
    private val duelQuestionPoolRepo: DuelQuestionPoolRepository,
    private val objectMapper: ObjectMapper
) {
    private val log = LoggerFactory.getLogger(DuelService::class.java)

    companion object {
        val SEED_TYPES = listOf("seed_wheat", "seed_rice", "seed_corn", "seed_grape", "seed_apple")
        const val SYSTEM_FEE_RATE = 0.0 // 수수료 없음
        const val TIME_LIMIT_SEC = 300
        const val TOTAL_QUESTIONS = 10
        val VALID_SERVERS = setOf("saussure", "frege", "russell", "wittgenstein")
    }

    // === 방 관리 ===

    @Transactional(readOnly = true)
    fun listRooms(serverId: String?): List<DuelRoomView> {
        val rooms = if (serverId != null) {
            duelRoomRepository.findByServerIdAndStatusOrderByCreatedAtDesc(serverId, "open")
        } else {
            duelRoomRepository.findByStatusOrderByCreatedAtDesc("open")
        }
        return rooms.map { toRoomView(it) }
    }

    @Transactional
    fun createRoom(userId: String, request: com.korfarm.api.contracts.DuelRoomCreateRequest): DuelRoomDetail {
        validateServerId(request.serverId)
        val stakeAmount = request.stakeAmount
        if (stakeAmount < 1 || stakeAmount > 50) {
            throw ApiException("INVALID_STAKE", "베팅은 1~50 씨앗", HttpStatus.BAD_REQUEST)
        }
        val roomSize = request.roomSize.coerceIn(2, 10)

        // 씨앗 보유량 검증
        validateSeedBalance(userId, stakeAmount)

        val room = DuelRoomEntity(
            id = IdGenerator.newId("room"),
            serverId = request.serverId,
            roomName = request.roomName.ifBlank { getUserName(userId) + "의 방" },
            roomSize = roomSize,
            stakeAmount = stakeAmount,
            status = "open",
            createdBy = userId
        )
        duelRoomRepository.save(room)

        val player = DuelRoomPlayerEntity(
            id = IdGenerator.newId("rp"),
            roomId = room.id,
            userId = userId,
            status = "joined",
            isReady = true, // 방장은 자동 준비
            joinedAt = LocalDateTime.now()
        )
        duelRoomPlayerRepository.save(player)

        return roomDetail(room.id)
    }

    @Transactional
    fun joinRoom(userId: String, roomId: String): DuelRoomJoinResult {
        val room = duelRoomRepository.findById(roomId).orElseThrow {
            ApiException("NOT_FOUND", "방을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        if (room.status != "open") {
            throw ApiException("ROOM_CLOSED", "방이 열려있지 않습니다", HttpStatus.CONFLICT)
        }
        val existing = duelRoomPlayerRepository.findByRoomIdAndUserId(roomId, userId)
        if (existing != null && existing.status == "joined") {
            return DuelRoomJoinResult(room = roomDetail(roomId))
        }

        val players = duelRoomPlayerRepository.findByRoomIdOrderByJoinedAtAsc(roomId)
        if (players.count { it.status == "joined" } >= room.roomSize) {
            throw ApiException("ROOM_FULL", "방이 가득 찼습니다", HttpStatus.CONFLICT)
        }

        // 씨앗 보유량 검증
        validateSeedBalance(userId, room.stakeAmount)

        val player = DuelRoomPlayerEntity(
            id = IdGenerator.newId("rp"),
            roomId = room.id,
            userId = userId,
            status = "joined",
            isReady = false,
            joinedAt = LocalDateTime.now()
        )
        duelRoomPlayerRepository.save(player)

        return DuelRoomJoinResult(room = roomDetail(roomId))
    }

    @Transactional
    fun leaveRoom(userId: String, roomId: String) {
        val player = duelRoomPlayerRepository.findByRoomIdAndUserId(roomId, userId) ?: return
        player.status = "left"
        duelRoomPlayerRepository.save(player)

        val remaining = duelRoomPlayerRepository.findByRoomIdOrderByJoinedAtAsc(roomId)
            .filter { it.status == "joined" }
        if (remaining.isEmpty()) {
            // 아무도 없으면 방 닫기
            duelRoomRepository.findById(roomId).ifPresent {
                it.status = "closed"
                duelRoomRepository.save(it)
            }
        } else if (remaining.size == 1) {
            // 1명만 남으면 방 닫기 (혼자 대결 불가)
            duelRoomRepository.findById(roomId).ifPresent {
                it.status = "closed"
                duelRoomRepository.save(it)
            }
        }
    }

    /**
     * 30분 이상 오래된 open 상태 방을 자동 정리
     */
    @Transactional
    fun cleanupStaleRooms() {
        val cutoff = LocalDateTime.now().minusMinutes(30)
        val staleRooms = duelRoomRepository.findByStatusOrderByCreatedAtDesc("open")
            .filter { it.createdAt.isBefore(cutoff) }
        staleRooms.forEach { room ->
            room.status = "closed"
            duelRoomRepository.save(room)
            log.info("오래된 대기방 정리: ${room.id}")
        }
    }

    @Transactional
    fun toggleReady(userId: String, roomId: String, stakeSeedType: String? = null): Boolean {
        val player = duelRoomPlayerRepository.findByRoomIdAndUserId(roomId, userId)
            ?: throw ApiException("NOT_FOUND", "방에 참가하지 않았습니다", HttpStatus.NOT_FOUND)
        if (player.status != "joined") {
            throw ApiException("INVALID_STATE", "방에 참가 상태가 아닙니다", HttpStatus.CONFLICT)
        }
        // 방장은 항상 준비 상태
        val room = duelRoomRepository.findById(roomId).orElseThrow {
            ApiException("NOT_FOUND", "방을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        if (room.createdBy == userId) {
            if (stakeSeedType != null) {
                player.stakeSeedType = stakeSeedType
                duelRoomPlayerRepository.save(player)
            }
            return true
        }
        player.isReady = !player.isReady
        if (player.isReady && stakeSeedType != null) {
            // 준비 시 특정 씨앗 종류 잔액 검증
            validateSpecificSeedBalance(userId, stakeSeedType, room.stakeAmount)
            player.stakeSeedType = stakeSeedType
        }
        duelRoomPlayerRepository.save(player)
        return player.isReady
    }

    // === 매치 시작 ===

    @Transactional
    fun startMatch(userId: String, roomId: String): String {
        val room = duelRoomRepository.findById(roomId).orElseThrow {
            ApiException("NOT_FOUND", "방을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        if (room.createdBy != userId) {
            throw ApiException("NOT_HOST", "방장만 시작할 수 있습니다", HttpStatus.FORBIDDEN)
        }
        if (room.status != "open") {
            throw ApiException("ROOM_CLOSED", "방이 열려있지 않습니다", HttpStatus.CONFLICT)
        }
        val players = duelRoomPlayerRepository.findByRoomIdOrderByJoinedAtAsc(roomId)
            .filter { it.status == "joined" }
        if (players.size < 2) {
            throw ApiException("NOT_ENOUGH_PLAYERS", "2명 이상이어야 시작할 수 있습니다", HttpStatus.BAD_REQUEST)
        }

        // 문제 선정
        val questions = questionPoolService.selectQuestions(room.serverId, 6, 4)
        if (questions.size < TOTAL_QUESTIONS) {
            throw ApiException("NOT_ENOUGH_QUESTIONS", "문제가 부족합니다 (${questions.size}/${TOTAL_QUESTIONS})", HttpStatus.INTERNAL_SERVER_ERROR)
        }

        val season = seasonService.currentSeason()
        val match = DuelMatchEntity(
            id = IdGenerator.newId("match"),
            seasonId = season.seasonId,
            roomId = room.id,
            serverId = room.serverId,
            status = "ongoing",
            timeLimitSec = TIME_LIMIT_SEC,
            startedAt = LocalDateTime.now()
        )
        duelMatchRepository.save(match)

        // 문제 할당
        questions.forEachIndexed { index, poolEntity ->
            val dq = DuelQuestionEntity(
                id = IdGenerator.newId("dq"),
                matchId = match.id,
                questionId = poolEntity.id,
                orderIndex = index + 1
            )
            duelQuestionRepository.save(dq)
        }

        // 참가자 처리: 씨앗 에스크로 차감 + 매치 플레이어 생성
        players.forEach { rp ->
            if (rp.stakeSeedType != null) {
                deductSpecificSeed(rp.userId, rp.stakeSeedType!!, room.stakeAmount, match.id)
            } else {
                deductSeedsFromAny(rp.userId, room.stakeAmount, match.id)
            }

            val mp = DuelMatchPlayerEntity(
                id = IdGenerator.newId("mp"),
                matchId = match.id,
                userId = rp.userId,
                result = "pending",
                stakeAmount = room.stakeAmount
            )
            duelMatchPlayerRepository.save(mp)
        }

        // 방 상태 변경
        room.status = "matched"
        duelRoomRepository.save(room)

        return match.id
    }

    // === 답변 기록 ===

    @Transactional
    fun recordAnswer(matchId: String, userId: String, questionId: String, answer: String, timeMs: Long): Boolean {
        val match = duelMatchRepository.findById(matchId).orElse(null) ?: return false
        if (match.status != "ongoing") return false

        // 정답 확인
        duelQuestionRepository.findByMatchIdOrderByOrderIndexAsc(matchId)
            .firstOrNull { it.questionId == questionId } ?: return false

        val poolEntity = duelQuestionPoolRepo.findById(questionId).orElse(null)
        val correctAnswerId = if (poolEntity != null) questionPoolService.getAnswerId(poolEntity.questionJson) else null
        val isCorrect = correctAnswerId != null && correctAnswerId == answer

        val answerJson = objectMapper.writeValueAsString(mapOf("answer" to answer))
        val existing = duelAnswerRepository.findByMatchIdAndUserId(matchId, userId)
            .firstOrNull { it.questionId == questionId }

        val entity = if (existing != null) {
            existing.answerJson = answerJson
            existing.isCorrect = isCorrect
            existing.timeMs = timeMs
            existing.submittedAt = LocalDateTime.now()
            existing
        } else {
            DuelAnswerEntity(
                id = IdGenerator.newId("ans"),
                matchId = matchId,
                questionId = questionId,
                userId = userId,
                answerJson = answerJson,
                isCorrect = isCorrect,
                timeMs = timeMs,
                submittedAt = LocalDateTime.now()
            )
        }
        duelAnswerRepository.save(entity)
        return isCorrect
    }

    // === 매치 종료 ===

    @Transactional
    fun finishMatch(matchId: String): DuelMatchResultDetailView? {
        val match = duelMatchRepository.findById(matchId).orElse(null) ?: return null
        if (match.status == "finished") return null

        val players = duelMatchPlayerRepository.findByMatchId(matchId)
        if (players.isEmpty()) return null

        val answers = duelAnswerRepository.findByMatchId(matchId)

        // 각 플레이어 채점
        players.forEach { player ->
            val playerAnswers = answers.filter { it.userId == player.userId }
            player.correctCount = playerAnswers.count { it.isCorrect == true }
            player.totalTimeMs = playerAnswers.sumOf { it.timeMs }
        }

        // 순위 산정: 정답 수 내림차순 → 동점 시 총 시간 오름차순
        val sorted = players.sortedWith(
            compareByDescending<DuelMatchPlayerEntity> { it.correctCount }
                .thenBy { it.totalTimeMs }
        )

        var rank = 1
        sorted.forEachIndexed { index, player ->
            if (index > 0) {
                val prev = sorted[index - 1]
                if (player.correctCount != prev.correctCount || player.totalTimeMs != prev.totalTimeMs) {
                    rank = index + 1
                }
            }
            player.rankPosition = rank
            player.result = if (rank == 1) "win" else "lose"
        }

        // 정산
        val escrows = duelEscrowRepository.findByMatchId(matchId)
        val totalEscrow = escrows.sumOf { it.amount }
        val systemFee = (totalEscrow * SYSTEM_FEE_RATE).toInt()
        val winnerPool = totalEscrow - systemFee

        val winners = sorted.filter { it.rankPosition == 1 }
        val rewardPerWinner = if (winners.isNotEmpty()) winnerPool / winners.size else 0

        winners.forEach { winner ->
            winner.rewardAmount = rewardPerWinner
            // 승자에게 씨앗 지급: 에스크로 seedType별 분배
            val seedTypeAmounts = escrows.groupBy { it.seedType }
                .mapValues { (_, escs) -> escs.sumOf { it.amount } }
            val totalAmount = seedTypeAmounts.values.sum()
            if (totalAmount > 0) {
                var remaining = rewardPerWinner
                seedTypeAmounts.entries.forEachIndexed { idx, (seedType, amount) ->
                    val share = if (idx == seedTypeAmounts.size - 1) {
                        remaining // 마지막은 나머지 전부
                    } else {
                        (rewardPerWinner.toLong() * amount / totalAmount).toInt()
                    }
                    if (share > 0) {
                        economyService.adjustSeed(winner.userId, seedType, share, "duel_reward", "duel_match", matchId)
                        remaining -= share
                    }
                }
            }
        }

        // 에스크로 상태 업데이트
        escrows.forEach { esc ->
            esc.status = if (winners.any { it.userId == esc.userId }) "won" else "lost"
            duelEscrowRepository.save(esc)
        }

        // 플레이어별 답변 수 계산
        val answeredCountMap = sorted.associate { player ->
            player.userId to answers.count { it.userId == player.userId }
        }

        // 플레이어 저장 + 통계 업데이트
        sorted.forEach { player ->
            duelMatchPlayerRepository.save(player)
            updateStats(match.seasonId, match.serverId, player.userId, player.result == "win")
        }

        match.status = "finished"
        match.endedAt = LocalDateTime.now()
        duelMatchRepository.save(match)

        // 매치 종료 후 방 재개방: 상태를 open으로, 준비 상태 리셋
        reopenRoom(match.roomId)

        return DuelMatchResultDetailView(
            matchId = matchId,
            serverId = match.serverId,
            roomId = match.roomId,
            results = sorted.map { toMatchResultView(it, answeredCountMap[it.userId] ?: 0) },
            totalEscrow = totalEscrow,
            systemFee = systemFee
        )
    }

    // === 조회 ===

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
    fun getCorrectCount(matchId: String, userId: String): Int {
        return duelAnswerRepository.findByMatchIdAndUserId(matchId, userId).count { it.isCorrect == true }
    }

    @Transactional(readOnly = true)
    fun getUsersWhoAnsweredQuestion(matchId: String, questionId: String): Set<String> {
        return duelAnswerRepository.findByMatchIdAndQuestionId(matchId, questionId)
            .map { it.userId }
            .toSet()
    }

    @Transactional(readOnly = true)
    fun getMatchQuestionViewAt(matchId: String, index: Int): DuelQuestionView? {
        val duelQuestions = duelQuestionRepository.findByMatchIdOrderByOrderIndexAsc(matchId)
        val dq = duelQuestions.getOrNull(index) ?: return null
        val poolEntity = duelQuestionPoolRepo.findById(dq.questionId).orElse(null) ?: return null
        return questionPoolService.toQuestionView(poolEntity, dq.orderIndex)
    }

    @Transactional(readOnly = true)
    fun getQuestionResults(matchId: String, questionId: String): Map<String, Boolean> {
        return duelAnswerRepository.findByMatchIdAndQuestionId(matchId, questionId)
            .associate { it.userId to (it.isCorrect == true) }
    }

    fun getCorrectAnswerId(questionId: String): String? {
        val poolEntity = duelQuestionPoolRepo.findById(questionId).orElse(null) ?: return null
        return questionPoolService.getAnswerId(poolEntity.questionJson)
    }

    @Transactional(readOnly = true)
    fun getMatchResults(matchId: String): DuelMatchResultDetailView? {
        val match = duelMatchRepository.findById(matchId).orElse(null) ?: return null
        val players = duelMatchPlayerRepository.findByMatchId(matchId)
        val answers = duelAnswerRepository.findByMatchId(matchId)
        val answeredCountMap = players.associate { p ->
            p.userId to answers.count { it.userId == p.userId }
        }
        val escrows = duelEscrowRepository.findByMatchId(matchId)
        val totalEscrow = escrows.sumOf { it.amount }
        val systemFee = (totalEscrow * SYSTEM_FEE_RATE).toInt()

        return DuelMatchResultDetailView(
            matchId = matchId,
            serverId = match.serverId,
            roomId = match.roomId,
            results = players.sortedBy { it.rankPosition ?: 999 }.map { toMatchResultView(it, answeredCountMap[it.userId] ?: 0) },
            totalEscrow = totalEscrow,
            systemFee = systemFee
        )
    }

    @Transactional(readOnly = true)
    fun getMatchDetail(matchId: String): Map<String, Any>? {
        val match = duelMatchRepository.findById(matchId).orElse(null) ?: return null
        return mapOf(
            "matchId" to match.id,
            "serverId" to match.serverId,
            "status" to match.status,
            "timeLimitSec" to match.timeLimitSec,
            "startedAt" to (match.startedAt?.toString() ?: ""),
            "endedAt" to (match.endedAt?.toString() ?: "")
        )
    }

    @Transactional(readOnly = true)
    fun getStats(userId: String, serverId: String): DuelStatsView {
        val season = seasonService.currentSeason()
        val stat = duelStatRepository.findBySeasonIdAndServerIdAndUserId(season.seasonId, serverId, userId)
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
    fun leaderboards(serverId: String): DuelLeaderboards {
        val season = seasonService.currentSeason()
        val wins = duelStatRepository.findTop50BySeasonIdAndServerIdOrderByWinsDesc(season.seasonId, serverId)
            .mapIndexed { index, stat ->
                DuelLeaderboardItem(rank = index + 1, userId = stat.userId, value = stat.wins.toDouble())
            }
        val winRates = duelStatRepository.findTop50BySeasonIdAndServerIdOrderByWinRateDesc(season.seasonId, serverId)
            .mapIndexed { index, stat ->
                val matches = stat.wins + stat.losses
                DuelLeaderboardItem(rank = index + 1, userId = stat.userId, value = stat.winRate.toDouble(), matches = matches)
            }
        val streaks = duelStatRepository.findTop50BySeasonIdAndServerIdOrderByBestStreakDesc(season.seasonId, serverId)
            .mapIndexed { index, stat ->
                DuelLeaderboardItem(rank = index + 1, userId = stat.userId, value = stat.bestStreak.toDouble())
            }
        return DuelLeaderboards(wins = wins, winRate = winRates, bestStreak = streaks)
    }

    // === 방 재개방 ===

    private fun reopenRoom(roomId: String?) {
        if (roomId == null) return
        val room = duelRoomRepository.findById(roomId).orElse(null) ?: return
        room.status = "open"
        duelRoomRepository.save(room)

        // 기존 플레이어 준비 상태 리셋 (방장만 유지)
        val players = duelRoomPlayerRepository.findByRoomIdOrderByJoinedAtAsc(roomId)
            .filter { it.status == "joined" }
        players.forEach { p ->
            p.isReady = (p.userId == room.createdBy)
            duelRoomPlayerRepository.save(p)
        }
    }

    // === 내부 헬퍼 ===

    // 특정 씨앗 종류 잔액 검증
    private fun validateSpecificSeedBalance(userId: String, seedType: String, amount: Int) {
        val seed = userSeedRepository.findForUpdate(userId, seedType)
        if (seed == null || seed.count < amount) {
            throw ApiException("INSUFFICIENT_SEEDS", "해당 씨앗이 부족합니다", HttpStatus.BAD_REQUEST)
        }
    }

    // 특정 씨앗 종류 차감 + 에스크로 기록
    private fun deductSpecificSeed(userId: String, seedType: String, amount: Int, matchId: String) {
        economyService.adjustSeed(userId, seedType, -amount, "duel_stake", "duel_match", matchId)
        duelEscrowRepository.save(
            DuelEscrowEntity(
                id = IdGenerator.newId("esc"),
                matchId = matchId,
                userId = userId,
                seedType = seedType,
                amount = amount,
                status = "locked"
            )
        )
    }

    // 씨앗 종류 무관 총합 검증
    private fun validateSeedBalance(userId: String, amount: Int) {
        val seeds = userSeedRepository.findByUserId(userId)
        val total = seeds.sumOf { it.count }
        if (total < amount) {
            throw ApiException("INSUFFICIENT_SEEDS", "씨앗이 부족합니다 (보유: ${total}, 필요: ${amount})", HttpStatus.BAD_REQUEST)
        }
    }

    // 5종 씨앗에서 순차 차감 + 에스크로 기록
    private fun deductSeedsFromAny(userId: String, amount: Int, matchId: String) {
        var remaining = amount
        for (seedType in SEED_TYPES) {
            if (remaining <= 0) break
            val seeds = userSeedRepository.findByUserId(userId)
            val seedEntity = seeds.firstOrNull { it.seedType == seedType } ?: continue
            if (seedEntity.count <= 0) continue

            val deduct = minOf(seedEntity.count, remaining)
            economyService.adjustSeed(userId, seedType, -deduct, "duel_stake", "duel_match", matchId)
            duelEscrowRepository.save(
                DuelEscrowEntity(
                    id = IdGenerator.newId("esc"),
                    matchId = matchId,
                    userId = userId,
                    seedType = seedType,
                    amount = deduct,
                    status = "locked"
                )
            )
            remaining -= deduct
        }
        if (remaining > 0) {
            throw ApiException("INSUFFICIENT_SEEDS", "씨앗 차감 실패", HttpStatus.BAD_REQUEST)
        }
    }

    private fun validateServerId(serverId: String) {
        if (serverId !in VALID_SERVERS) {
            throw ApiException("INVALID_SERVER", "유효하지 않은 서버: $serverId", HttpStatus.BAD_REQUEST)
        }
    }

    private fun getUserName(userId: String): String {
        return userRepository.findById(userId).map { it.name ?: "익명" }.orElse("익명")
    }

    private fun updateStats(seasonId: String, serverId: String, userId: String, win: Boolean) {
        val existing = duelStatRepository.findBySeasonIdAndServerIdAndUserId(seasonId, serverId, userId)
        val stat = existing ?: DuelStatEntity(
            id = IdGenerator.newId("ds"),
            seasonId = seasonId,
            serverId = serverId,
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
            serverId = room.serverId,
            roomName = room.roomName,
            roomSize = room.roomSize,
            stakeAmount = room.stakeAmount,
            status = room.status,
            playerCount = playerCount,
            createdBy = room.createdBy,
            createdAt = room.createdAt
        )
    }

    fun roomDetail(roomId: String): DuelRoomDetail {
        val room = duelRoomRepository.findById(roomId).orElseThrow {
            ApiException("NOT_FOUND", "방을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        val season = seasonService.currentSeason()
        val players = duelRoomPlayerRepository.findByRoomIdOrderByJoinedAtAsc(roomId)
            .filter { it.status == "joined" }
            .map { toRoomPlayerView(it, room.serverId, season.seasonId) }
        return DuelRoomDetail(room = toRoomView(room), players = players)
    }

    private fun toRoomPlayerView(player: DuelRoomPlayerEntity, serverId: String, seasonId: String): DuelRoomPlayerView {
        val userEntity = userRepository.findById(player.userId).orElse(null)
        val stat = duelStatRepository.findBySeasonIdAndServerIdAndUserId(seasonId, serverId, player.userId)
        return DuelRoomPlayerView(
            userId = player.userId,
            userName = userEntity?.name ?: "익명",
            status = player.status,
            isReady = player.isReady,
            joinedAt = player.joinedAt,
            profileImageUrl = userEntity?.profileImageUrl,
            levelId = userEntity?.levelId,
            wins = stat?.wins ?: 0,
            losses = stat?.losses ?: 0,
            winRate = stat?.winRate?.toDouble() ?: 0.0
        )
    }

    private fun toMatchResultView(player: DuelMatchPlayerEntity, answeredCount: Int): DuelMatchResultView {
        return DuelMatchResultView(
            userId = player.userId,
            userName = getUserName(player.userId),
            result = player.result,
            rankPosition = player.rankPosition,
            correctCount = player.correctCount,
            answeredCount = answeredCount,
            totalTimeMs = player.totalTimeMs,
            rewardAmount = player.rewardAmount
        )
    }

    // 문제 뷰 목록 조회 (정답 제외)
    @Transactional(readOnly = true)
    fun getMatchQuestionViews(matchId: String): List<DuelQuestionView> {
        val duelQuestions = duelQuestionRepository.findByMatchIdOrderByOrderIndexAsc(matchId)
        return duelQuestions.mapNotNull { dq ->
            val poolEntity = duelQuestionPoolRepo.findById(dq.questionId).orElse(null) ?: return@mapNotNull null
            questionPoolService.toQuestionView(poolEntity, dq.orderIndex)
        }
    }
}
