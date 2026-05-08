import { Link } from "react-router-dom";

/**
 * 글쓰기 현황 — 지식과 지혜 게시글 통계 + 최근 3개 포스트
 * props.levelId 가 있으면 카드 하단에 "지식과 지혜로 이동 →" CTA 노출.
 */
export default function ReportWritingStats({ stats, levelId }) {
  const writingHref = levelId ? `/writing/${levelId}` : null;

  if (!stats) {
    return (
      <div className="ur-writing-stats">
        <h3>글쓰기 현황</h3>
        <p className="ur-empty">아직 글쓰기 활동이 없습니다.</p>
        {writingHref && (
          <Link to={writingHref} className="ur-writing-cta">지식과 지혜로 이동 →</Link>
        )}
      </div>
    );
  }

  const { totalPostCount, feedbackReceivedCount, totalLikes, totalComments, recentPosts } = stats;

  if (totalPostCount === 0) {
    return (
      <div className="ur-writing-stats">
        <h3>글쓰기 현황</h3>
        <p className="ur-empty">아직 글쓰기 활동이 없습니다. 지식과 지혜에서 첫 글을 작성해 보세요.</p>
        {writingHref && (
          <Link to={writingHref} className="ur-writing-cta">지식과 지혜로 이동 →</Link>
        )}
      </div>
    );
  }

  return (
    <div className="ur-writing-stats">
      <h3>글쓰기 현황</h3>

      <div className="ur-writing-cards">
        <Card label="작성한 글" value={totalPostCount} unit="편" />
        <Card label="AI 첨삭" value={feedbackReceivedCount} unit="회" />
        <Card label="좋아요" value={totalLikes} unit="개" />
        <Card label="댓글" value={totalComments} unit="개" />
      </div>

      {recentPosts && recentPosts.length > 0 && (
        <div className="ur-writing-recent">
          <h4>최근 작성 글</h4>
          <ul>
            {recentPosts.map((p) => (
              <li key={p.postId}>
                <span className="ur-recent-title">
                  {p.title || "(제목 없음)"}
                </span>
                {p.hasFeedback && (
                  <span className="ur-feedback-badge">AI 첨삭</span>
                )}
                <span className="ur-recent-meta">
                  ❤ {p.likeCount} · 💬 {p.commentCount} · {fmt(p.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {writingHref && (
        <Link to={writingHref} className="ur-writing-cta">지식과 지혜로 이동 →</Link>
      )}
    </div>
  );
}

function Card({ label, value, unit }) {
  return (
    <div className="ur-writing-card">
      <div className="ur-writing-card-label">{label}</div>
      <div className="ur-writing-card-value">
        {value}
        <span className="ur-writing-card-unit">{unit}</span>
      </div>
    </div>
  );
}

function fmt(s) {
  if (!s) return "";
  try {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return `${d.getMonth() + 1}/${d.getDate()}`;
  } catch (_) {
    return s;
  }
}
