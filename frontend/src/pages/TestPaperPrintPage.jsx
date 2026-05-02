import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { apiGet } from "../utils/adminApi";
import TestPaperRenderer from "../components/test-paper/TestPaperRenderer";

/**
 * 시험지/정답해설 인쇄 전용 라우트.
 * URL: /admin/tests/{testId}/print?type=paper|answer&autoprint=1
 *
 * - autoprint=1 이면 로드 후 window.print() 자동 호출
 * - 어드민 레이아웃 없이 시험지만 노출 (CSS 의 @media print 가 그 외 영역 숨김)
 */
export default function TestPaperPrintPage() {
  const { testId } = useParams();
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "paper";
  const autoprint = searchParams.get("autoprint") === "1";

  const [layout, setLayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!testId) return;
    setLoading(true);
    apiGet(`/v1/admin/test-papers/${testId}/layout?type=${type}`)
      .then((res) => setLayout(res?.layout || null))
      .catch((e) => setError(e?.message || "불러오기 실패"))
      .finally(() => setLoading(false));
  }, [testId, type]);

  useEffect(() => {
    if (autoprint && layout && !loading) {
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
  }, [autoprint, layout, loading]);

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center" }}>시험지 불러오는 중...</div>;
  }
  if (error) {
    return <div style={{ padding: 40, color: "#c0392b" }}>{error}</div>;
  }
  if (!layout) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#888" }}>
        <p>아직 디자인된 레이아웃이 없습니다.</p>
        <p style={{ fontSize: 12 }}>시험지 디자인 메뉴에서 [자동 채우기]를 먼저 실행해주세요.</p>
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      <div className="tpr-toolbar" style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "#fff", borderBottom: "1px solid #ddd",
        padding: "8px 16px", display: "flex", gap: 8, alignItems: "center",
      }}>
        <strong style={{ fontSize: 14 }}>{layout.title || "시험지"}</strong>
        <span style={{ fontSize: 12, color: "#666" }}>
          {type === "answer" ? "정답·해설" : "시험지"}
        </span>
        <button
          onClick={() => window.print()}
          style={{
            marginLeft: "auto", padding: "6px 14px",
            background: "#2d6a4f", color: "#fff",
            border: "none", borderRadius: 6, cursor: "pointer",
          }}
        >🖨 인쇄</button>
        <button
          onClick={() => window.close()}
          style={{
            padding: "6px 14px",
            background: "#fff", color: "#333",
            border: "1px solid #ccc", borderRadius: 6, cursor: "pointer",
          }}
        >닫기</button>
      </div>
      <TestPaperRenderer layout={layout} editable={false} />
    </div>
  );
}
