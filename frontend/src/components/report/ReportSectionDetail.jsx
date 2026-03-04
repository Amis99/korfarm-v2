import { useState } from "react";

const SECTIONS = [
  {
    key: "examOmr",
    label: "시험 OMR",
    dotClass: "ur-dot-exam",
    renderItems: (items) => (
      <table>
        <thead>
          <tr><th>시험명</th><th>점수</th><th>만점</th><th>정답률</th><th>제출일</th></tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              <td>{it.testTitle || "-"}</td>
              <td style={{ fontWeight: 700 }}>{it.score}</td>
              <td>{it.totalPoints}</td>
              <td>{it.accuracy != null ? `${it.accuracy}%` : "-"}</td>
              <td style={{ fontSize: 12 }}>{fmtDate(it.submittedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    getSummary: (s) => `${s.count}회, 평균 ${s.averageScore?.toFixed(1)}점`,
  },
  {
    key: "farmMode",
    label: "농장 모드",
    dotClass: "ur-dot-farm",
    renderItems: (items) => (
      <table>
        <thead>
          <tr><th>콘텐츠 유형</th><th>점수</th><th>정답률</th><th>씨앗</th><th>완료일</th></tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              <td>{it.contentType || "-"}</td>
              <td style={{ fontWeight: 700 }}>{it.score ?? "-"}</td>
              <td>{it.accuracy != null ? `${it.accuracy}%` : "-"}</td>
              <td>{it.earnedSeed > 0 ? `+${it.earnedSeed}` : "-"}</td>
              <td style={{ fontSize: 12 }}>{fmtDate(it.completedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    getSummary: (s) => `${s.count}회, 평균 ${s.averageAccuracy?.toFixed(1)}점`,
  },
  {
    key: "dailyQuiz",
    label: "일일 퀴즈",
    dotClass: "ur-dot-quiz",
    renderItems: (items) => (
      <table>
        <thead>
          <tr><th>#</th><th>점수</th><th>제출일</th></tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td style={{ fontWeight: 700 }}>{it.score ?? "-"}</td>
              <td style={{ fontSize: 12 }}>{fmtDate(it.submittedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    getSummary: (s) => `${s.count}회, 평균 ${s.averageScore?.toFixed(1)}점`,
  },
  {
    key: "dailyReading",
    label: "일일 독해",
    dotClass: "ur-dot-reading",
    renderItems: (items) => (
      <table>
        <thead>
          <tr><th>#</th><th>점수</th><th>제출일</th></tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td style={{ fontWeight: 700 }}>{it.score ?? "-"}</td>
              <td style={{ fontSize: 12 }}>{fmtDate(it.submittedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    getSummary: (s) => `${s.count}회, 평균 ${s.averageScore?.toFixed(1)}점`,
  },
  {
    key: "proMode",
    label: "프로 모드",
    dotClass: "ur-dot-pro",
    renderItems: (items) => (
      <table>
        <thead>
          <tr><th>챕터</th><th>점수</th><th>상태</th><th>일시</th></tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              <td style={{ fontSize: 12 }}>{it.chapterId}</td>
              <td style={{ fontWeight: 700 }}>{it.score ?? "-"}</td>
              <td>{statusLabel(it.status)}</td>
              <td style={{ fontSize: 12 }}>{fmtDate(it.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    getSummary: (s) => `학습 ${s.completedItems}건, 테스트 ${s.testCount}회, 평균 ${s.averageTestScore?.toFixed(1)}점`,
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
                  <p style={{ color: "#a6b6a9", fontSize: 13 }}>데이터가 없습니다.</p>
                ) : (
                  <div style={{ overflowX: "auto" }}>{sec.renderItems(items)}</div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
