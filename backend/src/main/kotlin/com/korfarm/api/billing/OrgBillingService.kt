package com.korfarm.api.billing

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.org.OrgMembershipRepository
import com.korfarm.api.org.OrgRepository
import com.korfarm.api.user.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.YearMonth
import java.time.format.DateTimeFormatter

/**
 * 기관 월 결제 서비스 — Phase B
 *
 * 산식:
 *   0~20명: 기본료 200,000원 (본사 감면 가능)
 *   21~50명: 기본료 + (등록일수 짧은 (학생수-20)명의 등록일수 합 × 500원)
 *   학생 등록일수 = MIN(말일, 오늘) - MAX(1일, created_at) + 1, status='active' 만
 *
 * 청구·정지 흐름:
 *   매월 1일 → 전월 청구서 자동 발행
 *   결제 마감 = 그 달 말일 23:59:59
 *   다음 달 1일 미결제 → orgs.billing_suspended=1
 *   결제 즉시 → billing_suspended=0
 */
@Service
class OrgBillingService(
    private val billingRepository: OrgBillingRepository,
    private val orgRepository: OrgRepository,
    private val orgMembershipRepository: OrgMembershipRepository,
    private val userRepository: UserRepository,
) {
    private val log = LoggerFactory.getLogger(OrgBillingService::class.java)

    companion object {
        const val DEFAULT_BASE_FEE = 200_000      // 0~20명 기본료
        const val FREE_STUDENT_LIMIT = 20         // 무료 한도 (이 명수까지는 추가 과금 X)
        const val EXCESS_PRICE_PER_DAY = 500      // 초과 학생 1일당 가격
        const val MAX_STUDENT_LIMIT = 50          // 50명 초과는 별도 협상 (현재는 그대로 산정)
    }

    // ─── 청구서 산정 ────────────────────────────────────

    /**
     * 특정 기관·월의 청구서 산정 (DB 저장 X — 조회·미리보기용).
     * 월말까지 카운트가 늘어날 수 있으므로 발행 시점에 다시 계산해 저장.
     */
    @Transactional(readOnly = true)
    fun calculateMonthlyFee(orgId: String, yearMonth: YearMonth): BillingCalculation {
        val org = orgRepository.findById(orgId).orElseThrow {
            ApiException("NOT_FOUND", "기관을 찾을 수 없습니다", HttpStatus.NOT_FOUND)
        }
        val baseFee = org.monthlyBaseFeeOverride ?: DEFAULT_BASE_FEE

        val firstDay = yearMonth.atDay(1)
        val lastDay = yearMonth.atEndOfMonth()
        // 산정 기준일: 청구월의 말일 (단, 미래라면 오늘 기준)
        val today = LocalDate.now()
        val countUntil = if (lastDay.isAfter(today)) today else lastDay

        // active 학생 멤버십 (학부모·관리자 제외 — role='STUDENT' 또는 그 외 비관리자)
        val activeMemberships = orgMembershipRepository.findByOrgIdAndStatus(orgId, "active")
            .filter { it.role != "HQ_ADMIN" && it.role != "ORG_ADMIN" && it.role != "PARENT" }

        // 학생별 그 달 등록일수 = MIN(countUntil, lastDay) - MAX(firstDay, createdAt.toLocalDate()) + 1
        // createdAt 이 청구월 이후면 0 (음수 → clamp 0)
        val studentDays = activeMemberships.mapNotNull { m ->
            val createdDate = m.createdAt.toLocalDate()
            val startDate = if (createdDate.isAfter(firstDay)) createdDate else firstDay
            if (startDate.isAfter(countUntil)) return@mapNotNull null
            val days = (countUntil.toEpochDay() - startDate.toEpochDay() + 1).toInt()
            m.userId to days
        }

        val totalStudents = studentDays.size
        val excessCount = (totalStudents - FREE_STUDENT_LIMIT).coerceAtLeast(0)

        // 등록일수 오름차순으로 가장 짧은 N명의 일수 합산
        val excessDays = if (excessCount > 0) {
            studentDays.map { it.second }.sorted().take(excessCount).sum()
        } else 0

        val excessFee = excessDays * EXCESS_PRICE_PER_DAY
        val totalFee = baseFee + excessFee

        return BillingCalculation(
            orgId = orgId,
            yearMonth = yearMonth.toString(),
            baseFee = baseFee,
            baseFeeIsOverride = org.monthlyBaseFeeOverride != null,
            activeStudentCount = totalStudents,
            excessStudentCount = excessCount,
            excessDays = excessDays,
            excessFee = excessFee,
            totalFee = totalFee,
        )
    }

    /** 기관·월 청구서 발행 (기존 row 있으면 재계산해서 update). 결제 완료된 row 는 건드리지 않음. */
    @Transactional
    fun issueBilling(orgId: String, yearMonth: YearMonth): OrgBillingEntity {
        val ymStr = yearMonth.toString()
        val existing = billingRepository.findByOrgIdAndYearMonth(orgId, ymStr)
        if (existing != null && existing.status == "paid") return existing

        val calc = calculateMonthlyFee(orgId, yearMonth)
        val dueAt = yearMonth.atEndOfMonth().atTime(23, 59, 59)
        val notes = "기본료 ${calc.baseFee}원${if (calc.baseFeeIsOverride) " (감면 적용)" else ""} + " +
                "초과 학생 ${calc.excessStudentCount}명 등록일수 ${calc.excessDays}일 × 500원 = ${calc.excessFee}원"

        val entity = existing ?: OrgBillingEntity(
            id = IdGenerator.newId("ob"),
            orgId = orgId,
            yearMonth = ymStr,
            baseFee = calc.baseFee,
            totalFee = calc.totalFee,
            dueAt = dueAt,
            status = "pending",
        )
        entity.baseFee = calc.baseFee
        entity.excessStudentCount = calc.excessStudentCount
        entity.excessDays = calc.excessDays
        entity.excessFee = calc.excessFee
        entity.totalFee = calc.totalFee
        entity.activeStudentCount = calc.activeStudentCount
        entity.dueAt = dueAt
        entity.notes = notes
        return billingRepository.save(entity)
    }

    /** 모든 활성 기관에 대해 해당 월 청구서 발행 (스케줄러용) */
    @Transactional
    fun issueBillingForAllOrgs(yearMonth: YearMonth): Int {
        val orgs = orgRepository.findByStatusOrderByNameAsc("active")
            .filter { it.id != "org_hq" }  // 본사 자체는 제외
        var count = 0
        orgs.forEach { o ->
            try {
                issueBilling(o.id, yearMonth)
                count++
            } catch (e: Exception) {
                log.error("기관 ${o.id} ${yearMonth} 청구서 발행 실패", e)
            }
        }
        log.info("월 청구서 발행 완료: {}건 ({}월)", count, yearMonth)
        return count
    }

    // ─── 결제 ────────────────────────────────────

    @Transactional
    fun payBilling(billingId: String, paymentId: String? = null): OrgBillingEntity {
        val b = billingRepository.findById(billingId).orElseThrow {
            ApiException("NOT_FOUND", "청구서 없음", HttpStatus.NOT_FOUND)
        }
        if (b.status == "paid") throw ApiException("ALREADY_PAID", "이미 결제됨", HttpStatus.BAD_REQUEST)
        b.status = "paid"
        b.paidAt = LocalDateTime.now()
        b.paymentId = paymentId ?: "mock-${System.currentTimeMillis()}"
        billingRepository.save(b)
        // 결제 즉시 정지 해제
        unsuspendOrg(b.orgId)
        return b
    }

    @Transactional
    fun unsuspendOrg(orgId: String) {
        val org = orgRepository.findById(orgId).orElse(null) ?: return
        if (org.billingSuspended) {
            org.billingSuspended = false
            orgRepository.save(org)
            log.info("기관 정지 해제: {}", orgId)
        }
    }

    /** 미결제 청구서가 마감 지난 기관을 정지 — 매일 새벽 실행 */
    @Transactional
    fun suspendOverdueOrgs(): Int {
        val now = LocalDateTime.now()
        val pending = billingRepository.findByStatus("pending")
        val overdue = pending.filter { it.dueAt.isBefore(now) }
        var count = 0
        overdue.forEach { b ->
            b.status = "overdue"
            billingRepository.save(b)
            val org = orgRepository.findById(b.orgId).orElse(null)
            if (org != null && !org.billingSuspended) {
                org.billingSuspended = true
                orgRepository.save(org)
                count++
                log.info("기관 정지 (미결제): {} ({}원, 마감 {})", org.id, b.totalFee, b.dueAt)
            }
        }
        return count
    }

    // ─── 조회 ────────────────────────────────────

    @Transactional(readOnly = true)
    fun listBillings(orgId: String): List<OrgBillingEntity> =
        billingRepository.findByOrgIdOrderByYearMonthDesc(orgId)

    @Transactional(readOnly = true)
    fun getCurrentMonthBilling(orgId: String): OrgBillingEntity? {
        val ym = YearMonth.now().toString()
        return billingRepository.findByOrgIdAndYearMonth(orgId, ym)
    }

    /** 정지 상태 + 임박 안내용 — 미결제 청구서 목록 + 가장 빠른 마감 */
    @Transactional(readOnly = true)
    fun getOrgBillingStatus(orgId: String): OrgBillingStatus {
        val org = orgRepository.findById(orgId).orElse(null)
        val pending = billingRepository.findByOrgIdAndStatus(orgId, "pending")
        val overdue = billingRepository.findByOrgIdAndStatus(orgId, "overdue")
        val nextDue = pending.minByOrNull { it.dueAt }?.dueAt
        return OrgBillingStatus(
            orgId = orgId,
            suspended = org?.billingSuspended ?: false,
            pendingCount = pending.size,
            overdueCount = overdue.size,
            nextDueAt = nextDue,
            unpaidTotal = (pending + overdue).sumOf { it.totalFee },
        )
    }

    /** HQ 한정 — 모든 기관 결제 요약 한 번에. 운영자 AI 가 호출. */
    @Transactional(readOnly = true)
    fun summaryForAllOrgs(): List<OrgBillingSummary> {
        return orgRepository.findAll().map { org ->
            val pending = billingRepository.findByOrgIdAndStatus(org.id, "pending")
            val overdue = billingRepository.findByOrgIdAndStatus(org.id, "overdue")
            val current = billingRepository.findByOrgIdAndYearMonth(org.id, YearMonth.now().toString())
            OrgBillingSummary(
                orgId = org.id,
                orgName = org.name,
                suspended = org.billingSuspended,
                pendingCount = pending.size,
                overdueCount = overdue.size,
                unpaidTotal = (pending + overdue).sumOf { it.totalFee },
                currentMonthStatus = current?.status,
                currentMonthDueAt = current?.dueAt?.toString(),
                currentMonthTotal = current?.totalFee,
            )
        }
    }

    // ─── 본사 — 기본료 감면 ────────────────────────────────────

    @Transactional
    fun setMonthlyBaseFeeOverride(orgId: String, override: Int?) {
        val org = orgRepository.findById(orgId).orElseThrow {
            ApiException("NOT_FOUND", "기관 없음", HttpStatus.NOT_FOUND)
        }
        if (override != null && override < 0) {
            throw ApiException("INVALID", "감면 금액은 0 이상", HttpStatus.BAD_REQUEST)
        }
        org.monthlyBaseFeeOverride = override
        orgRepository.save(org)
    }
}

// DTOs
data class BillingCalculation(
    val orgId: String,
    val yearMonth: String,
    val baseFee: Int,
    val baseFeeIsOverride: Boolean,
    val activeStudentCount: Int,
    val excessStudentCount: Int,
    val excessDays: Int,
    val excessFee: Int,
    val totalFee: Int,
)

data class OrgBillingStatus(
    val orgId: String,
    val suspended: Boolean,
    val pendingCount: Int,
    val overdueCount: Int,
    val nextDueAt: LocalDateTime?,
    val unpaidTotal: Int,
)

data class OrgBillingSummary(
    val orgId: String,
    val orgName: String,
    val suspended: Boolean,
    val pendingCount: Int,
    val overdueCount: Int,
    val unpaidTotal: Int,
    val currentMonthStatus: String?,
    val currentMonthDueAt: String?,
    val currentMonthTotal: Int?,
)
