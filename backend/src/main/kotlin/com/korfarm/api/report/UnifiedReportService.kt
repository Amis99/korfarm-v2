package com.korfarm.api.report

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.common.ApiException
import com.korfarm.api.learning.FarmLearningLogRepository
import com.korfarm.api.learning.LearningAttemptRepository
import com.korfarm.api.learning.QuizAnswerDetailRepository
import com.korfarm.api.pro.CompetencyScore
import com.korfarm.api.pro.ProProgressRepo
import com.korfarm.api.pro.ProTestSessionRepo
import com.korfarm.api.test.TestPaperRepo
import com.korfarm.api.test.TestSubmissionRepo
import com.korfarm.api.studyplan.*
import com.korfarm.api.user.ParentLinkService
import com.korfarm.api.user.UserRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.format.DateTimeFormatter

@Service
class UnifiedReportService(
    private val testSubmissionRepo: TestSubmissionRepo,
    private val testPaperRepo: TestPaperRepo,
    private val farmLearningLogRepo: FarmLearningLogRepository,
    private val learningAttemptRepo: LearningAttemptRepository,
    private val proProgressRepo: ProProgressRepo,
    private val proTestSessionRepo: ProTestSessionRepo,
    private val userRepository: UserRepository,
    private val parentLinkService: ParentLinkService,
    private val studyPlanCellRepo: StudyPlanCellRepository,
    private val studyPlanRepo: StudyPlanRepository,
    private val studyPlanScopeRepo: StudyPlanScopeRepository,
    private val studyPlanAssetRepo: StudyPlanAssetRepository,
    private val studyPlanTargetRepo: StudyPlanTargetRepository,
    private val quizAnswerDetailRepo: QuizAnswerDetailRepository,
    private val objectMapper: ObjectMapper
) {
    private val dtFmt = DateTimeFormatter.ISO_LOCAL_DATE_TIME

    @Transactional(readOnly = true)
    fun getReport(studentId: String, startDate: LocalDate, endDate: LocalDate): UnifiedReportResponse {
        val user = userRepository.findById(studentId).orElseThrow {
            ApiException("NOT_FOUND", "학생을 찾을 수 없습니다.", HttpStatus.NOT_FOUND)
        }
        val start = startDate.atStartOfDay()
        val end = endDate.atTime(LocalTime.MAX)

        val examOmr = buildExamOmrSection(studentId, start, end)
        val farmMode = buildFarmModeSection(studentId, start, end)
        val dailyQuiz = buildDailySection(studentId, "daily_quiz", start, end)
        val dailyReading = buildDailySection(studentId, "daily_reading", start, end)
        val proMode = buildProModeSection(studentId, start, end)

        val studyPlan = buildStudyPlanSection(studentId, start, end)

        val sections = ReportSections(
            examOmr = examOmr,
            farmMode = farmMode,
            dailyQuiz = dailyQuiz,
            dailyReading = dailyReading,
            proMode = proMode,
            studyPlan = studyPlan
        )

        val trend = buildTrend(studentId, startDate, endDate)
        val radarData = RadarData(
            labels = listOf("시험 OMR", "농장 모드", "일일 퀴즈", "일일 독해", "프로 모드", "학습 계획표"),
            scores = listOf(
                examOmr.normalizedScore,
                farmMode.normalizedScore,
                dailyQuiz.normalizedScore,
                dailyReading.normalizedScore,
                proMode.normalizedScore,
                studyPlan?.normalizedScore ?: 0.0
            )
        )

        // 역량별·영역별 분석
        val competencyStats = buildCompetencyStats(studentId, start, end, farmMode)
        val areaStats = buildAreaStats(farmMode, competencyStats)
        val recommendations = buildRecommendations(competencyStats)

        val competencyRadarData = if (competencyStats.isNotEmpty()) {
            RadarData(
                labels = competencyStats.map { it.competencyLabel },
                scores = competencyStats.map { it.accuracy }
            )
        } else null

        val summary = buildSummary(sections, competencyStats)

        return UnifiedReportResponse(
            studentId = studentId,
            studentName = user.name ?: "",
            period = ReportPeriod(startDate, endDate),
            summary = summary,
            sections = sections,
            trend = trend,
            radarData = radarData,
            areaStats = areaStats,
            competencyStats = competencyStats,
            competencyRadarData = competencyRadarData,
            recommendations = recommendations
        )
    }

    @Transactional(readOnly = true)
    fun getReportForParent(parentId: String, studentId: String, startDate: LocalDate, endDate: LocalDate): UnifiedReportResponse {
        val linked = parentLinkService.verifyParentChildLink(parentId, studentId)
        if (!linked) {
            throw ApiException("FORBIDDEN", "자녀 연결이 확인되지 않습니다.", HttpStatus.FORBIDDEN)
        }
        return getReport(studentId, startDate, endDate)
    }

    // 시험 OMR 영역
    private fun buildExamOmrSection(userId: String, start: LocalDateTime, end: LocalDateTime): ExamOmrSection {
        val submissions = testSubmissionRepo.findByUserIdAndCreatedAtBetween(userId, start, end)
        if (submissions.isEmpty()) {
            return ExamOmrSection(0, 0.0, 0.0, null, null, 0.0, emptyList())
        }

        val testPaperIds = submissions.map { it.testId }.distinct()
        val testPapers = testPaperRepo.findAllById(testPaperIds).associateBy { it.id }

        val items = submissions.map { sub ->
            val paper = testPapers[sub.testId]
            val totalPoints = paper?.totalPoints ?: 100
            val totalQuestions = paper?.totalQuestions ?: 0
            val accuracy = if (totalQuestions > 0) (sub.correctCount.toDouble() / totalQuestions * 100) else 0.0
            ExamOmrItem(
                testId = sub.testId,
                testTitle = paper?.title ?: "",
                score = sub.score,
                totalPoints = totalPoints,
                correctCount = sub.correctCount,
                totalQuestions = totalQuestions,
                accuracy = round2(accuracy),
                submittedAt = sub.createdAt.format(dtFmt)
            )
        }

        val normalizedScores = items.map { it.score.toDouble() / it.totalPoints * 100 }
        val avgScore = round2(normalizedScores.average())
        val avgAccuracy = round2(items.map { it.accuracy }.average())

        return ExamOmrSection(
            count = items.size,
            averageScore = avgScore,
            averageAccuracy = avgAccuracy,
            highestScore = items.maxOf { it.score },
            lowestScore = items.minOf { it.score },
            normalizedScore = avgScore,
            items = items
        )
    }

    // 농장 모드 영역
    private fun buildFarmModeSection(userId: String, start: LocalDateTime, end: LocalDateTime): FarmModeSection {
        val logs = farmLearningLogRepo.findByUserIdAndStatusAndCompletedAtBetween(userId, "COMPLETED", start, end)
        if (logs.isEmpty()) {
            return FarmModeSection(0, 0.0, 0.0, 0.0, 0, emptyList())
        }

        val items = logs.map { log ->
            FarmModeItem(
                contentId = log.contentId,
                contentType = log.contentType,
                score = log.score,
                accuracy = log.accuracy,
                earnedSeed = log.earnedSeed,
                completedAt = log.completedAt?.format(dtFmt)
            )
        }

        val scores = items.mapNotNull { it.accuracy?.toDouble() }
        val avgAccuracy = if (scores.isNotEmpty()) round2(scores.average()) else 0.0
        val avgScore = if (items.any { it.score != null }) {
            round2(items.mapNotNull { it.score?.toDouble() }.average())
        } else avgAccuracy

        return FarmModeSection(
            count = items.size,
            averageScore = avgScore,
            averageAccuracy = avgAccuracy,
            normalizedScore = avgAccuracy,
            totalEarnedSeed = items.sumOf { it.earnedSeed },
            items = items
        )
    }

    // 일일 퀴즈 / 일일 독해
    private fun buildDailySection(userId: String, activityType: String, start: LocalDateTime, end: LocalDateTime): DailyActivitySection {
        val attempts = learningAttemptRepo.findByUserIdAndActivityTypeAndSubmittedAtBetween(userId, activityType, start, end)
        if (attempts.isEmpty()) {
            return DailyActivitySection(0, 0.0, 0.0, emptyList())
        }

        val items = attempts.map { a ->
            DailyActivityItem(
                contentId = a.contentId,
                score = a.score,
                submittedAt = a.submittedAt?.format(dtFmt)
            )
        }

        val scores = items.mapNotNull { it.score?.toDouble() }
        val avg = if (scores.isNotEmpty()) round2(scores.average()) else 0.0

        return DailyActivitySection(
            count = items.size,
            averageScore = avg,
            normalizedScore = avg,
            items = items
        )
    }

    // 프로 모드 영역
    private fun buildProModeSection(userId: String, start: LocalDateTime, end: LocalDateTime): ProModeSection {
        val completedItems = proProgressRepo.findByUserIdAndCompletedTrueAndCompletedAtBetween(userId, start, end)
        val testSessions = proTestSessionRepo.findByUserIdAndStatusInAndCreatedAtBetween(
            userId, listOf("passed", "failed"), start, end
        )

        val proItems = mutableListOf<ProModeItem>()

        completedItems.forEach { p ->
            proItems.add(
                ProModeItem(
                    chapterId = p.chapterId,
                    itemId = p.itemId,
                    score = p.score,
                    status = if (p.completed) "completed" else "in_progress",
                    createdAt = p.completedAt?.format(dtFmt) ?: p.createdAt.format(dtFmt)
                )
            )
        }

        testSessions.forEach { ts ->
            proItems.add(
                ProModeItem(
                    chapterId = ts.chapterId,
                    itemId = null,
                    score = ts.score,
                    status = ts.status,
                    createdAt = ts.createdAt.format(dtFmt)
                )
            )
        }

        // 프로 모드 테스트 점수 정규화: testSession.score / testPaper.totalPoints * 100
        val testScores = testSessions.mapNotNull { ts ->
            val paper = testPaperRepo.findById(ts.testId).orElse(null)
            if (ts.score != null && paper != null && paper.totalPoints > 0) {
                ts.score!!.toDouble() / paper.totalPoints * 100
            } else null
        }

        val avgTestScore = if (testScores.isNotEmpty()) round2(testScores.average()) else 0.0

        // 역량별 누적 분석: 각 세션의 competency_scores JSON을 합산
        val competencyBreakdown = buildCompetencyBreakdown(testSessions.mapNotNull { it.competencyScores })

        return ProModeSection(
            completedItems = completedItems.size,
            testCount = testSessions.size,
            averageTestScore = avgTestScore,
            normalizedScore = avgTestScore,
            items = proItems,
            competencyBreakdown = competencyBreakdown
        )
    }

    // 요약 생성
    private fun buildSummary(sections: ReportSections, competencyStats: List<CompetencyStats> = emptyList()): ReportSummary {
        val sectionData = mutableListOf(
            "시험 OMR" to sections.examOmr.let { it.count to it.normalizedScore },
            "농장 모드" to sections.farmMode.let { it.count to it.normalizedScore },
            "일일 퀴즈" to sections.dailyQuiz.let { it.count to it.normalizedScore },
            "일일 독해" to sections.dailyReading.let { it.count to it.normalizedScore },
            "프로 모드" to sections.proMode.let { (it.completedItems + it.testCount) to it.normalizedScore }
        )
        sections.studyPlan?.let {
            sectionData.add("학습 계획표" to (it.totalCells to it.normalizedScore))
        }

        val totalActivities = sectionData.sumOf { it.second.first }
        val activeSections = sectionData.filter { it.second.first > 0 }
        val avgScore = if (activeSections.isNotEmpty()) {
            round2(activeSections.map { it.second.second }.average())
        } else 0.0

        val best = activeSections.maxByOrNull { it.second.second }?.first
        val weakest = activeSections.minByOrNull { it.second.second }?.first

        // 학습일수: 각 영역 아이템의 날짜를 모아서 고유 일수 카운트
        val dates = mutableSetOf<LocalDate>()
        sections.examOmr.items.forEach { it.submittedAt?.let { d -> parseDate(d)?.let { dates.add(it) } } }
        sections.farmMode.items.forEach { it.completedAt?.let { d -> parseDate(d)?.let { dates.add(it) } } }
        sections.dailyQuiz.items.forEach { it.submittedAt?.let { d -> parseDate(d)?.let { dates.add(it) } } }
        sections.dailyReading.items.forEach { it.submittedAt?.let { d -> parseDate(d)?.let { dates.add(it) } } }
        sections.proMode.items.forEach { it.createdAt?.let { d -> parseDate(d)?.let { dates.add(it) } } }

        val activeCompetencies = competencyStats.filter { it.total > 0 }
        val bestComp = activeCompetencies.maxByOrNull { it.accuracy }?.competencyLabel
        val weakComp = activeCompetencies.minByOrNull { it.accuracy }?.competencyLabel

        return ReportSummary(
            totalActivities = totalActivities,
            averageScore = avgScore,
            bestSection = best,
            weakestSection = weakest,
            totalStudyDays = dates.size,
            bestCompetency = bestComp,
            weakestCompetency = weakComp
        )
    }

    // 학습 계획표 영역
    @Suppress("UNUSED_PARAMETER")
    private fun buildStudyPlanSection(userId: String, start: LocalDateTime, end: LocalDateTime): StudyPlanSection? {
        val targetLinks = studyPlanTargetRepo.findByTargetTypeAndTargetId("user", userId)
        val planIds = targetLinks.map { it.planId }.toMutableSet()

        if (planIds.isEmpty()) return null

        val plans = studyPlanRepo.findAllById(planIds).filter { it.status == "active" }
        if (plans.isEmpty()) return null
        val activePlanIds = plans.map { it.id }.toSet()

        val cells = activePlanIds.flatMap { studyPlanCellRepo.findByPlanIdAndUserId(it, userId) }
        if (cells.isEmpty()) return null

        // 기간 필터: updatedAt이 범위 내이거나, 항상 포함 (계획표 셀은 기간과 무관하게 전체 상태를 보여줌)
        val totalCells = cells.size
        val completedCells = cells.count { it.status in listOf("completed", "passed") }
        val submittedCells = cells.count { it.status in listOf("submitted", "scored") }
        val pendingCells = cells.count { it.status == "pending" }
        val rejectedCells = 0
        val completionRate = if (totalCells > 0) round2(completedCells.toDouble() / totalCells * 100) else 0.0

        // 정규화 점수: 완료율
        val normalizedScore = completionRate

        // plan, scope, asset 맵 구성
        val planMap = plans.associateBy { it.id }
        val scopeIds = cells.map { it.scopeId }.distinct()
        val assetIds = cells.map { it.assetId }.distinct()
        val scopeMap = if (scopeIds.isNotEmpty()) studyPlanScopeRepo.findAllById(scopeIds).associateBy { it.id } else emptyMap()
        val assetMap = if (assetIds.isNotEmpty()) studyPlanAssetRepo.findAllById(assetIds).associateBy { it.id } else emptyMap()

        // 완료된 셀만 items에 포함
        val completedItems = cells.filter { it.status in listOf("completed", "passed") }
        val items = completedItems.map { cell ->
            StudyPlanItem(
                planTitle = planMap[cell.planId]?.title ?: "",
                scopeLabel = scopeMap[cell.scopeId]?.label,
                assetLabel = assetMap[cell.assetId]?.label,
                assetType = assetMap[cell.assetId]?.assetType,
                status = cell.status,
                score = cell.score,
                reviewedAt = cell.reviewedAt?.format(dtFmt)
            )
        }

        return StudyPlanSection(
            totalCells = totalCells,
            completedCells = completedCells,
            submittedCells = submittedCells,
            pendingCells = pendingCells,
            rejectedCells = rejectedCells,
            completionRate = completionRate,
            normalizedScore = normalizedScore,
            items = items
        )
    }

    // 추이 데이터 생성
    private fun buildTrend(userId: String, startDate: LocalDate, endDate: LocalDate): List<TrendPoint> {
        val start = startDate.atStartOfDay()
        val end = endDate.atTime(LocalTime.MAX)

        val submissions = testSubmissionRepo.findByUserIdAndCreatedAtBetween(userId, start, end)
        val farmLogs = farmLearningLogRepo.findByUserIdAndStatusAndCompletedAtBetween(userId, "COMPLETED", start, end)
        val quizAttempts = learningAttemptRepo.findByUserIdAndActivityTypeAndSubmittedAtBetween(userId, "daily_quiz", start, end)
        val readingAttempts = learningAttemptRepo.findByUserIdAndActivityTypeAndSubmittedAtBetween(userId, "daily_reading", start, end)
        val proSessions = proTestSessionRepo.findByUserIdAndStatusInAndCreatedAtBetween(userId, listOf("passed", "failed"), start, end)

        // 학습 계획표 셀 (채점 완료된 것)
        val spCells = studyPlanCellRepo.findByUserIdAndStatus(userId, "passed") +
                studyPlanCellRepo.findByUserIdAndStatus(userId, "completed")
        val spCellsInRange = spCells.filter { c ->
            c.reviewedAt?.let { it >= start && it <= end } ?: false
        }

        val testPaperCache = mutableMapOf<String, Int>() // testId -> totalPoints

        // 날짜별 집계
        val allDates = mutableSetOf<LocalDate>()
        submissions.forEach { allDates.add(it.createdAt.toLocalDate()) }
        farmLogs.forEach { it.completedAt?.let { d -> allDates.add(d.toLocalDate()) } }
        quizAttempts.forEach { it.submittedAt?.let { d -> allDates.add(d.toLocalDate()) } }
        readingAttempts.forEach { it.submittedAt?.let { d -> allDates.add(d.toLocalDate()) } }
        proSessions.forEach { allDates.add(it.createdAt.toLocalDate()) }
        spCellsInRange.forEach { it.reviewedAt?.let { d -> allDates.add(d.toLocalDate()) } }

        return allDates.sorted().map { date ->
            val examScores = submissions.filter { it.createdAt.toLocalDate() == date }.map { sub ->
                val totalPts = testPaperCache.getOrPut(sub.testId) {
                    testPaperRepo.findById(sub.testId).orElse(null)?.totalPoints ?: 100
                }
                sub.score.toDouble() / totalPts * 100
            }
            val farmScores = farmLogs.filter { it.completedAt?.toLocalDate() == date }.mapNotNull { it.accuracy?.toDouble() }
            val quizScores = quizAttempts.filter { it.submittedAt?.toLocalDate() == date }.mapNotNull { it.score?.toDouble() }
            val readingScores = readingAttempts.filter { it.submittedAt?.toLocalDate() == date }.mapNotNull { it.score?.toDouble() }
            val proScores = proSessions.filter { it.createdAt.toLocalDate() == date }.mapNotNull { ts ->
                val totalPts = testPaperCache.getOrPut(ts.testId) {
                    testPaperRepo.findById(ts.testId).orElse(null)?.totalPoints ?: 100
                }
                ts.score?.let { it.toDouble() / totalPts * 100 }
            }

            val examAvg = if (examScores.isNotEmpty()) round2(examScores.average()) else null
            val farmAvg = if (farmScores.isNotEmpty()) round2(farmScores.average()) else null
            val quizAvg = if (quizScores.isNotEmpty()) round2(quizScores.average()) else null
            val readingAvg = if (readingScores.isNotEmpty()) round2(readingScores.average()) else null
            val proAvg = if (proScores.isNotEmpty()) round2(proScores.average()) else null

            val spScores = spCellsInRange.filter { it.reviewedAt?.toLocalDate() == date }
                .mapNotNull { it.score?.toDouble() }
            val spAvg = if (spScores.isNotEmpty()) round2(spScores.average()) else null

            val allScores = listOfNotNull(examAvg, farmAvg, quizAvg, readingAvg, proAvg, spAvg)
            val overall = if (allScores.isNotEmpty()) round2(allScores.average()) else null

            TrendPoint(
                date = date.toString(),
                examOmr = examAvg,
                farmMode = farmAvg,
                dailyQuiz = quizAvg,
                dailyReading = readingAvg,
                proMode = proAvg,
                studyPlan = spAvg,
                overall = overall
            )
        }
    }

    /** 여러 테스트 세션의 역량별 점수 JSON을 합산하여 전체 breakdown 생성 */
    private fun buildCompetencyBreakdown(jsonList: List<String>): Map<String, CompetencyBreakdown>? {
        if (jsonList.isEmpty()) return null

        data class Acc(var correct: Int = 0, var total: Int = 0)
        val accMap = mutableMapOf<String, Acc>()

        for (json in jsonList) {
            try {
                val scores: Map<String, CompetencyScore> = objectMapper.readValue(
                    json, object : TypeReference<Map<String, CompetencyScore>>() {}
                )
                for ((domain, score) in scores) {
                    val acc = accMap.getOrPut(domain) { Acc() }
                    acc.correct += score.correct
                    acc.total += score.total
                }
            } catch (_: Exception) {
                // 파싱 실패 시 무시
            }
        }

        if (accMap.isEmpty()) return null

        return accMap.mapValues { (_, v) ->
            CompetencyBreakdown(
                correct = v.correct,
                total = v.total,
                accuracy = if (v.total > 0) round2(v.correct.toDouble() / v.total * 100) else 0.0
            )
        }
    }

    /** 역량별 통계 빌드: quiz_answer_details + 농장 모드 contentType 병합 */
    private fun buildCompetencyStats(
        userId: String,
        start: LocalDateTime,
        end: LocalDateTime,
        farmMode: FarmModeSection
    ): List<CompetencyStats> {
        data class Acc(var correct: Int = 0, var total: Int = 0, val sources: MutableSet<String> = mutableSetOf())

        val accMap = mutableMapOf<String, Acc>()

        // 1) quiz_answer_details에서 questionKind별 집계
        val kindAggs = quizAnswerDetailRepo.aggregateByQuestionKind(userId, start, end)
        for (agg in kindAggs) {
            val info = CompetencyMapping.fromQuestionKind(agg.questionKind) ?: continue
            val acc = accMap.getOrPut(info.competencyLabel) { Acc() }
            acc.correct += agg.correctCount.toInt()
            acc.total += agg.totalCount.toInt()
            acc.sources.add("일일 퀴즈")
        }

        // 2) 농장 모드 contentType 기반 역량 매핑
        for (item in farmMode.items) {
            val info = CompetencyMapping.fromContentType(item.contentType) ?: continue
            val acc = accMap.getOrPut(info.competencyLabel) { Acc() }
            // accuracy를 100점 기준 1문항으로 환산
            val itemAccuracy = item.accuracy ?: item.score ?: continue
            acc.correct += itemAccuracy
            acc.total += 100
            acc.sources.add("농장 모드")
        }

        if (accMap.isEmpty()) return emptyList()

        return accMap.map { (label, acc) ->
            val accuracy = if (acc.total > 0) round2(acc.correct.toDouble() / acc.total * 100) else 0.0
            val (grade, advice) = CompetencyMapping.gradeFor(accuracy)
            CompetencyStats(
                competencyKey = label,
                competencyLabel = label,
                score = accuracy,
                correct = acc.correct,
                total = acc.total,
                accuracy = accuracy,
                sources = acc.sources.toList(),
                grade = grade,
                advice = advice
            )
        }.sortedByDescending { it.accuracy }
    }

    /** 영역별 통계 빌드 */
    @Suppress("UNUSED_PARAMETER")
    private fun buildAreaStats(
        farmMode: FarmModeSection,
        competencyStats: List<CompetencyStats>
    ): List<AreaStats> {
        data class AreaAcc(var scoreSum: Double = 0.0, var count: Int = 0, val sources: MutableSet<String> = mutableSetOf())

        val accMap = mutableMapOf<String, AreaAcc>()

        // 농장 모드 contentType → 영역 매핑
        for (item in farmMode.items) {
            val info = CompetencyMapping.fromContentType(item.contentType) ?: continue
            val acc = accMap.getOrPut(info.areaLabel) { AreaAcc() }
            acc.scoreSum += (item.accuracy ?: item.score ?: 0).toDouble()
            acc.count++
            acc.sources.add(item.contentType)
        }

        if (accMap.isEmpty()) return emptyList()

        return accMap.map { (label, acc) ->
            AreaStats(
                areaKey = label,
                areaLabel = label,
                activityCount = acc.count,
                averageScore = if (acc.count > 0) round2(acc.scoreSum / acc.count) else 0.0,
                sources = acc.sources.toList()
            )
        }.sortedByDescending { it.averageScore }
    }

    /** 약점 역량 기반 추천 학습 생성 */
    private fun buildRecommendations(competencyStats: List<CompetencyStats>): List<LearningRecommendation> {
        val weak = competencyStats.filter { it.accuracy < 70 && it.total > 0 }
        if (weak.isEmpty()) return emptyList()

        return weak.map { stat ->
            val items = when (stat.competencyLabel) {
                "어휘력" -> listOf(
                    RecommendedItem("farm", "어휘 기초", "기본 어휘 학습으로 어휘력을 강화하세요.", "/farm/vocab"),
                    RecommendedItem("daily", "일일 퀴즈", "매일 퀴즈로 어휘를 복습하세요.", "/daily-quiz")
                )
                "독해력", "구조 독해력" -> listOf(
                    RecommendedItem("farm", "독해 연습", "비문학·문학 독해 연습을 해보세요.", "/farm/reading"),
                    RecommendedItem("daily", "일일 독해", "매일 독해 지문으로 실력을 키우세요.", "/daily-reading")
                )
                "어법·문법" -> listOf(
                    RecommendedItem("farm", "문법 학습", "문법 기초부터 차근차근 학습하세요.", "/farm/grammar"),
                    RecommendedItem("farm", "문장 구성", "문장 만들기 연습을 해보세요.", "/farm/grammar")
                )
                "배경지식" -> listOf(
                    RecommendedItem("farm", "배경지식", "다양한 배경지식을 쌓아보세요.", "/farm/background")
                )
                "논리 사고력" -> listOf(
                    RecommendedItem("farm", "논리 추론", "논리 추론 문제를 풀어보세요.", "/farm/logic"),
                    RecommendedItem("farm", "선택지 판별", "선택지 판별 연습을 해보세요.", "/farm/choice")
                )
                "문제 해결력" -> listOf(
                    RecommendedItem("farm", "논리 추론", "문제 해결력을 키우는 연습을 해보세요.", "/farm/logic"),
                    RecommendedItem("farm", "서술형 쓰기", "서술형 문제로 사고력을 키우세요.", "/farm/writing")
                )
                else -> emptyList()
            }
            LearningRecommendation(
                reason = "${stat.competencyLabel} 점수가 ${stat.accuracy.toInt()}점으로 보강이 필요합니다.",
                targetLabel = stat.competencyLabel,
                items = items
            )
        }
    }

    private fun round2(value: Double): Double =
        Math.round(value * 100.0) / 100.0

    private fun parseDate(isoDateTime: String): LocalDate? =
        try { LocalDateTime.parse(isoDateTime, dtFmt).toLocalDate() } catch (_: Exception) { null }
}
