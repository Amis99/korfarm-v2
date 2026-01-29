package com.korfarm.api.system

import com.korfarm.api.common.ApiException
import com.korfarm.api.contracts.AdminFlagUpdateRequest
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class FeatureFlagService(
    private val featureFlagRepository: FeatureFlagRepository
) {
    @Transactional(readOnly = true)
    fun listFlags(): List<FeatureFlagView> {
        return featureFlagRepository.findAllByOrderByFlagKeyAsc().map { it.toView() }
    }

    @Transactional
    fun updateFlag(flagKey: String, request: AdminFlagUpdateRequest): FeatureFlagView {
        val entity = featureFlagRepository.findById(flagKey).orElseThrow {
            ApiException("NOT_FOUND", "flag not found", HttpStatus.NOT_FOUND)
        }
        request.enabled?.let { entity.enabled = it }
        request.rolloutPercent?.let { entity.rolloutPercent = it }
        request.description?.let { entity.description = it }
        return featureFlagRepository.save(entity).toView()
    }

    @Transactional(readOnly = true)
    fun isEnabled(flagKey: String, userId: String? = null): Boolean {
        val flag = featureFlagRepository.findById(flagKey).orElse(null) ?: return false
        if (!flag.enabled || flag.rolloutPercent <= 0) {
            return false
        }
        if (flag.rolloutPercent >= 100) {
            return true
        }
        if (userId.isNullOrBlank()) {
            return true
        }
        val bucket = rolloutBucket(userId, flagKey)
        return bucket <= flag.rolloutPercent
    }

    fun requireEnabled(flagKey: String, userId: String? = null) {
        if (!isEnabled(flagKey, userId)) {
            throw ApiException("FEATURE_DISABLED", "feature disabled", HttpStatus.SERVICE_UNAVAILABLE)
        }
    }

    @Transactional(readOnly = true)
    fun requireNotKilled(flagKey: String) {
        val flag = featureFlagRepository.findById(flagKey).orElse(null)
        if (flag?.enabled == true) {
            throw ApiException("SERVICE_UNAVAILABLE", "service temporarily disabled", HttpStatus.SERVICE_UNAVAILABLE)
        }
    }

    private fun rolloutBucket(userId: String, flagKey: String): Int {
        val seed = "$flagKey:$userId"
        val hash = seed.hashCode() and 0x7fffffff
        return (hash % 100) + 1
    }

    private fun FeatureFlagEntity.toView(): FeatureFlagView {
        return FeatureFlagView(
            flagKey = flagKey,
            enabled = enabled,
            rolloutPercent = rolloutPercent,
            description = description,
            updatedAt = updatedAt
        )
    }
}

data class FeatureFlagView(
    val flagKey: String,
    val enabled: Boolean,
    val rolloutPercent: Int,
    val description: String?,
    val updatedAt: java.time.LocalDateTime
)
