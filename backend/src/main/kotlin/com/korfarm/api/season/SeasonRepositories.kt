package com.korfarm.api.season

import org.springframework.data.jpa.repository.JpaRepository

interface SeasonRepository : JpaRepository<SeasonEntity, String> {
    fun findFirstByStatusOrderByStartAtDesc(status: String): SeasonEntity?
}

interface SeasonHarvestRankingRepository : JpaRepository<SeasonHarvestRankingEntity, String> {
    fun findFirstBySeasonIdAndLevelIdOrderByGeneratedAtDesc(seasonId: String, levelId: String): SeasonHarvestRankingEntity?
}

interface SeasonDuelRankingRepository : JpaRepository<SeasonDuelRankingEntity, String> {
    fun findFirstBySeasonIdAndLevelIdOrderByGeneratedAtDesc(seasonId: String, levelId: String): SeasonDuelRankingEntity?
}

interface SeasonAwardSnapshotRepository : JpaRepository<SeasonAwardSnapshotEntity, String> {
    fun findFirstBySeasonIdOrderByCapturedAtDesc(seasonId: String): SeasonAwardSnapshotEntity?
}
