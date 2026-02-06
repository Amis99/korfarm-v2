package com.korfarm.api.duel

import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.time.LocalDateTime

@Component
class DuelTimerScheduler(
    private val duelService: DuelService,
    private val duelMatchRepository: DuelMatchRepository,
    private val duelWebSocketHandler: DuelWebSocketHandler
) {
    private val log = LoggerFactory.getLogger(DuelTimerScheduler::class.java)

    // 10초마다 진행 중인 매치의 타임아웃 확인
    @Scheduled(fixedRate = 10_000)
    fun checkTimeouts() {
        val ongoingMatches = duelMatchRepository.findByStatusIn(listOf("ongoing"))
        val now = LocalDateTime.now()

        for (match in ongoingMatches) {
            val startedAt = match.startedAt ?: continue
            val deadline = startedAt.plusSeconds(match.timeLimitSec.toLong())

            if (now.isAfter(deadline)) {
                log.info("매치 타임아웃: ${match.id}")
                try {
                    val result = duelService.finishMatch(match.id)
                    if (result != null) {
                        duelWebSocketHandler.broadcastMatchFinish(match.id, result)
                    }
                } catch (e: Exception) {
                    log.error("매치 종료 실패: ${match.id}", e)
                }
            }
        }
    }
}
