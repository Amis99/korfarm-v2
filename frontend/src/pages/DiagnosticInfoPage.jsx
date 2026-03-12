import { useEffect } from "react";
import { Link } from "react-router-dom";
import { COMPETENCIES, TIER_INFO } from "../data/landingData";
import "../styles/features.css";

const LEVELS = [
  { tier: "소쉬르", levels: ["1", "2", "3"], target: "초등 1~3학년", color: "#4caf50" },
  { tier: "프레게", levels: ["1", "2", "3"], target: "초등 4~6학년", color: "#2196f3" },
  { tier: "러셀", levels: ["1", "2", "3"], target: "중등 1~3학년", color: "#9c27b0" },
  { tier: "비트겐슈타인", levels: ["1", "2", "3"], target: "고등 1~3학년", color: "#f44336" },
];

function RadarChart() {
  const labels = ["어휘", "독해", "논리", "문법", "배경지식"];
  const scores = [82, 90, 65, 78, 70];
  const cx = 120, cy = 110, r = 80;
  const angles = labels.map((_, i) => (Math.PI * 2 * i) / labels.length - Math.PI / 2);
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  return (
    <svg viewBox="0 0 240 230" style={{ width: "100%", maxWidth: 300, display: "block", margin: "0 auto" }}>
      {gridLevels.map((lv) => (
        <polygon key={lv} points={angles.map((a) => `${cx + r * lv * Math.cos(a)},${cy + r * lv * Math.sin(a)}`).join(" ")} fill="none" stroke="rgba(163,182,169,0.25)" strokeWidth="1" />
      ))}
      {angles.map((a, i) => (
        <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke="rgba(163,182,169,0.25)" strokeWidth="1" />
      ))}
      <polygon
        points={angles.map((a, i) => `${cx + r * (scores[i] / 100) * Math.cos(a)},${cy + r * (scores[i] / 100) * Math.sin(a)}`).join(" ")}
        fill="rgba(255,143,43,0.15)" stroke="rgba(255,143,43,0.7)" strokeWidth="2"
      />
      {angles.map((a, i) => {
        const px = cx + r * (scores[i] / 100) * Math.cos(a);
        const py = cy + r * (scores[i] / 100) * Math.sin(a);
        return <circle key={`p${i}`} cx={px} cy={py} r="4" fill="rgba(255,143,43,1)" />;
      })}
      {angles.map((a, i) => (
        <text key={`l${i}`} x={cx + (r + 18) * Math.cos(a)} y={cy + (r + 18) * Math.sin(a)} textAnchor="middle" dominantBaseline="middle" fontSize="12" fill="#333" fontWeight="bold">{labels[i]}</text>
      ))}
    </svg>
  );
}

function DiagnosticInfoPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="features-page">
      {/* 히어로 */}
      <div className="features-hero">
        <div className="features-wrap">
          <Link to="/" className="features-home-link">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
            홈으로
          </Link>
          <h1>12레벨 진단 시스템</h1>
          <p>10대 핵심 역량을 측정하고, 최적 레벨에 배정합니다.</p>
        </div>
      </div>

      {/* 12레벨 체계 */}
      <section className="features-section">
        <div className="features-wrap">
          <div className="features-section-head">
            <div className="features-section-icon">
              <span className="material-symbols-outlined">school</span>
            </div>
            <div>
              <h2>12레벨 체계</h2>
              <p>4서버 x 3단계 = 12레벨</p>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15, marginTop: 16 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2eadf" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 800 }}>서버</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 800 }}>레벨 1</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 800 }}>레벨 2</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 800 }}>레벨 3</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 800 }}>대상</th>
                </tr>
              </thead>
              <tbody>
                {LEVELS.map((row) => (
                  <tr key={row.tier} style={{ borderBottom: "1px solid #e2eadf" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: row.color }}>{row.tier}</td>
                    {row.levels.map((lv) => (
                      <td key={lv} style={{ padding: "12px 16px", textAlign: "center" }}>
                        <span style={{ display: "inline-block", padding: "4px 14px", borderRadius: 999, background: `${row.color}15`, color: row.color, fontWeight: 700, fontSize: 13 }}>
                          {row.tier} {lv}
                        </span>
                      </td>
                    ))}
                    <td style={{ padding: "12px 16px", color: "#555" }}>{row.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 진단 테스트 */}
      <section className="features-section" style={{ background: "#f2f7f1" }}>
        <div className="features-wrap">
          <div className="features-section-head">
            <div className="features-section-icon">
              <span className="material-symbols-outlined">quiz</span>
            </div>
            <div>
              <h2>진단 테스트</h2>
              <p>CAT 적응형 + Full 모드</p>
            </div>
          </div>
          <p>진단 테스트는 두 가지 모드로 제공됩니다.</p>
          <div className="features-highlight-list">
            {[
              "CAT(적응형) 모드: 15~25문항으로 빠르게 실력을 측정합니다. 응답에 따라 다음 문항 난이도가 자동 조절됩니다.",
              "Full 모드: 전체 문항을 풀어 정밀하게 10대 역량을 측정합니다.",
              "10대 핵심 역량별 점수를 산출하고, TCI(종합 역량 지수)를 계산합니다.",
              "결과에 따라 12레벨 중 최적 레벨에 자동 배정됩니다.",
            ].map((h) => (
              <div key={h} className="features-highlight-item">
                <span className="material-symbols-outlined">check_circle</span>
                <span>{h}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 진단 결과표 예시 */}
      <section className="features-section">
        <div className="features-wrap">
          <div className="features-section-head">
            <div className="features-section-icon">
              <span className="material-symbols-outlined">analytics</span>
            </div>
            <div>
              <h2>진단 결과표 예시</h2>
              <p>레이더 차트 + 역량별 점수</p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "center", marginTop: 24 }}>
            <div>
              <RadarChart />
            </div>
            <div>
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  { name: "어휘력", score: 82 },
                  { name: "독해력", score: 90 },
                  { name: "논리사고력", score: 65 },
                  { name: "문법능력", score: 78 },
                  { name: "배경지식", score: 70 },
                ].map((item) => (
                  <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "#fff", borderRadius: 12, border: "1px solid #e2eadf" }}>
                    <span style={{ fontWeight: 700, width: 80 }}>{item.name}</span>
                    <div style={{ flex: 1, height: 8, background: "#e2eadf", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${item.score}%`, background: "linear-gradient(90deg, #ff8f2b, #e0700f)", borderRadius: 4 }} />
                    </div>
                    <span style={{ fontWeight: 800, fontSize: 14, color: "#e0700f", width: 40, textAlign: "right" }}>{item.score}점</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, padding: "16px 20px", background: "rgba(255,143,43,0.08)", borderRadius: 16, textAlign: "center" }}>
                <span style={{ fontSize: 14, color: "#666" }}>추천 레벨</span>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#e0700f", marginTop: 4 }}>프레게 2</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10대 역량 */}
      <section className="features-section" style={{ background: "#f2f7f1" }}>
        <div className="features-wrap">
          <div className="features-section-head">
            <div className="features-section-icon">
              <span className="material-symbols-outlined">target</span>
            </div>
            <div>
              <h2>측정하는 10대 역량</h2>
              <p>진단 테스트로 측정하는 핵심 역량</p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
            {COMPETENCIES.map((c) => (
              <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "#fff", borderRadius: 14, border: "1px solid #e2eadf" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22, color: "#ff8f2b" }}>{c.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "#777", marginTop: 2 }}>{c.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 하단 CTA */}
      <div className="features-cta">
        <div className="features-wrap">
          <h2>진단 테스트를 시작하세요</h2>
          <p>나의 국어 실력을 정확히 파악하고 맞춤 학습을 시작하세요.</p>
          <div className="features-cta-actions">
            <Link to="/login" className="features-cta-primary">진단 시작하기</Link>
            <Link to="/about" className="features-cta-secondary">프로그램 소개 보기</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DiagnosticInfoPage;
