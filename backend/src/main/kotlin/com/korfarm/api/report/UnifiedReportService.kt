package com.korfarm.api.report

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.korfarm.api.classification.ClassificationMasterRepository
import com.korfarm.api.classification.ContentClassificationRepository
import com.korfarm.api.learning.RecommendationService
import com.korfarm.api.common.ApiException
import com.korfarm.api.diagnostic.DiagSessionRepository
import com.korfarm.api.diagnostic.scoring.COMPETENCIES
import com.korfarm.api.learning.FarmLearningLogRepository
import com.korfarm.api.learning.LEARNING_COMPETENCY_WINDOW_SIZE
import com.korfarm.api.learning.LearningAttemptRepository
import com.korfarm.api.learning.LearningCompetencyLogRepository
import com.korfarm.api.learning.QuizAnswerDetailRepository
import com.korfarm.api.learning.UserCompetencySummaryRepository
import com.korfarm.api.paid.ContentRepository
import com.korfarm.api.pro.CompetencyScore
import com.korfarm.api.pro.ProChapterItemRepo
import com.korfarm.api.pro.ProChapterRepo
import com.korfarm.api.pro.ProProgressRepo
import com.korfarm.api.pro.ProTestSessionRepo
import com.korfarm.api.test.TestPaperRepo
import com.korfarm.api.test.TestSubmissionRepo
import com.korfarm.api.studyplan.*
import com.korfarm.api.user.ParentLinkService
import com.korfarm.api.user.UserRepository
import com.korfarm.api.wisdom.AiFeedbackJobRepository
import com.korfarm.api.wisdom.AiFeedbackJobStatus
import com.korfarm.api.wisdom.WisdomCommentRepository
import com.korfarm.api.wisdom.WisdomFeedbackRepository
import com.korfarm.api.wisdom.WisdomLikeRepository
import com.korfarm.api.wisdom.WisdomPostRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import kotlin.math.exp
import kotlin.math.ln

