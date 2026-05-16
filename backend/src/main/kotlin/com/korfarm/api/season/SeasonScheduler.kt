package com.korfarm.api.season

import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

/**
 * 시즌 자동 갱신 스케줄러 — 2026-05-16 사용자 결정.
 *
 * 매월 1일 00:00 Asia/Seoul:
 *  - 기존 active 시즌 → ended + snapshot
 *  - 새 시즌 active 생성
 *  - 랭킹용 user_seeds.count, user_crops.count 일괄 0 리셋
 *  - 결제용 user_crop_wallet, user_grapefruit_wallet 은 그대로 (분리 보존)
 *
 * 비료(user_fertilizer)는 dead feature 라 손대지 않음. (자동 지급 경로 없음, 실제 DB 0 rows.)
 */
@Component
class SeasonScheduler(
    private val seasonService: SeasonService,
) {
    private val log = LoggerFactory.getLogger(SeasonScheduler::class.java)

    @Scheduled(cron = "0 0 0 1 * *", zone = "Asia/Seoul")
    fun monthlySeasonRollover() {
        log.info("시즌 자동 갱신 스케줄러 시작 (매월 1일 00:00 KST)")
        try {
            val newSeason = seasonService.rolloverToNewMonth()
            log.info("시즌 자동 갱신 완료: 새 시즌 id={} name={}", newSeason.id, newSeason.name)
        } catch (e: Exception) {
            log.error("시즌 자동 갱신 실패", e)
        }
    }
}
