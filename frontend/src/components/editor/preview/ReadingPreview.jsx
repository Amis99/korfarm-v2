import { useMemo } from "react";

/**
 * 독해 콘텐츠 미리보기 (왼쪽 패널)
 * 지문 + 하이라이트 + 정독 문항 + 복기 카드 + 확인 문항
 */
export default function ReadingPreview({ content, onClickPath, focusPath }) {
  const passage = content?.passage || {};
  const paragraphs = passage.paragraphs || [];
  const intensive = content?.intensive || {};
  const timeline = intensive.timeline || content?.timeline || [];
  const recall = content?.recall || {};
  const confirm = content?.confirm || {};

  /* 하이라이트 형식 정규화 (ranges[] / paragraphId+range 둘 다 지원) */
  const normalizeHighlightRanges = (highlight) => {
    if (!highlight) return [];
    if (Array.isArray(highlight.ranges)) return highlight.ranges;
    if (highlight.paragraphId && highlight.range) {
      return [{ paragraphId: highlight.paragraphId, start: highlight.range.start, end: highlight.range.end }];
    }
    return [];
  };

  /* 모든 하이라이트 범위 수집 (미리보기에 표시용) */
  const allHighlights = useMemo(() => {
    const ranges = [];
    timeline.forEach((step) => {
      normalizeHighlightRanges(step.highlight).forEach((r) => ranges.push(r));
    });
    return ranges;
  }, [timeline]);

  /* 단락 렌더링 (하이라이트 적용) */
  const renderParagraph = (para) => {
    const paraRanges = allHighlights.filter((r) => r.paragraphId === para.id);
    if (paraRanges.length === 0) return <p key={para.id}>{para.text}</p>;

    const sorted = [...paraRanges].sort((a, b) => a.start - b.start);
    const parts = [];
    let pos = 0;
    sorted.forEach((r, i) => {
      if (r.start > pos) parts.push({ text: para.text.slice(pos, r.start), hl: false });
      parts.push({ text: para.text.slice(r.start, r.end), hl: true });
      pos = r.end;
    });
    if (pos < para.text.length) parts.push({ text: para.text.slice(pos), hl: false });

    return (
      <p key={para.id}>
        {parts.map((p, i) =>
          p.hl ? <span key={i} className="highlight">{p.text}</span> : <span key={i}>{p.text}</span>
        )}
      </p>
    );
  };

  return (
    <div>
      {/* 지문 */}
      <div
        className={`ce-preview-card ${focusPath === "passage" ? "active" : ""}`}
        data-editor-path="passage"
        onClick={() => onClickPath("passage")}
      >
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>지문</div>
        <div className="ce-preview-passage" id="ce-passage-container">
          {paragraphs.map((para) => (
            <p key={para.id} data-paragraph-id={para.id}>{renderParagraph(para).props.children}</p>
          ))}
          {paragraphs.length === 0 && <span style={{ color: "var(--muted)" }}>(지문 없음)</span>}
        </div>
      </div>

      {/* 정독 타임라인 */}
      {timeline.length > 0 && (
        <div
          className={`ce-preview-card ${focusPath?.startsWith("intensive") ? "active" : ""}`}
          data-editor-path="intensive"
          onClick={() => onClickPath("intensive")}
        >
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
            정독 타임라인 ({timeline.length}단계)
          </div>
          {timeline.map((step, i) => (
            <div key={step.stepId || i} style={{ fontSize: 12, padding: "4px 0", borderBottom: "1px solid #1a2420" }}>
              <strong style={{ color: "var(--muted)" }}>Step {i + 1}</strong>
              {step.highlight && <span style={{ color: "#ff7f2a", marginLeft: 8 }}>하이라이트</span>}
              {step.question && (
                <span style={{ color: "#4ecb71", marginLeft: 8 }}>
                  Q: {(step.question.prompt || "").slice(0, 30)}...
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 복기 카드 */}
      {(recall.cards || []).length > 0 && (
        <div
          className={`ce-preview-card ${focusPath?.startsWith("recall") ? "active" : ""}`}
          data-editor-path="recall"
          onClick={() => onClickPath("recall")}
        >
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
            복기 카드 ({recall.cards.length}개)
          </div>
          {recall.cards.map((card, i) => (
            <div key={card.id || i} style={{ fontSize: 12, padding: "3px 0", color: "var(--muted)" }}>
              {i + 1}. {(card.text || "").slice(0, 50)}{card.text?.length > 50 ? "..." : ""}
            </div>
          ))}
        </div>
      )}

      {/* 확인 문항 */}
      {(confirm.questions || []).length > 0 && (
        <div
          className={`ce-preview-card ${focusPath?.startsWith("confirm") ? "active" : ""}`}
          data-editor-path="confirm"
          onClick={() => onClickPath("confirm")}
        >
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
            확인 문항 ({confirm.questions.length}개)
          </div>
          {confirm.questions.map((q, i) => (
            <div key={q.id || i} className="ce-preview-q">
              <div className="ce-preview-q-stem">{i + 1}. {q.prompt || "(발문 없음)"}</div>
              {q.answerText && (
                <div style={{ fontSize: 11, color: "#4ecb71" }}>정답: {q.answerText}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
