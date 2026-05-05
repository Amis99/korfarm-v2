package com.korfarm.api.billing

import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.time.YearMonth

@Component
class OrgBillingScheduler(
    private val orgBillingService: OrgBillingService,
) {
    private val log = LoggerFactory.getLogger(OrgBillingScheduler::class.java)

    /**
     * 매월 1일 새벽 2시 — 그 달의 청구서 자동 발행 (모든 활성 기관).
     * 첫 달 가입한 기관도 자동으로 일할 계산되어 발행됨.
     */
    @Scheduled(cron = "0 0 2 1 * *", zone = "Asia/Seoul")
    fun monthlyBillingIssue() {
        val ym = YearMonth.now()
        log.info("월 청구서 발행 스케줄러 시작: {}", ym)
        try {
            val count = orgBillingService.issueBillingForAllOrgs(ym)
            log.info("월 청구서 발행 완료: {}건", count)
        } catch (e: Exception) {
            log.error("월 청구서 발행 실패", e)
        }
    }

    /**
     * 매일 새벽 3시 — 마감 지난 미결제 청구 → 정지 처리.
     * 매월 1일 자정 직전 마감 → 1일 새벽 3시 일괄 정지.
     */
    @Scheduled(cron = "0 0 3 * * *", zone = "Asia/Seoul")
    fun dailySuspensionCheck() {
        log.info("미결제 정지 체크 스케줄러 시작")
        try {
            val count = orgBillingService.suspendOverdueOrgs()
            if (count > 0) log.info("정지 처리: {}건", count)
        } catch (e: Exception) {
            log.error("미결제 정지 체크 실패", e)
        }
    }
}
