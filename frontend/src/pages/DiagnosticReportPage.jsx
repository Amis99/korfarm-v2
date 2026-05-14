import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { apiGet, apiPut, API_BASE, TOKEN_KEY } from "../utils/api";
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
  const [answerPdf, setAnswerPdf] = useState({ checked: false, available: false });
  const [answerDownloading, setAnswerDownloading] = useState(false);

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

  // 정답·해설 PDF 다운로드 가능 여부 — 본인 응시 + 관리자가 정답 PDF 생성한 시험만
  useEffect(() => {
    if (isParentMode || !report?.tier) return;
    const testId = `diag_paper_${report.tier}`;
    apiGet(`/v1/test-storage/${testId}/answer-pdf/meta`)
      .then((m) => setAnswerPdf({ checked: true, available: !!m?.available }))
      .catch(() => setAnswerPdf({ checked: true, available: false }));
  }, [isParentMode, report?.tier]);

  const handleAnswerDownload = async () => {
    if (!report?.tier || answerDownloading) return;
    setAnswerDownloading(true);
    try {
      const testId = `diag_paper_${report.tier}`;
      const token = sessionStorage.getItem(TOKEN_KEY) || "";
      const resp = await fetch(`${API_BASE}/v1/test-storage/${testId}/answer-pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!resp.ok) throw new Error("정답·해설 PDF 를 받을 수 없습니다.");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      alert(e?.message || "다운로드 실패");
    } finally {
      setAnswerDownloading(false);
    }
  };

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
          {report.tierLabel} · {report.mode === "offline" ? "인쇄 OMR" : "온라인 응시"} · {report.answeredCount}문항
          {report.completedAt && <span className="completed-at"> · {report.completedAt.replace("T", " ").substring(0, 16)}</span>}
        </span>
        {report.gradeContext && (
          <div className="diag-grade-context">{report.gradeContext}</div>
        )}
      </div>

      {/* 풀이 속도 카드 (온라인 응시만, 본인 + 분포 통합) */}
      {report.mode !== "offline" && report.speedMinPerQuestion != null && (
        <div className="diag-report-section diag-time-section">
          <h2>풀이 속도</h2>
          <div className="speed-card-unified">
            <div className="speed-card-head">
              <div className="speed-card-mine">
                <div className="diag-time-label">내 풀이 속도 (보정)</div>
                <div className="diag-time-value">
                  {report.speedMinPerQuestion.toFixed(2)}
                  <span className="diag-time-unit">분/문항</span>
                </div>
                <div className="diag-time-note">
                  보정 시간({Math.floor((report.effectiveSpeedSec || 0) / 60)}분 {(report.effectiveSpeedSec || 0) % 60}초)
                  {" ÷ 푼 문항 "}{report.answeredCount}개<br />
                  <span style={{ opacity: 0.7 }}>* 보정 시간 = 마지막 마킹까지 + (오답 수 × 3분)</span>
                </div>
              </div>
              {report.speedPercentile != null && (
                <div className="speed-card-percentile">
                  <div className="diag-time-label">속도 백분위</div>
                  <div className="diag-time-value">
                    상위 {report.speedPercentile.toFixed(1)}
                    <span className="diag-time-unit">%</span>
                  </div>
                  <div className="diag-time-note">
                    같은 단계 응시자 중 (1등 0% · 꼴등 100%)
                  </div>
                </div>
              )}
            </div>

            {report.speedPercentile != null && report.speedDistribution ? (
              <>
                {/* 막대 그래프 — 좌 빠름(녹) 우 느림(빨), 본인 위치 marker */}
                <div className="speed-percentile-bar-wrap">
                  <div className="speed-percentile-bar">
                    <div
                      className="speed-percentile-marker"
                      style={{ left: `${Math.min(100, Math.max(0, report.speedPercentile))}%` }}
                      title={`상위 ${report.speedPercentile.toFixed(1)}% · ${report.speedMinPerQuestion.toFixed(2)} 분/문항`}
                    />
                  </div>
                  <div className="speed-percentile-axis">
                    <span>0% · {report.speedDistribution.fastestMinPerQ.toFixed(2)}분/문항</span>
                    <span>50% · {report.speedDistribution.medianMinPerQ.toFixed(2)}분/문항</span>
                    <span>100% · {report.speedDistribution.slowestMinPerQ.toFixed(2)}분/문항</span>
                  </div>
                </div>

                {/* 분포 통계 표 */}
                <table className="speed-distribution-table">
                  <thead>
                    <tr>
                      <th>위치</th>
                      <th>설명</th>
                      <th>분/문항</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>0%</td>
                      <td>가장 빠른 응시자</td>
                      <td>{report.speedDistribution.fastestMinPerQ.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>50%</td>
                      <td>중앙값 (응시자 절반의 기준)</td>
                      <td>{report.speedDistribution.medianMinPerQ.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>100%</td>
                      <td>가장 느린 응시자</td>
                      <td>{report.speedDistribution.slowestMinPerQ.toFixed(2)}</td>
                    </tr>
                    <tr className="speed-row-mine">
                      <td>상위 {report.speedPercentile.toFixed(1)}%</td>
                      <td>내 풀이 속도</td>
                      <td>{report.speedMinPerQuestion.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
                <div className="diag-time-note" style={{ marginTop: 8 }}>
                  같은 단계 응시자 {report.speedDistribution.sampleSize}명 기준
                </div>
              </>
            ) : (
              <div className="diag-time-note" style={{ marginTop: 8 }}>
                비교 분포는 같은 단계 응시자가 2명 이상 누적되면 표시됩니다.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 섹션 1: 종합 요약 카드 */}
      <ReportSummaryCards report={report} />

      {/* 섹션 2: 점수 게이지 */}
      <TciGaugeChart
        tci={report.adjustedTci}
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

      {/* 하단 액션 카드 — 학습 홈페이지 컨셉 (라운드 카드 grid) */}
      {!isParentMode && needsChoice && (
        <div style={{ textAlign: "center", marginTop: 24, marginBottom: -12, color: "#5d4e37", fontWeight: 600 }}>
          학습 레벨을 선택해 주세요
        </div>
      )}
      <div className="diag-report-actions">
        <button className="action-card" onClick={() => navigate(backUrl)}>
          <span className="material-symbols-outlined action-icon">list_alt</span>
          <span className="action-label">진단 목록</span>
        </button>

        {!isParentMode && answerPdf.checked && answerPdf.available && (
          <button
            className="action-card"
            onClick={handleAnswerDownload}
            disabled={answerDownloading}
            title="정답·해설 PDF 를 새 탭에서 열어 인쇄·저장할 수 있습니다."
          >
            <span className="material-symbols-outlined action-icon">print</span>
            <span className="action-label">
              {answerDownloading ? "정답·해설 불러오는 중..." : "정답·해설 인쇄"}
            </span>
          </button>
        )}

        {!isParentMode && needsChoice ? (
          <>
            <button
              className="action-card"
              onClick={() => handleLevelSelect(currentLevelId)}
              disabled={levelSaving}
            >
              <span className="material-symbols-outlined action-icon">school</span>
              <span className="action-label">학년 기준</span>
              <span className="action-value">{LEVEL_LABELS[currentLevelId] || currentLevelId}</span>
              <span className="action-note">{profile?.gradeLabel || profile?.grade_label} 기준</span>
            </button>
            <button
              className="action-card action-card--recommended"
              onClick={() => handleLevelSelect(recommendedLevelId)}
              disabled={levelSaving}
            >
              <span className="material-symbols-outlined action-icon">neurology</span>
              <span className="action-label">진단 결과</span>
              <span className="action-value">{LEVEL_LABELS[recommendedLevelId] || report.recommendedLevel?.label}</span>
              <span className="action-note">진단 테스트 추천</span>
            </button>
          </>
        ) : (
          !isParentMode && (
            <button className="action-card action-card--primary" onClick={() => navigate("/start")}>
              <span className="material-symbols-outlined action-icon">play_arrow</span>
              <span className="action-label">학습 시작하기</span>
            </button>
          )
        )}
      </div>
    </div>
  );
}

export default DiagnosticReportPage;
