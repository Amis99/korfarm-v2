/**
 * 캔바 스타일 교재 에디터 메인 페이지.
 *
 * 레이아웃:
 *  - 좌측  : 요소 추가 패널 (텍스트/사진/도형/스티커/도메인)
 *  - 중앙  : 상단 컨텍스트 툴바 + A4 캔버스 + 하단 페이지 썸네일
 *  - 우측  : 레이어 패널 + (예정) 페이지 설정
 *  - 상단  : 메타(접기) + 저장
 */
import { useMemo, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
// @ts-ignore — JS 모듈
import AdminLayout from "../../components/AdminLayout";
import { useCanvasEditor } from "./useCanvasEditor";
import { CanvasPagePreview } from "./CanvasPagePreview";
import { LeftAddPanel } from "./panels/LeftAddPanel";
import { TopContextToolbar } from "./panels/TopContextToolbar";
import { RightLayerPanel } from "./panels/RightLayerPanel";
import { PageInspector } from "./panels/PageInspector";
import { HeaderFooterEditor } from "./panels/HeaderFooterEditor";
import { DomainInspector } from "./panels/DomainInspector";
import "../../styles/admin-detail.css";

export default function CanvasTextbookEditorPage() {
  const params = useParams<{ textbookId?: string }>();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const orgId = search.get("orgId");
  const ed = useCanvasEditor(params.textbookId ?? "new", orgId);
  const [metaOpen, setMetaOpen] = useState(false);
  const [hfOpen, setHfOpen] = useState(false);

  const selectedElement = useMemo(() => {
    if (!ed.currentPage || ed.selectedElementIds.length === 0) return null;
    return ed.currentPage.elements.find((e) => e.id === ed.selectedElementIds[0]) ?? null;
  }, [ed.currentPage, ed.selectedElementIds]);

  if (ed.loading) return <AdminLayout><div style={{ padding: 24 }}>로딩 중…</div></AdminLayout>;
  if (ed.error) return <AdminLayout><div style={{ padding: 24, color: "#c0392b" }}>오류: {ed.error}</div></AdminLayout>;
  if (!ed.textbook) return <AdminLayout><div style={{ padding: 24 }}>교재를 불러올 수 없습니다.</div></AdminLayout>;

  const tb = ed.textbook;

  return (
    <AdminLayout>
      <div style={{ display: "grid",
                    gridTemplateColumns: "260px 1fr 260px",
                    gridTemplateRows: "44px 1fr 96px",
                    height: "calc(100vh - 60px)",
                    background: "#f3f3f3" }}>
        {/* 상단 — 메타·저장 (좌측·우측까지 풀폭) */}
        <header style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center",
                         gap: 10, padding: "0 12px", background: "#fff",
                         borderBottom: "1px solid #ddd" }}>
          <button className="admin-detail-btn secondary sm" type="button"
                  onClick={() => navigate("/admin/textbooks")}>← 목록</button>
          <input value={tb.title}
                 onChange={(e) => ed.updateMeta({ title: e.target.value })}
                 style={{ flex: 1, maxWidth: 360, fontSize: 14, fontWeight: 600,
                          padding: "5px 8px", border: "1px solid #ddd", borderRadius: 4 }} />
          <button className="admin-detail-btn secondary sm" type="button"
                  onClick={() => setMetaOpen((v) => !v)}>
            메타 {metaOpen ? "▴" : "▾"}
          </button>
          <button className="admin-detail-btn secondary sm" type="button"
                  onClick={() => setHfOpen((v) => !v)}>
            머리/꼬리 {hfOpen ? "▴" : "▾"}
          </button>
          {metaOpen && (
            <>
              <select value={tb.series} onChange={(e) => ed.updateMeta({ series: e.target.value as any })}
                      style={metaInput}>
                <option value="saussure">소쉬르</option>
                <option value="frege">프레게</option>
                <option value="russell">러셀</option>
                <option value="wittgenstein">비트겐슈타인</option>
                <option value="custom">맞춤</option>
              </select>
              <input type="number" min={1} max={12} value={tb.level ?? 1} style={{ ...metaInput, width: 60 }}
                     onChange={(e) => ed.updateMeta({ level: parseInt(e.target.value || "1", 10) })}
                     title="레벨" />
              <input type="number" min={1} value={tb.volume ?? 1} style={{ ...metaInput, width: 60 }}
                     onChange={(e) => ed.updateMeta({ volume: parseInt(e.target.value || "1", 10) })}
                     title="권" />
            </>
          )}
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: "#666" }}>줌</span>
          <input type="range" min={0.3} max={2} step={0.05} value={ed.zoom}
                 onChange={(e) => ed.setZoom(parseFloat(e.target.value))}
                 style={{ width: 90 }} />
          <span style={{ fontSize: 11, color: "#888" }}>{Math.round(ed.zoom * 100)}%</span>
          {ed.dirty && <span style={{ fontSize: 11, color: "#e67e22" }}>변경됨</span>}
          {ed.saveMsg && <span style={{ fontSize: 11, color: "#2d6a4f" }}>{ed.saveMsg}</span>}
          <button className="admin-detail-btn" onClick={ed.save} disabled={!ed.dirty || ed.saving} type="button">
            {ed.saving ? "저장 중..." : "저장"}
          </button>
        </header>

        {/* 좌측 — 요소 추가 */}
        <aside style={{ background: "#fff", borderRight: "1px solid #ddd", overflow: "hidden" }}>
          <LeftAddPanel onAdd={(el) => ed.addElement(el)} />
        </aside>

        {/* 중앙 — 툴바 + 캔버스 */}
        <main style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <TopContextToolbar
            selected={selectedElement}
            onChange={(id, patch) => ed.updateElement(id, patch)}
            onRemove={(id) => ed.removeElement(id)}
            onDuplicate={(id) => ed.duplicateElement(id)}
            onBringForward={(id) => ed.bringForward(id)}
            onSendBackward={(id) => ed.sendBackward(id)}
          />
          {hfOpen && (
            <div style={{ borderBottom: "1px solid #ddd", background: "#fffceb" }}>
              <HeaderFooterEditor
                header={tb.header}
                footer={tb.footer}
                onChangeHeader={(next) => ed.updateMeta({ header: next })}
                onChangeFooter={(next) => ed.updateMeta({ footer: next })}
              />
            </div>
          )}
          <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
            {ed.currentPage ? (
              <CanvasPagePreview
                page={ed.currentPage}
                pageWidthMm={tb.pageWidthMm}
                pageHeightMm={tb.pageHeightMm}
                zoom={ed.zoom}
                selectedIds={ed.selectedElementIds}
                onSelect={(ids, shiftKey) => ed.selectElements(ids, shiftKey)}
                onChangeElement={(id, patch) => ed.updateElement(id, patch)}
              />
            ) : <div style={{ padding: 24, textAlign: "center", color: "#888" }}>페이지를 선택하세요</div>}
          </div>
        </main>

        {/* 우측 — 페이지 배경 + 레이어 */}
        <aside style={{ background: "#fafafa", borderLeft: "1px solid #ddd",
                        overflow: "auto", display: "flex", flexDirection: "column" }}>
          <PageInspector
            page={ed.currentPage}
            imagePool={tb.imagePool}
            onChangeBackground={ed.updatePageBackground}
          />
          {selectedElement?.type === "domain" && (
            <DomainInspector
              element={selectedElement}
              onChange={(patch) => ed.updateElement(selectedElement.id, patch as any)}
            />
          )}
          <div style={{ flex: 1, overflow: "auto" }}>
            <RightLayerPanel
              page={ed.currentPage}
              selectedIds={ed.selectedElementIds}
              onSelect={ed.selectElements}
              onChange={(id, patch) => ed.updateElement(id, patch)}
            />
          </div>
        </aside>

        {/* 하단 — 페이지 썸네일 */}
        <footer style={{ gridColumn: "1 / -1", background: "#fff", borderTop: "1px solid #ddd",
                         padding: 8, display: "flex", gap: 8, alignItems: "center", overflow: "auto" }}>
          {tb.pages.map((p, i) => (
            <div key={p.pageId}
                 onClick={() => ed.selectPage(p.pageId)}
                 style={{
                   width: 56, height: 80, flexShrink: 0,
                   border: p.pageId === ed.selectedPageId ? "2px solid #2d6a4f" : "1px solid #ddd",
                   borderRadius: 3, cursor: "pointer", position: "relative",
                   background: "#fff",
                 }}>
              <div style={{ position: "absolute", bottom: 2, left: 0, right: 0,
                            textAlign: "center", fontSize: 9, color: "#666" }}>
                p.{i + 1}
              </div>
            </div>
          ))}
          <button className="admin-detail-btn secondary sm" onClick={ed.addPage} type="button">
            + 페이지
          </button>
          {tb.pages.length > 1 && ed.selectedPageId && (
            <button className="admin-detail-btn danger sm" type="button"
                    onClick={() => ed.removePage(ed.selectedPageId!)}>
              현재 페이지 삭제
            </button>
          )}
        </footer>
      </div>
    </AdminLayout>
  );
}

const metaInput: React.CSSProperties = {
  fontSize: 12, padding: "4px 6px", border: "1px solid #ddd", borderRadius: 3,
};
