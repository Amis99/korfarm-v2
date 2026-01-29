package com.korfarm.api.payment

import org.springframework.data.jpa.repository.JpaRepository

interface PaymentRepository : JpaRepository<PaymentEntity, String> {
    fun findByUserIdOrderByCreatedAtDesc(userId: String): List<PaymentEntity>
    fun findAllByOrderByCreatedAtDesc(): List<PaymentEntity>
}

