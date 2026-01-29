package com.korfarm.api.system

import org.springframework.data.jpa.repository.JpaRepository

interface FeatureFlagRepository : JpaRepository<FeatureFlagEntity, String> {
    fun findAllByOrderByFlagKeyAsc(): List<FeatureFlagEntity>
}
