import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import "../styles/passage-markdown.css";

/**
 * 학습 모듈 지문 박스 전용 마크다운 렌더러.
 *
 * 지원 항목:
 *  - 마크다운 표 (remark-gfm)
 *  - **bold**, *italic*, `code`, blockquote, list
 *  - 인라인 HTML <u>, <b>, <br> (react-markdown 기본 동작)
 *  - LaTeX 수식: $\frac{1}{2}$ (인라인), $$\sum_{i=1}^n i$$ (블록)
 *  - 평문 항목 나열 자동 줄바꿈:
 *      "1. ... 2. ... 3. ..." → 각 항목 줄바꿈
 *      "(1) ... (2) ..."        → 각 항목 줄바꿈
 *      "① ② ③ ..."             → 각 항목 줄바꿈
 *      "가. 나. 다. ..."         → 각 항목 줄바꿈
 */

/** 평문 내 항목 나열 패턴 앞에 줄바꿈 삽입 */
export function autoBreakItems(s) {
  if (!s || typeof s !== "string") return s;
  let out = s;
  // "(1) " "(2) " 등 — 앞 문자가 공백이 아니면 줄바꿈 삽입
  out = out.replace(/(\S)([ \t]+)(?=\(\d+\)\s)/g, "$1\n");
  // "1. " "2. " 등 — 단, 줄 시작이 아닌 경우만
  out = out.replace(/(\S)([ \t]+)(?=\d+\.\s)/g, "$1\n");
  // ①②③ 등 동그라미 숫자
  out = out.replace(/(\S)([ \t]*)(?=[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮])/g, "$1\n");
  // "가. 나. 다." 등 한글 항목 라벨
  out = out.replace(/(\S)([ \t]+)(?=[가-힣]\.[ \t])/g, "$1\n");
  return out;
}

function PassageMarkdown({ children, className = "" }) {
  if (children == null) return null;
  const raw = typeof children === "string" ? children : String(children);
  // 1) 리터럴 \n → 실제 줄바꿈
  const unescaped = raw.replace(/\\n/g, "\n");
  // 2) 항목 나열 자동 줄바꿈
  const text = autoBreakItems(unescaped);
  return (
    <div className={`passage-markdown ${className}`.trim()}>
      <Markdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, errorColor: "#c0392b" }]]}
      >
        {text}
      </Markdown>
    </div>
  );
}

export default PassageMarkdown;
