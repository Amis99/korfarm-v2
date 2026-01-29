package com.korfarm.api.duel

import org.springframework.data.jpa.repository.JpaRepository

interface DuelRoomRepository : JpaRepository<DuelRoomEntity, String> {
    fun findByStatusOrderByCreatedAtDesc(status: String): List<DuelRoomEntity>
}

interface DuelRoomPlayerRepository : JpaRepository<DuelRoomPlayerEntity, String> {
    fun findByRoomIdOrderByJoinedAtAsc(roomId: String): List<DuelRoomPlayerEntity>
    fun findByRoomIdAndUserId(roomId: String, userId: String): DuelRoomPlayerEntity?
    fun countByRoomIdAndStatus(roomId: String, status: String): Long
}

interface DuelMatchRepository : JpaRepository<DuelMatchEntity, String>

interface DuelMatchPlayerRepository : JpaRepository<DuelMatchPlayerEntity, String> {
    fun findByMatchId(matchId: String): List<DuelMatchPlayerEntity>
}

interface DuelQuestionRepository : JpaRepository<DuelQuestionEntity, String> {
    fun findByMatchIdOrderByOrderIndexAsc(matchId: String): List<DuelQuestionEntity>
}

interface DuelAnswerRepository : JpaRepository<DuelAnswerEntity, String> {
    fun findByMatchIdAndUserId(matchId: String, userId: String): List<DuelAnswerEntity>
    fun findByMatchId(matchId: String): List<DuelAnswerEntity>
}

interface DuelStatRepository : JpaRepository<DuelStatEntity, String> {
    fun findBySeasonIdAndLevelIdAndUserId(seasonId: String, levelId: String, userId: String): DuelStatEntity?
    fun findTop50BySeasonIdAndLevelIdOrderByWinsDesc(seasonId: String, levelId: String): List<DuelStatEntity>
    fun findTop50BySeasonIdAndLevelIdOrderByWinRateDesc(seasonId: String, levelId: String): List<DuelStatEntity>
    fun findTop50BySeasonIdAndLevelIdOrderByBestStreakDesc(seasonId: String, levelId: String): List<DuelStatEntity>
}

interface DuelEscrowRepository : JpaRepository<DuelEscrowEntity, String> {
    fun findByMatchId(matchId: String): List<DuelEscrowEntity>
}