@Service
class UnifiedReportService(
    private val testSubmissionRepo: TestSubmissionRepo,
    private val testPaperRepo: TestPaperRepo,
    private val farmLearningLogRepo: FarmLearningLogRepository,
    private val learningAttemptRepo: LearningAttemptRepository,
    private val proProgressRepo: ProProgressRepo,
    private val proTestSessionRepo: ProTestSessionRepo,
    private val proChapterRepo: ProChapterRepo,
    private val proChapterItemRepo: ProChapterItemRepo,
    private val userRepository: UserRepository,
    private val parentLinkService: ParentLinkService,
    private val studyPlanCellRepo: StudyPlanCellRepository,
    private val studyPlanRepo: StudyPlanRepository,
    private val studyPlanScopeRepo: StudyPlanScopeRepository,
    private val studyPlanAssetRepo: StudyPlanAssetRepository,
    private val studyPlanTargetRepo: StudyPlanTargetRepository,
    private val quizAnswerDetailRepo: QuizAnswerDetailRepository,
    private val contentRepository: ContentRepository,
    /** 학습 종합 누적 (Phase 2 신규) */
    private val userCompetencySummaryRepo: UserCompetencySummaryRepository,
    private val learningCompetencyLogRepo: LearningCompetencyLogRepository,
    /** 진단 v2 결과 조회 (Phase 2 신규) */
    private val diagSessionRepo: DiagSessionRepository,
    /** V0100 분류 마스터 — 영역·세부영역·주제 통합 평가 (V2 신규) */
    private val classificationMasterRepo: ClassificationMasterRepository,
    private val contentClassificationRepo: ContentClassificationRepository,
    /** 글쓰기 통계 집계 (V2 신규) */
    private val wisdomPostRepo: WisdomPostRepository,
    private val wisdomFeedbackRepo: WisdomFeedbackRepository,
    private val wisdomLikeRepo: WisdomLikeRepository,
    private val wisdomCommentRepo: WisdomCommentRepository,
    private val aiFeedbackJobRepo: AiFeedbackJobRepository,
    /** V3 추천 통합 — 약점·학습량·레벨 가중치 fallback 자동 적용 */
    private val recommendationService: RecommendationService,
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
        // V2: 시험·일일·농장·프로 통합 + decay + 소스 가중 + 윈도우 200
        val areaEntries = collectAreaEntries(studentId, start, end)
        val areaStats = buildAreaStatsV2(areaEntries)
        val themeStats = buildThemeStatsV2(areaEntries)
        val recommendations = buildRecommendations(competencyStats, areaStats)

        val competencyRadarData = if (competencyStats.isNotEmpty()) {
            RadarData(
                labels = competencyStats.map { it.competencyLabel },
                scores = competencyStats.map { it.accuracy }
            )
        } else null

        val summary = buildSummary(sections, competencyStats)

        // 캘린더 데이터
        val calendar = buildCalendarData(studentId, start, end)

        // Phase 2 — 학습 종합 누적 / 진단 측정 / 변화 추이
        val learningCompetency = buildLearningCompetencySnapshot(studentId)
        val diagnosticCompetency = buildDiagnosticCompetencySnapshot(studentId)
        val competencyTrend = buildCompetencyTrend(studentId, start, end)

        // V2 — AI 코멘트 + 글쓰기 통계
        val writingStats = buildWritingStats(studentId, start, end)

        // V3 — 추천 fallback 통합 (약점 → 학습량 부족 → 레벨 가중치)
        val recommendationBundle = buildRecommendationBundle(studentId)

        val aiComments = buildAiComments(
            learningCompetency = learningCompetency,
            diagnosticCompetency = diagnosticCompetency,
            areaStats = areaStats,
            themeStats = themeStats,
            studyPlan = studyPlan,
            writingStats = writingStats,
            recommendations = recommendations,
            recommendationBundle = recommendationBundle
        )

        return UnifiedReportResponse(
            studentId = studentId,
            studentName = user.name ?: "",
            studentLevelId = user.levelId,
            period = ReportPeriod(startDate, endDate),
            summary = summary,
            sections = sections,
            trend = trend,
            radarData = radarData,
            areaStats = areaStats,
            competencyStats = competencyStats,
            competencyRadarData = competencyRadarData,
            learningCompetency = learningCompetency,
            diagnosticCompetency = diagnosticCompetency,
            competencyTrend = competencyTrend,
            recommendations = recommendations,
            recommendationBundle = recommendationBundle,
            calendar = calendar,
            themeStats = themeStats,
            aiComments = aiComments,
            writingStats = writingStats
        )
    }

    /* ───────────────── V3 추천 fallback 통합 빌드 ───────────────── */

    private fun buildRecommendationBundle(userId: String): RecommendationBundleDto {
        val bundle = recommendationService.recommendWithFallback(userId, perCategory = 6)
        return RecommendationBundleDto(
            competency = mapGroup(bundle.competency),
            area = mapGroup(bundle.area),
            levelId = bundle.levelId,
        )
    }

    private fun mapGroup(g: RecommendationService.FallbackRecommendation): RecommendationGroupDto =
        RecommendationGroupDto(
            strategy = g.strategy,
            strategyLabel = strategyLabel(g.strategy),
            targetLabels = g.targetLabels,
            items = g.items.map { item ->
                RecommendedContentDto(
                    contentId = item.contentId,
                    title = item.title,
                    contentType = item.contentType,
                    contentTypeLabel = CompetencyMapping.contentTypeLabel(item.contentType),
                    levelId = item.levelId,
                    area = item.area,
                    subArea = item.subArea,
                    reason = item.reason,
                    path = pathForContent(item.contentId, item.contentType),
                )
            },
        )

    /**
     * 추천 카드 클릭 시 이동할 정식 라우트.
     * 프론트에 등록된 경로 (`App.jsx`) 기준:
     *   - DAILY_QUIZ → /daily-quiz
     *   - DAILY_READING → /daily-reading
     *   - STUDY_CONTENT → /study-learning/{id}
     *   - PRO_*, FARM_*, BACKGROUND_KNOWLEDGE, VOCAB_*, GRAMMAR_*, READING_*,
     *     LANGUAGE_CONCEPT*, LOGIC_REASONING*, CHOICE_JUDGEMENT, WRITING_DESCRIPTIVE
     *     → /learning/{id}  (LearningRunnerPage 가 contentId 로 로드)
     *   - 기타 → /learning/{id} (기본 fallback)
     */
    private fun pathForContent(contentId: String, contentType: String): String {
        val ct = contentType.uppercase()
        return when {
            ct == "DAILY_QUIZ" -> "/daily-quiz"
            ct == "DAILY_READING" -> "/daily-reading"
            ct == "STUDY_CONTENT" -> "/study-learning/$contentId"
            else -> "/learning/$contentId"
        }
    }

    private fun strategyLabel(strategy: String): String = when (strategy) {
        "weakness" -> "약점 보강"
        "low_volume" -> "학습량 부족"
        "level_default" -> "레벨 추천"
        else -> "추천"
    }

    /* ───────────────── Phase 2: 학습 종합 누적 / 진단 측정 / 시계열 ───────────────── */

    private fun buildLearningCompetencySnapshot(userId: String): LearningCompetencySnapshot {
        val rows = userCompetencySummaryRepo.findByUserId(userId).associateBy { it.competency }
        val items = COMPETENCIES.map { name ->
            val r = rows[name]
            LearningCompetencyItem(
                competency = name,
                ratioScore = r?.ratioScore ?: 0.0,
                sampleCount = r?.sampleCount ?: 0,
            )
        }
        val totalSamples = items.sumOf { it.sampleCount }
        val updatedAt = rows.values.mapNotNull { it.updatedAt }.maxOrNull()?.format(dtFmt)
        return LearningCompetencySnapshot(
            items = items,
            totalSamples = totalSamples,
            updatedAt = updatedAt,
            windowSize = LEARNING_COMPETENCY_WINDOW_SIZE,
        )
    }

    private fun buildDiagnosticCompetencySnapshot(userId: String): DiagnosticCompetencySnapshot? {
        val sessions = diagSessionRepo.findByUserIdOrderByStartedAtDesc(userId)
        val latest = sessions.firstOrNull { it.status == "COMPLETED" || it.scoresJson != null }
            ?: return null
        val scores: Map<String, Double> = try {
            if (latest.scoresJson.isNullOrBlank()) emptyMap()
            else objectMapper.readValue(latest.scoresJson, object : TypeReference<Map<String, Double>>() {})
        } catch (_: Exception) { emptyMap() }
        val touches: Map<String, Int> = try {
            if (latest.touchCountsJson.isNullOrBlank()) emptyMap()
            else objectMapper.readValue(latest.touchCountsJson, object : TypeReference<Map<String, Int>>() {})
        } catch (_: Exception) { emptyMap() }
        val items = COMPETENCIES.map { name ->
            DiagnosticCompetencyItem(
                competency = name,
                score = scores[name] ?: 0.0,
                touchCount = touches[name] ?: 0,
            )
        }
        return DiagnosticCompetencySnapshot(
            items = items,
            tier = latest.tier,
            measuredAt = latest.completedAt?.format(dtFmt) ?: latest.startedAt?.format(dtFmt),
        )
    }

    private fun buildCompetencyTrend(
        userId: String,
        start: LocalDateTime,
        end: LocalDateTime,
    ): List<CompetencyTrendPoint> {
        // 기간 내 모든 entry (in_window 무관) 조회
        val all = learningCompetencyLogRepo.findInWindowAsc(userId)
        val filtered = all.filter { it.completedAt in start..end }
        if (filtered.isEmpty()) return emptyList()

        val typeRefV = object : TypeReference<Map<String, Double>>() {}
        val typeRefM = object : TypeReference<Map<String, Int>>() {}

        // 일자별 그룹
        val byDate = filtered.groupBy { it.completedAt.toLocalDate() }
        val out = mutableListOf<CompetencyTrendPoint>()
        for ((date, entries) in byDate.toSortedMap()) {
            val earned = COMPETENCIES.associateWith { 0.0 }.toMutableMap()
            val maxV = COMPETENCIES.associateWith { 0.0 }.toMutableMap()
            for (e in entries) {
                val v: Map<String, Double> = try { objectMapper.readValue(e.vectorJson, typeRefV) } catch (_: Exception) { emptyMap() }
                val m: Map<String, Int> = try { objectMapper.readValue(e.measuredJson, typeRefM) } catch (_: Exception) { emptyMap() }
                for (c in COMPETENCIES) {
                    val measured = (m[c] ?: 0).toDouble()
                    if (measured == 0.0) continue
                    earned[c] = earned.getValue(c) + e.weight * measured * (v[c] ?: 0.0).coerceIn(0.0, 1.0)
                    maxV[c] = maxV.getValue(c) + e.weight * measured
                }
            }
            for (c in COMPETENCIES) {
                val mx = maxV.getValue(c)
                if (mx <= 0.0) continue
                out.add(CompetencyTrendPoint(
                    date = date.toString(),
                    competency = c,
                    ratioScore = (earned.getValue(c) / mx) * 100.0,
                ))
            }
        }
        return out
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
                submittedAt = sub.createdAt.format(dtFmt),
                submissionId = sub.id
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

    // 농장 모드 영역 (순수 농장 콘텐츠만 — DAILY_QUIZ, DAILY_READING, PRO_* 제외)
    private fun buildFarmModeSection(userId: String, start: LocalDateTime, end: LocalDateTime): FarmModeSection {
        val allLogs = farmLearningLogRepo.findByUserIdAndStatusAndCompletedAtBetween(userId, "COMPLETED", start, end)
        // 순수 농장 모드만 필터링
        val logs = allLogs.filter { it.contentType in CompetencyMapping.FARM_ONLY_TYPES }
        if (logs.isEmpty()) {
            return FarmModeSection(0, 0.0, 0.0, 0.0, 0, emptyList())
        }

        // 제목 조회
        val contentIds = logs.map { it.contentId }.distinct()
        val titleMap = if (contentIds.isNotEmpty()) {
            contentRepository.findAllById(contentIds).associate { it.id to it.title }
        } else emptyMap()

        val items = logs.map { log ->
            FarmModeItem(
                contentId = log.contentId,
                contentType = log.contentType,
                contentTypeLabel = CompetencyMapping.contentTypeLabel(log.contentType),
                contentTitle = titleMap[log.contentId],
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

        // 모드별 수행 횟수 요약
        val modeSummary = items.groupBy { it.contentTypeLabel ?: it.contentType }
            .map { (label, group) -> FarmModeSummary(modeLabel = label, count = group.size) }
            .sortedByDescending { it.count }

        return FarmModeSection(
            count = items.size,
            averageScore = avgScore,
            averageAccuracy = avgAccuracy,
            normalizedScore = avgAccuracy,
            totalEarnedSeed = items.sumOf { it.earnedSeed },
            items = items,
            modeSummary = modeSummary
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
                    contentTitle = null,
                    learningType = null,
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
                    contentTitle = null,
                    learningType = "테스트",
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

        // 챕터 리스트 생성: 기간 내 활동이 있는 챕터
        val activeChapterIds = (completedItems.map { it.chapterId } + testSessions.map { it.chapterId }).distinct()
        val chapters = if (activeChapterIds.isNotEmpty()) {
            buildProChapterList(userId, activeChapterIds)
        } else emptyList()

        return ProModeSection(
            completedItems = completedItems.size,
            testCount = testSessions.size,
            averageTestScore = avgTestScore,
            normalizedScore = avgTestScore,
            items = proItems,
            chapters = chapters
        )
    }

    /** 프로 모드 챕터 리스트 생성 */
    private fun buildProChapterList(userId: String, chapterIds: List<String>): List<ReportProChapter> {
        val chapterEntities = proChapterRepo.findAllById(chapterIds)
        if (chapterEntities.isEmpty()) return emptyList()

        val progressList = proProgressRepo.findByUserIdAndChapterIdIn(userId, chapterIds)
        val progressByChapter = progressList.groupBy { it.chapterId }

        return chapterEntities
            .sortedBy { it.globalChapterNumber }
            .map { ch ->
                // 전체 아이템 수
                val allItems = proChapterItemRepo.findByChapterIdOrderByItemOrderAsc(ch.id)
                val totalItems = allItems.size

                // 완료 아이템 수 — 잔존(삭제된 item) 제외 + 중복 progress 제거 + 100 클램프
                val chapterProgress = progressByChapter[ch.id] ?: emptyList()
                val validItemIds = allItems.map { it.id }.toSet()
                val completedCount = chapterProgress
                    .filter { it.completed && it.itemId in validItemIds }
                    .distinctBy { it.itemId }
                    .size
                val progressPercent = if (totalItems > 0)
                    ((completedCount * 100) / totalItems).coerceIn(0, 100) else 0

                // 테스트 통과 여부
                val passedSessions = proTestSessionRepo.findByUserIdAndChapterIdAndStatusIn(
                    userId, ch.id, listOf("passed")
                )
                val isTestPassed = passedSessions.isNotEmpty()

                // 테스트 정답률: 가장 최근 통과 세션 기준
                val testAccuracy = if (passedSessions.isNotEmpty()) {
                    val session = passedSessions.maxByOrNull { it.createdAt }!!
                    val paper = testPaperRepo.findById(session.testId).orElse(null)
                    if (session.score != null && paper != null && paper.totalPoints > 0) {
                        round2(session.score!!.toDouble() / paper.totalPoints * 100)
                    } else null
                } else null

                val status = when {
                    isTestPassed -> "passed"
                    completedCount > 0 -> "in_progress"
                    else -> "not_started"
                }

                ReportProChapter(
                    chapterId = ch.id,
                    chapterNumber = ch.globalChapterNumber,
                    title = ch.title,
                    progressPercent = progressPercent,
                    isTestPassed = isTestPassed,
                    testAccuracy = testAccuracy,
                    status = status
                )
            }
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
        val completionRate = if (totalCells > 0)
            round2((completedCells.toDouble() / totalCells * 100).coerceIn(0.0, 100.0)) else 0.0

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
            items = items,
            planIds = activePlanIds.toList()
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

    /** 여러 테스트 세션의 역량별 점수 JSON을 합산하여 역량→(correct, total) 반환 */
    private fun parseProTestCompetencyScores(jsonList: List<String>): Map<String, Pair<Int, Int>> {
        if (jsonList.isEmpty()) return emptyMap()

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

        return accMap.mapValues { (_, v) -> v.correct to v.total }
    }

    /** 역량별 통계 빌드: 프로 테스트 세션 + quiz_answer_details + 농장 모드 contentType 병합 → 10대 역량 전체 출력 */
    private fun buildCompetencyStats(
        userId: String,
        start: LocalDateTime,
        end: LocalDateTime,
        farmMode: FarmModeSection
    ): List<CompetencyStats> {
        data class Acc(var correct: Int = 0, var total: Int = 0, val sources: MutableSet<String> = mutableSetOf())

        val accMap = mutableMapOf<String, Acc>()

        // 1) 프로 테스트 세션의 competency_scores JSON 파싱 → 10대 역량 매핑
        val testSessions = proTestSessionRepo.findByUserIdAndStatusInAndCreatedAtBetween(
            userId, listOf("passed", "failed"), start, end
        )
        val proScores = parseProTestCompetencyScores(testSessions.mapNotNull { it.competencyScores })
        for ((domain, pair) in proScores) {
            // domain은 프로 테스트의 역량 키 — 10대 역량 라벨과 직접 매칭 시도
            val competencyLabel = CompetencyMapping.TEN_COMPETENCIES.find { it == domain } ?: domain
            val acc = accMap.getOrPut(competencyLabel) { Acc() }
            acc.correct += pair.first
            acc.total += pair.second
            acc.sources.add("프로 테스트")
        }

        // 2) quiz_answer_details에서 questionKind별 집계 → 10대 역량 매핑
        val kindAggs = quizAnswerDetailRepo.aggregateByQuestionKind(userId, start, end)
        for (agg in kindAggs) {
            val competencyLabel = CompetencyMapping.competencyForQuestionKind(agg.questionKind) ?: continue
            val acc = accMap.getOrPut(competencyLabel) { Acc() }
            acc.correct += agg.correctCount.toInt()
            acc.total += agg.totalCount.toInt()
            acc.sources.add("일일 퀴즈")
        }

        // 3) 농장 모드 contentType → 10대 역량 매핑
        for (item in farmMode.items) {
            val competencyLabel = CompetencyMapping.competencyForContentType(item.contentType) ?: continue
            val acc = accMap.getOrPut(competencyLabel) { Acc() }
            // accuracy를 100점 기준 1문항으로 환산
            val itemAccuracy = item.accuracy ?: item.score ?: continue
            acc.correct += itemAccuracy
            acc.total += 100
            acc.sources.add("농장 모드")
        }

        // 10대 역량 전체에 대해 결과 생성 (데이터 없는 역량도 0으로 포함)
        return CompetencyMapping.TEN_COMPETENCIES.map { label ->
            val acc = accMap[label]
            val accuracy = if (acc != null && acc.total > 0) round2(acc.correct.toDouble() / acc.total * 100) else 0.0
            val grade = CompetencyMapping.gradeFor(accuracy)
            CompetencyStats(
                competencyKey = label,
                competencyLabel = label,
                score = accuracy,
                correct = acc?.correct ?: 0,
                total = acc?.total ?: 0,
                accuracy = accuracy,
                sources = acc?.sources?.toList() ?: emptyList(),
                grade = grade
            )
        }
    }

    /* ───────────────── V2: 영역·세부영역·주제 가중 평가 알고리즘 ─────────────────
     * 10대 역량 알고리즘과 동일 공식: 슬라이딩 윈도우 200 + 시간 decay (30일 half-life)
     *   + 소스 가중 (시험 10 / 일일 3 / 학습 1).
     * 데이터 소스: 시험 OMR(test_submission) + 일일퀴즈/독해(learning_attempt) +
     *   농장 모드(farm_learning_log) + 프로 모드(pro_progress).
     * 분류: V0100 분류 마스터 + content_classifications 우선, 없으면 Content.area/subArea fallback.
     */
    private data class AreaEntry(
        val areaLabel: String,
        val subAreaLabel: String?,
        val themeKey: String?,
        val themeLabel: String?,
        val score: Double,                  // 0~100
        val weight: Double,                 // sourceWeight
        val completedAt: LocalDateTime
    )

    /** 영역별 슬라이딩 윈도우 — 10대 역량(100)보다 큼 (영역 다양성↑) */
    private val AREA_WINDOW_SIZE = 200
    private val AREA_HALF_LIFE_DAYS = 30.0
    private val SRC_WEIGHT_TEST = 10.0
    private val SRC_WEIGHT_DAILY = 3.0
    private val SRC_WEIGHT_LEARN = 1.0

    private fun areaDecay(daysAgo: Long): Double =
        exp(-ln(2.0) * daysAgo.coerceAtLeast(0).toDouble() / AREA_HALF_LIFE_DAYS)

    /** 모든 활동 소스에서 area/subArea/theme 정규화된 entry 수집 */
    private fun collectAreaEntries(
        userId: String,
        start: LocalDateTime,
        end: LocalDateTime
    ): List<AreaEntry> {
        val entries = mutableListOf<AreaEntry>()

        // 분류 마스터 캐시 — code → (type, label, parentCode)
        val masterByCode = classificationMasterRepo.findAllByActiveOrderBySortOrderAsc(true)
            .associateBy { it.code }

        fun resolveByContentId(
            contentId: String,
            fallbackArea: String,
            fallbackSubArea: String?,
            classMap: Map<String, List<com.korfarm.api.classification.ContentClassificationEntity>>
        ): Triple<String, String?, Pair<String?, String?>> {
            // V0100 분류 우선
            val mappings = classMap[contentId].orEmpty()
            val themeMap = mappings.firstOrNull { it.classificationType == "theme" }
            val subAreaMap = mappings.firstOrNull { it.classificationType == "sub_area" }
            val areaMap = mappings.firstOrNull { it.classificationType == "area" }

            val themeMaster = themeMap?.let { masterByCode[it.id.classificationCode] }
            val subAreaFromTheme = themeMaster?.parentCode?.let { masterByCode[it] }
            val areaFromSub = subAreaFromTheme?.parentCode?.let { masterByCode[it] }

            val finalThemeLabel = themeMaster?.labelKo
            val finalThemeKey = themeMap?.id?.classificationCode
            val finalSubLabel = (subAreaFromTheme ?: subAreaMap?.let { masterByCode[it.id.classificationCode] })?.labelKo
                ?: fallbackSubArea
            val finalAreaLabel = (areaFromSub ?: areaMap?.let { masterByCode[it.id.classificationCode] })?.labelKo
                ?: fallbackArea

            return Triple(finalAreaLabel, finalSubLabel, finalThemeKey to finalThemeLabel)
        }

        // 1) 시험 OMR — 한 시험은 다영역 혼합이라 paper.area / 콘텐츠 분류 정보 부족.
        //    1차에서는 시험 1건을 "기타" 또는 paper title 기반으로 저장. 점수=정답률 100점환산.
        val testSubmissions = testSubmissionRepo.findByUserIdAndCreatedAtBetween(userId, start, end)
        val testPaperIds = testSubmissions.map { it.testId }.distinct()
        val testPapers = if (testPaperIds.isNotEmpty()) testPaperRepo.findAllById(testPaperIds).associateBy { it.id } else emptyMap()
        for (sub in testSubmissions) {
            val paper = testPapers[sub.testId] ?: continue
            val totalQ = paper.totalQuestions
            val score = if (totalQ > 0) (sub.correctCount.toDouble() / totalQ) * 100.0 else 0.0
            entries += AreaEntry(
                areaLabel = "시험",
                subAreaLabel = paper.title.take(20),
                themeKey = null,
                themeLabel = null,
                score = score,
                weight = SRC_WEIGHT_TEST,
                completedAt = sub.createdAt
            )
        }

        // 2) 일일 퀴즈 + 일일 독해 — learning_attempt 활용
        val attempts = learningAttemptRepo.findByUserIdAndActivityTypeAndSubmittedAtBetween(userId, "daily_quiz", start, end) +
            learningAttemptRepo.findByUserIdAndActivityTypeAndSubmittedAtBetween(userId, "daily_reading", start, end)

        // 3) 농장 모드 + 프로 모드 — farm_learning_log 통합 (PRO_, DAILY_ 포함된 log)
        val farmLogs = farmLearningLogRepo.findByUserIdAndStatusAndCompletedAtBetween(userId, "COMPLETED", start, end)

        // 콘텐츠 분류 일괄 조회 (attempts + farmLogs)
        val attemptContentIds = attempts.map { it.contentId }.toSet()
        val farmContentIds = farmLogs.map { it.contentId }.toSet()
        val allContentIds = (attemptContentIds + farmContentIds).toList()
        val contentInfoMap = if (allContentIds.isNotEmpty()) {
            contentRepository.findAllById(allContentIds).associateBy { it.id }
        } else emptyMap()
        val classMap = if (allContentIds.isNotEmpty()) {
            contentClassificationRepo.findByIdContentIdIn(allContentIds).groupBy { it.id.contentId }
        } else emptyMap()

        for (a in attempts) {
            val content = contentInfoMap[a.contentId] ?: continue
            val src = a.activityType
            val (areaLabel, subLabel, themePair) = resolveByContentId(
                a.contentId,
                fallbackArea = CompetencyMapping.domainAreaFor(content.contentType),
                fallbackSubArea = content.subArea,
                classMap = classMap
            )
            val sc = (a.score ?: 0).toDouble()
            val ts = a.submittedAt ?: continue
            entries += AreaEntry(
                areaLabel = areaLabel,
                subAreaLabel = subLabel,
                themeKey = themePair.first,
                themeLabel = themePair.second,
                score = sc,
                weight = if (src == "daily_quiz" || src == "daily_reading") SRC_WEIGHT_DAILY else SRC_WEIGHT_LEARN,
                completedAt = ts
            )
        }

        for (log in farmLogs) {
            val content = contentInfoMap[log.contentId]
            // farm_learning_log 는 daily_quiz / daily_reading / pro_* / 농장 모드 모두 포함.
            // 위 attempts 에서 이미 daily 처리했으므로 여기는 farm + pro 만.
            if (log.contentType == "DAILY_QUIZ" || log.contentType == "DAILY_READING") continue
            val ts = log.completedAt ?: continue
            val sc = (log.accuracy ?: log.score ?: 0).toDouble()
            val (areaLabel, subLabel, themePair) = resolveByContentId(
                log.contentId,
                fallbackArea = CompetencyMapping.domainAreaFor(log.contentType),
                fallbackSubArea = content?.subArea,
                classMap = classMap
            )
            entries += AreaEntry(
                areaLabel = areaLabel,
                subAreaLabel = subLabel,
                themeKey = themePair.first,
                themeLabel = themePair.second,
                score = sc,
                weight = SRC_WEIGHT_LEARN,
                completedAt = ts
            )
        }

        // 슬라이딩 윈도우 — 최근 200건만
        return entries.sortedByDescending { it.completedAt }.take(AREA_WINDOW_SIZE)
    }

    /** 영역·세부영역 가중 평가 V2 */
    private fun buildAreaStatsV2(entries: List<AreaEntry>): List<AreaStats> {
        if (entries.isEmpty()) return emptyList()
        val now = LocalDateTime.now()

        val byArea = entries.groupBy { it.areaLabel }
        val ordered = listOf("비문학", "문학", "문법", "화법", "작문", "매체", "독서 (비문학)", "시험", "기타")
        val keys = (ordered.filter { it in byArea.keys } + (byArea.keys - ordered.toSet())).distinct()

        return keys.mapNotNull { area ->
            val list = byArea[area] ?: return@mapNotNull null
            val (raw, weighted, recent) = computeWeighted(list, now)
            val subList = list.groupBy { it.subAreaLabel ?: "기타" }.map { (sa, slist) ->
                val (sraw, sweighted, srecent) = computeWeighted(slist, now)
                SubAreaStats(
                    subAreaLabel = sa,
                    activityCount = slist.size,
                    averageScore = round2(sraw),
                    weightedScore = round2(sweighted),
                    recentWeight = round2(srecent)
                )
            }.sortedByDescending { it.weightedScore }
            AreaStats(
                areaKey = area,
                areaLabel = area,
                activityCount = list.size,
                averageScore = round2(raw),
                rawAverage = round2(raw),
                weightedScore = round2(weighted),
                recentWeight = round2(recent),
                subAreas = subList
            )
        }
    }

    /** 주제별 가중 평가 V2 — themeKey 가 있는 entry 만 */
    private fun buildThemeStatsV2(entries: List<AreaEntry>): List<ThemeStats> {
        if (entries.isEmpty()) return emptyList()
        val now = LocalDateTime.now()

        val themed = entries.filter { !it.themeKey.isNullOrBlank() && !it.themeLabel.isNullOrBlank() }
        if (themed.isEmpty()) return emptyList()

        return themed.groupBy { it.themeKey!! }.map { (key, list) ->
            val sample = list.first()
            val (raw, weighted, recent) = computeWeighted(list, now)
            ThemeStats(
                themeKey = key,
                themeLabel = sample.themeLabel ?: key,
                areaLabel = sample.areaLabel,
                subAreaLabel = sample.subAreaLabel,
                activityCount = list.size,
                rawAverage = round2(raw),
                weightedScore = round2(weighted),
                recentWeight = round2(recent)
            )
        }.sortedByDescending { it.weightedScore }
    }

    /** entries → (rawAverage, weightedScore, recentWeight) 계산 */
    private fun computeWeighted(list: List<AreaEntry>, now: LocalDateTime): Triple<Double, Double, Double> {
        if (list.isEmpty()) return Triple(0.0, 0.0, 0.0)
        var rawSum = 0.0
        var weightedSum = 0.0
        var weightSum = 0.0
        for (e in list) {
            val daysAgo = ChronoUnit.DAYS.between(e.completedAt, now)
            val decay = areaDecay(daysAgo)
            val effW = e.weight * decay
            rawSum += e.score
            weightedSum += e.score * effW
            weightSum += effW
        }
        return Triple(
            rawSum / list.size,
            if (weightSum > 0) weightedSum / weightSum else 0.0,
            weightSum
        )
    }

    /** AI 코멘트 — 룰 기반 템플릿 (자몽 차감 X). 약점·강점·계획표·글쓰기 분석 */
    private fun buildAiComments(
        learningCompetency: LearningCompetencySnapshot?,
        diagnosticCompetency: DiagnosticCompetencySnapshot?,
        areaStats: List<AreaStats>,
        themeStats: List<ThemeStats>,
        studyPlan: StudyPlanSection?,
        writingStats: WritingStats?,
        recommendations: List<LearningRecommendation>,
        recommendationBundle: RecommendationBundleDto? = null
    ): List<AiComment> {
        val now = LocalDateTime.now().format(dtFmt)
        val out = mutableListOf<AiComment>()

        // 1) 10대 역량 — 강점·약점
        val items = learningCompetency?.items.orEmpty().filter { it.sampleCount >= 5 }
        if (items.isNotEmpty()) {
            val sorted = items.sortedByDescending { it.ratioScore }
            val best = sorted.first()
            val weak = sorted.last()
            if (best.ratioScore - weak.ratioScore > 15.0) {
                out += AiComment(
                    section = "역량",
                    title = "강점 역량 — ${best.competency}",
                    content = "최근 학습에서 ${best.competency}이(가) ${best.ratioScore.toInt()}점으로 가장 안정적입니다. 이 강점을 살려 더 깊은 단계의 학습을 시도해 보세요.",
                    severity = "good",
                    generatedAt = now
                )
                out += AiComment(
                    section = "역량",
                    title = "보강이 필요한 역량 — ${weak.competency}",
                    content = "${weak.competency}이(가) ${weak.ratioScore.toInt()}점으로 상대적으로 낮습니다. 추천 학습에서 관련 콘텐츠를 우선 풀어보세요.",
                    severity = "warn",
                    generatedAt = now
                )
            }
        }

        // 2) 진단과 학습의 격차
        val learnMap = learningCompetency?.items.orEmpty().associate { it.competency to it.ratioScore }
        val diagMap = diagnosticCompetency?.items.orEmpty().associate { it.competency to it.score }
        val gaps = COMPETENCIES.mapNotNull { c ->
            val l = learnMap[c] ?: return@mapNotNull null
            val d = diagMap[c] ?: return@mapNotNull null
            if (d > 0 && l - d > 20) Triple(c, l, d) else null
        }
        if (gaps.isNotEmpty()) {
            val first = gaps.first()
            out += AiComment(
                section = "역량",
                title = "학습 누적과 진단의 격차 발견",
                content = "${first.first}은(는) 학습 누적 ${first.second.toInt()}점 vs 진단 ${first.third.toInt()}점으로 차이가 큽니다. 한 번 더 진단 응시를 권장합니다.",
                severity = "info",
                generatedAt = now
            )
        }

        // 3) 영역별 약점
        val weakArea = areaStats.filter { it.activityCount >= 3 }.minByOrNull { it.weightedScore }
        if (weakArea != null && weakArea.weightedScore < 60.0) {
            out += AiComment(
                section = "영역",
                title = "${weakArea.areaLabel} 영역 보강",
                content = "${weakArea.areaLabel} 영역의 가중 평균이 ${weakArea.weightedScore.toInt()}점입니다. 활동 ${weakArea.activityCount}회 기준 — 추천 학습에서 해당 영역을 우선해 보세요.",
                severity = "warn",
                generatedAt = now
            )
        }

        // 4) 주제별 약점 (3건 이상 풀었는데 60 미만)
        val weakTheme = themeStats.filter { it.activityCount >= 3 && it.weightedScore < 60.0 }.firstOrNull()
        if (weakTheme != null) {
            out += AiComment(
                section = "영역",
                title = "주제 — ${weakTheme.themeLabel} 보강",
                content = "${weakTheme.themeLabel} 주제의 정확도가 ${weakTheme.weightedScore.toInt()}점입니다. ${weakTheme.areaLabel} 영역 안에서 같은 주제 콘텐츠를 더 풀어보면 점수 회복에 도움이 됩니다.",
                severity = "warn",
                generatedAt = now
            )
        }

        // 5) 학습 계획표
        if (studyPlan != null && studyPlan.totalCells > 0) {
            val rate = studyPlan.completionRate
            when {
                rate >= 90.0 -> out += AiComment(
                    section = "계획표",
                    title = "학습 계획 우수 수행",
                    content = "학습 계획표 완료율이 ${rate.toInt()}%로 매우 우수합니다. 꾸준한 페이스를 유지하세요.",
                    severity = "good",
                    generatedAt = now
                )
                rate < 50.0 -> out += AiComment(
                    section = "계획표",
                    title = "학습 계획 미수행 알림",
                    content = "학습 계획표 완료율이 ${rate.toInt()}%로 절반 미만입니다. 미수행 셀 ${studyPlan.pendingCells}건을 먼저 마무리해 보세요.",
                    severity = "warn",
                    generatedAt = now
                )
            }
        }

        // 6) 글쓰기 활동
        if (writingStats != null) {
            if (writingStats.totalPostCount == 0) {
                out += AiComment(
                    section = "글쓰기",
                    title = "글쓰기 시작해 보기",
                    content = "최근 글쓰기 활동이 없습니다. 지식과 지혜에서 주제 글을 한 편 작성하고 AI 첨삭을 받아보세요.",
                    severity = "info",
                    generatedAt = now
                )
            } else if (writingStats.feedbackReceivedCount == 0) {
                out += AiComment(
                    section = "글쓰기",
                    title = "AI 첨삭 활용 권장",
                    content = "글 ${writingStats.totalPostCount}편 작성, 그러나 AI 첨삭 0회입니다. 작성한 글에 AI 첨삭을 받으면 보완 포인트를 즉시 확인할 수 있습니다.",
                    severity = "info",
                    generatedAt = now
                )
            } else {
                out += AiComment(
                    section = "글쓰기",
                    title = "꾸준한 글쓰기 활동",
                    content = "글 ${writingStats.totalPostCount}편 작성 + AI 첨삭 ${writingStats.feedbackReceivedCount}회. 좋아요 ${writingStats.totalLikes} · 댓글 ${writingStats.totalComments}회를 받았습니다.",
                    severity = "good",
                    generatedAt = now
                )
            }
        }

        // 7) 추천 학습 안내 — V3 bundle 우선, 구버전 recommendations 는 fallback
        if (recommendationBundle != null) {
            val total = recommendationBundle.competency.items.size + recommendationBundle.area.items.size
            if (total > 0) {
                val strategy = recommendationBundle.competency.strategy
                val titleHint = when (strategy) {
                    "weakness" -> "약점 보강 추천"
                    "low_volume" -> "학습량 부족 영역 추천"
                    else -> "레벨 맞춤 추천"
                }
                val targetText = recommendationBundle.competency.targetLabels.joinToString("·").ifBlank { "맞춤" }
                out += AiComment(
                    section = "추천",
                    title = "$titleHint — ${total}건",
                    content = "$targetText 기준으로 추천 학습 ${total}건을 준비했습니다. 페이지 하단의 추천 영역에서 바로 시작할 수 있습니다.",
                    severity = "info",
                    generatedAt = now
                )
            }
        } else if (recommendations.isNotEmpty()) {
            val total = recommendations.sumOf { it.items.size }
            out += AiComment(
                section = "추천",
                title = "다음 추천 학습 ${total}건",
                content = "약점 역량을 기반으로 추천 학습 ${total}건이 준비되어 있습니다. 페이지 하단의 추천 영역에서 바로 시작해 보세요.",
                severity = "info",
                generatedAt = now
            )
        }

        return out
    }

    /** 글쓰기 통계 — wisdom_posts + ai_feedback_jobs + likes + comments 합산 */
    private fun buildWritingStats(userId: String, start: LocalDateTime, end: LocalDateTime): WritingStats {
        val posts = wisdomPostRepo.findByUserIdAndStatusOrderByCreatedAtDesc(userId, "active")
            .filter { it.createdAt >= start && it.createdAt <= end }
        if (posts.isEmpty()) {
            return WritingStats(
                totalPostCount = 0,
                feedbackReceivedCount = 0,
                totalLikes = 0,
                totalComments = 0,
                recentPosts = emptyList()
            )
        }

        val postIds = posts.map { it.id }
        val likes = wisdomLikeRepo.findByPostIdIn(postIds).size
        val commentCounts = wisdomCommentRepo.findByPostIdInAndStatus(postIds, "active")
        val totalComments = commentCounts.size
        val feedbackPosts = wisdomFeedbackRepo.findByPostIdIn(postIds).map { it.postId }.toSet()
        val aiFeedbackCount = postIds.count { pid ->
            feedbackPosts.contains(pid) ||
                aiFeedbackJobRepo.findFirstByPostIdAndStatusInOrderByCreatedAtDesc(pid, listOf(AiFeedbackJobStatus.COMPLETED)) != null
        }

        val likesByPost = wisdomLikeRepo.findByPostIdIn(postIds).groupBy { it.postId }
        val commentsByPost = commentCounts.groupBy { it.postId }
        val recent = posts.sortedByDescending { it.createdAt }.take(3).map { p ->
            WritingRecent(
                postId = p.id,
                title = p.topicLabel,
                topicKey = p.topicKey,
                hasFeedback = feedbackPosts.contains(p.id),
                likeCount = likesByPost[p.id]?.size ?: 0,
                commentCount = commentsByPost[p.id]?.size ?: 0,
                createdAt = p.createdAt.format(dtFmt)
            )
        }

        return WritingStats(
            totalPostCount = posts.size,
            feedbackReceivedCount = aiFeedbackCount,
            totalLikes = likes,
            totalComments = totalComments,
            recentPosts = recent
        )
    }

    /** 영역별 통계 빌드: contentType → 비문학/문학/문법/기타 + subArea 세부분류 (호환용 — V2 로 대체) */
    @Deprecated("V2 buildAreaStatsV2 로 대체. 1차 release 후 제거.")
    private fun buildAreaStatsLegacy(farmMode: FarmModeSection): List<AreaStats> {
        data class SubAcc(var scoreSum: Double = 0.0, var count: Int = 0)
        data class AreaAcc(var scoreSum: Double = 0.0, var count: Int = 0, val subMap: MutableMap<String, SubAcc> = mutableMapOf())

        val accMap = mutableMapOf<String, AreaAcc>()

        // contentId → subArea 조회
        val contentIds = farmMode.items.map { it.contentId }.distinct()
        val subAreaMap = if (contentIds.isNotEmpty()) {
            contentRepository.findAllById(contentIds).associate { it.id to (it.subArea ?: "") }
        } else emptyMap()

        for (item in farmMode.items) {
            val rawSubArea = subAreaMap[item.contentId]?.takeIf { it.isNotEmpty() }
            val domainArea = if (rawSubArea != null) {
                CompetencyMapping.areaForSubArea(rawSubArea) ?: CompetencyMapping.domainAreaFor(item.contentType)
            } else {
                CompetencyMapping.domainAreaFor(item.contentType)
            }
            val subArea = rawSubArea ?: CompetencyMapping.contentTypeLabel(item.contentType)
            val score = (item.accuracy ?: item.score ?: 0).toDouble()

            val acc = accMap.getOrPut(domainArea) { AreaAcc() }
            acc.scoreSum += score
            acc.count++
            val sub = acc.subMap.getOrPut(subArea) { SubAcc() }
            sub.scoreSum += score
            sub.count++
        }

        if (accMap.isEmpty()) return emptyList()

        // 고정 영역 순서
        val areaOrder = listOf("비문학", "문학", "문법", "기타")
        return areaOrder.mapNotNull { area ->
            val acc = accMap[area] ?: return@mapNotNull null
            val subAreas = acc.subMap.map { (label, sub) ->
                SubAreaStats(
                    subAreaLabel = label,
                    activityCount = sub.count,
                    averageScore = if (sub.count > 0) round2(sub.scoreSum / sub.count) else 0.0
                )
            }.sortedByDescending { it.averageScore }

            AreaStats(
                areaKey = area,
                areaLabel = area,
                activityCount = acc.count,
                averageScore = if (acc.count > 0) round2(acc.scoreSum / acc.count) else 0.0,
                subAreas = subAreas
            )
        }
    }

    /** 약점 역량·영역 기반 추천 학습: DB에서 실제 콘텐츠 5개 선택 */
    private fun buildRecommendations(
        competencyStats: List<CompetencyStats>,
        areaStats: List<AreaStats>
    ): List<LearningRecommendation> {
        val weakCompetencies = competencyStats.filter { it.accuracy < 70 && it.total > 0 }
        if (weakCompetencies.isEmpty()) return emptyList()

        // 약점 역량의 관련 contentType 수집
        val targetTypes = weakCompetencies.flatMap {
            CompetencyMapping.recommendedContentTypes(it.competencyLabel)
        }.distinct()

        if (targetTypes.isEmpty()) return emptyList()

        // DB에서 해당 타입의 published 콘텐츠 조회
        val candidates = targetTypes.flatMap { type ->
            contentRepository.findByContentTypeAndStatus(type, "published")
        }.distinctBy { it.id }.take(5)

        if (candidates.isEmpty()) return emptyList()

        val reason = weakCompetencies.joinToString(", ") { "${it.competencyLabel}(${it.accuracy.toInt()}%)" } +
            " 역량 보강을 위한 추천 학습입니다."

        val items = candidates.map { c ->
            RecommendedItem(
                contentId = c.id,
                contentType = c.contentType,
                label = c.title,
                path = "/engine?contentId=${c.id}&contentType=${c.contentType}"
            )
        }

        return listOf(
            LearningRecommendation(
                reason = reason,
                targetLabel = weakCompetencies.first().competencyLabel,
                items = items
            )
        )
    }

    /** 캘린더 데이터: 모든 활동 소스에서 날짜별 집계 + 평균 정답률 */
    private fun buildCalendarData(userId: String, start: LocalDateTime, end: LocalDateTime): List<CalendarDay> {
        val dayMap = mutableMapOf<LocalDate, MutableMap<String, Int>>()
        val dayScoreMap = mutableMapOf<LocalDate, MutableList<Double>>()

        // 테스트
        testSubmissionRepo.findByUserIdAndCreatedAtBetween(userId, start, end).forEach {
            val date = it.createdAt.toLocalDate()
            dayMap.getOrPut(date) { mutableMapOf() }
                .merge("테스트", 1) { a, b -> a + b }
            val paper = testPaperRepo.findById(it.testId).orElse(null)
            val totalQ = paper?.totalQuestions ?: 0
            if (totalQ > 0) {
                dayScoreMap.getOrPut(date) { mutableListOf() }
                    .add(it.correctCount.toDouble() / totalQ * 100)
            }
        }

        // 농장 학습
        farmLearningLogRepo.findByUserIdAndStatusAndCompletedAtBetween(userId, "COMPLETED", start, end).forEach {
            val label = when {
                it.contentType == "DAILY_QUIZ" -> "일일 퀴즈"
                it.contentType == "DAILY_READING" -> "일일 독해"
                it.contentType.startsWith("PRO_") -> "프로 모드"
                else -> "농장 모드"
            }
            it.completedAt?.toLocalDate()?.let { date ->
                dayMap.getOrPut(date) { mutableMapOf() }
                    .merge(label, 1) { a, b -> a + b }
                it.accuracy?.let { acc ->
                    dayScoreMap.getOrPut(date) { mutableListOf() }.add(acc.toDouble())
                }
            }
        }

        // 일일 퀴즈/독해 (learningAttemptRepo)
        listOf("daily_quiz" to "일일 퀴즈", "daily_reading" to "일일 독해").forEach { (type, label) ->
            learningAttemptRepo.findByUserIdAndActivityTypeAndSubmittedAtBetween(userId, type, start, end).forEach {
                it.submittedAt?.toLocalDate()?.let { date ->
                    dayMap.getOrPut(date) { mutableMapOf() }
                        .merge(label, 1) { a, b -> a + b }
                    it.score?.let { sc ->
                        dayScoreMap.getOrPut(date) { mutableListOf() }.add(sc.toDouble())
                    }
                }
            }
        }

        // 프로 모드
        proProgressRepo.findByUserIdAndCompletedTrueAndCompletedAtBetween(userId, start, end).forEach {
            it.completedAt?.toLocalDate()?.let { date ->
                dayMap.getOrPut(date) { mutableMapOf() }
                    .merge("프로 모드", 1) { a, b -> a + b }
                it.score?.let { sc ->
                    dayScoreMap.getOrPut(date) { mutableListOf() }.add(sc.toDouble())
                }
            }
        }

        return dayMap.entries.sortedBy { it.key }.map { (date, activities) ->
            val scores = dayScoreMap[date]
            val avgAccuracy = if (scores != null && scores.isNotEmpty()) round2(scores.average()) else null
            CalendarDay(
                date = date.toString(),
                totalCount = activities.values.sum(),
                activities = activities.map { (label, count) -> CalendarActivity(label, count) },
                averageAccuracy = avgAccuracy
            )
        }
    }

    private fun round2(value: Double): Double =
        Math.round(value * 100.0) / 100.0

    private fun parseDate(isoDateTime: String): LocalDate? =
        try { LocalDateTime.parse(isoDateTime, dtFmt).toLocalDate() } catch (_: Exception) { null }
}
