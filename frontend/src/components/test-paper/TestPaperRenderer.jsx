import { API_BASE, TOKEN_KEY } from "../../utils/api";
import "../../styles/test-paper.css";

/**
 * 시험지/정답해설 layout JSON 을 A4 페이지로 렌더.
 * 편집 모드에서도 인쇄 모드에서도 같은 마크업 — CSS 로 편집 UI 숨김.
 *
 * Props:
 *   layout    { version, type, title, pages: [...] }
 *   editable  true 면 contentEditable + 블록 추가/삭제 (Phase 2 에 활성화)
 *   onChange  편집 시 변경 콜백
 */
export default function TestPaperRenderer({ layout, editable = false, onChange }) {
  if (!layout || !layout.pages || layout.pages.length === 0) {
    return (
      <div className="tpr-empty">
        <p>레이아웃이 없습니다. [자동 채우기] 버튼을 눌러 시작하세요.</p>
      </div>
    );
  }

  return (
    <div className="tpr-root">
      {layout.pages.map((page, pageIdx) => (
        <PageView key={page.id || pageIdx} page={page} pageIdx={pageIdx} />
      ))}
    </div>
  );
}

function PageView({ page, pageIdx }) {
  const cols = page.columns || 1;
  return (
    <div className="tpr-page" data-page-idx={pageIdx}>
      {page.header && (
        <header className="tpr-page-header">
          {page.header.title && <h2>{page.header.title}</h2>}
          {page.header.meta && <div className="tpr-page-meta">{page.header.meta}</div>}
        </header>
      )}
      <div className={`tpr-page-body cols-${cols}`}>
        {(page.blocks || []).map((b, i) => (
          <BlockView key={b.id || i} block={b} />
        ))}
      </div>
      <div className="tpr-page-footer">— {pageIdx + 1} —</div>
    </div>
  );
}

function BlockView({ block }) {
  switch (block.type) {
    case "info":
      return <div className="tpr-block tpr-info">{block.html || block.text}</div>;
    case "text":
      return <div className="tpr-block tpr-text" dangerouslySetInnerHTML={{ __html: block.html || "" }} />;
    case "image":
      return <ImageBlock block={block} />;
    case "passage":
      return (
        <div className="tpr-block tpr-passage">
          {block.label && <div className="tpr-passage-label">{block.label}</div>}
          <div className="tpr-passage-body" dangerouslySetInnerHTML={{ __html: block.html || "" }} />
        </div>
      );
    case "question":
      return <QuestionBlock block={block} />;
    case "box":
      return (
        <div className="tpr-block tpr-box">
          {block.label && <div className="tpr-box-label">{block.label}</div>}
          <div className="tpr-box-body" dangerouslySetInnerHTML={{ __html: block.html || "" }} />
        </div>
      );
    case "answer-table":
      return <AnswerTable block={block} />;
    case "answer-explanation":
      return <AnswerExplanation block={block} />;
    case "page-break":
      return <div className="tpr-page-break" />;
    default:
      return null;
  }
}

function ImageBlock({ block }) {
  const fileId = block.fileId;
  const url = block.url || (fileId ? imageUrl(fileId) : null);
  if (!url) return null;
  const align = block.align || "center";
  const width = block.width || "auto";
  return (
    <figure className={`tpr-block tpr-image tpr-image-align-${align}`}>
      <img src={url} alt={block.caption || ""} style={{ width, maxWidth: "100%" }} />
      {block.caption && <figcaption>{block.caption}</figcaption>}
    </figure>
  );
}

function QuestionBlock({ block }) {
  const choices = block.choices || [];
  return (
    <div className="tpr-block tpr-question">
      <div className="tpr-question-stem">
        <span className="tpr-question-no">{block.no}.</span>
        <span dangerouslySetInnerHTML={{ __html: ensureHtml(block.stem) }} />
        {block.points != null && <span className="tpr-question-points">[{block.points}점]</span>}
      </div>
      {choices.length > 0 && (
        <ol className="tpr-choices">
          {choices.map((c, i) => (
            <li key={c.id || i}>
              <span className="tpr-choice-marker">{c.marker || `${i + 1})`}</span>
              <span dangerouslySetInnerHTML={{ __html: ensureHtml(c.text) }} />
            </li>
          ))}
        </ol>
      )}
      {block.questionType === "ESSAY" && (
        <div className="tpr-essay-blank" />
      )}
    </div>
  );
}

function AnswerTable({ block }) {
  const rows = block.rows || [];
  return (
    <div className="tpr-block tpr-answer-table">
      <table>
        <thead>
          <tr>
            <th>번호</th><th>정답</th><th>배점</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.no}>
              <td>{r.no}</td>
              <td>{r.answer}</td>
              <td>{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AnswerExplanation({ block }) {
  return (
    <div className="tpr-block tpr-answer-exp">
      <div className="tpr-answer-exp-head">
        <span className="tpr-answer-exp-no">{block.no}.</span>
        <span className="tpr-answer-exp-mark">정답 {block.answer}</span>
        {block.points != null && <span className="tpr-answer-exp-points">{block.points}점</span>}
      </div>
      {block.stem && (
        <div className="tpr-answer-exp-stem" dangerouslySetInnerHTML={{ __html: ensureHtml(block.stem) }} />
      )}
      {block.explanation && (
        <div className="tpr-answer-exp-body">
          <strong>해설</strong>
          <span dangerouslySetInnerHTML={{ __html: ensureHtml(block.explanation) }} />
        </div>
      )}
      {block.modelAnswer && (
        <div className="tpr-answer-exp-body">
          <strong>모범답안</strong>
          <span dangerouslySetInnerHTML={{ __html: ensureHtml(block.modelAnswer) }} />
        </div>
      )}
    </div>
  );
}

function ensureHtml(s) {
  if (!s) return "";
  // 이미 HTML 태그 포함이면 그대로, 아니면 줄바꿈을 br 로
  if (/<[a-z][^>]*>/i.test(s)) return s;
  return String(s).replace(/\n/g, "<br/>");
}

export function imageUrl(fileId) {
  const token = sessionStorage.getItem(TOKEN_KEY);
  return `${API_BASE}/v1/files/${fileId}/download${token ? `?token=${token}` : ""}`;
}
