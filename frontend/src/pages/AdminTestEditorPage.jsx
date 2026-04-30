import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import TestPaperDocEditor from "../components/editor/testpaper/TestPaperDocEditor";
import { useTestEditor } from "../hooks/useTestEditor";
import { apiPut } from "../utils/adminApi";
import { LEVEL_LABELS } from "../constants/levels";
import "../styles/test-storage.css";
import "../styles/content-editor.css";
import "../styles/dailyquiz-doc-editor.css";

const KIND_LABEL = { diagnostic: "진단", chapter: "챕터", misc: "기타" };

/**
 * 시험지 비주얼 에디터 페이지.
 * UI: 콘텐츠 에디터(.ce-*)와 일관된 스타일.
 */
export default function AdminTestEditorPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const editor = useTestEditor(testId === "undefined" ? null : testId);
  const [showJson, setShowJson] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState("");

  // 메타 편집 상태
  const [metaForm, setMetaForm] = useState(null);
  const [metaSaving, setMetaSaving] = useState(false);
  const [metaSaveMsg, setMetaSaveMsg] = useState("");

  useEffect(() => {
    if (editor.meta && metaForm == null) {
      setMetaForm({
        title: editor.meta.title || "",
        levelId: editor.meta.levelId || "",
        timeLimitMinutes: editor.meta.timeLimitMinutes ?? "",
        series: editor.meta.series || "",
        description: editor.meta.description || "",
      });
    }
  }, [editor.meta, metaForm]);

  if (!testId || testId === "undefined") {
    navigate("/admin/tests");
    return null;
  }

  const handleToggleJson = () => {
    if (!showJson) {
      setJsonText(JSON.stringify(editor.content || {}, null, 2));
      setJsonError("");
    } else {
      try {
        const parsed = JSON.parse(jsonText);
        editor.setContentDirect(parsed);
        setJsonError("");
      } catch (e) {
        setJsonError("JSON 파싱 오류: " + (e.message || ""));
        return;
      }
    }
    setShowJson(!showJson);
  };

  const saveMeta = async () => {
    if (!metaForm) return;
    setMetaSaving(true);
    setMetaSaveMsg("");
    try {
      await apiPut(`/v1/admin/test-papers/${testId}`, {
        title: metaForm.title,
        levelId: metaForm.levelId || null,
        timeLimitMinutes: metaForm.timeLimitMinutes === "" ? null : Number(metaForm.timeLimitMinutes),
        series: metaForm.series || null,
        description: metaForm.description || null,
      });
      setMetaSaveMsg("저장됨");
      setTimeout(() => setMetaSaveMsg(""), 2500);
    } catch (e) {
      alert("메타 저장 실패: " + (e.message || ""));
    } finally {
      setMetaSaving(false);
    }
  };

  if (editor.loading) {
    return (
      <AdminLayout>
        <div style={{ padding: 24, color: "var(--text)" }}>로딩 중...</div>
      </AdminLayout>
    );
  }
  if (editor.error && !editor.content) {
    return (
      <AdminLayout>
        <div style={{ padding: 24, color: "var(--text)" }}>
          {editor.error}
          <div style={{ marginTop: 12 }}>
            <Link to="/admin/tests" className="ts-back-link">← 시험 관리</Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const meta = editor.meta || {};
  const totalQ = (editor.content?.questions || []).length;

  return (
    <AdminLayout>
      <div className="ce-shell" style={{ flexDirection: "column" }}>
        {/* 상단 툴바 — 콘텐츠 에디터와 동일 */}
        <div className="ce-toolbar">
          <Link to="/admin/tests" className="ts-back-link" style={{ marginRight: 12, fontSize: 13 }}>
            ← 시험 관리
          </Link>
          <div className="ce-toolbar-title">
            <strong>{meta.title || "(제목 없음)"}</strong>
            <span className="ce-toolbar-badge">{totalQ}문항</span>
            {editor.dirty && <span className="ce-toolbar-badge dirty">저장 필요</span>}
            {editor.saveMsg && <span className="ce-toolbar-badge">{editor.saveMsg}</span>}
          </div>
          <Link to={`/admin/tests/${testId}/statistics`} className="ce-btn ce-btn-secondary" style={{ textDecoration: "none" }}>
            통계 보기
          </Link>
          <button className="ce-btn ce-btn-secondary" onClick={editor.undo} disabled={!editor.canUndo}>
            ↶ Undo
          </button>
          <button className="ce-btn ce-btn-secondary" onClick={handleToggleJson}>
            {showJson ? "비주얼" : "JSON"}
          </button>
          <button
            className="ce-btn ce-btn-primary"
            onClick={editor.save}
            disabled={editor.saving || !editor.dirty}
          >{editor.saving ? "저장 중..." : "본문 저장"}</button>
        </div>

        {/* 본문 영역 — 메타 + 에디터를 같은 max-width 컨테이너 */}
        <div style={{
          flex: 1, overflow: "auto",
          padding: 20,
          background: "var(--bg)",
        }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            {/* 메타 정보 */}
            {metaForm && (
              <div style={{
                background: "var(--panel)", border: "1px solid var(--stroke)", borderRadius: 8,
                padding: 14, marginBottom: 14,
              }}>
                <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
                  <strong style={{ color: "var(--text)", fontSize: 13 }}>📝 시험지 메타 정보</strong>
                  <span style={{ flex: 1 }} />
                  {metaSaveMsg && <span style={{ marginRight: 8, color: "#86efac", fontSize: 12 }}>{metaSaveMsg}</span>}
                  <button onClick={saveMeta} disabled={metaSaving} className="ce-btn ce-btn-primary" style={{ padding: "4px 12px", fontSize: 12 }}>
                    {metaSaving ? "저장 중..." : "메타 저장"}
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                  <Field label="제목 *">
                    <input value={metaForm.title} onChange={(e) => setMetaForm({ ...metaForm, title: e.target.value })} style={metaInpStyle} />
                  </Field>
                  <Field label="시험 종류">
                    <select
                      value={metaForm.series || ""}
                      onChange={(e) => setMetaForm({ ...metaForm, series: e.target.value })}
                      style={metaInpStyle}
                    >
                      <option value="">기타</option>
                      <option value="diagnostic">진단</option>
                      <option value="chapter">챕터</option>
                    </select>
                  </Field>
                  <Field label="레벨">
                    <select
                      value={metaForm.levelId || ""}
                      onChange={(e) => setMetaForm({ ...metaForm, levelId: e.target.value })}
                      style={metaInpStyle}
                    >
                      <option value="">레벨 선택</option>
                      {Object.entries(LEVEL_LABELS).map(([id, label]) => (
                        <option key={id} value={id}>{label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="시간 제한 (분)">
                    <input type="number" value={metaForm.timeLimitMinutes} onChange={(e) => setMetaForm({ ...metaForm, timeLimitMinutes: e.target.value })} style={metaInpStyle} placeholder="비워두면 무제한" />
                  </Field>
                  <Field label="설명" full>
                    <input value={metaForm.description} onChange={(e) => setMetaForm({ ...metaForm, description: e.target.value })} style={metaInpStyle} />
                  </Field>
                </div>
              </div>
            )}

            {/* 본문 (에디터 / JSON) */}
            <div style={{
              background: "var(--panel)", border: "1px solid var(--stroke)", borderRadius: 8,
              padding: 14,
            }}>
              {showJson ? (
                <>
                  {jsonError && <div style={{ color: "#ef4444", marginBottom: 8, fontSize: 12 }}>{jsonError}</div>}
                  <textarea
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    style={{
                      width: "100%", height: "70vh", fontFamily: "monospace", fontSize: 12,
                      padding: 12, border: "1px solid var(--stroke)", borderRadius: 6,
                      background: "var(--bg)", color: "var(--text)",
                    }}
                  />
                </>
              ) : (
                <TestPaperDocEditor editor={editor} />
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function Field({ label, children, full }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, gridColumn: full ? "1 / -1" : undefined }}>
      <span style={{ fontSize: 11, color: "var(--muted)" }}>{label}</span>
      {children}
    </label>
  );
}

const metaInpStyle = {
  padding: "6px 10px", fontSize: 13,
  background: "var(--bg)", color: "var(--text)",
  border: "1px solid var(--stroke)", borderRadius: 4,
};
