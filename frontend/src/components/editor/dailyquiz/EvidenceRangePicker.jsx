import { useMemo, useRef, useState } from "react";

/**
 * 지문(paragraphs) 글자 단위 표시 → 드래그로 영역 선택 → onAdd({paragraphId, start, end, label}) 호출.
 * 이미 등록된 ranges 는 노란 형광펜으로 표시. 클릭 시 onRemoveRange(idx) 호출 (옵션).
 *
 * 한 단락 내 영역만 등록 가능 (start/end 같은 paragraphId 안).
 */
export default function EvidenceRangePicker({
  paragraphs = [],
  ranges = [],
  onAdd,
  onRemoveRange,
  highlightColor = "rgba(255, 220, 100, 0.55)",
  emptyHint = "지문에서 정답/근거 영역을 드래그로 선택한 뒤 [등록]을 누르세요.",
}) {
  const containerRef = useRef(null);
  const [pending, setPending] = useState(null); // {paragraphId, start, end, label}

  // 등록된 ranges 를 char index 별 set 으로 변환
  const highlightedByPara = useMemo(() => {
    const m = {};
    for (const r of ranges) {
      if (!m[r.paragraphId]) m[r.paragraphId] = new Set();
      for (let i = r.start; i < r.end; i += 1) m[r.paragraphId].add(i);
    }
    return m;
  }, [ranges]);

  // 영역 내 모든 char index → range idx 매핑 (어느 글자를 클릭해도 그 range 삭제)
  const charToRangeIdx = useMemo(() => {
    const m = {};
    ranges.forEach((r, idx) => {
      for (let i = r.start; i < r.end; i += 1) {
        const k = `${r.paragraphId}:${i}`;
        if (!(k in m)) m[k] = idx;
      }
    });
    return m;
  }, [ranges]);

  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) { setPending(null); return; }
    const range = sel.getRangeAt(0);
    const startEl = range.startContainer.parentElement?.closest("[data-pi]");
    const endEl = range.endContainer.parentElement?.closest("[data-pi]");
    if (!startEl || !endEl) { setPending(null); return; }
    const paragraphId = startEl.dataset.pid;
    if (paragraphId !== endEl.dataset.pid) {
      setPending(null);
      alert("한 단락 안에서만 영역을 선택할 수 있습니다.");
      sel.removeAllRanges();
      return;
    }
    const start = Math.min(Number(startEl.dataset.pi), Number(endEl.dataset.pi));
    const endRaw = Math.max(Number(startEl.dataset.pi), Number(endEl.dataset.pi));
    const end = endRaw + 1; // exclusive
    const para = paragraphs.find((p) => p.id === paragraphId);
    const label = (para?.text || "").slice(start, end);
    setPending({ paragraphId, start, end, label });
  };

  const commitPending = () => {
    if (!pending || !onAdd) return;
    onAdd(pending);
    setPending(null);
    window.getSelection()?.removeAllRanges();
  };

  return (
    <div className="dq-evp" ref={containerRef}>
      <div className="dq-evp-hint">{pending ? `선택: "${pending.label.slice(0, 40)}${pending.label.length > 40 ? "…" : ""}"` : emptyHint}</div>
      <div className="dq-evp-passage" onMouseUp={handleMouseUp}>
        {paragraphs.map((p) => (
          <p key={p.id} className="dq-evp-para">
            {Array.from(p.text || "").map((ch, i) => {
              const isHi = highlightedByPara[p.id]?.has(i);
              const charKey = `${p.id}:${i}`;
              const rangeIdx = charToRangeIdx[charKey];
              if (ch === "\n") return <br key={`${p.id}-${i}-br`} />;
              return (
                <span
                  key={`${p.id}-${i}`}
                  data-pid={p.id}
                  data-pi={i}
                  className={`dq-evp-char ${isHi ? "hi" : ""}`}
                  style={isHi ? {
                    background: `linear-gradient(transparent 55%, ${highlightColor} 55%)`,
                    fontWeight: 700,
                  } : undefined}
                  onMouseDown={(e) => {
                    // 형광펜 영역 위에서는 텍스트 선택을 막아 삭제 클릭만 트리거
                    if (isHi) e.stopPropagation();
                  }}
                  onClick={(e) => {
                    if (isHi && rangeIdx !== undefined && onRemoveRange) {
                      e.stopPropagation();
                      const r = ranges[rangeIdx];
                      const label = r?.label || (p.text || "").slice(r.start, r.end);
                      if (window.confirm(`이 영역("${label.slice(0, 30)}${label.length > 30 ? "…" : ""}")을 삭제할까요?`)) {
                        onRemoveRange(rangeIdx);
                      }
                    }
                  }}
                >{ch}</span>
              );
            })}
          </p>
        ))}
      </div>
      <div className="dq-evp-actions">
        <button
          type="button"
          className="ce-btn ce-btn-primary"
          onClick={commitPending}
          disabled={!pending}
        >
          + 영역 등록
        </button>
        {pending && (
          <button
            type="button"
            className="ce-btn ce-btn-secondary"
            onClick={() => { setPending(null); window.getSelection()?.removeAllRanges(); }}
          >취소</button>
        )}
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: "#999" }}>
          등록된 영역: {ranges.length}개 · 노란 형광펜 부분 클릭 시 삭제
        </span>
      </div>
    </div>
  );
}
