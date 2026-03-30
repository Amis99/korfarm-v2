import { useState } from "react";

const SECTIONS = [
  {
    key: "examOmr",
    label: "시험 OMR",
    dotClass: "ur-dot-exam",
    renderItems: (items) => (
      <table>
        <thead>
          <tr><th>시험명</th><th>정답률</th><th>제출일</th></tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              <td>{it.testTitle || "-"}</td>
              <td style={{ fontWeight: 700 }}>{it.accuracy != null ? `${it.accuracy}%` : "-"}</td>
              <td style={{ fontSize: 12 }}>{fmtDate(it.submittedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    getSummary: (s) => `${s.count}회, 평균 ${s.averageAccuracy?.toFixed(1)}%`,
  },
  {
    key: "farmMode",
    label: "농장 모드",
    dotClass: "ur-dot-farm",
    renderItems: (items) => (
      <table>
        <thead>
          <tr><th>제목</th><th>유형</th><th>정답률</th><th>완료</th></tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              <td>{it.contentTitle || "-"}</td>
              <td style={{ fontSize: 12 }}>{it.contentTypeLabel || "-"}</td>
              <td style={{ fontWeight: 700 }}>{it.accuracy != null ? `${it.accuracy}%` : "-"}</td>
              <td style={{ fontSize: 12 }}>{it.completedAt ? "완료" : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    getSummary: (s) => `${s.count}회, 평균 ${s.averageAccuracy?.toFixed(1)}%`,
  },
  {
    key: "dailyQuiz",
    label: "일일 퀴즈",
    dotClass: "ur-dot-quiz",
    renderItems: (items) => (
      <table>
        <thead>
          <tr><th>#</th><th>정답률</th><th>제출일</th></tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td style={{ fontWeight: 700 }}>{it.score != null ? `${it.score}%` : "-"}</td>
              <td style={{ fontSize: 12 }}>{fmtDate(it.submittedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    getSummary: (s) => `${s.count}회, 평균 ${s.averageScore?.toFixed(1)}%`,
  },
  {
    key: "dailyReading",
    label: "일일 독해",
    dotClass: "ur-dot-reading",
    renderItems: (items) => (
      <table>
        <thead>
          <tr><th>#</th><th>정답률</th><th>제출일</th></tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td style={{ fontWeight: 700 }}>{it.score != null ? `${it.score}%` : "-"}</td>
              <td style={{ fontSize: 12 }}>{fmtDate(it.submittedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    getSummary: (s) => `${s.count}회, 평균 ${s.averageScore?.toFixed(1)}%`,
  },
  {
    key: "proMode",
    label: "프로 모드",
    dotClass: "ur-dot-pro",
    renderItems: (items, sectionData) => (
      <>
        <table>
          <thead>
            <tr><th>챕터</th><th>종류</th><th>제목</th><th>상태</th><th>일시</th></tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td style={{ fontSize: 12 }}>{it.chapterId}</td>
                <td style={{ fontSize: 12 }}>{it.learningType || "-"}</td>
                <td>{it.contentTitle || "-"}</td>
                <td>{statusLabel(it.status)}</td>
                <td style={{ fontSize: 12 }}>{fmtDate(it.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sectionData?.competencyBreakdown && Object.keys(sectionData.competencyBreakdown).length > 0 && (
          <div style={{ marginTop: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 10px" }}>역량별 누적 분석</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {Object.entries(sectionData.competencyBreakdown)
                .sort(([,a], [,b]) => a.accuracy - b.accuracy)
                .map(([domain, data]) => (
                  <div key={domain} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ flex: "0 0 140px", fontSize: 12, color: "#374151" }}>{domain}</span>
                    <div style={{ flex: 1, height: 12, background: "#e5e7eb", borderRadius: 6, overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: `${Math.min(100, data.accuracy)}%`,
                        background: data.accuracy < 50 ? "#ef4444" : "#f06c24",
                        borderRadius: 6,
                      }} />
                    </div>
                    <span style={{ flex: "0 0 80px", fontSize: 11, color: "#6b7280", textAlign: "right" }}>
                      {data.correct}/{data.total} ({Math.round(data.accuracy)}%)
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </>
    ),
    getSummary: (s) => `학습 ${s.completedItems}건, 테스트 ${s.testCount}회`,
  },
  {
    key: "studyPlan",
    label: "학습 계획표",
    dotClass: "ur-dot-studyplan",
    renderItems: (items) => (
      <table>
        <thead>
          <tr><th>계획표</th><th>범위</th><th>에셋</th><th>상태</th><th>검토일</th></tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              <td>{it.planTitle || "-"}</td>
              <td>{it.scopeLabel || "-"}</td>
              <td>{it.assetLabel || "-"}</td>
              <td>{statusLabel(it.status)}</td>
              <td style={{ fontSize: 12 }}>{fmtDate(it.reviewedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    getSummary: (s) => `${s.completedCells}/${s.totalCells}건 완료, 완료율 ${s.completionRate?.toFixed(1)}%`,
  },
];

function fmtDate(iso) {
  if (!iso) return "-";
  return iso.replace("T", " ").slice(0, 16);
}

function statusLabel(st) {
  if (st === "passed") return "합격";
  if (st === "failed") return "불합격";
  if (st === "completed") return "완료";
  if (st === "in_progress") return "진행중";
  return st || "-";
}

export default function ReportSectionDetail({ sections }) {
  const [openKeys, setOpenKeys] = useState({});

  const toggle = (key) => setOpenKeys((prev) => ({ ...prev, [key]: !prev[key] }));

  if (!sections) return null;

  return (
    <div>
      {SECTIONS.map((sec) => {
        const data = sections[sec.key];
        if (!data) return null;
        const items = data.items || [];
        const isOpen = !!openKeys[sec.key];
        return (
          <div key={sec.key} className="ur-section">
            <div className="ur-section-header" onClick={() => toggle(sec.key)}>
              <div className="ur-section-title">
                <span className={`ur-dot ${sec.dotClass}`} />
                {sec.label}
                <span className="ur-section-stats">({sec.getSummary(data)})</span>
              </div>
              <span className={`material-symbols-outlined ur-section-arrow ${isOpen ? "open" : ""}`}>
                expand_more
              </span>
            </div>
            {isOpen && (
              <div className="ur-section-body">
                {items.length === 0 ? (
                  <p style={{ color: "#888", fontSize: 13 }}>데이터가 없습니다.</p>
                ) : (
                  <div style={{ overflowX: "auto" }}>{sec.renderItems(items, data)}</div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
