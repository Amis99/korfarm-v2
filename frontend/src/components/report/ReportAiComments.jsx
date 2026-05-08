import { useNavigate } from "react-router-dom";

/**
 * AI 코멘트 — 룰 기반 분석문 카드 리스트
 * - severity: good / warn / info
 * - section 별 클릭 라우팅:
 *   · "글쓰기" → /writing/{levelId}
 *   · "추천"  → 같은 페이지의 #sec-reco 로 스크롤
 */
export default function ReportAiComments({ comments, levelId }) {
  const navigate = useNavigate();

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

  const handleClick = (section) => {
    if (section === "글쓰기" && levelId) {
      navigate(`/writing/${levelId}`);
    } else if (section === "추천") {
      const el = document.getElementById("sec-reco");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="ur-ai-comments">
      <h3>AI 코멘트</h3>
      <div className="ur-ai-comment-list">
        {comments.map((c, i) => {
          const clickable = (c.section === "글쓰기" && levelId) || c.section === "추천";
          return (
            <div
              key={`${c.section}-${i}`}
              className={`ur-ai-comment ur-sev-${c.severity || "info"}${clickable ? " ur-ai-clickable" : ""}`}
              onClick={clickable ? () => handleClick(c.section) : undefined}
              role={clickable ? "button" : undefined}
              tabIndex={clickable ? 0 : undefined}
              onKeyDown={clickable ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleClick(c.section);
                }
              } : undefined}
            >
              <div className="ur-ai-head">
                <span className="ur-ai-section">[{c.section}]</span>
                <span className="ur-ai-title">{c.title}</span>
                {clickable && <span className="ur-ai-chev">›</span>}
              </div>
              <p className="ur-ai-body">{c.content}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
