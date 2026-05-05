package com.korfarm.api.grapefruit

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import com.korfarm.api.org.OrgMembershipRepository
import com.korfarm.api.security.SecurityUtils
import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

/**
 * 자몽(AI 결제용 가상 화폐) 서비스 — Phase A
 *
 * - 기관 충전: 1자몽 = 200원 (10000원 = 50자몽)
 * - 개인 충전: 1자몽 = 250원 (10000원 = 40자몽) — Phase C
 * - 모든 차감은 grapefruit_pricing 테이블의 단가 사용
 * - 잔액 부족 시 ApiException("INSUFFICIENT_GRAPEFRUIT", 402 Payment Required)
 */
@Service
class GrapefruitService(
    private val pricingRepository: GrapefruitPricingRepository,
    private val orgWalletRepository: OrgGrapefruitWalletRepository,
    private val userWalletRepository: UserGrapefruitWalletRepository,
    private val transactionRepository: GrapefruitTransactionRepository,
    private val orgMembershipRepository: OrgMembershipRepository,
    private val userCropWalletRepository: UserCropWalletRepository,
) {
    private val log = LoggerFactory.getLogger(GrapefruitService::class.java)

    companion object {
        const val ORG_PRICE_PER_GRAPEFRUIT = 200          // 1자몽 = 200원 (기관)
        const val USER_PRICE_PER_GRAPEFRUIT = 250         // 1자몽 = 250원 (개인)
        const val ORG_GRAPEFRUITS_PER_10K = 50            // 10000원 → 50자몽
        const val USER_GRAPEFRUITS_PER_10K = 40

        // 초기 시드 (DB 비어있을 때만 INSERT)
        val SEED_PRICING = listOf(
            PricingSeed("wisdom-feedback", "AI 글쓰기 첨삭 (1편)", "sonnet", 1, "학생이 쓴 글 1편 첨삭"),
            PricingSeed("wisdom-ocr", "AI 필기 OCR (사진 1장)", "sonnet", 1, "학생 손글씨 사진 1장 OCR"),
            PricingSeed("file-to-markdown-1to5", "AI PDF/이미지 마크다운 변환 (1~5장)", "sonnet", 1, "PDF 또는 이미지 1~5페이지 변환"),
            PricingSeed("file-to-markdown-6to10", "AI PDF/이미지 마크다운 변환 (6~10장)", "sonnet", 2, "PDF 또는 이미지 6~10페이지 변환"),
            PricingSeed("passage-generation", "AI 지문 생성 (1편)", "sonnet", 1, "학습/시험 지문 1편 생성"),
            PricingSeed("checkpoint-extract", "AI 체크포인트 추출 — 일반", "sonnet", 1, "지문에서 체크포인트 추출 (일반 Sonnet)"),
            PricingSeed("checkpoint-extract-opus", "AI 체크포인트 추출 — 고급", "opus", 4, "지문에서 체크포인트 추출 (고급 Opus)"),
            PricingSeed("study-questions-sonnet", "AI 학습 문항 생성 — 일반 (5문항/회)", "sonnet", 2, "학습 문항 5개 생성 (일반 Sonnet)"),
            PricingSeed("study-questions-opus", "AI 학습 문항 생성 — 고급 (5문항/회)", "opus", 8, "학습 문항 5개 생성 (고급 Opus)"),
            PricingSeed("question-single-opus", "AI 단건 문제 출제", "opus", 3, "문제 1개 단건 출제 (Opus)"),
            PricingSeed("study-package-sonnet", "AI 학습 통합 생성", "sonnet", 4, "지문+체크포인트+5문항 일괄 생성 (일반)"),
        )
    }

    data class PricingSeed(
        val kind: String, val label: String, val model: String,
        val price: Int, val description: String
    )

    data class UserAiBalance(
        val grapefruits: Int,
        val crops: Map<String, Int>,        // crop_type → balance
    )

    /** 첫 부팅 시 단가 시드 — DB 비어있을 때만 INSERT (Flyway 비활성 환경 대응) */
    @PostConstruct
    @Transactional
    fun seedPricingIfEmpty() {
        if (pricingRepository.count() > 0) return
        val now = LocalDateTime.now()
        SEED_PRICING.forEach { s ->
            pricingRepository.save(
                GrapefruitPricingEntity(
                    kind = s.kind,
                    label = s.label,
                    model = s.model,
                    priceGrapefruits = s.price,
                    description = s.description,
                    active = true,
                    updatedAt = now,
                    updatedBy = "system-seed",
                )
            )
        }
        log.info("자몽 단가 시드 완료: {}건", SEED_PRICING.size)
    }

    // ─── 단가 조회/수정 ────────────────────────────────────

    @Transactional(readOnly = true)
    fun listPricing(): List<GrapefruitPricingEntity> =
        pricingRepository.findAll().sortedBy { it.kind }

    @Transactional(readOnly = true)
    fun getPrice(kind: String): Int {
        val p = pricingRepository.findById(kind).orElseThrow {
            ApiException("PRICING_NOT_FOUND", "단가 정보 없음: $kind", HttpStatus.NOT_FOUND)
        }
        if (!p.active) throw ApiException("PRICING_INACTIVE", "비활성화된 기능: $kind", HttpStatus.BAD_REQUEST)
        return p.priceGrapefruits
    }

    @Transactional
    fun updatePricing(kind: String, priceGrapefruits: Int, active: Boolean?, updatedBy: String) {
        val p = pricingRepository.findById(kind).orElseThrow {
            ApiException("PRICING_NOT_FOUND", "단가 정보 없음: $kind", HttpStatus.NOT_FOUND)
        }
        if (priceGrapefruits < 0) throw ApiException("INVALID", "단가는 0 이상", HttpStatus.BAD_REQUEST)
        p.priceGrapefruits = priceGrapefruits
        if (active != null) p.active = active
        p.updatedBy = updatedBy
        pricingRepository.save(p)
    }

    // ─── 잔액 조회 ────────────────────────────────────

    @Transactional(readOnly = true)
    fun getOrgBalance(orgId: String): Int =
        orgWalletRepository.findById(orgId).map { it.balance }.orElse(0)

    @Transactional(readOnly = true)
    fun getUserBalance(userId: String): Int =
        userWalletRepository.findById(userId).map { it.balance }.orElse(0)

    /** 호출자(ORG_ADMIN)의 본인 기관 자몽 잔액. ORG 가 아니면 null */
    @Transactional(readOnly = true)
    fun getCallerOrgBalance(): Pair<String, Int>? {
        val userId = SecurityUtils.currentUserId() ?: return null
        val orgId = orgMembershipRepository.findByUserIdAndStatus(userId, "active")
            .firstOrNull { it.role == "ORG_ADMIN" }?.orgId ?: return null
        return orgId to getOrgBalance(orgId)
    }

    // ─── 충전 ────────────────────────────────────

    @Transactional
    fun chargeOrg(orgId: String, amountWon: Int, paymentId: String?, memo: String?): Int {
        if (amountWon <= 0) throw ApiException("INVALID", "충전 금액은 양수", HttpStatus.BAD_REQUEST)
        // 단순 환산: 200원당 1자몽. 잔돈 무시(가장 가까운 정수 내림).
        val grapefruits = amountWon / ORG_PRICE_PER_GRAPEFRUIT
        if (grapefruits <= 0) throw ApiException("INVALID", "최소 ${ORG_PRICE_PER_GRAPEFRUIT}원 이상", HttpStatus.BAD_REQUEST)

        val wallet = orgWalletRepository.findById(orgId).orElseGet {
            OrgGrapefruitWalletEntity(orgId = orgId, balance = 0)
        }
        wallet.balance += grapefruits
        orgWalletRepository.save(wallet)

        recordTransaction(
            walletType = "org", ownerId = orgId,
            direction = "charge", amount = grapefruits,
            kind = null, aiLogId = null, paymentId = paymentId,
            amountWon = amountWon, balanceAfter = wallet.balance,
            memo = memo ?: "기관 자몽 충전",
        )
        return wallet.balance
    }

    @Transactional
    fun chargeUser(userId: String, amountWon: Int, paymentId: String?, memo: String?): Int {
        if (amountWon <= 0) throw ApiException("INVALID", "충전 금액은 양수", HttpStatus.BAD_REQUEST)
        val grapefruits = amountWon / USER_PRICE_PER_GRAPEFRUIT
        if (grapefruits <= 0) throw ApiException("INVALID", "최소 ${USER_PRICE_PER_GRAPEFRUIT}원 이상", HttpStatus.BAD_REQUEST)

        val wallet = userWalletRepository.findById(userId).orElseGet {
            UserGrapefruitWalletEntity(userId = userId, balance = 0)
        }
        wallet.balance += grapefruits
        userWalletRepository.save(wallet)

        recordTransaction(
            walletType = "user", ownerId = userId,
            direction = "charge", amount = grapefruits,
            kind = null, aiLogId = null, paymentId = paymentId,
            amountWon = amountWon, balanceAfter = wallet.balance,
            memo = memo ?: "개인 자몽 충전",
        )
        return wallet.balance
    }

    // ─── 차감 (AI 호출 시) ────────────────────────────────────

    /**
     * 기관 자몽 차감. AI 호출 직전에 호출.
     * 잔액 부족 시 INSUFFICIENT_GRAPEFRUIT (402).
     */
    @Transactional
    fun spendOrg(orgId: String, kind: String, aiLogId: String? = null, memo: String? = null): Int {
        val price = getPrice(kind)
        return spendOrgInternal(orgId, kind, price, aiLogId, memo)
    }

    /** 기관 자몽 임의 단가 차감 (예: 페이지 수에 따라) */
    @Transactional
    fun spendOrgWithCustomPrice(orgId: String, kind: String, price: Int, aiLogId: String? = null, memo: String? = null): Int {
        if (price <= 0) throw ApiException("INVALID", "단가는 양수", HttpStatus.BAD_REQUEST)
        return spendOrgInternal(orgId, kind, price, aiLogId, memo)
    }

    private fun spendOrgInternal(orgId: String, kind: String, price: Int, aiLogId: String?, memo: String?): Int {
        val wallet = orgWalletRepository.findById(orgId).orElseGet {
            OrgGrapefruitWalletEntity(orgId = orgId, balance = 0)
        }
        if (wallet.balance < price) {
            throw ApiException(
                "INSUFFICIENT_GRAPEFRUIT",
                "자몽 잔액 부족 — 필요: ${price}자몽, 보유: ${wallet.balance}자몽. 자몽 충전 후 다시 시도해 주세요.",
                HttpStatus.PAYMENT_REQUIRED
            )
        }
        wallet.balance -= price
        orgWalletRepository.save(wallet)

        recordTransaction(
            walletType = "org", ownerId = orgId,
            direction = "spend", amount = price,
            kind = kind, aiLogId = aiLogId, paymentId = null,
            amountWon = null, balanceAfter = wallet.balance,
            memo = memo,
        )
        return wallet.balance
    }

    /**
     * 호출자가 ORG_ADMIN 이면 본인 기관 자몽 차감, HQ_ADMIN 이면 차감 없이 통과(0 반환).
     * 기존 AI endpoint 들에 한 줄로 삽입하기 위한 헬퍼.
     */
    @Transactional
    fun spendForCaller(kind: String, aiLogId: String? = null, memo: String? = null): Int {
        if (SecurityUtils.hasAnyRole("HQ_ADMIN")) return 0
        val pair = getCallerOrgBalance() ?: return 0  // 권한이 없는 경우 — 차감 안 하고 통과 (다른 가드가 처리)
        val (orgId, _) = pair
        return spendOrg(orgId, kind, aiLogId, memo)
    }

    /** 페이지 수 기반 차감 (PDF 마크다운 — 1~5장 vs 6~10장) */
    @Transactional
    fun spendForCallerByPages(pageCount: Int, aiLogId: String? = null): Int {
        if (SecurityUtils.hasAnyRole("HQ_ADMIN")) return 0
        if (pageCount <= 0) return 0
        val kind = if (pageCount <= 5) "file-to-markdown-1to5" else "file-to-markdown-6to10"
        return spendForCaller(kind, aiLogId, "${pageCount}페이지 변환")
    }

    // ─── 개인 충전·차감 (Phase C) ────────────────────────────────────

    /** 개인 자몽 잔액 + 보유 작물 합계 (모두 1:1 자몽 환산) */
    @Transactional(readOnly = true)
    fun getUserAiBalance(userId: String): UserAiBalance {
        val grapefruits = getUserBalance(userId)
        val crops = userCropWalletRepository.findByIdUserId(userId)
            .filter { it.balance > 0 }
            .associate { it.id.cropType to it.balance }
        return UserAiBalance(grapefruits = grapefruits, crops = crops)
    }

    /**
     * 학생 AI 사용 차감.
     * currency: "grapefruit" 또는 "crop_<type>" (예: "crop_wheat", "crop_apple")
     * 잔액 부족 시 INSUFFICIENT_GRAPEFRUIT (402).
     */
    @Transactional
    fun spendForUser(
        userId: String,
        kind: String,
        currency: String,
        aiLogId: String? = null,
        memo: String? = null,
    ): Int {
        val price = getPrice(kind)
        return when {
            currency == "grapefruit" -> spendUserGrapefruit(userId, kind, price, aiLogId, memo)
            currency.startsWith("crop_") -> spendUserCrop(userId, currency, kind, price, aiLogId, memo)
            else -> throw ApiException("INVALID_CURRENCY", "통화 잘못됨: $currency", HttpStatus.BAD_REQUEST)
        }
    }

    private fun spendUserGrapefruit(userId: String, kind: String, price: Int, aiLogId: String?, memo: String?): Int {
        val wallet = userWalletRepository.findById(userId).orElseGet {
            UserGrapefruitWalletEntity(userId = userId, balance = 0)
        }
        if (wallet.balance < price) {
            throw ApiException(
                "INSUFFICIENT_GRAPEFRUIT",
                "자몽 잔액 부족 — 필요: ${price}자몽, 보유: ${wallet.balance}자몽",
                HttpStatus.PAYMENT_REQUIRED
            )
        }
        wallet.balance -= price
        userWalletRepository.save(wallet)
        recordTransaction(
            walletType = "user", ownerId = userId,
            direction = "spend", amount = price,
            kind = kind, aiLogId = aiLogId, paymentId = null,
            amountWon = null, balanceAfter = wallet.balance,
            memo = memo,
        )
        return wallet.balance
    }

    private fun spendUserCrop(userId: String, cropType: String, kind: String, price: Int, aiLogId: String?, memo: String?): Int {
        val id = UserCropWalletId(userId = userId, cropType = cropType)
        val wallet = userCropWalletRepository.findById(id).orElseGet {
            UserCropWalletEntity(id = id, balance = 0)
        }
        if (wallet.balance < price) {
            throw ApiException(
                "INSUFFICIENT_CROP",
                "${cropType} 잔액 부족 — 필요: ${price}개, 보유: ${wallet.balance}개",
                HttpStatus.PAYMENT_REQUIRED
            )
        }
        wallet.balance -= price
        userCropWalletRepository.save(wallet)
        recordTransaction(
            walletType = "user", ownerId = userId,
            direction = "spend", amount = price,
            kind = kind, aiLogId = aiLogId, paymentId = null,
            amountWon = null, balanceAfter = wallet.balance,
            memo = "${cropType} 사용: ${memo ?: kind}",
        )
        return wallet.balance
    }

    /**
     * 작물 변환 시 ai_wallet 에 추가 (랭킹용 user_crops 는 별도 +1).
     * EconomyService.convertSeedsToCrops 에서 호출.
     */
    @Transactional
    fun grantCropToWallet(userId: String, cropType: String, amount: Int = 1) {
        if (amount <= 0) return
        val id = UserCropWalletId(userId = userId, cropType = cropType)
        val wallet = userCropWalletRepository.findById(id).orElseGet {
            UserCropWalletEntity(id = id, balance = 0)
        }
        wallet.balance += amount
        userCropWalletRepository.save(wallet)
    }

    // ─── 거래 이력 ────────────────────────────────────

    @Transactional(readOnly = true)
    fun listTransactionsForOrg(orgId: String): List<GrapefruitTransactionEntity> =
        transactionRepository.findTop100ByWalletTypeAndWalletOwnerIdOrderByCreatedAtDesc("org", orgId)

    @Transactional(readOnly = true)
    fun listTransactionsForUser(userId: String): List<GrapefruitTransactionEntity> =
        transactionRepository.findTop100ByWalletTypeAndWalletOwnerIdOrderByCreatedAtDesc("user", userId)

    private fun recordTransaction(
        walletType: String, ownerId: String,
        direction: String, amount: Int,
        kind: String?, aiLogId: String?, paymentId: String?,
        amountWon: Int?, balanceAfter: Int, memo: String?,
    ) {
        transactionRepository.save(
            GrapefruitTransactionEntity(
                id = IdGenerator.newId("gft"),
                walletType = walletType,
                walletOwnerId = ownerId,
                direction = direction,
                amount = amount,
                kind = kind,
                aiLogId = aiLogId,
                paymentId = paymentId,
                amountWon = amountWon,
                balanceAfter = balanceAfter,
                memo = memo,
                createdAt = LocalDateTime.now(),
            )
        )
    }
}
