package com.korfarm.api.test

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.korfarm.api.org.OrgMembershipRepository
import com.korfarm.api.org.OrgRepository
import com.korfarm.api.user.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import kotlin.math.sqrt

/**
 * 시험지 응시 통계 계산·캐시 관리.
 * 정책: 응시(submitOmr) 즉시 재계산 → test_paper_statistics 갱신.
 * 어드민 페이지 조회 시 캐시 그대로 반환 (no on-demand).
 */
@Service
class TestStatisticsService(
    private val testPaperRepo: TestPaperRepo,
    private val questionRepo: TestQuestionRepo,
    private val submissionRepo: TestSubmissionRepo,
    private val statisticsRepo: TestPaperStatisticsRepo,
    private val userRepository: UserRepository,
    private val orgRepository: OrgRepository,
    private val orgMembershipRepository: OrgMembershipRepository,
    private val objectMapper: ObjectMapper,
) {

    /**
     * 응시 즉시 호출 — 해당 시험지 통계 전체 재계산 후 캐시 저장.
     */
    @Transactional
    fun recomputeAndCache(testId: String) {
        val paper = testPaperRepo.findById(testId).orElse(null) ?: return
        val questions = questionRepo.findByTestIdOrderByNumberAsc(testId)
        val submissions = submissionRepo.findByTestId(testId)

        if (submissions.isEmpty()) {
            // 응시자 0명 — 빈 통계 저장
            val empty = statisticsRepo.findById(testId).orElse(
                TestPaperStatisticsEntity(paperId = testId)
            )
            empty.submissionCount = 0
            empty.avgScore = null
            empty.maxScore = null
            empty.minScore = null
            empty.stdDev = null
            empty.gradeStatsJson = "{}"
            empty.questionStatsJson = "[]"
            empty.updatedAt = LocalDateTime.now()
            statisticsRepo.save(empty)
            return
        }

        // 학생 정보 조회
        val userIds = submissions.map { it.userId }
        val userMap = userRepository.findAllById(userIds).associateBy { it.id }

        // ── 전체 통계 ──
        val scores = submissions.map { it.score }
        val avg = scores.average()
        val max = scores.max()
        val min = scores.min()
        val variance = scores.map { (it - avg) * (it - avg) }.average()
        val std = sqrt(variance)

        // ── 학년별 통계 ──
        val gradeMap = mutableMapOf<String, MutableList<Int>>()
        for (sub in submissions) {
            val grade = userMap[sub.userId]?.gradeLabel ?: "미상"
            gradeMap.getOrPut(grade) { mutableListOf() }.add(sub.score)
        }
        val gradeStats = gradeMap.mapValues { (_, list) ->
            val a = list.average()
            val v = list.map { (it - a) * (it - a) }.average()
            mapOf(
                "count" to list.size,
                "avg" to a,
                "max" to list.max(),
                "min" to list.min(),
                "stdDev" to sqrt(v)
            )
        }

        // ── 문항별 통계 ──
        // 각 답안 파싱
        val questionStats = questions.map { q ->
            var attempts = 0
            var correctCount = 0
            val choiceDist = mutableMapOf<String, Int>()
            val choiceStudents = mutableMapOf<String, MutableList<String>>()
            val wrongStudents = mutableListOf<String>()

            for (sub in submissions) {
                val answers = parseAnswers(sub.answersJson)
                val myAns = answers[q.number.toString()] ?: continue
                if (myAns.isBlank()) continue
                attempts++

                val studentName = userMap[sub.userId]?.name ?: "미상"
                choiceDist[myAns] = (choiceDist[myAns] ?: 0) + 1
                choiceStudents.getOrPut(myAns) { mutableListOf() }.add(studentName)

                val isCorrect = if (q.type == "객관식") {
                    myAns == q.correctAnswer
                } else {
                    // 서술형은 statsJson에서 graded 결과 사용
                    val statsList = parseStatsList(sub.statsJson)
                    statsList.find { (it["q"] as? Number)?.toInt() == q.number }
                        ?.get("correct") as? Boolean ?: false
                }

                if (isCorrect) {
                    correctCount++
                } else {
                    wrongStudents.add(studentName)
                }
            }

            val correctRate = if (attempts > 0) correctCount.toDouble() / attempts else 0.0
            val wrongRate = 1.0 - correctRate

            // 역량 벡터: 현재는 domain 기반 매핑만 활용 (추후 문항별 vector 컬럼 추가 시 확장)
            val competencyVector = q.domain?.let {
                com.korfarm.api.learning.mapDomainToCompetency(it)?.let { c -> mapOf(c to 1.0) }
            } ?: emptyMap()

            mapOf(
                "number" to q.number,
                "type" to q.type,
                "domain" to q.domain,
                "subDomain" to q.subDomain,
                "points" to q.points,
                "correctAnswer" to q.correctAnswer,
                "wrongRate" to wrongRate,
                "correctRate" to correctRate,
                "attempts" to attempts,
                "correctCount" to correctCount,
                "choiceDistribution" to choiceDist,
                "choiceStudents" to choiceStudents,
                "wrongStudentNames" to wrongStudents,
                "competencyVector" to competencyVector
            )
        }

        // 저장
        val entity = statisticsRepo.findById(testId).orElse(TestPaperStatisticsEntity(paperId = testId))
        entity.submissionCount = submissions.size
        entity.avgScore = avg
        entity.maxScore = max
        entity.minScore = min
        entity.stdDev = std
        entity.gradeStatsJson = objectMapper.writeValueAsString(gradeStats)
        entity.questionStatsJson = objectMapper.writeValueAsString(questionStats)
        entity.updatedAt = LocalDateTime.now()
        statisticsRepo.save(entity)
    }

    /**
     * 어드민 통계 페이지: 캐시 그대로 반환 (없으면 즉시 1회 계산 후 반환).
     */
    @Transactional
    fun getStatistics(testId: String): TestPaperStatistics {
        val paper = testPaperRepo.findById(testId).orElseThrow {
            com.korfarm.api.common.ApiException(
                "NOT_FOUND", "시험지를 찾을 수 없습니다.",
                org.springframework.http.HttpStatus.NOT_FOUND
            )
        }
        var cache = statisticsRepo.findById(testId).orElse(null)
        if (cache == null) {
            recomputeAndCache(testId)
            cache = statisticsRepo.findById(testId).orElse(null)
        }
        if (cache == null) {
            return TestPaperStatistics(
                paperId = testId,
                submissionCount = 0,
                avgScore = null, maxScore = null, minScore = null, stdDev = null,
                totalPoints = paper.totalPoints,
                gradeStats = emptyMap(),
                updatedAt = null
            )
        }
        val gradeStats: Map<String, Map<String, Any>> = cache.gradeStatsJson?.let {
            try { objectMapper.readValue(it) } catch (_: Exception) { emptyMap() }
        } ?: emptyMap()
        return TestPaperStatistics(
            paperId = testId,
            submissionCount = cache.submissionCount,
            avgScore = cache.avgScore,
            maxScore = cache.maxScore,
            minScore = cache.minScore,
            stdDev = cache.stdDev,
            totalPoints = paper.totalPoints,
            gradeStats = gradeStats.mapValues { (_, m) ->
                GradeStat(
                    count = (m["count"] as? Number)?.toInt() ?: 0,
                    avg = (m["avg"] as? Number)?.toDouble() ?: 0.0,
                    max = (m["max"] as? Number)?.toInt() ?: 0,
                    min = (m["min"] as? Number)?.toInt() ?: 0,
                    stdDev = (m["stdDev"] as? Number)?.toDouble() ?: 0.0
                )
            },
            updatedAt = cache.updatedAt
        )
    }

    /**
     * 학생별 응시 상세 (통계 페이지 학생 테이블용).
     */
    @Transactional(readOnly = true)
    fun getStudentDetails(testId: String): List<StudentSubmissionDetail> {
        val paper = testPaperRepo.findById(testId).orElseThrow {
            com.korfarm.api.common.ApiException(
                "NOT_FOUND", "시험지를 찾을 수 없습니다.",
                org.springframework.http.HttpStatus.NOT_FOUND
            )
        }
        val submissions = submissionRepo.findByTestId(testId)
        if (submissions.isEmpty()) return emptyList()

        val questions = questionRepo.findByTestIdOrderByNumberAsc(testId)
        val userIds = submissions.map { it.userId }
        val userMap = userRepository.findAllById(userIds).associateBy { it.id }
        // 학생 → 소속 기관 (active membership 첫 번째)
        val membershipsByUser = userIds.associateWith { uid ->
            orgMembershipRepository.findByUserIdAndStatus(uid, "active").firstOrNull()
        }
        val orgIds = membershipsByUser.values.mapNotNull { it?.orgId }.distinct()
        val orgMap = if (orgIds.isNotEmpty()) {
            orgRepository.findAllById(orgIds).associateBy { it.id }
        } else emptyMap()

        return submissions.map { sub ->
            val answers = parseAnswers(sub.answersJson)
            val statsList = parseStatsList(sub.statsJson)
            val statsByQ = statsList.associateBy { (it["q"] as? Number)?.toInt() ?: 0 }

            // 영역별 점수 집계
            val domainAgg = mutableMapOf<String, IntArray>() // [score, maxScore, correct, total]
            val wrongNumbers = mutableListOf<Int>()

            for (q in questions) {
                val domain = q.domain ?: "기타"
                val agg = domainAgg.getOrPut(domain) { IntArray(4) }
                agg[1] += q.points
                agg[3] += 1

                val stat = statsByQ[q.number]
                val earned = (stat?.get("earned") as? Number)?.toInt() ?: 0
                val isCorrect = stat?.get("correct") as? Boolean ?: false
                agg[0] += earned
                if (isCorrect) agg[2] += 1 else wrongNumbers.add(q.number)
            }

            val totalPoints = paper.totalPoints
            val accuracy = if (totalPoints > 0) sub.score.toDouble() / totalPoints else 0.0

            val user = userMap[sub.userId]
            val membership = membershipsByUser[sub.userId]
            StudentSubmissionDetail(
                userId = sub.userId,
                userName = user?.name,
                school = user?.school,
                grade = user?.gradeLabel,
                orgName = membership?.orgId?.let { orgMap[it]?.name },
                score = sub.score,
                totalPoints = totalPoints,
                accuracy = accuracy,
                submittedAt = sub.createdAt,
                domainScores = domainAgg.mapValues { (_, a) ->
                    DomainScore(score = a[0], maxScore = a[1], correct = a[2], total = a[3])
                },
                wrongQuestionNumbers = wrongNumbers
            )
        }.sortedByDescending { it.score }
    }

    /**
     * 문항별 분석.
     */
    @Transactional
    fun getQuestionAnalysis(testId: String): List<QuestionAnalysis> {
        var cache = statisticsRepo.findById(testId).orElse(null)
        if (cache == null) {
            recomputeAndCache(testId)
            cache = statisticsRepo.findById(testId).orElse(null)
        }
        val raw: List<Map<String, Any?>> = cache?.questionStatsJson?.let {
            try { objectMapper.readValue(it) } catch (_: Exception) { emptyList() }
        } ?: emptyList()

        return raw.map { m ->
            QuestionAnalysis(
                number = (m["number"] as? Number)?.toInt() ?: 0,
                type = (m["type"] as? String) ?: "객관식",
                domain = m["domain"] as? String,
                subDomain = m["subDomain"] as? String,
                points = (m["points"] as? Number)?.toInt() ?: 0,
                correctAnswer = m["correctAnswer"] as? String,
                wrongRate = (m["wrongRate"] as? Number)?.toDouble() ?: 0.0,
                correctRate = (m["correctRate"] as? Number)?.toDouble() ?: 0.0,
                attempts = (m["attempts"] as? Number)?.toInt() ?: 0,
                correctCount = (m["correctCount"] as? Number)?.toInt() ?: 0,
                choiceDistribution = (m["choiceDistribution"] as? Map<String, Any?>)
                    ?.mapValues { (it.value as? Number)?.toInt() ?: 0 } ?: emptyMap(),
                choiceStudents = (m["choiceStudents"] as? Map<String, Any?>)
                    ?.mapValues { (it.value as? List<*>)?.filterIsInstance<String>() ?: emptyList() }
                    ?: emptyMap(),
                wrongStudentNames = (m["wrongStudentNames"] as? List<*>)?.filterIsInstance<String>() ?: emptyList(),
                competencyVector = (m["competencyVector"] as? Map<String, Any?>)
                    ?.mapValues { (it.value as? Number)?.toDouble() ?: 0.0 } ?: emptyMap()
            )
        }.sortedBy { it.number }
    }

    private fun parseAnswers(json: String?): Map<String, String> {
        if (json.isNullOrBlank()) return emptyMap()
        return try { objectMapper.readValue(json) } catch (_: Exception) { emptyMap() }
    }

    private fun parseStatsList(json: String?): List<Map<String, Any?>> {
        if (json.isNullOrBlank()) return emptyList()
        return try { objectMapper.readValue(json) } catch (_: Exception) { emptyList() }
    }
}
