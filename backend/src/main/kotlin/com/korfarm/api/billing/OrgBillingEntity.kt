package com.korfarm.api.billing

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.Table
import java.time.LocalDateTime

/** 기관 월 청구 */
@Entity
@Table(name = "org_billing")
class OrgBillingEntity(
    @Id
    var id: String,

    @Column(name = "org_id", nullable = false)
    var orgId: String,

    @Column(name = "billing_month", nullable = false, length = 7)
    var yearMonth: String,           // "2026-05" — DB 컬럼명은 billing_month (MySQL year_month 예약어 회피)

    @Column(name = "base_fee", nullable = false)
    var baseFee: Int,

    @Column(name = "excess_student_count", nullable = false)
    var excessStudentCount: Int = 0,

    @Column(name = "excess_days", nullable = false)
    var excessDays: Int = 0,

    @Column(name = "excess_fee", nullable = false)
    var excessFee: Int = 0,

    @Column(name = "total_fee", nullable = false)
    var totalFee: Int,

    @Column(name = "active_student_count", nullable = false)
    var activeStudentCount: Int = 0,

    @Column(name = "due_at", nullable = false)
    var dueAt: LocalDateTime,

    @Column(name = "paid_at")
    var paidAt: LocalDateTime? = null,

    @Column(name = "payment_id")
    var paymentId: String? = null,

    @Column(nullable = false, length = 16)
    var status: String = "pending",  // pending / paid / overdue / canceled

    @Column(columnDefinition = "TEXT")
    var notes: String? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),
) {
    @PrePersist
    fun onCreate() {
        if (createdAt == LocalDateTime.MIN) createdAt = LocalDateTime.now()
    }
}
