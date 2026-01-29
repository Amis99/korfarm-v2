package com.korfarm.api.files

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "files")
class FileEntity(
    @Id
    var id: String,

    @Column(name = "owner_id", nullable = false)
    var ownerId: String,

    @Column(nullable = false)
    var purpose: String,

    @Column(nullable = false)
    var url: String,

    @Column(nullable = false)
    var mime: String,

    @Column(nullable = false)
    var size: Long,

    @Column(nullable = false)
    var status: String,

    @Column(name = "created_at", nullable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    @PrePersist
    fun onCreate() {
        val now = LocalDateTime.now()
        createdAt = now
        updatedAt = now
    }

    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }
}
