/**
 * AI 코멘트 — 룰 기반 분석문 카드 리스트
 * - severity: good / warn / info
 */
export default function ReportAiComments({ comments }) {
  if (!comments || comments.length === 0) {
    return (
      <div className="ur-ai-comments">
        <h3>AI 코멘트</h3>
        <p className="ur-empty">
          학습 데이터가 더 쌓이면 자동 분석 코멘트가 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="ur-ai-comments">
      <h3>AI 코멘트</h3>
      <p className="ur-algo-hint">
        역량 · 영역 · 주제 · 계획표 · 글쓰기를 종합 분석한 룰 기반 자동 코멘트
      </p>
      <div className="ur-ai-comment-list">
        {comments.map((c, i) => (
          <div
            key={`${c.section}-${i}`}
            className={`ur-ai-comment ur-sev-${c.severity || "info"}`}
          >
            <div className="ur-ai-head">
              <span className="ur-ai-section">[{c.section}]</span>
              <span className="ur-ai-title">{c.title}</span>
            </div>
            <p className="ur-ai-body">{c.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
