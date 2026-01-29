package com.korfarm.api.shop

import org.springframework.data.jpa.repository.JpaRepository

interface ProductRepository : JpaRepository<ProductEntity, String> {
    fun findByStatus(status: String): List<ProductEntity>
}

