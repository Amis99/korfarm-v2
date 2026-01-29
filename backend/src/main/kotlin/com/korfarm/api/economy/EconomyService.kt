package com.korfarm.api.economy

import com.korfarm.api.common.ApiException
import com.korfarm.api.common.IdGenerator
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class EconomyService(
    private val userSeedRepository: UserSeedRepository,
    private val userCropRepository: UserCropRepository,
    private val userFertilizerRepository: UserFertilizerRepository,
    private val economyLedgerRepository: EconomyLedgerRepository
) {
    private val seedRequired = 10
    private val fertilizerSpent = 1
    private val fertilizerMultiplier = 3

    @Transactional(readOnly = true)
    fun getInventory(userId: String): Inventory {
        val seeds = userSeedRepository.findByUserId(userId)
        val crops = userCropRepository.findByUserId(userId)
        val fertilizer = userFertilizerRepository.findByUserId(userId)?.count ?: 0
        val updatedAt = LocalDateTime.now().toString()
        return Inventory(
            seeds = seeds.associate { it.seedType to it.count },
            crops = crops.associate { it.cropType to it.count },
            fertilizer = fertilizer,
            updatedAt = updatedAt
        )
    }

    @Transactional(readOnly = true)
    fun getLedger(userId: String): List<LedgerEntry> {
        return economyLedgerRepository.findByUserIdOrderByCreatedAtDesc(userId).map {
            LedgerEntry(
                id = it.id,
                currencyType = it.currencyType,
                itemType = it.itemType,
                delta = it.delta,
                reason = it.reason,
                refType = it.refType,
                refId = it.refId,
                createdAt = it.createdAt.toString()
            )
        }
    }

    @Transactional
    fun addSeeds(userId: String, seedType: String, count: Int, reason: String, refType: String?, refId: String?) {
        val seed = userSeedRepository.findForUpdate(userId, seedType)
            ?: UserSeedEntity(
                id = IdGenerator.newId("us"),
                userId = userId,
                seedType = seedType,
                count = 0
            )
        seed.count += count
        userSeedRepository.save(seed)
        addLedger(userId, "seed", seedType, count, reason, refType, refId)
    }

    @Transactional
    fun adjustSeed(userId: String, seedType: String, delta: Int, reason: String, refType: String?, refId: String?) {
        val seed = userSeedRepository.findForUpdate(userId, seedType)
            ?: if (delta > 0) {
                UserSeedEntity(
                    id = IdGenerator.newId("us"),
                    userId = userId,
                    seedType = seedType,
                    count = 0
                )
            } else {
                throw ApiException("INSUFFICIENT_SEEDS", "not enough seeds", HttpStatus.BAD_REQUEST)
            }
        val nextCount = seed.count + delta
        if (nextCount < 0) {
            throw ApiException("INSUFFICIENT_SEEDS", "not enough seeds", HttpStatus.BAD_REQUEST)
        }
        seed.count = nextCount
        userSeedRepository.save(seed)
        addLedger(userId, "seed", seedType, delta, reason, refType, refId)
    }

    @Transactional
    fun adjustCrop(userId: String, cropType: String, delta: Int, reason: String, refType: String?, refId: String?) {
        val crop = userCropRepository.findForUpdate(userId, cropType)
            ?: if (delta > 0) {
                UserCropEntity(
                    id = IdGenerator.newId("uc"),
                    userId = userId,
                    cropType = cropType,
                    count = 0
                )
            } else {
                throw ApiException("INSUFFICIENT_CROPS", "not enough crops", HttpStatus.BAD_REQUEST)
            }
        val nextCount = crop.count + delta
        if (nextCount < 0) {
            throw ApiException("INSUFFICIENT_CROPS", "not enough crops", HttpStatus.BAD_REQUEST)
        }
        crop.count = nextCount
        userCropRepository.save(crop)
        addLedger(userId, "crop", cropType, delta, reason, refType, refId)
    }

    @Transactional
    fun harvestCraft(userId: String, seedType: String, useFertilizer: Boolean): HarvestCraftResult {
        val seed = userSeedRepository.findForUpdate(userId, seedType)
            ?: throw ApiException("INSUFFICIENT_SEEDS", "not enough seeds", HttpStatus.BAD_REQUEST)
        val currentSeeds = seed.count
        if (currentSeeds < seedRequired) {
            throw ApiException("INSUFFICIENT_SEEDS", "not enough seeds", HttpStatus.BAD_REQUEST)
        }
        val fertilizerCost = if (useFertilizer) fertilizerSpent else 0
        val fertilizer = userFertilizerRepository.findForUpdate(userId)
            ?: UserFertilizerEntity(id = IdGenerator.newId("uf"), userId = userId, count = 0)
        if (fertilizerCost > 0 && fertilizer.count < fertilizerCost) {
            throw ApiException("INSUFFICIENT_FERTILIZER", "not enough fertilizer", HttpStatus.BAD_REQUEST)
        }

        val cropType = seedType.replace("seed_", "crop_")
        val cropDelta = if (useFertilizer) fertilizerMultiplier else 1

        seed.count = currentSeeds - seedRequired
        val crop = userCropRepository.findForUpdate(userId, cropType)
            ?: UserCropEntity(id = IdGenerator.newId("uc"), userId = userId, cropType = cropType, count = 0)
        crop.count += cropDelta

        if (fertilizerCost > 0) {
            fertilizer.count -= fertilizerCost
        }

        userSeedRepository.save(seed)
        userCropRepository.save(crop)
        if (fertilizerCost > 0 || fertilizer.count > 0) {
            userFertilizerRepository.save(fertilizer)
        }

        addLedger(userId, "seed", seedType, -seedRequired, "harvest_craft", "harvest", null)
        addLedger(userId, "crop", cropType, cropDelta, "harvest_craft", "harvest", null)
        if (fertilizerCost > 0) {
            addLedger(userId, "fertilizer", "fertilizer", -fertilizerCost, "harvest_craft", "harvest", null)
        }

        return HarvestCraftResult(
            cropType = cropType,
            cropDelta = cropDelta,
            seedSpent = seedRequired,
            fertilizerSpent = fertilizerCost,
            inventory = getInventory(userId)
        )
    }

    private fun addLedger(
        userId: String,
        currencyType: String,
        itemType: String?,
        delta: Int,
        reason: String,
        refType: String?,
        refId: String?
    ) {
        val entity = EconomyLedgerEntity(
            id = IdGenerator.newId("lg"),
            userId = userId,
            currencyType = currencyType,
            itemType = itemType,
            delta = delta,
            reason = reason,
            refType = refType,
            refId = refId
        )
        economyLedgerRepository.save(entity)
    }
}
