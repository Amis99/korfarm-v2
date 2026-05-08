import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiGet } from "../utils/api";
import { apiGet as adminApiGet } from "../utils/adminApi";
import ReportLearningDiagnosticPanel from "../components/report/ReportLearningDiagnosticPanel";
import ReportCompetencyTrendChart from "../components/report/ReportCompetencyTrendChart";
import ReportCompetencySection from "../components/report/ReportCompetencySection";
import ReportSectionDetail from "../components/report/ReportSectionDetail";
import "../styles/student-home.css";
import "../styles/analysis-report.css";

/**
 * 학생 / 학부모 / 관리자 공용 분석 리포트 페이지.
 * 백엔드 /v1/report/unified 응답을 그대로 매핑.
 * - studentIdParam 있으면 학부모/관리자 권한으로 자녀·학생 리포트
 * - period 변경 시 startDate / endDate 재계산해 재요청
 */

const COMPETENCY_LIST = [
  "어휘력", "추론력", "비판적 사고", "사실적 이해", "통합 사고",
  "감상력", "문법 정확성", "글쓰기 표현", "매체 이해", "메타인지",
];

function levelClass(v) {
  if (v == null) return "";
  if (v >= 4) return "lvl-4";
  if (v >= 3) return "lvl-3";
  if (v >= 2) return "lvl-2";
  if (v >= 1) return "lvl-1";
  return "";
}

// 활동 횟수 → heatmap 단계 (0~4)
function countToLevel(c) {
  if (!c || c === 0) return 0;
  if (c <= 2) return 1;
  if (c <= 5) return 2;
  if (c <= 9) return 3;
  return 4;
}

// 기간 → 날짜 범위
function buildDateRange(period) {
  const now = new Date();
  const end = now.toISOString().slice(0, 10);
  const start = new Date(now);
  if (period === "7d") start.setDate(now.getDate() - 6);
  else if (period === "30d") start.setDate(now.getDate() - 29);
  else if (period === "90d") start.setDate(now.getDate() - 89);
  else start.setFullYear(now.getFullYear() - 2); // "all" — 2년치
  return { start: start.toISOString().slice(0, 10), end };
}

// 영역별 매핑용 컬러
const AREA_COLOR = {
  "비문학": "#F06C24",
  "문학":  "#5B9BD5",
  "문법·어휘": "#A5C77E",
  "문법": "#A5C77E",
  "어휘": "#A5C77E",
  "화법·작문": "#F4C97A",
  "매체": "#C589CB",
  "기타": "#B7AFA1",
};

