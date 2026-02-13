package com.korfarm.api.pro

import org.springframework.data.jpa.repository.JpaRepository

interface ProChapterRepo : JpaRepository<ProChapterEntity, String> {
    fun findByLevelIdAndStatusOrderByGlobalChapterNumberAsc(levelId: String, status: String): List<ProChapterEntity>
    fun findByStatusOrderByGlobalChapterNumberAsc(status: String): List<ProChapterEntity>
    fun findByLevelIdOrderByGlobalChapterNumberAsc(levelId: String): List<ProChapterEntity>
}

interface ProChapterItemRepo : JpaRepository<ProChapterItemEntity, String> {
    fun findByChapterIdOrderByItemOrderAsc(chapterId: String): List<ProChapterItemEntity>
    fun deleteByChapterId(chapterId: String)
}

interface ProProgressRepo : JpaRepository<ProProgressEntity, String> {
    fun findByUserIdAndChapterId(userId: String, chapterId: String): List<ProProgressEntity>
    fun findByUserIdAndItemId(userId: String, itemId: String): ProProgressEntity?
    fun findByUserIdAndChapterIdIn(userId: String, chapterIds: List<String>): List<ProProgressEntity>
}

interface ProTestSessionRepo : JpaRepository<ProTestSessionEntity, String> {
    fun findByUserIdAndChapterId(userId: String, chapterId: String): List<ProTestSessionEntity>
    fun findByUserIdAndChapterIdAndStatusIn(userId: String, chapterId: String, statuses: List<String>): List<ProTestSessionEntity>
}

interface ProChapterTestRepo : JpaRepository<ProChapterTestEntity, String> {
    fun findByChapterIdAndStatusOrderByVersionAsc(chapterId: String, status: String): List<ProChapterTestEntity>
    fun findByChapterIdAndVersion(chapterId: String, version: Int): ProChapterTestEntity?
}
