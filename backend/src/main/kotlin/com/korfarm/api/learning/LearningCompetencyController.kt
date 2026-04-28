package com.korfarm.api.learning

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.ApiResponse
import com.korfarm.api.security.SecurityUtils
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/learning/competency")
class LearningCompetencyController(
    private val learningCompetencyService: LearningCompetencyService,
) {

    /**
     * 학습/테스트 종합 누적 10대 역량 점수 (현재 윈도우 기준).
     * 진단 결과는 별도 — diagnostic API 에서 따로 조회.
     */
    @GetMapping("/summary")
    fun getMySummary(): ApiResponse<Map<String, UserCompetencySummaryView>> {
        val userId = SecurityUtils.currentUserId()
            ?: throw ApiException("UNAUTHORIZED", "unauthorized", HttpStatus.UNAUTHORIZED)
        return ApiResponse(success = true, data = learningCompetencyService.getSummary(userId))
    }
}
