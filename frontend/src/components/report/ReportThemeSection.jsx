import { useState, useMemo } from "react";

/**
 * 주제별 성취 분석 (V0100 분류 마스터 — theme 단위)
 * - V2: weightedScore 우선
 * - 영역별로 그룹핑해서 펼침/접기
 * - 활동 3건 이상만 표시 (소표본 제외)
 * - showAlgorithmHint: admin 전용 — 알고리즘 디버그 문구 노출
 */
export default function ReportThemeSection({ themeStats, showAlgorithmHint = false }) {
  const items = (themeStats || []).filter((t) => (t.activityCount ?? 0) >= 1);
  const grouped = useMemo(() => {
    const m = new Map();
    items.forEach((t) => {
      const key = t.areaLabel || "기타";
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(t);
    });
    return m;
  }, [items]);

  const [openAreas, setOpenAreas] = useState(() => {
    const s = new Set();
    grouped.forEach((_, k) => s.add(k));
    return s;
  });

  if (items.length === 0) {
    return (
      <div className="ur-theme-section">
        <h3>주제별 성취 분석</h3>
        <p className="ur-empty">
          아직 주제별 데이터가 충분하지 않습니다. 학습이 누적되면 자동으로 표시됩니다.
        </p>
      </div>
    );
  }

  const toggle = (k) => {
    const next = new Set(openAreas);
    if (next.has(k)) next.delete(k); else next.add(k);
    setOpenAreas(next);
  };

  return (
    <div className="ur-theme-section">
      <h3>주제별 성취 분석</h3>
      {showAlgorithmHint && (
        <p className="ur-algo-hint">
          영역·세부영역과 동일한 가중 평가 — 약점 주제부터 보강 추천
        </p>
      )}

      {[...grouped.entries()].map(([area, themes]) => {
        const sorted = [...themes].sort(
          (a, b) => (b.weightedScore ?? 0) - (a.weightedScore ?? 0)
        );
        const isOpen = openAreas.has(area);
        return (
          <div key={area} className="ur-theme-area-group">
            <button
              type="button"
              className="ur-theme-area-head"
              onClick={() => toggle(area)}
            >
              <span style={{ fontWeight: 700 }}>{area}</span>
              <span style={{ marginLeft: 8, fontSize: 12, color: "#666" }}>
                {sorted.length}개 주제 / 총 {sorted.reduce((s, t) => s + t.activityCount, 0)}회
              </span>
              <span style={{ marginLeft: "auto" }}>{isOpen ? "▾" : "▸"}</span>
            </button>
            {isOpen && (
              <table className="ur-theme-table">
                <thead>
                  <tr>
                    <th>주제</th>
                    <th>세부영역</th>
                    <th>활동</th>
                    <th>가중 점수</th>
                    <th>단순 평균</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((t) => (
                    <tr key={t.themeKey}>
                      <td style={{ fontWeight: 600 }}>{t.themeLabel}</td>
                      <td style={{ fontSize: 12, color: "#666" }}>
                        {t.subAreaLabel || "-"}
                      </td>
                      <td>{t.activityCount}회</td>
                      <td style={{ fontWeight: 700 }}>
                        {(t.weightedScore ?? 0).toFixed(1)}점
                      </td>
                      <td style={{ color: "#888" }}>
                        {(t.rawAverage ?? 0).toFixed(1)}점
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
}
