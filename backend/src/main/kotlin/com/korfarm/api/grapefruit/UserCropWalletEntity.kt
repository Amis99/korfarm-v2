package com.korfarm.api.grapefruit

import jakarta.persistence.Column
import jakarta.persistence.Embeddable
import jakarta.persistence.EmbeddedId
import jakarta.persistence.Entity
import jakarta.persistence.PrePersist
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import java.io.Serializable
import java.time.LocalDateTime

@Embeddable
data class UserCropWalletId(
    @Column(name = "user_id") var userId: String = "",
    @Column(name = "crop_type") var cropType: String = "",
) : Serializable

/**
 * 개인 AI 사용용 작물 지갑 (Phase C).
 * user_crops 는 랭킹용으로 누적 보존 (사용해도 차감 X).
 * user_crop_wallet 은 AI 사용 시 차감되는 별도 지갑.
 * 작물 변환 시: user_crops += 1, user_crop_wallet += 1 동시 처리.
 */
@Entity
@Table(name = "user_crop_wallet")
class UserCropWalletEntity(
    @EmbeddedId
    var id: UserCropWalletId,

    @Column(nullable = false)
    var balance: Int = 0,

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),
) {
    @PrePersist
    @PreUpdate
    fun touch() {
        updatedAt = LocalDateTime.now()
    }
}
