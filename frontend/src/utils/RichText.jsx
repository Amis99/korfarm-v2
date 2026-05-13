/**
 * 인라인 HTML(<u>, <b>)과 마크다운(**bold**)을 React 엘리먼트로 변환하는 경량 파서.
 * dangerouslySetInnerHTML 없이 안전하게 렌더링.
 *
 * 추가 기능:
 *  - 평문 항목 나열(1. / (1) / ① / 가.) 자동 줄바꿈
 *  - LaTeX 수식: $\frac{1}{2}$ (인라인), $$\sum$$ (블록) — KaTeX로 렌더
 *
 * 주의: katex.min.css는 PassageMarkdown.jsx에서 한 번만 import하므로 (전역 적용)
 *       여기서는 별도 import 불필요.
 */
import katex from "katex";
import FileImage from "../components/FileImage";

function autoBreakItems(s) {
  if (!s || typeof s !== "string") return s;
  let out = s;
  out = out.replace(/(\S)([ \t]+)(?=\(\d+\)\s)/g, "$1\n");
  out = out.replace(/(\S)([ \t]+)(?=\d+\.\s)/g, "$1\n");
  out = out.replace(/(\S)([ \t]*)(?=[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮])/g, "$1\n");
  out = out.replace(/(\S)([ \t]+)(?=[가-힣]\.[ \t])/g, "$1\n");
  return out;
}

function MathSnippet({ tex, displayMode = false }) {
  let html;
  try {
    html = katex.renderToString(tex, {
      throwOnError: false,
      errorColor: "#c0392b",
      displayMode,
      output: "html",
    });
  } catch (e) {
    // throwOnError:false이면 여기 안 옴 (그래도 안전망)
    return <span style={{ color: "#c0392b" }}>{`${displayMode ? "$$" : "$"}${tex}${displayMode ? "$$" : "$"}`}</span>;
  }
  const className = displayMode ? "rt-math rt-math-display" : "rt-math";
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

function RichText({ children }) {
  if (!children || typeof children !== 'string') return children ?? null;
  const text = autoBreakItems(children.replace(/\\n/g, '\n'));
  // split 패턴: $$...$$ (블록), $...$ (인라인), <u>, <b>, **bold**, ![alt](url)
  // 수식이 먼저 와야 더 길게 매치 (lazy 우선순위 처리)
  const pattern = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|<u>[\s\S]*?<\/u>|<b>[\s\S]*?<\/b>|\*\*[\s\S]*?\*\*|!\[[^\]]*\]\([^)]+\))/g;
  const parts = text.split(pattern);
  return parts.map((part, i) => {
    if (typeof part !== "string") return part;
    if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) {
      return <MathSnippet key={i} tex={part.slice(2, -2).trim()} displayMode />;
    }
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      return <MathSnippet key={i} tex={part.slice(1, -1).trim()} />;
    }
    if (part.startsWith('<u>') && part.endsWith('</u>')) {
      return <u key={i}>{part.slice(3, -4)}</u>;
    }
    if (part.startsWith('<b>') && part.endsWith('</b>')) {
      return <b key={i}>{part.slice(3, -4)}</b>;
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    // ![alt](url) 이미지 — /v1/files/{id}/download 는 토큰 필요 → FileImage 사용
    if (part.startsWith('![')) {
      const m = part.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (m) {
        const alt = m[1];
        const url = m[2].trim();
        const fileMatch = url.match(/\/v1\/files\/([A-Za-z0-9_-]+)\/download/);
        if (fileMatch) {
          return <FileImage key={i} fileId={fileMatch[1]} alt={alt} />;
        }
        return (
          <img
            key={i}
            src={url}
            alt={alt}
            style={{ maxWidth: "100%", display: "block", margin: "4px 0" }}
          />
        );
      }
    }
    // 평문 내 \n을 <br/>로 변환
    if (part.includes('\n')) {
      return part.split('\n').flatMap((seg, j) =>
        j === 0 ? [seg] : [<br key={`${i}-br-${j}`} />, seg]
      );
    }
    return part;
  }).flat();
}

export default RichText;
