package com.korfarm.api.economy

data class Inventory(
    val seeds: Map<String, Int>,
    val crops: Map<String, Int>,
    val fertilizer: Int,
    val updatedAt: String
)

data class LedgerEntry(
    val id: String,
    val currencyType: String,
    val itemType: String?,
    val delta: Int,
    val reason: String,
    val refType: String?,
    val refId: String?,
    val createdAt: String
)

data class HarvestCraftResult(
    val cropType: String,
    val cropDelta: Int,
    val seedSpent: Int,
    val fertilizerSpent: Int,
    val inventory: Inventory
)
