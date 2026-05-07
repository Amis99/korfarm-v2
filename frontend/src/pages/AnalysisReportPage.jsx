import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../utils/api";
import "../styles/student-home.css";
import "../styles/analysis-report.css";

const COMPETENCY_LIST = [
  "어휘력", "추론력", "비판적 사고", "사실적 이해", "통합 사고",
  "감상력", "문법 정확성", "글쓰기 표현", "매체 이해", "메타인지",
];

const FALLBACK_AREAS = [
  { area: "비문학", pct: 38 },
  { area: "문학", pct: 22 },
  { area: "문법·어휘", pct: 18 },
  { area: "화법·작문", pct: 12 },
  { area: "매체", pct: 10 },
];

function levelClass(v) {
  if (v == null) return "";
  if (v >= 4) return "lvl-4";
  if (v >= 3) return "lvl-3";
  if (v >= 2) return "lvl-2";
  if (v >= 1) return "lvl-1";
  return "";
}

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
      {/* 축 */}
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
      {/* 데이터 */}
      <polygon
        points={polygonPts}
        fill="rgba(240, 108, 36, 0.25)"
        stroke="#F06C24"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* 라벨 */}
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
  const [period, setPeriod] = useState("30d");
  const [studentName, setStudentName] = useState("학생");
  const [competency, setCompetency] = useState(null);
  const [seasonScore, setSeasonScore] = useState(0);
  const [rankPos, setRankPos] = useState(null);
  const [planMatrix, setPlanMatrix] = useState(null);

  useEffect(() => {
    apiGet("/v1/auth/me")
      .then((d) => setStudentName(d?.name || d?.username || "학생"))
      .catch(() => {});

    apiGet("/v1/learning/competency/summary")
      .then((d) => setCompetency(d || {}))
      .catch((e) => {
        console.error("competency fetch failed", e);
        setCompetency({});
      });

    apiGet("/v1/seasons/current")
      .then((season) => {
        const sid = season?.id || season?.seasonId;
        if (!sid) return;
        apiGet(`/v1/seasons/${sid}/harvest-rankings`).then((r) => {
          const items = r?.items || r || [];
          if (Array.isArray(items)) {
            // 본인 위치 추정 — 응답에 본인 표시가 있으면 활용
            const me = items.find((it) => it.me || it.isMe);
            if (me) {
              setSeasonScore(me.value ?? me.totalCrops ?? me.score ?? 0);
              setRankPos(me.rank ?? null);
            }
          }
        });
      })
      .catch(() => {});
  }, []);

  // 10대 역량 값 매핑 (없으면 0)
  const radarValues = useMemo(() => {
    if (!competency) return COMPETENCY_LIST.map(() => 0);
    return COMPETENCY_LIST.map((label) => {
      const c = competency[label];
      if (!c) return 0;
      return c.ratioScore ?? c.ratio_score ?? 0;
    });
  }, [competency]);

  // 강점·약점 추출
  const { strongs, weaks } = useMemo(() => {
    if (!competency) return { strongs: [], weaks: [] };
    const arr = COMPETENCY_LIST.map((label) => ({
      label,
      score: competency[label]?.ratioScore ?? competency[label]?.ratio_score ?? 0,
      sample: competency[label]?.sampleCount ?? competency[label]?.sample_count ?? 0,
    })).filter((c) => c.sample > 0);
    arr.sort((a, b) => b.score - a.score);
    return {
      strongs: arr.slice(0, 3).map((c) => c.label),
      weaks: arr.slice(-3).reverse().map((c) => c.label),
    };
  }, [competency]);

  const periods = [
    { id: "7d", label: "최근 7일" },
    { id: "30d", label: "30일" },
    { id: "90d", label: "90일" },
    { id: "all", label: "전체" },
  ];

  // 30일 timeline heatmap (정적 fallback — 실제 데이터 API 미구현)
  const heatmapDays = useMemo(() => {
    const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
    return Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      level: Math.floor(Math.random() * 5),  // placeholder — 실제로는 API 응답
    }));
  }, [period]);

  return (
    <div className="student-home report-shell">
      <header className="top-bar" style={{ padding: "calc(env(safe-area-inset-top) + 14px) 18px 14px" }}>
        <button className="hamburger" aria-label="홈으로" onClick={() => navigate("/start-new")}>
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

      <section className="report-section">
        <h2>📈 학습 요약</h2>
        <div className="summary-grid">
          <div className="summary-card">
            <span className="label">학습 시간</span>
            <span className="value">— 시간</span>
            <span className="delta">집계 중</span>
          </div>
          <div className="summary-card tint-blue">
            <span className="label">푼 문제</span>
            <span className="value">— 문제</span>
            <span className="delta">집계 중</span>
          </div>
          <div className="summary-card tint-green">
            <span className="label">글쓰기</span>
            <span className="value">— 편</span>
            <span className="delta">집계 중</span>
          </div>
          <div className="summary-card tint-orange">
            <span className="label">시즌 점수</span>
            <span className="value">{seasonScore.toLocaleString()}</span>
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
        <p style={{ margin: "-8px 0 12px", fontSize: 11.5, color: "var(--subtle)" }}>
          ※ 영역별 통계 API 미구현 — 임시 분포 표시 (출시 전 실연동 예정)
        </p>
        <div className="bar-list">
          {FALLBACK_AREAS.map((a) => (
            <div key={a.area} className="bar-row">
              <span className="label">{a.area}</span>
              <div className="bar-bg">
                <div className="bar-fill" style={{ width: `${a.pct}%` }}></div>
              </div>
              <span className="pct">{a.pct}%</span>
            </div>
          ))}
        </div>
      </section>

      <section className="report-section">
        <h2>📅 학습 흔적</h2>
        <p style={{ margin: "-8px 0 12px", fontSize: 11.5, color: "var(--subtle)" }}>
          ※ 일별 학습 timeline API 미구현 — 정적 표시 (출시 전 실연동 예정)
        </p>
        <div className="heatmap">
          {heatmapDays.map((d) => (
            <div key={d.day} className={`heatmap-cell ${levelClass(d.level)}`}></div>
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

      <section className="report-section">
        <h2>🤖 AI 코멘트</h2>
        <div className="ai-comment-box">
          <div className="head">
            <span className="clay clay-cream" aria-hidden="true">
              <span className="lbl">선생님</span>
            </span>
            <span className="name">선생님 분석</span>
          </div>
          {strongs.length > 0 ? (
            <p>
              <strong>{studentName}</strong> 학생, 최근 학습을 살펴봤어요. <strong>{strongs[0]}</strong>이(가) 특히 좋아졌어요.
              계속 그 흐름을 유지해 주세요.
            </p>
          ) : (
            <p>
              아직 데이터가 충분하지 않아요. 일일 퀴즈와 독해를 며칠 더 진행하면 분석이 더 정확해져요.
            </p>
          )}
          {weaks.length > 0 && (
            <p>
              다만 <strong>{weaks[0]}</strong> 영역이 아직 약해요. 다음 1~2주 동안 그 영역을 집중적으로 보강하면 균형이 잡힐 거예요.
            </p>
          )}
          <p>아래 추천 학습부터 차근차근 풀어 보세요. 화이팅! 🌱</p>
        </div>
      </section>

      <section className="report-section">
        <h2>✨ 다음 추천 학습</h2>
        <p style={{ margin: "-8px 0 12px", fontSize: 11.5, color: "var(--subtle)" }}>
          ※ AI 추천 학습 직접 endpoint 미구현 — AI 튜터 채팅에서 추천받을 수 있어요.
        </p>
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
      </section>

      <div style={{ height: "32px" }} />
    </div>
  );
}

export default AnalysisReportPage;
