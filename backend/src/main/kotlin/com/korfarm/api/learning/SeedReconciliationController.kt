package com.korfarm.api.learning

import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.AdminGuard
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

/**
 * 씨앗 백테필 정산 — HQ_ADMIN 전용.
 *
 *   POST /v1/admin/seed-reconciliation?days=3&apply=false   → dry-run (계산만)
 *   POST /v1/admin/seed-reconciliation?days=3&apply=true    → 실제 가산
 *
 * 정책: 새 정책 계산값이 기존 log.earnedSeed 보다 크면 차이만큼 가산.
 * 더 작으면 변경 없음(롤백 안 함). DAILY_QUIZ/READING 하루 cap 10 그대로 적용.
 */
@RestController
@RequestMapping("/v1/admin/seed-reconciliation")
class SeedReconciliationController(
    private val service: SeedReconciliationService,
) {
    @PostMapping
    fun reconcile(
        @RequestParam(defaultValue = "3") days: Int,
        @RequestParam(defaultValue = "false") apply: Boolean,
    ): ApiResponse<SeedReconciliationService.ReconciliationReport> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val report = service.reconcile(days, apply)
        return ApiResponse(success = true, data = report)
    }

    /**
     * STUCK 백테필 — STARTED 로 멈춘 일일 학습(DAILY_QUIZ/DAILY_READING) 을
     * 추정 정확도(default 70) 로 보상 처리.
     *
     *   POST /v1/admin/seed-reconciliation/stuck?days=5&accuracy=70&apply=false  → dry-run
     *   POST /v1/admin/seed-reconciliation/stuck?days=5&accuracy=70&apply=true   → 적용
     *
     * 학생 권한자(STUDENT) 만 대상. ORG_ADMIN/HQ_ADMIN 어드민 테스트는 제외.
     */
    @PostMapping("/stuck")
    fun reconcileStuck(
        @RequestParam(defaultValue = "5") days: Int,
        @RequestParam(defaultValue = "70") accuracy: Int,
        @RequestParam(defaultValue = "false") apply: Boolean,
    ): ApiResponse<SeedReconciliationService.StuckReport> {
        AdminGuard.requireAnyRole("HQ_ADMIN")
        val report = service.reconcileStuck(days, accuracy, apply)
        return ApiResponse(success = true, data = report)
    }
}
