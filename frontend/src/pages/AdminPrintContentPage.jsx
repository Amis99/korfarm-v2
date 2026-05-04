import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiGet } from "../utils/api";
import { normalizeModuleKey } from "../constants/contentTypes";
import PrintLayout from "../engine/core/PrintLayout";
import "../styles/learning-engine.css";

/**
 * 어드민 PDF 인쇄 페이지
 * 라우트: /admin/print-content?ids=ID1,ID2,...
 *
 * 학습 계획표에서 배정된 농장 콘텐츠를 PDF 로 인쇄하기 위한 단독 페이지.
 * 각 contentId 의 학습 데이터를 fetch 한 후 PrintLayout 으로 시험지 형태 렌더,
 * 모두 로드되면 자동으로 window.print() 호출.
 *
 * 단일: ?ids=content_xxx
 * 일괄: ?ids=a,b,c (각 콘텐츠가 새 페이지로 분할)
 */
export default function AdminPrintContentPage() {
  const [params] = useSearchParams();
  const idsParam = params.get("ids") || params.get("id") || "";
  const ids = idsParam.split(",").map(s => s.trim()).filter(Boolean);
  const [items, setItems] = useState([]); // [{ contentId, content, moduleKey, error }]
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ids.length === 0) { setLoading(false); return; }
    let alive = true;
    Promise.all(
      ids.map(async (id) => {
        try {
          const data = await apiGet(`/v1/learning/content/${encodeURIComponent(id)}`);
          // data.content_type 은 배열, content 는 객체
          const moduleKeyRaw = data?.module_key || data?.moduleKey;
          const moduleKey = normalizeModuleKey(moduleKeyRaw) ||
            normalizeModuleKey(Array.isArray(data?.content_type) ? data.content_type[0] : data?.contentType);
          // PrintLayout 이 받는 content 객체 형태로 정리
          const content = {
            title: data?.title || "",
            targetLevel: data?.level_id || data?.levelId || "",
            payload: data?.content?.payload || data?.content || {},
          };
          return { contentId: id, content, moduleKey: moduleKey || "worksheet_quiz" };
        } catch (e) {
          return { contentId: id, error: e.message };
        }
      })
    ).then(arr => {
      if (alive) {
        setItems(arr);
        setLoading(false);
      }
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsParam]);

  // 모두 로드된 후 인쇄 다이얼로그 자동 호출
  useEffect(() => {
    if (loading || items.length === 0) return;
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, [loading, items.length]);

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>학습 데이터를 불러오는 중…</div>;
  if (ids.length === 0) return <div style={{ padding: 40 }}>인쇄할 콘텐츠 ID 가 지정되지 않았습니다.</div>;

  return (
    <div className="admin-print-host">
      {/* 화면에서도 PrintLayout 이 보이게 — 학생 페이지에선 print-only 지만 어드민 인쇄용 페이지에선 항상 표시 */}
      <style>{`
        .admin-print-host .print-only { display: block !important; }
        @media print { .admin-print-host .no-print { display: none !important; } }
        .admin-print-host .print-layout + .print-layout { page-break-before: always; }
      `}</style>
      <div className="no-print" style={{ position: "sticky", top: 0, background: "#fff", padding: "8px 16px", borderBottom: "1px solid #eee", display: "flex", gap: 12, alignItems: "center" }}>
        <strong>PDF 인쇄 — {items.length}건</strong>
        <button onClick={() => window.print()} style={{ padding: "6px 14px", background: "#2f7a3e", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>
          🖨 인쇄 / PDF 저장
        </button>
        <button onClick={() => window.close()} style={{ padding: "6px 14px", background: "none", border: "1px solid #ccc", borderRadius: 4, cursor: "pointer" }}>
          닫기
        </button>
      </div>
      {items.map((it, i) => (
        <div key={`${it.contentId}-${i}`}>
          {it.error ? (
            <div style={{ padding: 24, color: "#c00" }}>
              <strong>{it.contentId}</strong> — 불러오기 실패: {it.error}
            </div>
          ) : (
            <PrintLayout moduleKey={it.moduleKey} content={it.content} />
          )}
        </div>
      ))}
    </div>
  );
}
