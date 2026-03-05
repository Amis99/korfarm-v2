import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { apiGet, apiPut } from "../utils/api";
import { LEVEL_LABELS } from "../constants/levels";
import CompetencyRadarChart from "../components/diagnostic/CompetencyRadarChart";
import TciGaugeChart from "../components/diagnostic/TciGaugeChart";
import ReportSummaryCards from "../components/diagnostic/ReportSummaryCards";
import TierStatsSection from "../components/diagnostic/TierStatsSection";
import CompetencyDetailSection from "../components/diagnostic/CompetencyDetailSection";
import QuestionTypeChart from "../components/diagnostic/QuestionTypeChart";
import GenreComparisonChart from "../components/diagnostic/GenreComparisonChart";
import PassageAnalysisSection from "../components/diagnostic/PassageAnalysisSection";
import FullErrorAnalysis from "../components/diagnostic/FullErrorAnalysis";
import QuestionReviewSection from "../components/diagnostic/QuestionReviewSection";
import LearningRecommendation from "../components/diagnostic/LearningRecommendation";
import "../styles/diagnostic-v2.css";

function DiagnosticReportPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("studentId");
  const isParentMode = !!studentId;

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [levelSaving, setLevelSaving] = useState(false);

  useEffect(() => {
    const url = isParentMode
      ? `/v1/parents/children/${studentId}/diagnostic/${sessionId}/report`
      : `/v1/diagnostic/sessions/${sessionId}/report`;
    apiGet(url)
      .then(setReport)
      .catch(() => navigate(isParentMode ? `/diagnostic/v2?studentId=${studentId}` : "/diagnostic/v2"))
      .finally(() => setLoading(false));
  }, [sessionId, navigate, isParentMode, studentId]);

  useEffect(() => {
    if (!isParentMode) {
      apiGet("/v1/auth/me").then(setProfile).catch(() => {});
    }
  }, [isParentMode]);

  // testKey → levelId 매핑
  const TIER_TO_PREFIX = { sohssure: "saussure", frege: "frege", russell: "russell", wittgenstein: "wittgenstein" };
  const recommendedLevelId = report?.recommendedLevel?.testKey && report?.recommendedLevel?.level
    ? `${TIER_TO_PREFIX[report.recommendedLevel.testKey] || report.recommendedLevel.testKey}${report.recommendedLevel.level}`
    : null;

  const currentLevelId = profile?.levelId || profile?.level_id;
  const needsChoice = recommendedLevelId && currentLevelId && recommendedLevelId !== currentLevelId;

  const handleLevelSelect = async (levelId) => {
    setLevelSaving(true);
    try {
      await apiPut("/v1/auth/me", { levelId });
      navigate("/start");
    } catch {
      navigate("/start");
    }
  };

  if (loading) return <div className="diag-v2-loading">리포트를 불러오는 중...</div>;
  if (!report) return null;

  const backUrl = isParentMode ? `/diagnostic/v2?studentId=${studentId}` : "/diagnostic/v2";

  return (
    <div className="diag-report-page">
      <div className="diag-report-header">
        <h1>역량 진단 리포트</h1>
        <span className="tier-label">
          {report.tierLabel} · {report.mode === "cat" ? "적응형" : "전체 풀이"} · {report.answeredCount}문항
          {report.completedAt && <span className="completed-at"> · {report.completedAt.replace("T", " ").substring(0, 16)}</span>}
        </span>
        {report.gradeContext && (
          <div className="diag-grade-context">{report.gradeContext}</div>
        )}
      </div>

      {/* 섹션 1: 종합 요약 카드 */}
      <ReportSummaryCards report={report} />

      {/* 섹션 2: TCI 게이지 (강화) */}
      <TciGaugeChart
        tci={report.adjustedTci}
        rawTci={report.rawTci}
        confidence={report.confidence}
        recommendation={report.recommendedLevel?.label}
        statistics={report.statistics}
        accuracyRate={report.accuracyRate}
      />

      {/* 섹션 3: 전체 응시자 통계 */}
      <TierStatsSection
        statistics={report.statistics}
        percentiles={report.percentiles}
      />

      {/* 섹션 4: 10대 역량 레이더 (평균 오버레이) */}
      <div className="diag-report-section">
        <h2>10대 역량 프로필</h2>
        <div className="diag-radar-container">
          <CompetencyRadarChart
            scores={report.competencyScores}
            averageScores={report.statistics?.competencyStats}
          />
        </div>
      </div>

      {/* 섹션 5: 역량 상세 분석 (아코디언) */}
      <CompetencyDetailSection
        details={report.competencyDetails}
        statistics={report.statistics}
      />

      {/* 섹션 6: 문항 유형별 정답률 */}
      <QuestionTypeChart analysis={report.questionTypeAnalysis} />

      {/* 섹션 7: 장르별 비교 */}
      <GenreComparisonChart analysis={report.genreAnalysis} />

      {/* 섹션 8: 지문별 성적 */}
      <PassageAnalysisSection analysis={report.passageAnalysis} />

      {/* 섹션 9: 오류 경로 종합 */}
      <FullErrorAnalysis analysis={report.fullErrorAnalysis} />

      {/* 섹션 10: 개별 문항 리뷰 */}
      <QuestionReviewSection reviews={report.questionReviews} />

      {/* 섹션 11: 추천 학습 방향 */}
      <LearningRecommendation report={report} />

      {/* 하단 버튼 */}
      <div className="diag-report-actions">
        <button className="btn-secondary" onClick={() => navigate(backUrl)}>진단 목록</button>
        {!isParentMode && needsChoice ? (
          <div className="diag-level-choice">
            <h3>학습 레벨을 선택해 주세요</h3>
            <div className="diag-level-options">
              <button className="diag-level-option" onClick={() => handleLevelSelect(currentLevelId)} disabled={levelSaving}>
                <span className="material-symbols-outlined">school</span>
                <div className="diag-level-option-label">학년 기준</div>
                <div className="diag-level-option-value">{LEVEL_LABELS[currentLevelId] || currentLevelId}</div>
                <div className="diag-level-option-note">{profile?.gradeLabel || profile?.grade_label} 기준</div>
              </button>
              <button className="diag-level-option diag-level-option--recommended" onClick={() => handleLevelSelect(recommendedLevelId)} disabled={levelSaving}>
                <span className="material-symbols-outlined">neurology</span>
                <div className="diag-level-option-label">진단 결과</div>
                <div className="diag-level-option-value">{LEVEL_LABELS[recommendedLevelId] || report.recommendedLevel?.label}</div>
                <div className="diag-level-option-note">진단 테스트 추천</div>
              </button>
            </div>
          </div>
        ) : (
          !isParentMode && <button className="btn-primary" onClick={() => navigate("/start")}>학습 시작하기</button>
        )}
      </div>
    </div>
  );
}

export default DiagnosticReportPage;
