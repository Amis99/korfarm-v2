package com.korfarm.api.diagnostic

import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.time.LocalDateTime

/**
 * 진단 OMR 타이머 자동 제출 스케줄러 (V0142, 2026-05-16).
 *
 * 학생이 모바일·태블릿으로 OMR 응시 중 슬립 모드로 60분이 지나도
 * 입력된 답안까지 자동 채점되도록 보장.
 *
 * 5분마다 status='pending' AND deadline < NOW() 인 draft 를 찾아
 * DiagnosticService.finalizeOmrDraft 호출 — 입력된 답안으로 submitFromOmr 진행.
 */
@Component
class DiagnosticOmrScheduler(
    private val omrDraftRepo: DiagOmrDraftRepository,
    private val diagnosticService: DiagnosticService,
) {
    private val log = LoggerFactory.getLogger(DiagnosticOmrScheduler::class.java)

    @Scheduled(fixedRate = 5 * 60 * 1000)
    fun autoSubmitExpiredOmrDrafts() {
        val now = LocalDateTime.now()
        val expired = omrDraftRepo.findByStatusAndDeadlineBefore("pending", now)
        if (expired.isEmpty()) return
        log.info("진단 OMR 자동 제출 — 만료 draft {}건", expired.size)
        var ok = 0
        for (draft in expired) {
            try {
                diagnosticService.finalizeOmrDraft(draft.id.userId, draft)
                ok++
            } catch (e: Exception) {
                log.warn("OMR 자동 제출 실패 user={} tier={}", draft.id.userId, draft.id.tier, e)
            }
        }
        log.info("진단 OMR 자동 제출 완료 — {}/{}건 성공", ok, expired.size)
    }
}
