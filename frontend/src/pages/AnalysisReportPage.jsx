import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiGet, apiPost } from "../utils/api";
import { apiGet as adminApiGet } from "../utils/adminApi";
import { clampPct } from "../utils/format";
import ReportLearningDiagnosticPanel from "../components/report/ReportLearningDiagnosticPanel";
import ReportAreaSection from "../components/report/ReportAreaSection";
import ReportThemeSection from "../components/report/ReportThemeSection";
import ReportTrendChart from "../components/report/ReportTrendChart";
import ReportSectionDetail from "../components/report/ReportSectionDetail";
import ReportStudyPlanMatrix from "../components/report/ReportStudyPlanMatrix";
import ReportRecommendations from "../components/report/ReportRecommendations";
import ReportAiComments from "../components/report/ReportAiComments";
import ReportWritingStats from "../components/report/ReportWritingStats";
import "../styles/student-home.css";
import "../styles/unified-report.css";
import "../styles/analysis-report.css";

/**
 * 통합 분석표 — 학생 / 학부모 / 관리자 공용
 * 사용자 명시 8개 섹션:
 *   1. 10대 역량 분석
 *   2. 영역별·세부영역별·주제별 성취 분석
 *   3. 최근 테스트 추이
 *   4. 학습량 및 학습 분포
 *   5. 학습 계획표 수행도
 *   6. AI 코멘트
 *   7. 다음 추천 학습 (일일 학습 제외)
 *   8. 글쓰기 현황
 * + 인쇄 버튼
 */

// 기간 → 날짜 범위
function buildDateRange(period) {
  const now = new Date();
  const end = now.toISOString().slice(0, 10);
  const start = new Date(now);
  if (period === "7d") start.setDate(now.getDate() - 6);
  else if (period === "30d") start.setDate(now.getDate() - 29);
  else if (period === "90d") start.setDate(now.getDate() - 89);
  else start.setFullYear(now.getFullYear() - 2);
  return { start: start.toISOString().slice(0, 10), end };
}

const SOURCE_COLOR = {
  examOmr: "#5B9BD5",
  farmMode: "#A5C77E",
  dailyQuiz: "#F4C97A",
  dailyReading: "#F06C24",
  proMode: "#C589CB",
  studyPlan: "#B7AFA1",
};

// "추천학습 생성" 버튼 포함 섹션 — 하루 1회 갱신 제한 (백엔드 정책)
function RecommendationsSection({ report, setReport, studentIdParam, canRegenerate }) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  const handleRegenerate = async () => {
    if (busy) return;
    setBusy(true); setNotice(null);
    try {
      const res = await apiPost("/v1/learning/recommendations/regenerate", {});
      const data = res?.data;
      if (data?.success && data.bundle) {
        setReport((prev) => prev ? { ...prev, recommendationBundle: data.bundle } : prev);
        setNotice({ ok: true, text: data.message || "새 추천이 생성됐어요." });
      } else {
        setNotice({ ok: false, text: data?.message || "하루 1회만 갱신할 수 있어요." });
      }
    } catch (e) {
      setNotice({ ok: false, text: e?.message || "추천 생성에 실패했어요." });
    } finally {
      setBusy(false);
    }
  };

  const has =
    (report?.recommendationBundle &&
      (report.recommendationBundle.competency?.items?.length > 0 ||
        report.recommendationBundle.area?.items?.length > 0));

  return (
    <section className="report-section" id="sec-reco">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0 }}>✨ 다음 추천 학습</h2>
        {canRegenerate && (
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={busy}
            className="btn-soft"
            style={{
              padding: "6px 14px", borderRadius: 8, border: "1px solid #d6c9b3",
              background: busy ? "#eee" : "#fff7e6", color: "#5a4d33",
              fontWeight: 600, cursor: busy ? "default" : "pointer",
            }}
          >
            {busy ? "생성 중…" : "🔄 추천학습 생성 (하루 1회)"}
          </button>
        )}
      </div>
      {notice && (
        <p style={{
          marginTop: 8, fontSize: 13,
          color: notice.ok ? "#2e7d32" : "#c62828"
        }}>{notice.text}</p>
      )}
      {has ? (
        <ReportRecommendations bundle={report.recommendationBundle} studentId={studentIdParam || undefined} />
      ) : Array.isArray(report?.recommendations) && report.recommendations.length > 0 ? (
        <ReportRecommendations legacy={report.recommendations} studentId={studentIdParam || undefined} />
      ) : (
        <p className="ur-empty">아직 추천할 학습이 충분하지 않습니다. 학습 데이터가 누적되면 자동으로 표시됩니다.</p>
      )}
    </section>
  );
}

function AnalysisReportPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();

  const isParent = user?.roles?.includes("PARENT");
  const isAdmin = user?.roles?.some((r) => r === "HQ_ADMIN" || r === "ORG_ADMIN");
  const studentIdParam = params.get("studentId");

  const [period, setPeriod] = useState("30d");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [meName, setMeName] = useState("");

  useEffect(() => {
    if (!studentIdParam) {
      apiGet("/v1/auth/me")
        .then((d) => setMeName(d?.name || d?.username || "학생"))
        .catch(() => {});
    }
  }, [studentIdParam]);

  const fetchReport = (refresh) => {
    const { start, end } = buildDateRange(period);
    const qs = `startDate=${start}&endDate=${end}${refresh ? "&refresh=true" : ""}`;
    if (isParent && studentIdParam) {
      return apiGet(`/v1/parents/children/${studentIdParam}/report/unified?${qs}`);
    }
    if (isAdmin && studentIdParam) {
      return adminApiGet(`/v1/admin/students/${studentIdParam}/report/unified?${qs}`);
    }
    return apiGet(`/v1/report/unified?${qs}`);
  };

  useEffect(() => {
    setLoading(true);
    setError("");
    fetchReport(false)
      .then((d) => setReport(d || null))
      .catch((e) => {
        console.error("[analysis-report] fetch failed", e);
        setError(e?.message || "데이터를 불러올 수 없습니다.");
        setReport(null);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, isParent, isAdmin, studentIdParam]);

  const handleRefresh = async () => {
    if (refreshing || !report?.refreshableToday) return;
    setRefreshing(true);
    setError("");
    try {
      const d = await fetchReport(true);
      setReport(d || null);
    } catch (e) {
      console.error("[analysis-report] refresh failed", e);
      const msg = e?.message || "새로고침 실패";
      setError(msg);
    } finally {
      setRefreshing(false);
    }
  };

  const studentName = report?.studentName || meName || "학생";

  // 학습량 — 활동 카드 + 비중 바
  const activityList = useMemo(() => {
    const s = report?.sections || {};
    const out = [];
    if (s.examOmr?.count) {
      out.push({ key: "examOmr", label: "지필 시험", count: s.examOmr.count, score: s.examOmr.averageScore, color: SOURCE_COLOR.examOmr });
    }
    if (s.farmMode?.count) {
      out.push({ key: "farmMode", label: "농장 모드", count: s.farmMode.count, score: s.farmMode.averageAccuracy ?? s.farmMode.averageScore, color: SOURCE_COLOR.farmMode });
    }
    if (s.dailyQuiz?.count) {
      out.push({ key: "dailyQuiz", label: "일일 퀴즈", count: s.dailyQuiz.count, score: s.dailyQuiz.averageScore, color: SOURCE_COLOR.dailyQuiz });
    }
    if (s.dailyReading?.count) {
      out.push({ key: "dailyReading", label: "일일 독해", count: s.dailyReading.count, score: s.dailyReading.averageScore, color: SOURCE_COLOR.dailyReading });
    }
    const proTotal = (s.proMode?.completedItems ?? 0) + (s.proMode?.testCount ?? 0);
    if (proTotal > 0) {
      out.push({ key: "proMode", label: "프로 모드", count: proTotal, score: s.proMode?.averageTestScore, color: SOURCE_COLOR.proMode, sub: `학습 ${s.proMode?.completedItems ?? 0} · 테스트 ${s.proMode?.testCount ?? 0}` });
    }
    return out;
  }, [report]);

  const totalActivities = activityList.reduce((s, a) => s + a.count, 0);

  const periods = [
    { id: "7d", label: "최근 7일" },
    { id: "30d", label: "30일" },
    { id: "90d", label: "90일" },
    { id: "all", label: "전체" },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="student-home report-shell">
      <header className="top-bar no-print" style={{ padding: "calc(env(safe-area-inset-top) + 14px) 18px 14px" }}>
        <button className="hamburger" aria-label="홈으로" onClick={() => navigate(-1)}>
          <span></span>
        </button>
        <a className="brand" href="/" aria-label="국어농장 랜딩으로" onClick={(e) => { e.preventDefault(); navigate("/"); }}>
          <img
            src={import.meta.env.BASE_URL + "korfarm-logo.png"}
            alt="국어농장"
            style={{ height: 36, width: "auto", display: "block" }}
          />
        </a>
        <div style={{ flex: 1 }}></div>
      </header>

      <div className="report-page-head">
        <div className="row">
          <h1>📊 {studentName}의 통합 분석표</h1>
          <div className="report-actions">
            <div className="period-tabs no-print" role="tablist">
              {periods.map((p) => (
                <button
                  key={p.id}
                  role="tab"
                  className={period === p.id ? "active" : ""}
                  onClick={() => setPeriod(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {!isParent && (
              <button
                type="button"
                className="btn-print no-print"
                onClick={handleRefresh}
                disabled={refreshing || !report?.refreshableToday}
                aria-label="AI 새로고침 (일 1회)"
                title={
                  refreshing ? "AI 분석 중..."
                  : report?.refreshableToday ? "AI 새로고침 — 일 1회 가능"
                  : "오늘 이미 새로고침했습니다 (내일 다시 가능)"
                }
                style={{ opacity: report?.refreshableToday ? 1 : 0.4 }}
              >
                {refreshing ? "⏳ 분석 중" : report?.aiEnabled ? "🔄 AI 갱신" : "🔄 AI 새로고침"}
              </button>
            )}
            <button
              type="button"
              className="btn-print no-print"
              onClick={handlePrint}
              aria-label="인쇄하기"
            >
              🖨 인쇄
            </button>
          </div>
        </div>
        <p>학습 데이터를 영역·주제·역량 단위로 분석해 강약점을 한눈에 보여줍니다.</p>
      </div>

      {loading && (
        <div className="report-status-msg">분석 데이터를 불러오는 중...</div>
      )}
      {error && !loading && (
        <div className="report-status-msg report-status-error">⚠️ {error}</div>
      )}

      {/* 1. 10대 역량 분석 */}
      <section className="report-section" id="sec-competency">
        <h2>🎯 10대 역량 분석</h2>
        {(report?.learningCompetency || report?.diagnosticCompetency) ? (
          <div className="competency-panel-compact">
            <ReportLearningDiagnosticPanel
              learningCompetency={report.learningCompetency}
              diagnosticCompetency={report.diagnosticCompetency}
            />
          </div>
        ) : (
          <p className="ur-empty">아직 역량 데이터가 충분하지 않습니다.</p>
        )}

        {isAdmin && (
          <p className="ur-algo-hint" style={{ marginTop: 12 }}>
            최근 100건 학습/시험 + 30일 가중치 + 시험 10·일일 3·학습 1 가중 + 약점 가중치 + 난이도 보정
          </p>
        )}
      </section>

      {/* 2. 영역별·세부영역별·주제별 성취 분석 */}
      <section className="report-section" id="sec-area">
        <h2>📚 영역별 · 세부영역별 · 주제별 성취 분석</h2>
        <ReportAreaSection areaStats={report?.areaStats || []} showAlgorithmHint={isAdmin} />
        <div style={{ marginTop: 20 }}>
          <ReportThemeSection themeStats={report?.themeStats || []} showAlgorithmHint={isAdmin} />
        </div>
      </section>

      {/* 3. 최근 테스트 추이 */}
      <section className="report-section" id="sec-tests">
        <h2>📝 최근 테스트 추이</h2>
        {report?.sections?.examOmr?.items?.length > 0 ? (
          <>
            <table className="ur-test-table">
              <thead>
                <tr>
                  <th>일시</th>
                  <th>시험명</th>
                  <th>점수</th>
                  <th>정답수</th>
                  <th>정답률</th>
                </tr>
              </thead>
              <tbody>
                {report.sections.examOmr.items.slice(0, 10).map((it) => (
                  <tr key={it.submissionId || it.testId}>
                    <td style={{ fontSize: 12, color: "#666" }}>
                      {it.submittedAt ? it.submittedAt.slice(0, 10) : "-"}
                    </td>
                    <td>{it.testTitle || "-"}</td>
                    <td>
                      <strong>{it.score}</strong>/{it.totalPoints}
                    </td>
                    <td>{it.correctCount}/{it.totalQuestions}</td>
                    <td style={{ fontWeight: 700 }}>{it.accuracy?.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {Array.isArray(report?.trend) && report.trend.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h3>일자별 추이</h3>
                <ReportTrendChart trend={report.trend} />
              </div>
            )}
          </>
        ) : (
          <p className="ur-empty">최근 응시한 시험이 없습니다.</p>
        )}
      </section>

      {/* 4. 학습량 및 학습 분포 */}
      <section className="report-section" id="sec-volume">
        <h2>🧩 학습량 및 학습 분포</h2>

        <div className="activity-cards">
          {activityList.map((a) => (
            <div key={a.key} className="activity-card" style={{ borderColor: a.color }}>
              <div className="activity-card-label">{a.label}</div>
              <div className="activity-card-count">
                {a.count}<span className="unit">회</span>
              </div>
              {a.score != null && (
                <div className="activity-card-score">평균 {Number(a.score).toFixed(1)}점</div>
              )}
              {a.sub && <div className="activity-card-sub">{a.sub}</div>}
            </div>
          ))}
          {activityList.length === 0 && (
            <p className="ur-empty">이 기간엔 학습 활동이 없습니다.</p>
          )}
        </div>

        {totalActivities > 0 && (
          <div style={{ marginTop: 16 }}>
            <h3>활동 비중</h3>
            <div className="bar-list">
              {activityList.map((a) => {
                const pct = (a.count / totalActivities) * 100;
                return (
                  <div key={a.key} className="bar-row">
                    <span className="label">{a.label}</span>
                    <div className="bar-bg">
                      <div className="bar-fill" style={{ width: `${pct}%`, background: a.color }} />
                    </div>
                    <span className="pct">{pct.toFixed(0)}% · {a.count}회</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {report?.sections && (
          <div style={{ marginTop: 16 }}>
            <h3>활동별 상세</h3>
            <ReportSectionDetail sections={{ ...report.sections, studyPlan: null }} />
          </div>
        )}
      </section>

      {/* 5. 학습 계획표 수행도 */}
      <section className="report-section" id="sec-plan">
        <h2>📋 학습 계획표 수행도</h2>
        {report?.sections?.studyPlan?.totalCells > 0 ? (
          <>
            <div className="study-plan-summary">
              <div className="sp-summary-card">
                <span className="label">완료율</span>
                <span className="value">{clampPct(report.sections.studyPlan.completionRate).toFixed(0)}%</span>
              </div>
              <div className="sp-summary-card">
                <span className="label">완료</span>
                <span className="value">{report.sections.studyPlan.completedCells}</span>
              </div>
              <div className="sp-summary-card">
                <span className="label">제출</span>
                <span className="value">{report.sections.studyPlan.submittedCells}</span>
              </div>
              <div className="sp-summary-card">
                <span className="label">대기</span>
                <span className="value">{report.sections.studyPlan.pendingCells}</span>
              </div>
              <div className="sp-summary-card">
                <span className="label">반려</span>
                <span className="value">{report.sections.studyPlan.rejectedCells}</span>
              </div>
            </div>
            {Array.isArray(report.sections.studyPlan.planIds) && report.sections.studyPlan.planIds.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <ReportStudyPlanMatrix planIds={report.sections.studyPlan.planIds} />
              </div>
            )}
          </>
        ) : (
          <p className="ur-empty">아직 학습 계획표가 배정되지 않았습니다.</p>
        )}
      </section>

      {/* 6. AI 코멘트 */}
      <section className="report-section" id="sec-ai">
        <ReportAiComments
          comments={report?.aiComments || []}
          levelId={report?.studentLevelId || user?.levelId}
        />
      </section>

      {/* 7. 다음 추천 학습 — AI 추천 (최초 1회 자동 + 하루 1회 수동 갱신) */}
      <RecommendationsSection
        report={report}
        setReport={setReport}
        studentIdParam={studentIdParam}
        canRegenerate={!isParent && !studentIdParam}   /* 학부모/관리자는 직접 갱신 X — 학생만 */
      />


      {/* 8. 글쓰기 현황 */}
      <section className="report-section" id="sec-writing">
        <ReportWritingStats
          stats={report?.writingStats}
          levelId={report?.studentLevelId || user?.levelId}
        />
      </section>

      <div style={{ height: "32px" }} />
    </div>
  );
}

export default AnalysisReportPage;
