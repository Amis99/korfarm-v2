import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

/**
 * 학생 화면용 read-only 마크다운 렌더러.
 * 지원: 표(GFM) · 이미지 · 인라인 HTML(<u>, <b> 등) · 문단 분리 · LaTeX 수식($..$, $$..$$)
 *
 * 기존 RichText 보다 광범위하게 지원하므로 듀얼/콘텐츠/시험 화면에서 사용 가능.
 *
 * 사용:
 *   <PassageMarkdown>{passageText}</PassageMarkdown>
 *   또는
 *   <PassageMarkdown value={passageText} />
 */
function PassageMarkdown({ children, value, className }) {
  const text = typeof children === "string" ? children : (value ?? "");
  if (!text) return null;
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={{
          img: ({ node, ...props }) => (
            <img
              {...props}
              alt={props.alt || ""}
              style={{ maxWidth: "100%", maxHeight: 400, borderRadius: 4, margin: "8px 0" }}
            />
          ),
          table: ({ node, ...props }) => (
            <div style={{ overflowX: "auto", margin: "8px 0" }}>
              <table {...props} style={{ borderCollapse: "collapse", width: "100%" }} />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th {...props} style={{ border: "1px solid #ccc", padding: "4px 8px", background: "#f5f5f5", fontWeight: 600 }} />
          ),
          td: ({ node, ...props }) => (
            <td {...props} style={{ border: "1px solid #ccc", padding: "4px 8px" }} />
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

export default PassageMarkdown;
