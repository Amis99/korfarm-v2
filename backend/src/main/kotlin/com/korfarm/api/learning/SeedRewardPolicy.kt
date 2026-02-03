package com.korfarm.api.learning

import com.korfarm.api.economy.SeedCatalogEntity

object SeedRewardPolicy {
    private val levelOrder = listOf(
        "saussure1",
        "saussure2",
        "saussure3",
        "frege1",
        "frege2",
        "frege3",
        "russell1",
        "russell2",
        "russell3",
        "wittgenstein1",
        "wittgenstein2",
        "wittgenstein3"
    )

    fun seedCountFor(userLevelId: String?, contentLevelId: String?): Int {
        if (userLevelId.isNullOrBlank() || contentLevelId.isNullOrBlank()) {
            return 3
        }

        val userIndex = levelOrder.indexOf(userLevelId)
        val contentIndex = levelOrder.indexOf(contentLevelId)
        if (userIndex == -1 || contentIndex == -1) {
            return 3
        }

        val diff = contentIndex - userIndex
        return when {
            diff >= 2 -> 5
            diff == 1 -> 4
            diff == 0 -> 3
            diff == -1 -> 2
            else -> 1
        }
    }

    fun randomSeedType(catalog: List<SeedCatalogEntity>): String {
        if (catalog.isEmpty()) return "seed_wheat"
        val weighted = catalog.flatMap { seed ->
            val weight = if (seed.rarity == "common") 70 else 30
            List(weight) { seed.seedType }
        }
        return weighted.random()
    }
}
