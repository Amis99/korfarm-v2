package com.korfarm.api.learning

/**
 * 학생 한 명의 10대 역량 누적을 처음부터 다시 계산할 때의 결과 요약.
 */
data class RebuildCompetencyResult(
    val totalLogs: Int,
    val processed: Int,
    val recorded: Int,
    val skipped: Int,
)
