package com.korfarm.api.duel

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository

interface DuelRoomRepository : JpaRepository<DuelRoomEntity, String> {
    fun findByStatusOrderByCreatedAtDesc(status: String): List<DuelRoomEntity>
    fun findByServerIdAndStatusOrderByCreatedAtDesc(serverId: String, status: String): List<DuelRoomEntity>
}

interface DuelRoomPlayerRepository : JpaRepository<DuelRoomPlayerEntity, String> {
    fun findByRoomIdOrderByJoinedAtAsc(roomId: String): List<DuelRoomPlayerEntity>
    fun findByRoomIdAndUserId(roomId: String, userId: String): DuelRoomPlayerEntity?
    fun countByRoomIdAndStatus(roomId: String, status: String): Long
}

interface DuelMatchRepository : JpaRepository<DuelMatchEntity, String> {
    fun findByStatusIn(statuses: List<String>): List<DuelMatchEntity>
    fun findAllByOrderByCreatedAtDesc(pageable: Pageable): Page<DuelMatchEntity>
    fun findByServerIdOrderByCreatedAtDesc(serverId: String, pageable: Pageable): Page<DuelMatchEntity>
    fun findByStatusOrderByCreatedAtDesc(status: String, pageable: Pageable): Page<DuelMatchEntity>
    fun findByServerIdAndStatusOrderByCreatedAtDesc(serverId: String, status: String, pageable: Pageable): Page<DuelMatchEntity>
}

interface DuelMatchPlayerRepository : JpaRepository<DuelMatchPlayerEntity, String> {
    fun findByMatchId(matchId: String): List<DuelMatchPlayerEntity>
}

interface DuelQuestionRepository : JpaRepository<DuelQuestionEntity, String> {
    fun findByMatchIdOrderByOrderIndexAsc(matchId: String): List<DuelQuestionEntity>
}

interface DuelAnswerRepository : JpaRepository<DuelAnswerEntity, String> {
    fun findByMatchIdAndUserId(matchId: String, userId: String): List<DuelAnswerEntity>
    fun findByMatchId(matchId: String): List<DuelAnswerEntity>
    fun findByMatchIdAndQuestionId(matchId: String, questionId: String): List<DuelAnswerEntity>
    fun findByQuestionId(questionId: String): List<DuelAnswerEntity>
}

interface DuelStatRepository : JpaRepository<DuelStatEntity, String> {
    fun findBySeasonIdAndServerIdAndUserId(seasonId: String, serverId: String, userId: String): DuelStatEntity?
    fun findTop50BySeasonIdAndServerIdOrderByWinsDesc(seasonId: String, serverId: String): List<DuelStatEntity>
    fun findTop50BySeasonIdAndServerIdOrderByWinRateDesc(seasonId: String, serverId: String): List<DuelStatEntity>
    fun findTop50BySeasonIdAndServerIdOrderByBestStreakDesc(seasonId: String, serverId: String): List<DuelStatEntity>
    fun findBySeasonIdAndServerIdIn(seasonId: String, serverIds: List<String>): List<DuelStatEntity>
}

interface DuelEscrowRepository : JpaRepository<DuelEscrowEntity, String> {
    fun findByMatchId(matchId: String): List<DuelEscrowEntity>
}

interface DuelQuestionPoolRepository : JpaRepository<DuelQuestionPoolEntity, String> {
    fun findByServerIdAndQuestionTypeAndStatus(serverId: String, questionType: String, status: String): List<DuelQuestionPoolEntity>
    fun findByServerIdAndStatus(serverId: String, status: String): List<DuelQuestionPoolEntity>
}
