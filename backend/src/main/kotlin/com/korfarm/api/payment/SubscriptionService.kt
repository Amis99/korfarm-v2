package com.korfarm.api.payment

import com.korfarm.api.common.ApiException
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class SubscriptionService(
    private val subscriptionRepository: SubscriptionRepository
) {
    @Transactional(readOnly = true)
    fun currentSubscription(userId: String): SubscriptionView {
        val current = subscriptionRepository.findTopByUserIdOrderByEndAtDesc(userId)
            ?: return SubscriptionView(status = "none")
        val now = LocalDateTime.now()
        val effectiveStatus = if (current.endAt.isBefore(now)) "expired" else current.status
        return SubscriptionView(
            status = effectiveStatus,
            startAt = current.startAt,
            endAt = current.endAt,
            nextBillingAt = current.nextBillingAt
        )
    }

    @Transactional
    fun cancelSubscription(userId: String): SubscriptionView {
        val current = subscriptionRepository.findTopByUserIdOrderByEndAtDesc(userId)
            ?: throw ApiException("NOT_FOUND", "subscription not found", HttpStatus.NOT_FOUND)
        current.status = "canceled"
        current.canceledAt = LocalDateTime.now()
        subscriptionRepository.save(current)
        return SubscriptionView(
            status = current.status,
            startAt = current.startAt,
            endAt = current.endAt,
            nextBillingAt = current.nextBillingAt
        )
    }

    @Transactional(readOnly = true)
    fun requireActive(userId: String) {
        val current = subscriptionRepository.findTopByUserIdOrderByEndAtDesc(userId)
            ?: throw ApiException("PAYMENT_REQUIRED", "subscription required", HttpStatus.PAYMENT_REQUIRED)
        if (!isEntitled(current)) {
            throw ApiException("PAYMENT_REQUIRED", "subscription required", HttpStatus.PAYMENT_REQUIRED)
        }
    }

    fun isEntitled(subscription: SubscriptionEntity): Boolean {
        val now = LocalDateTime.now()
        return subscription.endAt.isAfter(now) && (subscription.status == "active" || subscription.status == "canceled")
    }
}

