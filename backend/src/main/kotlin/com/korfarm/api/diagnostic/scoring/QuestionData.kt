package com.korfarm.api.diagnostic.scoring

/** 진단 문항 데이터 (JSON 파싱 후 사용) */
data class QuestionData(
    val questionId: String,
    val passageId: String,
    val tier: String,
    val questionType: String,
    val level: Int?,
    val correctChoice: String?,
    val choices: List<ChoiceData>
)

data class ChoiceData(
    val choiceId: String,
    val text: String,
    val vector: Map<String, Double>,
    val errorPath: String?
)
