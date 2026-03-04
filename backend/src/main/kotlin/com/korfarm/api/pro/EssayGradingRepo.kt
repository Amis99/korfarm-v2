package com.korfarm.api.pro

import org.springframework.data.jpa.repository.JpaRepository

interface EssayGradingRepo : JpaRepository<EssayGradingEntity, String> {
    fun findBySubmissionId(submissionId: String): List<EssayGradingEntity>
    fun findBySubmissionIdAndQuestionNumber(submissionId: String, questionNumber: Int): EssayGradingEntity?
    fun findByTestId(testId: String): List<EssayGradingEntity>
    fun findByTestIdAndUserId(testId: String, userId: String): List<EssayGradingEntity>
    fun findByUserIdAndStatus(userId: String, status: String): List<EssayGradingEntity>
}
