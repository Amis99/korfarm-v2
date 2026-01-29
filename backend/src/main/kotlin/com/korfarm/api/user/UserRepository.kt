package com.korfarm.api.user

import org.springframework.data.jpa.repository.JpaRepository

interface UserRepository : JpaRepository<UserEntity, String> {
    fun findByEmail(email: String): UserEntity?
    fun existsByEmail(email: String): Boolean
}
