package com.korfarm.api.payment

import org.springframework.data.jpa.repository.JpaRepository

interface SubscriptionRepository : JpaRepository<SubscriptionEntity, String> {
    fun findTopByUserIdOrderByEndAtDesc(userId: String): SubscriptionEntity?
}

