package com.korfarm.api.aigen

import com.korfarm.api.common.IdGenerator
import org.springframework.stereotype.Service
import java.time.LocalDateTime

@Service
class AiGenLogService(
    private val repo: AiGenLogRepository,
) {
    fun log(
        userId: String,
        testId: String?,
        kind: String,
        model: String,
        inputTokens: Int? = null,
        outputTokens: Int? = null,
        durationMs: Int? = null,
        passed: Boolean? = null,
        retryCount: Int = 0,
        status: String = "success",
        errorMessage: String? = null,
    ): AiGenLogEntity {
        val entity = AiGenLogEntity(
            id = IdGenerator.newId("aigen"),
            userId = userId,
            testId = testId,
            kind = kind,
            model = model,
            inputTokens = inputTokens,
            outputTokens = outputTokens,
            durationMs = durationMs,
            passed = passed,
            retryCount = retryCount,
            status = status,
            errorMessage = errorMessage,
            createdAt = LocalDateTime.now(),
        )
        return repo.save(entity)
    }
}
