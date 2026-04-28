import { useState } from "react";
import { COMPETENCIES, COMPETENCY_SHORT, vectorActiveCount, vectorSum } from "../../../constants/competencies";

/**
 * 10대 역량 벡터 입력기 — 자유 가중치 (사용자 결정 Option B, 2026-04-28).
 *
 * 두 가지 용도:
 *   - 정답 시 누적되는 correctVector (label="정답 벡터")
 *   - 오답 선택 시 학생 약점 wrongVector (label="이 선택지 약점")
 *
 * props:
 *   value: { 역량: 가중치 } 또는 null/undefined
 *   onChange(newValue)
 *   label
 *   compact: 좁은 영역 (선택지 옆 등)에 끼워 넣을 때
 *   color: "correct"(주황) | "wrong"(파랑) | undefined
 *   defaultOpen: 기본 펼침 여부
 */
export default function CompetencyVectorEditor({
  value,
  onChange,
  label = "역량 벡터",
  compact = false,
  color,
  defaultOpen = false,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const v = value || {};
  const active = vectorActiveCount(v);
  const sum = vectorSum(v);

  const setWeight = (c, w) => {
    const nv = { ...v };
    if (w <= 0) delete nv[c];
    else nv[c] = Math.round(w * 100) / 100;
    onChange(nv);
  };
  const clearAll = () => onChange({});

  return (
    <div className={`cv-editor ${compact ? "cv-compact" : ""} ${color === "wrong" ? "cv-color-wrong" : color === "correct" ? "cv-color-correct" : ""}`}>
      <button
        type="button"
        className="cv-toggle"
        onClick={() => setOpen(!open)}
      >
        <span className="cv-toggle-arrow">{open ? "▼" : "▶"}</span>
        <span className="cv-toggle-label">{label}</span>
        <span className="cv-toggle-summary">
          {active === 0 ? "(미설정)" : `${active}개 · 합 ${sum.toFixed(1)}`}
        </span>
      </button>
      {open && (
        <div className="cv-body">
          {COMPETENCIES.map((c) => {
            const w = Number(v[c]) || 0;
            return (
              <div key={c} className="cv-row">
                <label className="cv-label" title={c}>
                  {compact ? COMPETENCY_SHORT[c] : c}
                </label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={w}
                  onChange={(e) => setWeight(c, Number(e.target.value))}
                  className="cv-slider"
                />
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={w}
                  onChange={(e) => setWeight(c, Number(e.target.value))}
                  className="cv-num"
                />
              </div>
            );
          })}
          <div className="cv-actions">
            <button type="button" className="cv-clear" onClick={clearAll}>전체 초기화</button>
          </div>
        </div>
      )}
    </div>
  );
}
