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
    private val diagSessionRepo: com.korfarm.api.diagnostic.DiagSessionRepository,
    private val diagResponseRepo: com.korfarm.api.diagnostic.DiagResponseRepository,
    private val diagQuestionRepo: com.korfarm.api.diagnostic.DiagQuestionRepository,
    private val diagPassageRepo: com.korfarm.api.diagnostic.DiagPassageRepository,
    private val proTestSessionRepo: com.korfarm.api.pro.ProTestSessionRepo,
) {

    private fun resolveKind(testId: String, series: String?): String = when {
        testId.startsWith("diag_paper_") -> "diagnostic"
        series == "chapter" -> "chapter"
        else -> "misc"
    }

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
            val existing = statisticsRepo.findById(testId).orElse(null)
            val empty = existing ?: TestPaperStatisticsEntity(paperId = testId)
            empty.submissionCount = 0
            empty.avgScore = null
            empty.maxScore = null
            empty.minScore = null
            empty.stdDev = null
            empty.gradeStatsJson = "{}"
            empty.questionStatsJson = "[]"
            empty.updatedAt = LocalDateTime.now()
            // 기존 row는 dirty checking으로 자동 UPDATE — save() 호출하면 detached merge로 처리되어
            // 일부 환경에서 INSERT 시도(PK 충돌)가 발생하므로 신규일 때만 save 호출
            if (existing == null) statisticsRepo.save(empty)
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
            // 서술형 전용: 점수 버킷 (만점 / 부분점수 / 0점)별 응답자 + 답안 텍스트
            //   essayDist: { full|partial|zero -> count }
            //   essayBuckets: { full|partial|zero -> [ {userId, name, answer, earned} ] }
            val essayDist = mutableMapOf<String, Int>()
            val essayBuckets = mutableMapOf<String, MutableList<Map<String, Any?>>>()

            val isEssay = q.type == "서술형" || q.type == "서술"

            for (sub in submissions) {
                val answers = parseAnswers(sub.answersJson)
                val myAns = answers[q.number.toString()] ?: continue
                if (myAns.isBlank()) continue
                attempts++

                val studentName = userMap[sub.userId]?.name ?: "미상"
                val statsList = parseStatsList(sub.statsJson)
                val stat = statsList.find { (it["q"] as? Number)?.toInt() == q.number }
                val earned = (stat?.get("earned") as? Number)?.toInt() ?: 0
                val correctFromStats = stat?.get("correct") as? Boolean ?: false

                val isCorrect = if (isEssay) correctFromStats else (myAns == q.correctAnswer)

                if (isEssay) {
                    val bucket = when {
                        earned >= q.points -> "full"     // 만점
                        earned > 0 -> "partial"          // 부분점수
                        else -> "zero"                   // 0점
                    }
                    essayDist[bucket] = (essayDist[bucket] ?: 0) + 1
                    essayBuckets.getOrPut(bucket) { mutableListOf() }.add(
                        mapOf(
                            "userId" to sub.userId,
                            "name" to studentName,
                            "answer" to myAns,
                            "earned" to earned
                        )
                    )
                } else {
                    // 객관식: 선택지별 분포
                    choiceDist[myAns] = (choiceDist[myAns] ?: 0) + 1
                    choiceStudents.getOrPut(myAns) { mutableListOf() }.add(studentName)
                }

                if (isCorrect) correctCount++ else wrongStudents.add(studentName)
            }

            val correctRate = if (attempts > 0) correctCount.toDouble() / attempts else 0.0
            val wrongRate = 1.0 - correctRate

            // 역량 벡터: 현재는 domain 기반 매핑만 활용 (추후 문항별 vector 컬럼 추가 시 확장)
            val competencyVector = q.domain?.let {
                com.korfarm.api.learning.mapDomainToCompetency(it)?.let { c -> mapOf(c to 1.0) }
            } ?: emptyMap()

            // 선지 ID 목록 — choices_json 에서 추출 (없으면 1~5 fallback)
            val choiceIds: List<String> = if (isEssay) emptyList() else {
                try {
                    val raw: List<Map<String, Any?>> = objectMapper.readValue(
                        q.choicesJson ?: "[]",
                        object : com.fasterxml.jackson.core.type.TypeReference<List<Map<String, Any?>>>() {}
                    )
                    raw.mapIndexed { i, m ->
                        ((m["id"] ?: m["choice_id"]) as? String) ?: (i + 1).toString()
                    }.takeIf { it.isNotEmpty() } ?: listOf("1", "2", "3", "4", "5")
                } catch (_: Exception) { listOf("1", "2", "3", "4", "5") }
            }

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
                "competencyVector" to competencyVector,
                "choiceIds" to choiceIds,
                // 서술형 전용 필드 (객관식이면 빈 map)
                "essayDistribution" to essayDist,
                "essayBuckets" to essayBuckets
            )
        }

        // 저장
        val existing = statisticsRepo.findById(testId).orElse(null)
        val entity = existing ?: TestPaperStatisticsEntity(paperId = testId)
        entity.submissionCount = submissions.size
        entity.avgScore = avg
        entity.maxScore = max
        entity.minScore = min
        entity.stdDev = std
        entity.gradeStatsJson = objectMapper.writeValueAsString(gradeStats)
        entity.questionStatsJson = objectMapper.writeValueAsString(questionStats)
        entity.updatedAt = LocalDateTime.now()
        if (existing == null) statisticsRepo.save(entity)
        // 기존이면 managed entity의 dirty checking으로 자동 UPDATE
    }

    /**
     * 어드민 통계 페이지: 캐시 그대로 반환 (없으면 즉시 1회 계산 후 반환).
     * 종류별 분기:
     *   - 진단: diag_sessions 의 raw_tci 기반
     *   - 챕터: pro_test_sessions 의 score 기반
     *   - 기타: test_submissions 의 score 기반 (캐시 사용)
     *
     * scope: "all" — 전체 응시자 (HQ_ADMIN 기본).
     *        "org" — callerOrgIds 에 속한 학생만 (ORG_ADMIN 기본).
     */
    @Transactional
    fun getStatistics(testId: String, scope: String = "all", callerUserId: String? = null): TestPaperStatistics {
        val paper = testPaperRepo.findById(testId).orElseThrow {
            com.korfarm.api.common.ApiException(
                "NOT_FOUND", "시험지를 찾을 수 없습니다.",
                org.springframework.http.HttpStatus.NOT_FOUND
            )
        }
        val callerOrgIds = if (scope == "org" && callerUserId != null) {
            orgMembershipRepository.findByUserIdAndStatus(callerUserId, "active")
                .filter { it.role == "ORG_ADMIN" }
                .map { it.orgId }
        } else emptyList()
        val kind = resolveKind(testId, paper.series)
        if (kind == "diagnostic") return diagnosticStatistics(testId, paper, scope, callerOrgIds)
        // chapter / misc 모두 test_submissions 기반

        if (scope == "org") {
            // 기관 필터 — on-the-fly 재계산
            return computeStatisticsForOrgs(testId, paper, callerOrgIds)
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

    /** scope="org" 일 때 챕터·기타 통계 on-the-fly 계산 — 캐시 미사용. */
    private fun computeStatisticsForOrgs(
        testId: String, paper: TestPaperEntity, orgIds: List<String>
    ): TestPaperStatistics {
        if (orgIds.isEmpty()) {
            return TestPaperStatistics(
                paperId = testId, submissionCount = 0,
                avgScore = null, maxScore = null, minScore = null, stdDev = null,
                totalPoints = paper.totalPoints, gradeStats = emptyMap(), updatedAt = null
            )
        }
        val allSubs = submissionRepo.findByTestId(testId)
        if (allSubs.isEmpty()) return emptyStatsResponse(testId, paper)
        val orgUserIds = orgIds.flatMap { orgId ->
            orgMembershipRepository.findByOrgIdAndStatus(orgId, "active")
                .filter { it.role == "STUDENT" }.map { it.userId }
        }.toSet()
        val subs = allSubs.filter { it.userId in orgUserIds }
        if (subs.isEmpty()) return emptyStatsResponse(testId, paper)
        val scores = subs.map { it.score }
        val avg = scores.average()
        val variance = scores.map { (it - avg) * (it - avg) }.average()
        val userMap = userRepository.findAllById(subs.map { it.userId }).associateBy { it.id }
        val gradeMap = mutableMapOf<String, MutableList<Int>>()
        for (s in subs) {
            val g = userMap[s.userId]?.gradeLabel ?: "미상"
            gradeMap.getOrPut(g) { mutableListOf() }.add(s.score)
        }
        val gradeStats = gradeMap.mapValues { (_, list) ->
            val a = list.average()
            val v = list.map { (it - a) * (it - a) }.average()
            GradeStat(
                count = list.size, avg = a,
                max = list.max(), min = list.min(),
                stdDev = sqrt(v)
            )
        }
        return TestPaperStatistics(
            paperId = testId,
            submissionCount = subs.size,
            avgScore = avg,
            maxScore = scores.max(),
            minScore = scores.min(),
            stdDev = sqrt(variance),
            totalPoints = paper.totalPoints,
            gradeStats = gradeStats,
            updatedAt = subs.maxOf { it.createdAt }
        )
    }

    private fun emptyStatsResponse(testId: String, paper: TestPaperEntity) = TestPaperStatistics(
        paperId = testId, submissionCount = 0,
        avgScore = null, maxScore = null, minScore = null, stdDev = null,
        totalPoints = paper.totalPoints, gradeStats = emptyMap(), updatedAt = null
    )

    /**
     * 학생별 응시 상세 (통계 페이지 학생 테이블용).
     * scope="org" 일 때 callerOrgIds 멤버십 학생만 표시.
     */
    @Transactional(readOnly = true)
    fun getStudentDetails(testId: String, scope: String = "all", callerUserId: String? = null): List<StudentSubmissionDetail> {
        val paper = testPaperRepo.findById(testId).orElseThrow {
            com.korfarm.api.common.ApiException(
                "NOT_FOUND", "시험지를 찾을 수 없습니다.",
                org.springframework.http.HttpStatus.NOT_FOUND
            )
        }
        val orgUserIds: Set<String>? = if (scope == "org" && callerUserId != null) {
            val callerOrgIds = orgMembershipRepository.findByUserIdAndStatus(callerUserId, "active")
                .filter { it.role == "ORG_ADMIN" }
                .map { it.orgId }
            callerOrgIds.flatMap { orgId ->
                orgMembershipRepository.findByOrgIdAndStatus(orgId, "active")
                    .filter { it.role == "STUDENT" }.map { it.userId }
            }.toSet()
        } else null
        val kind = resolveKind(testId, paper.series)
        if (kind == "diagnostic") return diagnosticStudentDetails(testId, paper, orgUserIds)
        // chapter / misc 모두 test_submissions 기반 — 동일 로직

        val submissionsAll = submissionRepo.findByTestId(testId)
        val submissions = if (orgUserIds != null) submissionsAll.filter { it.userId in orgUserIds } else submissionsAll
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
            // 정답률 = 정답수 / 응답수 (전체 문항수 아님) — 사용자 명시 2026-05-16.
            // 미응답 문항은 분모에서 제외해 학생이 푼 만큼의 정답률만 표시.
            val answeredCount = answers.values.count { !it.isNullOrBlank() }
            val correctCount = statsList.count { (it["correct"] as? Boolean) == true }
            val accuracy = if (answeredCount > 0) correctCount.toDouble() / answeredCount else 0.0

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
                wrongQuestionNumbers = wrongNumbers,
                kind = kind,                    // "chapter" / "misc"
                submissionId = sub.id,
            )
        }.sortedByDescending { it.score }
    }

    /**
     * 문항별 분석.
     * 진단 시험: diag_responses 분포 + diag_questions vector 사용.
     * 챕터/기타: test_submissions 기반.
     * scope="org" 일 때 callerOrgIds 멤버십 학생만 집계.
     */
    @Transactional
    fun getQuestionAnalysis(
        testId: String, scope: String = "all", callerUserId: String? = null
    ): List<QuestionAnalysis> {
        val orgUserIds: Set<String>? = if (scope == "org" && callerUserId != null) {
            val callerOrgIds = orgMembershipRepository.findByUserIdAndStatus(callerUserId, "active")
                .filter { it.role == "ORG_ADMIN" }.map { it.orgId }
            callerOrgIds.flatMap { orgId ->
                orgMembershipRepository.findByOrgIdAndStatus(orgId, "active")
                    .filter { it.role == "STUDENT" }.map { it.userId }
            }.toSet()
        } else null
        if (testId.startsWith("diag_paper_")) return diagnosticQuestionAnalysis(testId, orgUserIds)

        // 일반/챕터 — scope="org" 면 on-the-fly 계산, 아니면 캐시 사용
        return if (orgUserIds != null) computeQuestionAnalysisForOrgs(testId, orgUserIds)
        else questionAnalysisFromCache(testId)
    }

    /** 캐시 기반 문항 분석 (scope="all"). */
    private fun questionAnalysisFromCache(testId: String): List<QuestionAnalysis> {
        var cache = statisticsRepo.findById(testId).orElse(null)
        if (cache == null) {
            recomputeAndCache(testId)
            cache = statisticsRepo.findById(testId).orElse(null)
        }
        var raw: List<Map<String, Any?>> = cache?.questionStatsJson?.let {
            try { objectMapper.readValue(it) } catch (_: Exception) { emptyList() }
        } ?: emptyList()
        // 옛 캐시 schema 감지 — essayDistribution 또는 choiceIds 키가 한 row에도 없으면 재계산
        val needsRecompute = raw.isNotEmpty() && (
            raw.none { it.containsKey("essayDistribution") } ||
            raw.none { it.containsKey("choiceIds") }
        )
        if (needsRecompute) {
            recomputeAndCache(testId)
            cache = statisticsRepo.findById(testId).orElse(null)
            raw = cache?.questionStatsJson?.let {
                try { objectMapper.readValue(it) } catch (_: Exception) { emptyList() }
            } ?: emptyList()
        }

        // 문항 본문 사전 — 모달에서 발문·선지·해설 보여주기 (캐시에는 분포만 있음)
        val questionMap = questionRepo.findByTestIdOrderByNumberAsc(testId).associateBy { it.number }

        return raw.map { m ->
            val number = (m["number"] as? Number)?.toInt() ?: 0
            val qEntity = questionMap[number]
            val (choiceTexts, choiceExplMap, stemText, passageText, explanation) = extractQuestionBody(qEntity)
            QuestionAnalysis(
                number = number,
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
                    ?.mapValues { (it.value as? Number)?.toDouble() ?: 0.0 } ?: emptyMap(),
                essayDistribution = (m["essayDistribution"] as? Map<String, Any?>)
                    ?.mapValues { (it.value as? Number)?.toInt() ?: 0 } ?: emptyMap(),
                essayBuckets = (m["essayBuckets"] as? Map<String, Any?>)?.mapValues { (_, v) ->
                    (v as? List<*>)?.filterIsInstance<Map<String, Any?>>()?.map { e ->
                        EssayAnswerEntry(
                            userId = (e["userId"] as? String) ?: "",
                            name = (e["name"] as? String) ?: "",
                            answer = (e["answer"] as? String) ?: "",
                            earned = (e["earned"] as? Number)?.toInt() ?: 0
                        )
                    } ?: emptyList()
                } ?: emptyMap(),
                choiceIds = (m["choiceIds"] as? List<*>)?.filterIsInstance<String>() ?: emptyList(),
                stemText = stemText,
                passageText = passageText,
                choiceTexts = choiceTexts,
                explanation = explanation,
                choiceExplanations = choiceExplMap,
            )
        }.sortedBy { it.number }
    }

    /** scope="org" 일 때 챕터·기타 문항별 분석 on-the-fly 계산. */
    private fun computeQuestionAnalysisForOrgs(
        testId: String, orgUserIds: Set<String>
    ): List<QuestionAnalysis> {
        val questions = questionRepo.findByTestIdOrderByNumberAsc(testId)
        if (questions.isEmpty()) return emptyList()
        val subsAll = submissionRepo.findByTestId(testId)
        val subs = subsAll.filter { it.userId in orgUserIds }
        val userMap = userRepository.findAllById(subs.map { it.userId }).associateBy { it.id }

        return questions.map { q ->
            val isEssay = q.type == "서술형" || q.type == "서술"
            var attempts = 0
            var correctCount = 0
            val choiceDist = mutableMapOf<String, Int>()
            val choiceStudents = mutableMapOf<String, MutableList<String>>()
            val wrongStudents = mutableListOf<String>()
            val essayDist = mutableMapOf<String, Int>()
            val essayBuckets = mutableMapOf<String, MutableList<Map<String, Any?>>>()

            for (sub in subs) {
                val answers = parseAnswers(sub.answersJson)
                val myAns = answers[q.number.toString()] ?: continue
                if (myAns.isBlank()) continue
                attempts++
                val studentName = userMap[sub.userId]?.name ?: "미상"
                val statsList = parseStatsList(sub.statsJson)
                val stat = statsList.find { (it["q"] as? Number)?.toInt() == q.number }
                val earned = (stat?.get("earned") as? Number)?.toInt() ?: 0
                val correctFromStats = stat?.get("correct") as? Boolean ?: false
                val isCorrect = if (isEssay) correctFromStats else (myAns == q.correctAnswer)
                if (isEssay) {
                    val bucket = when {
                        earned >= q.points -> "full"
                        earned > 0 -> "partial"
                        else -> "zero"
                    }
                    essayDist[bucket] = (essayDist[bucket] ?: 0) + 1
                    essayBuckets.getOrPut(bucket) { mutableListOf() }.add(mapOf(
                        "userId" to sub.userId, "name" to studentName,
                        "answer" to myAns, "earned" to earned
                    ))
                } else {
                    choiceDist[myAns] = (choiceDist[myAns] ?: 0) + 1
                    choiceStudents.getOrPut(myAns) { mutableListOf() }.add(studentName)
                }
                if (isCorrect) correctCount++ else wrongStudents.add(studentName)
            }
            val correctRate = if (attempts > 0) correctCount.toDouble() / attempts else 0.0
            val competencyVector = q.domain?.let {
                com.korfarm.api.learning.mapDomainToCompetency(it)?.let { c -> mapOf(c to 1.0) }
            } ?: emptyMap()
            val choiceIds: List<String> = if (isEssay) emptyList() else {
                try {
                    val rawCh: List<Map<String, Any?>> = objectMapper.readValue(
                        q.choicesJson ?: "[]",
                        object : com.fasterxml.jackson.core.type.TypeReference<List<Map<String, Any?>>>() {}
                    )
                    rawCh.mapIndexed { i, m -> ((m["id"] ?: m["choice_id"]) as? String) ?: (i + 1).toString() }
                        .takeIf { it.isNotEmpty() } ?: listOf("1", "2", "3", "4", "5")
                } catch (_: Exception) { listOf("1", "2", "3", "4", "5") }
            }
            val (choiceTexts, choiceExplMap, stemText, passageText, explanation) = extractQuestionBody(q)
            QuestionAnalysis(
                number = q.number,
                type = q.type,
                domain = q.domain,
                subDomain = q.subDomain,
                points = q.points,
                correctAnswer = q.correctAnswer,
                wrongRate = 1.0 - correctRate,
                correctRate = correctRate,
                attempts = attempts,
                correctCount = correctCount,
                choiceDistribution = choiceDist,
                choiceStudents = choiceStudents,
                wrongStudentNames = wrongStudents,
                competencyVector = competencyVector,
                essayDistribution = essayDist,
                essayBuckets = essayBuckets.mapValues { (_, list) ->
                    list.map { e ->
                        EssayAnswerEntry(
                            userId = (e["userId"] as? String) ?: "",
                            name = (e["name"] as? String) ?: "",
                            answer = (e["answer"] as? String) ?: "",
                            earned = (e["earned"] as? Number)?.toInt() ?: 0
                        )
                    }
                },
                choiceIds = choiceIds,
                stemText = stemText,
                passageText = passageText,
                choiceTexts = choiceTexts,
                explanation = explanation,
                choiceExplanations = choiceExplMap,
            )
        }.sortedBy { it.number }
    }

    /** test_questions row 에서 모달 표시용 본문 추출. */
    private fun extractQuestionBody(q: TestQuestionEntity?): QBodyPack {
        if (q == null) return QBodyPack(emptyMap(), emptyMap(), null, null, null)
        val choiceTexts = mutableMapOf<String, String>()
        try {
            val rawCh: List<Map<String, Any?>> = objectMapper.readValue(
                q.choicesJson ?: "[]",
                object : com.fasterxml.jackson.core.type.TypeReference<List<Map<String, Any?>>>() {}
            )
            rawCh.forEachIndexed { i, m ->
                val id = (m["id"] ?: m["choice_id"]) as? String ?: (i + 1).toString()
                val text = (m["text"] ?: m["content"]) as? String ?: ""
                choiceTexts[id] = text
            }
        } catch (_: Exception) {}
        val choiceExpl: Map<String, String> = try {
            objectMapper.readValue(q.choiceExplanationsJson ?: "{}",
                object : com.fasterxml.jackson.core.type.TypeReference<Map<String, String>>() {})
        } catch (_: Exception) { emptyMap() }
        return QBodyPack(
            choiceTexts = choiceTexts,
            choiceExplanations = choiceExpl,
            stemText = q.stem,
            passageText = q.passage,
            explanation = q.intent
        )
    }

    private data class QBodyPack(
        val choiceTexts: Map<String, String>,
        val choiceExplanations: Map<String, String>,
        val stemText: String?,
        val passageText: String?,
        val explanation: String?
    )

    private fun parseAnswers(json: String?): Map<String, String> {
        if (json.isNullOrBlank()) return emptyMap()
        return try { objectMapper.readValue(json) } catch (_: Exception) { emptyMap() }
    }

    private fun parseStatsList(json: String?): List<Map<String, Any?>> {
        if (json.isNullOrBlank()) return emptyList()
        return try { objectMapper.readValue(json) } catch (_: Exception) { emptyList() }
    }

    // ─── 진단 시험 통계 ───
    private fun diagnosticStatistics(
        testId: String, paper: TestPaperEntity,
        scope: String = "all", callerOrgIds: List<String> = emptyList()
    ): TestPaperStatistics {
        val tier = testId.removePrefix("diag_paper_")
        val allSessions = diagSessionRepo.findByTierAndStatus(tier, "completed")
        val sessions = if (scope == "org") {
            val orgUserIds = callerOrgIds.flatMap { orgId ->
                orgMembershipRepository.findByOrgIdAndStatus(orgId, "active")
                    .filter { it.role == "STUDENT" }.map { it.userId }
            }.toSet()
            allSessions.filter { it.userId in orgUserIds }
        } else allSessions
        if (sessions.isEmpty()) {
            return TestPaperStatistics(
                paperId = testId,
                submissionCount = 0,
                avgScore = null, maxScore = null, minScore = null, stdDev = null,
                totalPoints = paper.totalPoints,
                gradeStats = emptyMap(),
                updatedAt = null
            )
        }
        // 점수: raw_tci (0~100) — paper.totalPoints 와 동일 스케일로 가정
        val scores = sessions.mapNotNull { it.rawTci?.toDouble() }
        val avg = if (scores.isNotEmpty()) scores.average() else 0.0
        val max = scores.maxOrNull()?.toInt()
        val min = scores.minOrNull()?.toInt()
        val variance = if (scores.isNotEmpty()) scores.map { (it - avg) * (it - avg) }.average() else 0.0
        val std = sqrt(variance)

        // 학년별 집계 (학생 정보 조회)
        val userMap = userRepository.findAllById(sessions.map { it.userId }).associateBy { it.id }
        val gradeMap = mutableMapOf<String, MutableList<Double>>()
        for (s in sessions) {
            val grade = userMap[s.userId]?.gradeLabel ?: "미상"
            val sc = s.rawTci?.toDouble() ?: continue
            gradeMap.getOrPut(grade) { mutableListOf() }.add(sc)
        }
        val gradeStats = gradeMap.mapValues { (_, list) ->
            val a = list.average()
            val v = list.map { (it - a) * (it - a) }.average()
            GradeStat(
                count = list.size,
                avg = a,
                max = list.max().toInt(),
                min = list.min().toInt(),
                stdDev = sqrt(v)
            )
        }
        return TestPaperStatistics(
            paperId = testId,
            submissionCount = sessions.size,
            avgScore = avg,
            maxScore = max,
            minScore = min,
            stdDev = std,
            totalPoints = paper.totalPoints,
            gradeStats = gradeStats,
            updatedAt = sessions.mapNotNull { it.completedAt }.maxOrNull()
        )
    }

    private fun diagnosticStudentDetails(
        testId: String, paper: TestPaperEntity, orgUserIds: Set<String>? = null
    ): List<StudentSubmissionDetail> {
        val tier = testId.removePrefix("diag_paper_")
        val sessionsAll = diagSessionRepo.findByTierAndStatus(tier, "completed")
        val sessions = if (orgUserIds != null) sessionsAll.filter { it.userId in orgUserIds } else sessionsAll
        if (sessions.isEmpty()) return emptyList()

        val userIds = sessions.map { it.userId }
        val userMap = userRepository.findAllById(userIds).associateBy { it.id }
        val membershipsByUser = userIds.associateWith { uid ->
            orgMembershipRepository.findByUserIdAndStatus(uid, "active").firstOrNull()
        }
        val orgIds = membershipsByUser.values.mapNotNull { it?.orgId }.distinct()
        val orgMap = if (orgIds.isNotEmpty()) orgRepository.findAllById(orgIds).associateBy { it.id } else emptyMap()

        return sessions.map { s ->
            val user = userMap[s.userId]
            val membership = membershipsByUser[s.userId]
            val score = s.rawTci?.toInt() ?: 0
            val totalPoints = paper.totalPoints
            val accuracy = if (s.answeredCount > 0) s.correctCount.toDouble() / s.answeredCount else 0.0

            // 영역별 — scores_json + max_scores_json 파싱
            val scoresMap: Map<String, Any?> = s.scoresJson?.let {
                try { objectMapper.readValue(it, object : com.fasterxml.jackson.core.type.TypeReference<Map<String, Any?>>() {}) }
                catch (_: Exception) { emptyMap() }
            } ?: emptyMap()
            val maxMap: Map<String, Any?> = s.maxScoresJson?.let {
                try { objectMapper.readValue(it, object : com.fasterxml.jackson.core.type.TypeReference<Map<String, Any?>>() {}) }
                catch (_: Exception) { emptyMap() }
            } ?: emptyMap()
            val domainScores = scoresMap.keys.associate { key ->
                val sc = (scoresMap[key] as? Number)?.toInt() ?: 0
                val mx = (maxMap[key] as? Number)?.toInt() ?: 0
                key to DomainScore(score = sc, maxScore = mx, correct = if (sc > 0) 1 else 0, total = if (mx > 0) 1 else 0)
            }

            // 틀린 번호 — 학생 시험지 PDF 의 실제 번호 = response_order (2026-05-17 fix)
            val responses = diagResponseRepo.findBySessionIdOrderByResponseOrderAsc(s.id)
            val wrongNumbers = responses
                .filter { it.isCorrect == false }
                .map { it.responseOrder }
                .sorted()

            StudentSubmissionDetail(
                userId = s.userId,
                userName = user?.name,
                school = user?.school,
                grade = user?.gradeLabel,
                orgName = membership?.orgId?.let { orgMap[it]?.name },
                score = score,
                totalPoints = totalPoints,
                accuracy = accuracy,
                submittedAt = s.completedAt ?: s.startedAt,
                domainScores = domainScores,
                wrongQuestionNumbers = wrongNumbers,
                kind = "diagnostic",
                sessionId = s.id,
                tier = s.tier,
                tci = (s.adjustedTci ?: s.rawTci)?.toDouble(),
                recommendedLevel = s.recommendedLevel,
            )
        }.sortedByDescending { it.score }
    }

    /**
     * 진단 시험 문항별 분석.
     * - 객관식 분포: diag_responses.selected_choice 집계
     * - 학생 이름 매핑: diag_responses → diag_sessions(user_id) → users
     * - 역량 벡터: diag_questions.choices_json[*].vector (정답 선지의 vector)
     */
    private fun diagnosticQuestionAnalysis(
        testId: String, orgUserIds: Set<String>? = null
    ): List<QuestionAnalysis> {
        val tier = testId.removePrefix("diag_paper_")
        val sessionsAll = diagSessionRepo.findByTierAndStatus(tier, "completed")
        val sessions = if (orgUserIds != null) sessionsAll.filter { it.userId in orgUserIds } else sessionsAll
        if (sessions.isEmpty()) return emptyList()

        val sessionIds = sessions.map { it.id }
        val sessionUserMap = sessions.associate { it.id to it.userId }
        val userIds = sessions.map { it.userId }.distinct()
        val userMap = userRepository.findAllById(userIds).associateBy { it.id }

        // 모든 응답 수집
        val allResponses = sessionIds.flatMap { sid ->
            diagResponseRepo.findBySessionIdOrderByResponseOrderAsc(sid)
        }

        val tierQuestions = diagQuestionRepo.findByTierOrderByIdAsc(tier)
        val questionNumberMap = tierQuestions.withIndex().associate { (idx, q) -> q.id to (idx + 1) }

        // 진단 지문 — passageId → text_md 매핑 (모달용)
        val passageIds = tierQuestions.map { it.passageId }.distinct()
        val passageMap = if (passageIds.isNotEmpty()) {
            diagPassageRepo.findAllById(passageIds).associate { it.id to it.textMd }
        } else emptyMap()

        return tierQuestions.map { q ->
            val number = questionNumberMap[q.id] ?: 0
            val responsesForQ = allResponses.filter { it.questionId == q.id }

            val choiceDist = mutableMapOf<String, Int>()
            val choiceStudents = mutableMapOf<String, MutableList<String>>()
            val wrongStudents = mutableListOf<String>()
            var attempts = 0
            var correctCount = 0

            for (r in responsesForQ) {
                val choice = r.selectedChoice ?: continue
                if (choice.isBlank()) continue
                attempts++
                val userId = sessionUserMap[r.sessionId]
                val name = userMap[userId]?.name ?: "미상"
                choiceDist[choice] = (choiceDist[choice] ?: 0) + 1
                choiceStudents.getOrPut(choice) { mutableListOf() }.add(name)
                if (r.isCorrect) correctCount++ else wrongStudents.add(name)
            }
            val correctRate = if (attempts > 0) correctCount.toDouble() / attempts else 0.0
            val wrongRate = 1.0 - correctRate

            val rawChoices: List<Map<String, Any?>> = try {
                objectMapper.readValue(q.choicesJson, object : com.fasterxml.jackson.core.type.TypeReference<List<Map<String, Any?>>>() {})
            } catch (_: Exception) { emptyList() }
            val correctChoiceObj = rawChoices.firstOrNull {
                ((it["choice_id"] ?: it["id"]) as? String) == q.correctChoice
            }
            val competencyVector = (correctChoiceObj?.get("vector") as? Map<String, Any?>)
                ?.mapValues { (it.value as? Number)?.toDouble() ?: 0.0 } ?: emptyMap()

            val mappedType = if (q.questionType.equals("ESSAY", ignoreCase = true) || q.questionType == "서술형")
                "서술형" else "객관식"

            val choiceIds: List<String> = rawChoices.mapIndexed { i, m ->
                ((m["choice_id"] ?: m["id"]) as? String) ?: ('A' + i).toString()
            }
            val choiceTexts = rawChoices.mapIndexed { i, m ->
                val id = ((m["choice_id"] ?: m["id"]) as? String) ?: ('A' + i).toString()
                val text = (m["text"] ?: m["content"]) as? String ?: ""
                id to text
            }.toMap()
            val choiceExplMap = rawChoices.mapIndexed { i, m ->
                val id = ((m["choice_id"] ?: m["id"]) as? String) ?: ('A' + i).toString()
                val expl = (m["explanation"] ?: m["analysis"]) as? String ?: ""
                id to expl
            }.filter { (_, v) -> v.isNotBlank() }.toMap()

            QuestionAnalysis(
                number = number,
                type = mappedType,
                domain = null,
                subDomain = null,
                points = 1,
                correctAnswer = q.correctChoice,
                wrongRate = wrongRate,
                correctRate = correctRate,
                attempts = attempts,
                correctCount = correctCount,
                choiceDistribution = choiceDist,
                choiceStudents = choiceStudents,
                wrongStudentNames = wrongStudents,
                competencyVector = competencyVector,
                essayDistribution = emptyMap(),
                essayBuckets = emptyMap(),
                choiceIds = choiceIds,
                stemText = q.stem,
                passageText = passageMap[q.passageId],
                choiceTexts = choiceTexts,
                explanation = q.modelAnswer,  // 진단 문항 해설은 modelAnswer 컬럼에 저장됨
                choiceExplanations = choiceExplMap,
            )
        }.sortedBy { it.number }
    }
}