// SVG radar chart (10 axes)
function RadarChart({ values }) {
  const cx = 180, cy = 180, R = 130;
  const N = 10;
  const points = values.map((v, i) => {
    const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
    const r = (R * Math.max(0, Math.min(100, v))) / 100;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  });
  const polygonPts = points.map((p) => p.join(",")).join(" ");

  // 그리드 (5단계)
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
  return (
    <svg viewBox="0 0 360 360" className="radar-svg" aria-label="10대 역량 분포 레이더">
      {gridLevels.map((g) => (
        <polygon
          key={g}
          points={Array.from({ length: N }, (_, i) => {
            const a = (Math.PI * 2 * i) / N - Math.PI / 2;
            const r = R * g;
            return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
          }).join(" ")}
          fill="none"
          stroke="rgba(216, 203, 177, 0.5)"
          strokeWidth="1"
        />
      ))}
      {Array.from({ length: N }, (_, i) => {
        const a = (Math.PI * 2 * i) / N - Math.PI / 2;
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + R * Math.cos(a)}
            y2={cy + R * Math.sin(a)}
            stroke="rgba(216, 203, 177, 0.4)"
            strokeWidth="1"
          />
        );
      })}
      <polygon
        points={polygonPts}
        fill="rgba(240, 108, 36, 0.25)"
        stroke="#F06C24"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {COMPETENCY_LIST.map((label, i) => {
        const a = (Math.PI * 2 * i) / N - Math.PI / 2;
        const r = R + 22;
        const x = cx + r * Math.cos(a);
        const y = cy + r * Math.sin(a);
        return (
          <text
            key={label}
            x={x}
            y={y}
            fontSize="10.5"
            fill="#6B6359"
            textAnchor="middle"
            dominantBaseline="middle"
            fontWeight="600"
          >
            {label}
          </text>
        );
      })}
    </svg>
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
  const [error, setError] = useState("");

  // 시즌 점수·랭킹 (별도 API)
  const [seasonScore, setSeasonScore] = useState(0);
  const [rankPos, setRankPos] = useState(null);

  // 자기 이름 / 자녀 이름은 응답의 studentName 사용. fallback 으로 /v1/auth/me
  const [meName, setMeName] = useState("");

  useEffect(() => {
    if (!studentIdParam) {
      apiGet("/v1/auth/me")
        .then((d) => setMeName(d?.name || d?.username || "학생"))
        .catch(() => {});
    }
  }, [studentIdParam]);

  useEffect(() => {
    setLoading(true);
    setError("");
    const { start, end } = buildDateRange(period);
    const qs = `startDate=${start}&endDate=${end}`;
    let req;
    if (isParent && studentIdParam) {
      req = apiGet(`/v1/parents/children/${studentIdParam}/report/unified?${qs}`);
    } else if (isAdmin && studentIdParam) {
      req = adminApiGet(`/v1/admin/students/${studentIdParam}/report/unified?${qs}`);
    } else {
      req = apiGet(`/v1/report/unified?${qs}`);
    }
    req
      .then((d) => setReport(d || null))
      .catch((e) => {
        console.error("[analysis-report] fetch failed", e);
        setError(e?.message || "데이터를 불러올 수 없습니다.");
        setReport(null);
      })
      .finally(() => setLoading(false));
  }, [period, isParent, isAdmin, studentIdParam]);

  // 시즌 점수
  useEffect(() => {
    apiGet("/v1/seasons/current")
      .then((season) => {
        const sid = season?.id || season?.seasonId;
        if (!sid) return;
        apiGet(`/v1/seasons/${sid}/harvest-rankings`).then((r) => {
          const items = r?.items || (Array.isArray(r) ? r : []);
          if (Array.isArray(items)) {
            const targetUserId = studentIdParam || user?.id;
            const me = items.find((it) => it.me || it.isMe || it.userId === targetUserId);
            if (me) {
              setSeasonScore(me.value ?? me.totalCrops ?? me.score ?? 0);
              setRankPos(me.rank ?? null);
            }
          }
        });
      })
      .catch(() => {});
  }, [studentIdParam, user]);

  // ─── 파생 데이터 ────────────────────────────────────────────────

  const studentName = report?.studentName || meName || "학생";

  // 10대 역량 radar
  const radarValues = useMemo(() => {
    const radar = report?.competencyRadarData;
    if (!radar?.labels || !radar?.scores) return COMPETENCY_LIST.map(() => 0);
    // labels 순서가 COMPETENCY_LIST 와 다를 수 있으니 매핑
    return COMPETENCY_LIST.map((label) => {
      const i = radar.labels.indexOf(label);
      return i >= 0 ? Math.max(0, Math.min(100, radar.scores[i] ?? 0)) : 0;
    });
  }, [report]);

  // 강점·약점
  const { strongs, weaks } = useMemo(() => {
    const arr = COMPETENCY_LIST.map((label, i) => ({
      label,
      score: radarValues[i],
    })).filter((c) => c.score > 0);
    arr.sort((a, b) => b.score - a.score);
    return {
      strongs: arr.slice(0, 3).map((c) => c.label),
      weaks: arr.slice(-3).reverse().map((c) => c.label),
    };
  }, [radarValues]);

  // 학습 요약 카드 — sections 합산
  const summary = useMemo(() => {
    const s = report?.sections || {};
    const sum = (key) => s[key]?.count ?? 0;
    const totalActivities = sum("examOmr") + sum("farmMode") + sum("dailyQuiz") +
                            sum("dailyReading") + (s.proMode?.completedItems ?? 0) +
                            (s.proMode?.testCount ?? 0);

    // 평균 정답률 — calendar 의 averageAccuracy 평균
    const cal = report?.calendar || [];
    let accSum = 0, accCnt = 0;
    cal.forEach((c) => {
      if (c.averageAccuracy != null) {
        accSum += c.averageAccuracy;
        accCnt += 1;
      }
    });
    const avgAccuracy = accCnt > 0 ? Math.round(accSum / accCnt) : null;

    // 활동 일수
    const activeDays = cal.filter((c) => (c.totalCount || 0) > 0).length;

    return { totalActivities, avgAccuracy, activeDays };
  }, [report]);

  // 영역별 학습량 (areaStats → bar)
  const areaList = useMemo(() => {
    const stats = report?.areaStats || [];
    const total = stats.reduce((s, a) => s + (a.activityCount || 0), 0) || 1;
    return stats.map((a) => ({
      area: a.areaLabel || a.areaKey,
      activityCount: a.activityCount || 0,
      pct: Math.round(((a.activityCount || 0) / total) * 100),
      avgScore: a.averageScore,
      color: AREA_COLOR[a.areaLabel] || "#A5C77E",
    }));
  }, [report]);

  // 학습 흔적 heatmap — calendar 응답 사용 (날짜 → totalCount)
  const heatmapDays = useMemo(() => {
    const cal = report?.calendar || [];
    const calMap = {};
    cal.forEach((e) => { calMap[e.date] = e; });

    const { start, end } = buildDateRange(period);
    const days = [];
    const startD = new Date(start);
    const endD = new Date(end);
    for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
      const ds = d.toISOString().slice(0, 10);
      const entry = calMap[ds];
      const count = entry?.totalCount || 0;
      days.push({
        date: ds,
        count,
        accuracy: entry?.averageAccuracy ?? null,
        level: countToLevel(count),
      });
    }
    return days;
  }, [report, period]);

  // 추천 학습 — recommendations
  const recommendations = useMemo(() => {
    const recs = report?.recommendations || [];
    return recs.slice(0, 6);
  }, [report]);

  const periods = [
    { id: "7d", label: "최근 7일" },
    { id: "30d", label: "30일" },
    { id: "90d", label: "90일" },
    { id: "all", label: "전체" },
  ];

  // sections 활동별 상세 — 제목/회수
  const sectionsList = useMemo(() => {
    const s = report?.sections || {};
    const out = [];
    if (s.examOmr?.count) out.push({ key: "examOmr", label: "테스트", count: s.examOmr.count, color: "#5B9BD5" });
    if (s.farmMode?.count) out.push({ key: "farmMode", label: "농장 모드", count: s.farmMode.count, accuracy: s.farmMode.averageAccuracy, color: "#A5C77E" });
    if (s.dailyQuiz?.count) out.push({ key: "dailyQuiz", label: "일일 퀴즈", count: s.dailyQuiz.count, color: "#F4C97A" });
    if (s.dailyReading?.count) out.push({ key: "dailyReading", label: "일일 독해", count: s.dailyReading.count, color: "#F06C24" });
    if ((s.proMode?.completedItems ?? 0) + (s.proMode?.testCount ?? 0) > 0) {
      out.push({
        key: "proMode",
        label: "프로 모드",
        count: (s.proMode?.completedItems ?? 0) + (s.proMode?.testCount ?? 0),
        sub: `학습 ${s.proMode?.completedItems ?? 0} · 테스트 ${s.proMode?.testCount ?? 0}`,
        color: "#C589CB",
      });
    }
    if (s.studyPlan?.totalCells) {
      out.push({
        key: "studyPlan",
        label: "학습 계획표",
        count: s.studyPlan.completedCells ?? 0,
        sub: `${s.studyPlan.completedCells ?? 0}/${s.studyPlan.totalCells} 완료`,
        color: "#B7AFA1",
      });
    }
    return out;
  }, [report]);

  return (
    <div className="student-home report-shell">
      <header className="top-bar" style={{ padding: "calc(env(safe-area-inset-top) + 14px) 18px 14px" }}>
        <button className="hamburger" aria-label="홈으로" onClick={() => navigate(-1)}>
          <span></span>
        </button>
        <a className="brand" href="/start" aria-label="국어농장 홈" onClick={(e) => { e.preventDefault(); navigate("/start"); }}>
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
          <div className="period-tabs" role="tablist">
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
        </div>
        <p>학습 데이터를 한눈에 보여드려요. 약점은 무엇이고 어떻게 보강하면 좋을지 AI 가 분석했어요.</p>
      </div>

      {loading && (
        <div style={{ margin: "0 16px 16px", padding: 16, background: "var(--surface)", borderRadius: 16, textAlign: "center", color: "var(--muted)" }}>
          분석 데이터를 불러오는 중...
        </div>
      )}
      {error && !loading && (
        <div style={{ margin: "0 16px 16px", padding: 16, background: "rgba(216, 88, 14, 0.1)", border: "1px solid rgba(216, 88, 14, 0.3)", borderRadius: 16, textAlign: "center", color: "var(--accent-deep)", fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      <section className="report-section">
        <h2>📈 학습 요약</h2>
        <div className="summary-grid">
          <div className="summary-card">
            <span className="label">총 학습 활동</span>
            <span className="value">{summary.totalActivities.toLocaleString()}</span>
            <span className="delta">건</span>
          </div>
          <div className="summary-card tint-blue">
            <span className="label">평균 정답률</span>
            <span className="value">{summary.avgAccuracy != null ? `${summary.avgAccuracy}%` : "—"}</span>
            <span className="delta">{summary.avgAccuracy != null ? "기간 평균" : "데이터 부족"}</span>
          </div>
          <div className="summary-card tint-green">
            <span className="label">활동 일수</span>
            <span className="value">{summary.activeDays}</span>
            <span className="delta">일</span>
          </div>
          <div className="summary-card tint-orange">
            <span className="label">시즌 점수</span>
            <span className="value">{Number(seasonScore).toLocaleString()}</span>
            <span className="delta">{rankPos ? `${rankPos}위` : "—"}</span>
          </div>
        </div>
      </section>

      <section className="report-section">
        <h2>🎯 10대 역량 분포</h2>
        <div className="radar-wrap">
          <RadarChart values={radarValues} />
        </div>
        <div className="radar-tags">
          <div className="group">
            <span className="group-title">💪 강점</span>
            <div className="tag-row">
              {strongs.length === 0 && <span className="tag strong">데이터 부족</span>}
              {strongs.map((s) => <span key={s} className="tag strong">{s}</span>)}
            </div>
          </div>
          <div className="group">
            <span className="group-title">📌 약점</span>
            <div className="tag-row">
              {weaks.length === 0 && <span className="tag weak">데이터 부족</span>}
              {weaks.map((w) => <span key={w} className="tag weak">{w}</span>)}
            </div>
          </div>
        </div>
      </section>

      <section className="report-section">
        <h2>📚 영역별 학습량</h2>
        {areaList.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
            아직 영역별 데이터가 없어요. 학습을 시작하면 여기에 채워져요.
          </p>
        ) : (
          <div className="bar-list">
            {areaList.map((a) => (
              <div key={a.area} className="bar-row">
                <span className="label">{a.area}</span>
                <div className="bar-bg">
                  <div className="bar-fill" style={{ width: `${a.pct}%`, background: a.color }}></div>
                </div>
                <span className="pct">
                  {a.activityCount}회
                  {a.avgScore != null && ` · ${a.avgScore.toFixed(0)}%`}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="report-section">
        <h2>📅 학습 흔적</h2>
        <p style={{ margin: "-8px 0 12px", fontSize: 11.5, color: "var(--subtle)" }}>
          {summary.activeDays > 0
            ? `최근 ${heatmapDays.length}일 동안 ${summary.activeDays}일 학습했어요.`
            : `이 기간엔 학습 기록이 없어요. 일일 퀴즈/독해부터 시작해 보세요.`}
        </p>
        <div className="heatmap">
          {heatmapDays.map((d) => (
            <div
              key={d.date}
              className={`heatmap-cell ${levelClass(d.level)}`}
              title={`${d.date} — ${d.count}건${d.accuracy != null ? ` · 정답률 ${Math.round(d.accuracy)}%` : ""}`}
            ></div>
          ))}
        </div>
        <div className="heatmap-legend">
          <span>적음</span>
          <span className="dot" style={{ background: "rgba(216, 203, 177, 0.3)" }}></span>
          <span className="dot lvl-1" style={{ background: "rgba(244, 201, 122, 0.4)" }}></span>
          <span className="dot lvl-2" style={{ background: "rgba(244, 201, 122, 0.65)" }}></span>
          <span className="dot lvl-3" style={{ background: "rgba(240, 108, 36, 0.6)" }}></span>
          <span className="dot lvl-4" style={{ background: "rgba(216, 88, 14, 0.85)" }}></span>
          <span>많음</span>
        </div>
      </section>

      {sectionsList.length > 0 && (
        <section className="report-section">
          <h2>🧩 활동 비중</h2>
          <div className="bar-list">
            {sectionsList.map((s) => (
              <div key={s.key} className="bar-row">
                <span className="label">{s.label}</span>
                <div className="bar-bg" style={{ background: "rgba(216,203,177,0.25)" }}>
                  <div
                    className="bar-fill"
                    style={{
                      width: `${Math.min(100, (s.count / Math.max(1, summary.totalActivities)) * 100)}%`,
                      background: s.color,
                    }}
                  ></div>
                </div>
                <span className="pct">{s.sub || `${s.count}회`}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 학습 누적 vs 진단 측정 비교 */}
      {(report?.learningCompetency || report?.diagnosticCompetency) && (
        <section className="report-section">
          <h2>📐 학습 누적 vs 진단 측정</h2>
          <ReportLearningDiagnosticPanel
            learningCompetency={report.learningCompetency}
            diagnosticCompetency={report.diagnosticCompetency}
          />
        </section>
      )}

      {/* 역량별 일자별 변화 추이 */}
      {Array.isArray(report?.competencyTrend) && report.competencyTrend.length > 0 && (
        <section className="report-section">
          <h2>📈 역량 변화 추이</h2>
          <ReportCompetencyTrendChart trend={report.competencyTrend} />
        </section>
      )}

      {/* 역량 상세 통계 — 정답률·표본수·강약점 */}
      {Array.isArray(report?.competencyStats) && report.competencyStats.length > 0 && (
        <section className="report-section">
          <h2>🎯 역량 상세 통계</h2>
          <ReportCompetencySection competencyStats={report.competencyStats} />
        </section>
      )}

      {/* 활동별 상세 — 시험·농장·일일·프로·학습계획표 */}
      {report?.sections && (
        <section className="report-section">
          <h2>🗂 활동별 상세</h2>
          <ReportSectionDetail sections={report.sections} />
        </section>
      )}

      <section className="report-section">
        <h2>🤖 AI 코멘트</h2>
        <div className="ai-comment-box">
          <div className="head">
            <span className="clay clay-cream" aria-hidden="true">
              <span className="lbl">선생님</span>
            </span>
            <span className="name">선생님 분석</span>
          </div>
          {summary.totalActivities === 0 ? (
            <p>
              아직 학습 데이터가 없어요. 일일 퀴즈와 독해를 며칠 진행하면 분석이 나타나요.
            </p>
          ) : (
            <>
              {strongs.length > 0 && (
                <p>
                  <strong>{studentName}</strong> 학생, 최근 {summary.activeDays}일 동안 {summary.totalActivities}건의 학습을 했어요.{" "}
                  <strong>{strongs[0]}</strong>이(가) 특히 좋아졌어요.
                </p>
              )}
              {weaks.length > 0 && (
                <p>
                  다만 <strong>{weaks[0]}</strong> 영역이 아직 약해요. 다음 1~2주 동안 그 영역을 집중적으로 보강하면 균형이 잡힐 거예요.
                </p>
              )}
              {summary.avgAccuracy != null && (
                <p>
                  기간 평균 정답률은 <strong>{summary.avgAccuracy}%</strong>예요.{" "}
                  {summary.avgAccuracy >= 80
                    ? "아주 잘하고 있어요! 같은 흐름을 유지해요."
                    : summary.avgAccuracy >= 60
                      ? "조금만 더 집중하면 80% 도 충분히 가능해요."
                      : "기초부터 차근차근 풀어 보세요. 어려운 문제는 표시해 두면 도움이 돼요."}
                </p>
              )}
              <p>아래 추천 학습부터 시작해 보세요. 화이팅! 🌱</p>
            </>
          )}
        </div>
      </section>

      <section className="report-section">
        <h2>✨ 다음 추천 학습</h2>
        {recommendations.length > 0 ? (
          <div className="reco-grid">
            {recommendations.map((r, i) => {
              const targetRoute = r.contentId
                ? `/learning/${r.contentId}`
                : r.testId
                  ? `/tests/${r.testId}/omr`
                  : "/my/tutor";
              return (
                <button key={r.contentId || r.testId || i} className="reco-item" onClick={() => navigate(targetRoute)}>
                  <span className="clay clay-yellow" aria-hidden="true">
                    <span className="lbl">{r.contentTypeLabel?.slice(0, 2) || "추천"}</span>
                  </span>
                  <div className="info">
                    <span className="title">{r.contentTitle || r.testTitle || "추천 학습"}</span>
                    <span className="meta">
                      {r.reason || r.areaLabel || r.contentTypeLabel || "약점 보강"}
                    </span>
                  </div>
                  <span className="chev">›</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="reco-grid">
            <button className="reco-item" onClick={() => navigate("/my/tutor")}>
              <span className="clay clay-orange" aria-hidden="true">
                <span className="lbl">AI</span>
              </span>
              <div className="info">
                <span className="title">AI 튜터에게 추천받기</span>
                <span className="meta">약점 분석 + 맞춤 학습 추천</span>
              </div>
              <span className="chev">›</span>
            </button>
            <button className="reco-item" onClick={() => navigate("/daily-quiz")}>
              <span className="clay clay-yellow" aria-hidden="true">
                <span className="lbl">퀴즈</span>
              </span>
              <div className="info">
                <span className="title">일일 퀴즈 풀기</span>
                <span className="meta">10문제 · 약 5분 · 매일 갱신</span>
              </div>
              <span className="chev">›</span>
            </button>
            <button className="reco-item" onClick={() => navigate("/daily-reading")}>
              <span className="clay clay-blue" aria-hidden="true">
                <span className="lbl">독해</span>
              </span>
              <div className="info">
                <span className="title">일일 독해 풀기</span>
                <span className="meta">비문학 1지문 · 약 7분</span>
              </div>
              <span className="chev">›</span>
            </button>
          </div>
        )}
      </section>

      <div style={{ height: "32px" }} />
    </div>
  );
}

export default AnalysisReportPage;
