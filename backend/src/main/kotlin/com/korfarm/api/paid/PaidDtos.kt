package com.korfarm.api.paid

data class ProModeLevel(
    val levelId: String,
    val title: String,
    val chapterCount: Int
)

data class ProModeChapter(
    val chapterId: String,
    val title: String,
    val content: Map<String, Any>
)

data class FarmMode(
    val modeId: String,
    val title: String,
    val description: String?
)

data class WritingPrompt(
    val promptId: String,
    val title: String,
    val prompt: String
)

data class TestSummary(
    val testId: String,
    val title: String,
    val status: String
)
