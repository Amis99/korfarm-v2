package com.korfarm.api.duel

import org.springframework.stereotype.Component
import java.time.LocalDateTime
import java.util.concurrent.locks.ReentrantLock
import kotlin.concurrent.withLock

data class DuelQueueEntry(
    val userId: String,
    val levelId: String,
    val stakeAmount: Int,
    val stakeCropType: String,
    val roomSize: Int,
    val joinedAt: LocalDateTime = LocalDateTime.now()
)

data class DuelQueueJoinResult(
    val position: Int? = null,
    val matched: List<DuelQueueEntry> = emptyList()
)

@Component
class DuelQueueStore {
    private val lock = ReentrantLock()
    private val entries = mutableListOf<DuelQueueEntry>()

    fun join(entry: DuelQueueEntry): DuelQueueJoinResult = lock.withLock {
        entries.removeAll { it.userId == entry.userId }
        entries.add(entry)
        val candidates = entries
            .filter { it.levelId == entry.levelId }
            .filter { it.stakeAmount == entry.stakeAmount }
            .filter { it.stakeCropType == entry.stakeCropType }
            .filter { it.roomSize == entry.roomSize }
            .sortedBy { it.joinedAt }
        if (candidates.size >= entry.roomSize) {
            val selected = candidates.take(entry.roomSize)
            entries.removeAll(selected.toSet())
            return DuelQueueJoinResult(matched = selected)
        }
        val position = entries.indexOfFirst { it.userId == entry.userId } + 1
        return DuelQueueJoinResult(position = position)
    }

    fun leave(userId: String): Boolean = lock.withLock {
        val before = entries.size
        entries.removeAll { it.userId == userId }
        return before != entries.size
    }

    fun positionOf(userId: String): Int? = lock.withLock {
        val index = entries.indexOfFirst { it.userId == userId }
        return if (index >= 0) index + 1 else null
    }
}
