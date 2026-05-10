package com.korfarm.api.chat

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalDateTime

@Service
class OcrLimitChecker(
    private val ocrUsageLogRepository: OcrUsageLogRepository,
) {
    companion object {
        const val CHANNEL_AGENT = "agent"
        const val CHANNEL_TUTOR = "tutor"
        const val CHANNEL_PODO_CHAT = "podo_chat"
        private const val AGENT_MONTHLY_LIMIT = 100
        private const val TUTOR_MONTHLY_LIMIT = 20
        private const val PODO_DAILY_LIMIT = 5
    }

    @Transactional
    fun checkAndCount(userId: String, channel: String, imageCount: Int, orgId: String? = null) {
        if (imageCount <= 0) return
        val now = LocalDateTime.now()
        val (used, limit) = when (channel) {
            CHANNEL_AGENT -> {
                val checkedOrgId = orgId ?: throw ApiException(
                    "BAD_REQUEST",
                    "기관 OCR 한도 확인을 위해 orgId가 필요합니다.",
                    HttpStatus.BAD_REQUEST,
                )
                val start = LocalDate.now().withDayOfMonth(1).atStartOfDay()
                ocrUsageLogRepository.sumImageCountByOrgAndChannelSince(checkedOrgId, channel, start) to AGENT_MONTHLY_LIMIT
            }
            CHANNEL_TUTOR -> {
                val start = LocalDate.now().withDayOfMonth(1).atStartOfDay()
                ocrUsageLogRepository.sumImageCountByUserAndChannelSince(userId, channel, start) to TUTOR_MONTHLY_LIMIT
            }
            CHANNEL_PODO_CHAT -> {
                val start = LocalDate.now().atStartOfDay()
                ocrUsageLogRepository.sumImageCountByUserAndChannelSince(userId, channel, start) to PODO_DAILY_LIMIT
            }
            else -> 0L to Int.MAX_VALUE
        }

        if (used + imageCount > limit) {
            throw ApiException(
                "OCR_LIMIT_EXCEEDED",
                "이번 OCR 한도 ${limit}건을 모두 사용했습니다. 이미지는 분석하지 않고 텍스트만 처리합니다.",
                HttpStatus.TOO_MANY_REQUESTS,
            )
        }

        ocrUsageLogRepository.save(
            OcrUsageLogEntity(
                id = IdGenerator.newId("ocr"),
                userId = userId,
                channel = channel,
                orgId = orgId,
                imageCount = imageCount,
                occurredAt = now,
            )
        )
    }
}
