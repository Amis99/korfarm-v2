package com.korfarm.api.season

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.economy.EconomyLedgerRepository
import com.korfarm.api.economy.SeasonScoreCalculator
import com.korfarm.api.economy.UserCropRepository
import com.korfarm.api.economy.UserSeedRepository
import com.korfarm.api.org.OrgMembershipRepository
import com.korfarm.api.user.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalDateTime

@Service
class SeasonService(
    private val seasonRepository: SeasonRepository,
    private val seasonHarvestRankingRepository: SeasonHarvestRankingRepository,
    private val seasonDuelRankingRepository: SeasonDuelRankingRepository,
    private val seasonAwardSnapshotRepository: SeasonAwardSnapshotRepository,
    private val seasonModalSeenRepository: SeasonModalSeenRepository,
    private val economyLedgerRepository: EconomyLedgerRepository,
    private val userCropRepository: UserCropRepository,
    private val userSeedRepository: UserSeedRepository,
    private val userRepository: UserRepository,
    private val orgMembershipRepository: OrgMembershipRepository,
    private val objectMapper: ObjectMapper
) {
    private val logger = LoggerFactory.getLogger(SeasonService::class.java)

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

    fun harvestRankings(seasonId: String, levelId: String?): List<HarvestRankingItem> {
        // 시즌 점수 공식 적용 — 작물합×50 + 최소작물×500 + 총씨앗
        // (학생이 보는 자기 시즌 점수와 동일한 척도)
        // levelId null/blank → 레벨 통합 랭킹, 값 있음 → 그 레벨만
        val allCrops = userCropRepository.findAll()
        val allSeeds = userSeedRepository.findAll()

        val cropsByUser = allCrops.groupBy { it.userId }
        val seedsByUser = allSeeds.groupBy { it.userId }

        val userIds = (cropsByUser.keys + seedsByUser.keys).toSet()
        if (userIds.isEmpty()) return emptyList()

        // 시즌 랭킹은 STUDENT 만 — HQ_ADMIN/ORG_ADMIN/PARENT 는 제외.
        // 관리자가 테스트로 학습한 점수가 1·2위 차지하는 문제 방지.
        val studentUserIds = orgMembershipRepository.findByStatus("active")
            .filter { it.role == "STUDENT" }
            .map { it.userId }
            .toSet()
        val eligibleIds = userIds.intersect(studentUserIds)
        if (eligibleIds.isEmpty()) return emptyList()

        val userMap = userRepository.findAllById(eligibleIds).associateBy { it.id }

        // 레벨 필터 — 빈 값/null 이면 통합 랭킹, 값 있으면 user.levelId 일치만
        val levelFilteredIds = if (levelId.isNullOrBlank()) {
            eligibleIds
        } else {
            eligibleIds.filter { userMap[it]?.levelId == levelId }.toSet()
        }
        if (levelFilteredIds.isEmpty()) return emptyList()

        // 각 사용자 시즌 점수 계산 + 0점 초과만 노출 (STUDENT 만)
        data class RankRow(val userId: String, val score: Int, val name: String, val img: String?)
        val ranked = levelFilteredIds.map { userId ->
            val cropsMap = cropsByUser[userId]?.associate { it.cropType to it.count } ?: emptyMap()
            val totalSeeds = seedsByUser[userId]?.sumOf { it.count } ?: 0
            val score = SeasonScoreCalculator.calculate(cropsMap, totalSeeds)
            val u = userMap[userId]
            RankRow(userId, score, u?.name ?: "?", u?.profileImageUrl)
        }
            .filter { it.score > 0 }
            .sortedByDescending { it.score }

        return ranked.mapIndexed { idx, row ->
            HarvestRankingItem(
                rank = idx + 1,
                userId = row.userId,
                userName = row.name,
                value = row.score,
                profileImageUrl = row.img
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

    // ─── 시즌 자동 갱신 (매월 1일 00:00 KST, SeasonScheduler 호출) ─────────────────
    //
    // 정책 (2026-05-16 사용자 결정):
    //  - 매월 1일 00:00 KST 자동으로 새 시즌 시작
    //  - 기존 active 시즌 → status="ended" + snapshot (랭킹 결과 캡처)
    //  - 새 시즌 status="active" 생성 (name="YYYY년 MM월 시즌")
    //  - 랭킹용 user_seeds.count, user_crops.count 일괄 0 리셋
    //  - 결제용 user_crop_wallet, user_grapefruit_wallet 그대로 (분리 보존)
    //  - 비료(user_fertilizer)는 dead feature 라 손대지 않음
    @Transactional
    fun rolloverToNewMonth(): SeasonEntity {
        val now = LocalDateTime.now()
        val today = LocalDate.now()
        val newStart = today.withDayOfMonth(1).atStartOfDay()
        val newEnd = newStart.plusMonths(1)

        // 1. 기존 active 시즌 종료 + snapshot
        val previousSeasons = seasonRepository.findAll().filter { it.status == "active" }
        for (prev in previousSeasons) {
            try {
                snapshotSeasonAwards(prev.id, now)
            } catch (ex: Exception) {
                logger.warn("snapshot 실패 seasonId={} — 시즌 종료는 계속 진행", prev.id, ex)
            }
            prev.status = "ended"
            prev.endAt = newStart  // 새 시즌 시작 시점으로 종료
            seasonRepository.save(prev)
        }

        // 2. 새 시즌 생성
        val name = "${today.year}년 ${today.monthValue}월 시즌"
        val newSeason = SeasonEntity(
            id = IdGenerator.newId("season"),
            name = name,
            levelId = "(통합)",  // sentinel — 랭킹 시 level 필터로 처리
            startAt = newStart,
            endAt = newEnd,
            status = "active"
        )
        seasonRepository.save(newSeason)
        logger.info("새 시즌 시작: id={} name={} start={} end={}", newSeason.id, name, newStart, newEnd)

        // 3. 랭킹용 잔액 일괄 0 리셋
        val seedsReset = userSeedRepository.resetAllSeasonSeedsToZero(now)
        val cropsReset = userCropRepository.resetAllSeasonCropsToZero(now)
        logger.info("시즌 랭킹 잔액 리셋: seeds={}행, crops={}행 (결제용 wallet 은 그대로)", seedsReset, cropsReset)

        return newSeason
    }

    /** 시즌 종료 시점에 랭킹 결과를 snapshot 으로 캡처 (학생이 새 시즌 안내 모달에서 직전 결과 조회 시 사용) */
    @Transactional
    fun snapshotSeasonAwards(seasonId: String, capturedAt: LocalDateTime) {
        // 통합 + 12레벨별 랭킹 캡처
        val integratedRankings = harvestRankings(seasonId, null).take(50)
        val levelRankings = LEVEL_IDS.associateWith { levelId ->
            harvestRankings(seasonId, levelId).take(20)
        }
        val snapshot = mapOf(
            "integrated" to integratedRankings,
            "by_level" to levelRankings,
            "captured_at" to capturedAt.toString(),
        )
        val entity = SeasonAwardSnapshotEntity(
            id = IdGenerator.newId("sas"),
            seasonId = seasonId,
            snapshotJson = objectMapper.writeValueAsString(snapshot),
            capturedAt = capturedAt,
        )
        seasonAwardSnapshotRepository.save(entity)
    }

    // ─── 시즌 시작 안내 모달 ────────────────────────────────────────────────
    //
    // 학생/학부모/관리자 모두 새 시즌 첫 진입 시 1회 표시.
    // 학생: 자기 직전 시즌 순위·점수 + 새 시즌 0 출발 안내
    // 학부모: 자녀들 직전 시즌 결과 요약 (간략)
    // 관리자: 기관 이번 달 활동 요약 또는 단순 새 시즌 안내
    @Transactional(readOnly = true)
    fun getModalStatus(userId: String, roles: List<String>): SeasonModalStatus {
        val current = seasonRepository.findFirstByStatusOrderByStartAtDesc("active") ?: return SeasonModalStatus(
            shouldShow = false, seasonId = null, seasonName = null, role = "STUDENT", payload = null,
        )
        val seenId = SeasonModalSeenId(seasonId = current.id, userId = userId)
        val alreadySeen = seasonModalSeenRepository.existsById(seenId)
        if (alreadySeen) {
            return SeasonModalStatus(
                shouldShow = false, seasonId = current.id, seasonName = current.name,
                role = primaryRole(roles), payload = null,
            )
        }

        val role = primaryRole(roles)
        val payload: Map<String, Any?> = when (role) {
            "STUDENT" -> buildStudentModalPayload(userId)
            "PARENT" -> buildParentModalPayload(userId)
            "HQ_ADMIN", "ORG_ADMIN" -> buildAdminModalPayload(userId, roles)
            else -> emptyMap()
        }
        return SeasonModalStatus(
            shouldShow = true, seasonId = current.id, seasonName = current.name,
            role = role, payload = payload,
        )
    }

    @Transactional
    fun markModalSeen(userId: String, seasonId: String) {
        val seenId = SeasonModalSeenId(seasonId = seasonId, userId = userId)
        if (!seasonModalSeenRepository.existsById(seenId)) {
            seasonModalSeenRepository.save(SeasonModalSeenEntity(id = seenId, seenAt = LocalDateTime.now()))
        }
    }

    private fun primaryRole(roles: List<String>): String {
        return when {
            roles.contains("HQ_ADMIN") -> "HQ_ADMIN"
            roles.contains("ORG_ADMIN") -> "ORG_ADMIN"
            roles.contains("PARENT") -> "PARENT"
            else -> "STUDENT"
        }
    }

    private fun buildStudentModalPayload(userId: String): Map<String, Any?> {
        // 직전 시즌 (ended 최신) snapshot 에서 자기 순위·점수 추출
        val prevSeason = seasonRepository.findAll().filter { it.status == "ended" }
            .maxByOrNull { it.startAt }
        if (prevSeason == null) return mapOf("hasPrevious" to false)
        val snap = seasonAwardSnapshotRepository.findFirstBySeasonIdOrderByCapturedAtDesc(prevSeason.id)
            ?: return mapOf("hasPrevious" to false, "prevSeasonName" to prevSeason.name)
        val map: Map<String, Any> = objectMapper.readValue(snap.snapshotJson, object : TypeReference<Map<String, Any>>() {})
        val integrated = (map["integrated"] as? List<*>) ?: emptyList<Any>()
        val byLevel = (map["by_level"] as? Map<*, *>) ?: emptyMap<Any, Any>()
        val user = userRepository.findById(userId).orElse(null)
        val myLevelId = user?.levelId
        val myIntegrated = integrated.firstOrNull { (it as? Map<*, *>)?.get("userId") == userId } as? Map<*, *>
        val myLevelList = (byLevel[myLevelId] as? List<*>) ?: emptyList<Any>()
        val myInLevel = myLevelList.firstOrNull { (it as? Map<*, *>)?.get("userId") == userId } as? Map<*, *>
        return mapOf(
            "hasPrevious" to true,
            "prevSeasonName" to prevSeason.name,
            "myIntegratedRank" to (myIntegrated?.get("rank") as? Number)?.toInt(),
            "myIntegratedScore" to (myIntegrated?.get("value") as? Number)?.toInt(),
            "myLevelRank" to (myInLevel?.get("rank") as? Number)?.toInt(),
            "myLevelScore" to (myInLevel?.get("value") as? Number)?.toInt(),
            "myLevelId" to myLevelId,
            "totalParticipants" to integrated.size,
        )
    }

    private fun buildParentModalPayload(userId: String): Map<String, Any?> {
        // 직전 시즌에서 자녀들 결과 요약 — 간략하게 시즌 이름만 (자녀 목록은 프론트가 별도 조회)
        val prevSeason = seasonRepository.findAll().filter { it.status == "ended" }
            .maxByOrNull { it.startAt }
        return mapOf(
            "hasPrevious" to (prevSeason != null),
            "prevSeasonName" to prevSeason?.name,
        )
    }

    private fun buildAdminModalPayload(userId: String, roles: List<String>): Map<String, Any?> {
        // 관리자는 단순 새 시즌 시작 안내 (운영 정보는 대시보드에서 확인)
        val prevSeason = seasonRepository.findAll().filter { it.status == "ended" }
            .maxByOrNull { it.startAt }
        return mapOf(
            "hasPrevious" to (prevSeason != null),
            "prevSeasonName" to prevSeason?.name,
            "isHq" to roles.contains("HQ_ADMIN"),
        )
    }

    companion object {
        private val LEVEL_IDS = listOf(
            "saussure1", "saussure2", "saussure3",
            "frege1", "frege2", "frege3",
            "russell1", "russell2", "russell3",
            "wittgenstein1", "wittgenstein2", "wittgenstein3",
        )
    }
}
