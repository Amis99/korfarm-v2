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

  // 단락 삭제·ID 변경으로 paragraphs 에 없는 paragraphId 의 range 는 비주얼 에디터에서도
  // 보이지 않고 카운트에서 제외. 카운트가 실제 유효 영역과 일치해야 사용자가 정확히 인지.
  const paragraphIdSet = useMemo(() => new Set((paragraphs || []).map((p) => p.id)), [paragraphs]);
  const validRanges = useMemo(
    () => (ranges || []).filter((r) => paragraphIdSet.has(r.paragraphId)),
    [ranges, paragraphIdSet],
  );
  const orphanCount = (ranges || []).length - validRanges.length;

  // 등록된 ranges 를 char index 별 set 으로 변환 (유효 range 만)
  const highlightedByPara = useMemo(() => {
    const m = {};
    for (const r of validRanges) {
      if (!m[r.paragraphId]) m[r.paragraphId] = new Set();
      for (let i = r.start; i < r.end; i += 1) m[r.paragraphId].add(i);
    }
    return m;
  }, [validRanges]);

  // 영역 내 모든 char index → 그 위치에 걸친 모든 range idx 배열 매핑.
  // - 같은 위치에 여러 range 가 등록(중복·일부 겹침) → 한 번 클릭으로 모두 삭제되도록 누적.
  // - orphan range (paragraphs 에 없는 paragraphId) 는 화면에 표시 안 되므로 click 매핑 제외.
  // 단, idx 는 원본 ranges 배열 기준 — onRemoveRange(idx) 호출 시 부모의 splice 와 일치.
  const charToRangeIdxs = useMemo(() => {
    const m = {};
    ranges.forEach((r, idx) => {
      if (!paragraphIdSet.has(r.paragraphId)) return;
      for (let i = r.start; i < r.end; i += 1) {
        const k = `${r.paragraphId}:${i}`;
        if (!m[k]) m[k] = [];
        m[k].push(idx);
      }
    });
    return m;
  }, [ranges, paragraphIdSet]);

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
              const rangeIdxs = charToRangeIdxs[charKey];
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
                    if (isHi && rangeIdxs && rangeIdxs.length > 0 && onRemoveRange) {
                      e.stopPropagation();
                      const firstR = ranges[rangeIdxs[0]];
                      const label = firstR?.label || (p.text || "").slice(firstR.start, firstR.end);
                      const labelStr = label.slice(0, 30) + (label.length > 30 ? "…" : "");
                      const msg = rangeIdxs.length === 1
                        ? `이 영역("${labelStr}")을 삭제할까요?`
                        : `이 위치에 ${rangeIdxs.length}개 영역이 겹쳐 등록되어 있습니다.\n모두 삭제할까요?`;
                      if (window.confirm(msg)) {
                        // idx 큰 거부터 삭제해야 인덱스 변동이 누적되지 않음
                        [...rangeIdxs].sort((a, b) => b - a).forEach((idx) => onRemoveRange(idx));
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
          등록된 영역: {validRanges.length}개
          {orphanCount > 0 && (
            <span style={{ color: "#c00", marginLeft: 6 }}>
              · 옛 단락 잔존 {orphanCount}개 (학생 화면·채점 자동 제외)
            </span>
          )} · 노란 형광펜 부분 클릭 시 삭제
        </span>
      </div>
    </div>
  );
}
