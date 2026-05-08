package com.korfarm.api.shop

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "products")
class ProductEntity(
    @Id
    var id: String,

    @Column(nullable = false)
    var name: String,

    @Column(nullable = false)
    var price: Int,

    @Column(nullable = false)
    var stock: Int,

    @Column(nullable = false)
    var status: String,

    @Column(nullable = true)
    var category: String? = "textbook",

    @Column(name = "level_label", nullable = true)
    var levelLabel: String? = null,

    @Column(nullable = true, length = 500)
    var summary: String? = null,

    @Column(name = "image_url", nullable = true, length = 1000)
    var imageUrl: String? = null,

    @Column(name = "detail_images_json", nullable = true, columnDefinition = "TEXT")
    var detailImagesJson: String? = null,

    @Column(name = "tags_json", nullable = true, columnDefinition = "TEXT")
    var tagsJson: String? = null,

    @Column(name = "details_json", nullable = true, columnDefinition = "TEXT")
    var detailsJson: String? = null,

    @Column(nullable = true, length = 32)
    var badge: String? = null,

    @Column(name = "sort_order", nullable = false)
    var sortOrder: Int = 0,

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
