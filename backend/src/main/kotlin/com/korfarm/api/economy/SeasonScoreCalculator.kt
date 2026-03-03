package com.korfarm.api.economy

// 시즌 점수 공식: 작물합×C + 최소작물×B + 총씨앗
object SeasonScoreCalculator {
    const val CROP_VALUE = 50
    const val BALANCE_BONUS = 500

    private val cropKeys = listOf("crop_wheat", "crop_rice", "crop_corn", "crop_grape", "crop_apple")

    fun calculate(crops: Map<String, Int>, totalSeeds: Int): Int {
        val values = cropKeys.map { crops[it] ?: 0 }
        val cropSum = values.sum()
        val minCrop = values.min()
        return CROP_VALUE * cropSum + BALANCE_BONUS * minCrop + totalSeeds
    }
}
