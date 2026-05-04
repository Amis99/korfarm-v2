import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiGet } from "../utils/api";
import { apiGetCamel } from "../utils/adminApi";
import { normalizeModuleKey } from "../constants/contentTypes";
import PrintLayout from "../engine/core/PrintLayout";
import "../styles/learning-engine.css";

// 내용 숙지 콘텐츠 인쇄 — 페이지별 본문 + 4유형 문제
function StudyContentPrint({ detail, pages }) {
  const TYPE_LABEL = { mcq: "객관식", ox: "OX", short: "단답", essay: "서술" };
  return (
    <div className="print-only print-layout">
      <header style={{ borderBottom: "2px solid #333", paddingBottom: 6, marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "#666" }}>
          학교 [ &nbsp; ] &nbsp;&nbsp; 학년/반 [ &nbsp; ] &nbsp;&nbsp; 이름 [ &nbsp; ] &nbsp;&nbsp; 시작 [ : ]
        </div>
        <h1 style={{ fontSize: 22, margin: "8px 0 4px" }}>{detail?.title || "내용 숙지"}</h1>
        <div style={{ fontSize: 12, color: "#555" }}>
          {detail?.levelId || ""}
          {detail?.area && ` · ${detail.area}`}
          {detail?.subArea && ` · ${detail.subArea}`}
        </div>
      </header>
      {(pages || []).map((page, pi) => (
        <section key={page.id || pi} style={{ pageBreakInside: "avoid", marginBottom: 18 }}>
          <h2 style={{ fontSize: 16, borderLeft: "4px solid #2f7a3e", paddingLeft: 8, margin: "16px 0 8px" }}>
            페이지 {pi + 1}{page.title ? ` — ${page.title}` : ""}
          </h2>
          {page.markdown && (
            <div style={{ whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.7, marginBottom: 10 }}>
              {page.markdown}
            </div>
          )}
          {Array.isArray(page.questions) && page.questions.length > 0 && (
            <ol style={{ paddingLeft: 22 }}>
              {page.questions.map((q, qi) => (
                <li key={q.id || qi} style={{ marginBottom: 8, fontSize: 12 }}>
                  <div>
                    <span style={{ display: "inline-block", padding: "1px 6px", background: "#eef2e8", borderRadius: 3, fontSize: 10, marginRight: 6 }}>
                      {TYPE_LABEL[q.type] || q.type}
                    </span>
                    {q.prompt || q.question || q.title}
                  </div>
                  {Array.isArray(q.choices) && q.choices.length > 0 && (
                    <ol style={{ paddingLeft: 18, fontSize: 12, marginTop: 2 }}>
                      {q.choices.map((c, ci) => (
                        <li key={c.id || ci}>{c.text || c.label || (typeof c === "string" ? c : "")}</li>
                      ))}
                    </ol>
                  )}
                  {q.type === "ox" && (
                    <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>O / X</div>
                  )}
                  {(q.type === "short" || q.type === "essay") && (
                    <div style={{
                      borderBottom: "1px solid #999", height: q.type === "essay" ? 60 : 18,
                      marginTop: 4,
                    }} />
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>
      ))}
      {(!pages || pages.length === 0) && (
        <p style={{ color: "#666" }}>등록된 페이지가 없습니다. (콘텐츠 메타만 표시)</p>
      )}
    </div>
  );
}

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
          // study_ 로 시작하면 내용 숙지 콘텐츠 — 별도 endpoint
          if (id.startsWith("study_")) {
            const detail = await apiGetCamel(`/v1/admin/study/contents/${encodeURIComponent(id)}`);
            const pages = await apiGetCamel(`/v1/admin/study/contents/${encodeURIComponent(id)}/pages`).catch(() => []);
            return { contentId: id, kind: "study", detail, pages: Array.isArray(pages) ? pages : [] };
          }
          // 일반 콘텐츠
          const data = await apiGet(`/v1/learning/content/${encodeURIComponent(id)}`);
          const moduleKeyRaw = data?.module_key || data?.moduleKey;
          const moduleKey = normalizeModuleKey(moduleKeyRaw) ||
            normalizeModuleKey(Array.isArray(data?.content_type) ? data.content_type[0] : data?.contentType);
          const content = {
            title: data?.title || "",
            targetLevel: data?.level_id || data?.levelId || "",
            payload: data?.content?.payload || data?.content || {},
          };
          return { contentId: id, kind: "general", content, moduleKey: moduleKey || "worksheet_quiz" };
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
          ) : it.kind === "study" ? (
            <StudyContentPrint detail={it.detail} pages={it.pages} />
          ) : (
            <PrintLayout moduleKey={it.moduleKey} content={it.content} />
          )}
        </div>
      ))}
    </div>
  );
}
