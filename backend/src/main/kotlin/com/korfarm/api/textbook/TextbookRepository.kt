package com.korfarm.api.textbook

import org.springframework.data.jpa.repository.JpaRepository

interface TextbookRepository : JpaRepository<TextbookEntity, String> {
    fun findAllByOrderByCreatedAtDesc(): List<TextbookEntity>
    fun findByOrgIdInOrderByCreatedAtDesc(orgIds: Collection<String>): List<TextbookEntity>
}
