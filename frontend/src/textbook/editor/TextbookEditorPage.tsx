/**
 * 교재 비주얼 에디터 메인 페이지.
 * 좌(페이지 트리) / 중앙(A4 미리보기) / 우(Inspector + Palette) 3패널.
 */
import { useMemo } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
// @ts-ignore — JS 모듈
import AdminLayout from "../../components/AdminLayout";
import { PagePreview } from "../renderer/PagePreview";
import { useTextbookEditor } from "./useTextbookEditor";
import { BlockPalette } from "./BlockPalette";
import { BlockInspector } from "./BlockInspector";
import "../../styles/textbook-preview.css";
import "../../styles/test-paper.css";
import "../../styles/layout-editor.css";
import "../../styles/admin-detail.css";

export default function TextbookEditorPage() {
  const params = useParams<{ textbookId?: string }>();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const textbookId = params.textbookId ?? "new";
  const orgId = search.get("orgId");
  const ed = useTextbookEditor(textbookId, orgId);

  const currentPage = useMemo(() => {
    if (!ed.textbook || !ed.selectedPageId) return null;
    return ed.textbook.pages.find((p) => p.pageId === ed.selectedPageId) ?? null;
  }, [ed.textbook, ed.selectedPageId]);

  const selectedBlock = useMemo(() => {
    if (!currentPage || ed.selectedBlockIndex == null) return null;
    return currentPage.blocks[ed.selectedBlockIndex] ?? null;
  }, [currentPage, ed.selectedBlockIndex]);

  if (ed.loading) return <AdminLayout><div style={{ padding: 24 }}>로딩 중…</div></AdminLayout>;
  if (ed.error)   return <AdminLayout><div style={{ padding: 24, color: "#c0392b" }}>오류: {ed.error}</div></AdminLayout>;
  if (!ed.textbook) return <AdminLayout><div style={{ padding: 24 }}>교재를 불러올 수 없습니다.</div></AdminLayout>;

  const tb = ed.textbook;
  const currentPageIndex = currentPage ? tb.pages.findIndex((p) => p.pageId === currentPage.pageId) : -1;

  return (
    <AdminLayout>
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 320px", height: "calc(100vh - 60px)" }}>
      {/* 좌 — 메타 패널 + 페이지 트리 */}
      <aside style={{ borderRight: "1px solid #ddd", overflowY: "auto", padding: 10, background: "#fafafa" }}>
        <button className="admin-detail-btn secondary sm"
                onClick={() => navigate("/admin/textbooks")}
                type="button"
                style={{ width: "100%", marginBottom: 10 }}>
          ← 목록
        </button>

        {/* 교재 메타 */}
        <details open style={{ marginBottom: 12, border: "1px solid #e2e2e0", borderRadius: 4, background: "#fff" }}>
          <summary style={{ padding: "6px 8px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            교재 메타
          </summary>
          <div style={{ padding: 8, display: "grid", gap: 6 }}>
            <MetaField label="제목">
              <input type="text" value={tb.title}
                     onChange={(e) => ed.updateMeta({ title: e.target.value })}
                     style={fieldStyle} />
            </MetaField>
            <MetaField label="시리즈">
              <select value={tb.series}
                      onChange={(e) => ed.updateMeta({ series: e.target.value as any })}
                      style={fieldStyle}>
                <option value="saussure">소쉬르</option>
                <option value="frege">프레게</option>
                <option value="russell">러셀</option>
                <option value="wittgenstein">비트겐슈타인</option>
                <option value="custom">맞춤</option>
              </select>
            </MetaField>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              <MetaField label="레벨">
                <input type="number" min={1} max={12} value={tb.level ?? 1}
                       onChange={(e) => ed.updateMeta({ level: parseInt(e.target.value || "1", 10) })}
                       style={fieldStyle} />
              </MetaField>
              <MetaField label="권">
                <input type="number" min={1} value={tb.volume ?? 1}
                       onChange={(e) => ed.updateMeta({ volume: parseInt(e.target.value || "1", 10) })}
                       style={fieldStyle} />
              </MetaField>
            </div>
            <MetaField label="챕터 범위">
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <input type="number" min={1} value={tb.chapterRange?.[0] ?? 1}
                       onChange={(e) => {
                         const from = parseInt(e.target.value || "1", 10);
                         const to = tb.chapterRange?.[1] ?? from;
                         ed.setTextbook({ ...tb, chapterRange: [from, Math.max(from, to)] });
                       }}
                       style={{ ...fieldStyle, flex: 1 }} />
                <span style={{ fontSize: 11, color: "#666" }}>~</span>
                <input type="number" min={1} value={tb.chapterRange?.[1] ?? 4}
                       onChange={(e) => {
                         const to = parseInt(e.target.value || "1", 10);
                         const from = tb.chapterRange?.[0] ?? 1;
                         ed.setTextbook({ ...tb, chapterRange: [Math.min(from, to), to] });
                       }}
                       style={{ ...fieldStyle, flex: 1 }} />
              </div>
            </MetaField>
          </div>
        </details>

        <div style={{ fontSize: 11, color: "#666", marginBottom: 4, fontWeight: 600 }}>페이지 {tb.pages.length}장</div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {tb.pages.map((p, i) => (
            <li key={p.pageId}
              onClick={() => ed.selectPage(p.pageId)}
              style={{
                padding: "5px 8px", marginBottom: 2, borderRadius: 3, cursor: "pointer",
                background: p.pageId === ed.selectedPageId ? "#2d6a4f" : "transparent",
                color: p.pageId === ed.selectedPageId ? "#fff" : "#222",
                fontSize: 12, display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
              <span>p.{i + 1}</span>
              {tb.pages.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); ed.removePage(p.pageId); }}
                  style={{ background: "transparent", border: "none", color: "inherit",
                           cursor: "pointer", fontSize: 14, lineHeight: 1 }}
                  title="페이지 삭제"
                >×</button>
              )}
            </li>
          ))}
        </ul>
        <button className="admin-detail-btn sm"
                onClick={ed.addPage}
                type="button"
                style={{ width: "100%", marginTop: 8 }}>
          + 페이지 추가
        </button>
      </aside>

      {/* 중앙 — A4 미리보기 */}
      <main style={{ overflow: "auto", background: "#ddd", padding: 20 }}>
        <div style={{ marginBottom: 8, display: "flex", gap: 8, justifyContent: "center", alignItems: "center" }}>
          <button className="admin-detail-btn"
                  onClick={ed.save}
                  disabled={!ed.dirty || ed.saving}
                  type="button">
            {ed.saving ? "저장 중..." : "저장"}
          </button>
          {ed.dirty && <span style={{ color: "#e67e22", fontSize: 11 }}>변경됨</span>}
          {ed.saveMsg && <span style={{ color: "#2d6a4f", fontSize: 11 }}>{ed.saveMsg}</span>}
        </div>
        {currentPage && currentPageIndex >= 0 ? (
          <div onClick={(e) => {
            // 페이지 내 블록 클릭 → 선택. PagePreview 의 BlockSlot 이 data-block-index 부여.
            const el = (e.target as HTMLElement).closest("[data-block-index]");
            if (el) {
              const idx = parseInt(el.getAttribute("data-block-index") ?? "-1", 10);
              if (idx >= 0) ed.selectBlock(idx);
            } else {
              ed.selectBlock(null);
            }
          }}>
            <PagePreview
              page={currentPage}
              pageIndex={currentPageIndex}
              textbook={tb}
              selectedBlockIndex={ed.selectedBlockIndex}
              onBlockChange={(idx, patch) => ed.updateBlock(idx, patch)}
            />
          </div>
        ) : <div style={{ textAlign: "center", color: "#888" }}>페이지를 선택하세요</div>}
      </main>

      {/* 우 — Inspector + Palette */}
      <aside style={{ borderLeft: "1px solid #ddd", overflowY: "auto", background: "#f7f7f5" }}>
        {selectedBlock && ed.selectedBlockIndex != null ? (
          <BlockInspector
            block={selectedBlock}
            index={ed.selectedBlockIndex}
            onChange={(patch) => ed.selectedBlockIndex != null && ed.updateBlock(ed.selectedBlockIndex, patch)}
            onRemove={() => ed.selectedBlockIndex != null && ed.removeBlock(ed.selectedBlockIndex)}
            onMoveUp={ed.selectedBlockIndex > 0
              ? () => ed.moveBlock(ed.selectedBlockIndex!, ed.selectedBlockIndex! - 1)
              : undefined}
            onMoveDown={currentPage && ed.selectedBlockIndex < currentPage.blocks.length - 1
              ? () => ed.moveBlock(ed.selectedBlockIndex!, ed.selectedBlockIndex! + 1)
              : undefined}
          />
        ) : (
          <div style={{ padding: 12, fontSize: 11, color: "#888" }}>
            미리보기에서 블록을 클릭하면 편집 폼이 나타납니다.
          </div>
        )}
        <hr />
        <BlockPalette onAdd={(b) => ed.addBlock(b)} />
      </aside>
    </div>
    </AdminLayout>
  );
}

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "4px 6px",
  border: "1px solid #d4d4d4",
  borderRadius: 3,
  fontSize: 12,
  boxSizing: "border-box",
};

function MetaField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: "#666", marginBottom: 2 }}>{label}</div>
      {children}
    </div>
  );
}

