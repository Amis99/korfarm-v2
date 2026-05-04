import { useEffect, useState, useCallback } from "react";
import AdminLayout from "../components/AdminLayout";
import { useRequireRole } from "../hooks/useRequireRole";
import Toast from "../components/learning-db/Toast";
import LDBTreePanel from "../components/learning-db/LDBTreePanel";
import LDBNewFileModal from "../components/learning-db/LDBNewFileModal";
import LDBUploadModal from "../components/learning-db/LDBUploadModal";
import JsonVisualEditor from "../components/learning-db/JsonVisualEditor";
import {
  fetchMeta, fetchTree, fetchFile, saveFile, deleteFile
} from "../utils/learningDbApi";
import "../styles/learning-db.css";

function AdminLearningDBPage() {
  useRequireRole("HQ_ADMIN");
  const [meta, setMeta] = useState({ areas: [], kinds: [] });
  const [tree, setTree] = useState(null);
  const [loadingTree, setLoadingTree] = useState(false);
  const [selected, setSelected] = useState(null); // { path, label, data, dirty }
  const [loadingFile, setLoadingFile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [toast, setToast] = useState(null);

  const reloadTree = useCallback(async () => {
    setLoadingTree(true);
    try {
      const res = await fetchTree();
      const t = res?.children !== undefined ? res : res?.data;
      setTree(t);
    } catch (e) {
      setToast({ msg: "트리 로드 실패: " + e.message, type: "error" });
    } finally {
      setLoadingTree(false);
    }
  }, []);

  useEffect(() => {
    fetchMeta()
      .then(res => {
        const m = res?.areas !== undefined ? res : res?.data;
        setMeta(m || { areas: [], kinds: [] });
      })
      .catch(e => setToast({ msg: "메타 로드 실패: " + e.message, type: "error" }));
    reloadTree();
  }, [reloadTree]);

  const selectFile = async (path, label) => {
    if (selected?.dirty) {
      if (!window.confirm("저장하지 않은 변경사항이 있습니다. 무시하고 다른 파일을 열까요?")) return;
    }
    setSelected({ path, label, data: null, dirty: false });
    setLoadingFile(true);
    try {
      const res = await fetchFile(path);
      // safeJson 이 풀어준 raw JSON (객체/배열/원시값)
      setSelected({ path, label, data: res, dirty: false });
    } catch (e) {
      setToast({ msg: "파일 로드 실패: " + e.message, type: "error" });
    } finally {
      setLoadingFile(false);
    }
  };

  const onEditorChange = (next) => {
    setSelected(s => s ? { ...s, data: next, dirty: true } : null);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await saveFile(selected.path, selected.data);
      setSelected(s => s ? { ...s, dirty: false } : null);
      setToast({ msg: "저장 완료", type: "success" });
      reloadTree();
    } catch (e) {
      setToast({ msg: "저장 실패: " + e.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!window.confirm(`'${selected.label}' 파일을 삭제할까요? 되돌릴 수 없습니다.`)) return;
    setDeleting(true);
    try {
      await deleteFile(selected.path);
      setToast({ msg: "삭제 완료", type: "success" });
      setSelected(null);
      reloadTree();
    } catch (e) {
      setToast({ msg: "삭제 실패: " + e.message, type: "error" });
    } finally {
      setDeleting(false);
    }
  };

  const onCreated = ({ path, label }) => {
    setShowNew(false);
    setToast({ msg: "새 파일 생성됨", type: "success" });
    reloadTree();
    selectFile(path, label);
  };

  const onUploaded = () => {
    setShowUpload(false);
    setToast({ msg: "업로드 완료", type: "success" });
    reloadTree();
  };

  // 비주얼 에디터에 보낼 data — 객체가 아니면 wrapping
  const editorData = (() => {
    if (!selected || selected.data === null || selected.data === undefined) return null;
    if (typeof selected.data === "object" && !Array.isArray(selected.data)) return selected.data;
    return { 값: selected.data };
  })();

  return (
    <AdminLayout>
      <div className="ldb-page">
        <div className="ldb-v2-topbar">
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>학습 자료DB</h2>
            <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
              영역·세부영역별 raw 자료(해설서·문제은행·문제분석)
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="ldb-btn ldb-btn-primary" onClick={() => setShowNew(true)}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 4 }}>add</span>
              새 JSON 만들기
            </button>
            <button type="button" className="ldb-btn ldb-btn-ghost" onClick={() => setShowUpload(true)}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 4 }}>upload</span>
              업로드
            </button>
          </div>
        </div>
        <div className="ldb-v2-workspace">
          <LDBTreePanel
            tree={tree}
            loading={loadingTree}
            onSelectFile={selectFile}
            selectedPath={selected?.path || null}
          />
          <div className="ldb-v2-editor">
            {!selected && (
              <div className="ldb-editor-empty">
                좌측에서 영역 → 세부영역 → 자료종류 를 펼쳐 파일을 선택하세요.<br />
                또는 우측 상단 [새 JSON 만들기] 로 시작하세요.
              </div>
            )}
            {selected && loadingFile && (
              <div className="ldb-editor-empty">불러오는 중...</div>
            )}
            {selected && !loadingFile && editorData && (
              <JsonVisualEditor
                data={editorData}
                onChange={onEditorChange}
                title={selected.label}
                actions={
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="ldb-pill" title={selected.path}>{selected.path}</span>
                    {selected.dirty && (
                      <span className="ldb-pill" style={{ background: "#fff3cd", color: "#856404" }}>변경됨</span>
                    )}
                    <button type="button" className="ldb-btn ldb-btn-primary"
                      disabled={saving || !selected.dirty}
                      onClick={handleSave}>
                      {saving ? "저장 중…" : "저장"}
                    </button>
                    <button type="button" className="ldb-btn ldb-btn-ghost"
                      disabled={deleting}
                      onClick={handleDelete}
                      style={{ color: "#c0392b" }}>
                      {deleting ? "삭제 중…" : "삭제"}
                    </button>
                  </div>
                }
              />
            )}
          </div>
        </div>
        {showNew && (
          <LDBNewFileModal
            meta={meta}
            tree={tree}
            onClose={() => setShowNew(false)}
            onCreated={onCreated}
          />
        )}
        {showUpload && (
          <LDBUploadModal
            meta={meta}
            tree={tree}
            onClose={() => setShowUpload(false)}
            onDone={onUploaded}
          />
        )}
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </AdminLayout>
  );
}

export default AdminLearningDBPage;
