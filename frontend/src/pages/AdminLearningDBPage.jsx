import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import Toast from "../components/learning-db/Toast";
import LDBTreePanel from "../components/learning-db/LDBTreePanel";
import LDBUploadModal from "../components/learning-db/LDBUploadModal";
import JsonVisualEditor from "../components/learning-db/JsonVisualEditor";
import {
  fetchCategories, fetchTree, fetchItem, saveItem, deleteItem
} from "../utils/learningDbApi";
import "../styles/learning-db.css";

function AdminLearningDBPage() {
  const [categories, setCategories] = useState([]);
  const [trees, setTrees] = useState({});
  const [loadingCats, setLoadingCats] = useState(new Set());
  const [selected, setSelected] = useState(null); // { category, id, label, fullNodeId, data, dirty }
  const [loadingItem, setLoadingItem] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [toast, setToast] = useState(null);

  const loadCategories = () => {
    fetchCategories()
      .then(res => setCategories(res?.data || []))
      .catch(e => setToast({ msg: "카테고리 로드 실패: " + e.message, type: "error" }));
  };
  useEffect(loadCategories, []);

  const expandCategory = async (catKey, force = false) => {
    if (!force && trees[catKey]) return;
    setLoadingCats(prev => new Set(prev).add(catKey));
    try {
      const res = await fetchTree(catKey);
      setTrees(prev => ({ ...prev, [catKey]: res?.data }));
    } catch (e) {
      setToast({ msg: `'${catKey}' 트리 로드 실패: ${e.message}`, type: "error" });
    } finally {
      setLoadingCats(prev => {
        const next = new Set(prev);
        next.delete(catKey);
        return next;
      });
    }
  };

  const selectItem = async (catKey, itemId, label, fullNodeId) => {
    if (selected?.dirty) {
      if (!window.confirm("저장하지 않은 변경사항이 있습니다. 무시하고 다른 항목을 열까요?")) return;
    }
    setSelected({ category: catKey, id: itemId, label, fullNodeId, data: null, dirty: false });
    setLoadingItem(true);
    try {
      const res = await fetchItem(catKey, itemId);
      setSelected({ category: catKey, id: itemId, label, fullNodeId, data: res?.data?.data, dirty: false });
    } catch (e) {
      setToast({ msg: `항목 로드 실패: ${e.message}`, type: "error" });
    } finally {
      setLoadingItem(false);
    }
  };

  const onEditorChange = (next) => {
    setSelected(s => s ? { ...s, data: next, dirty: true } : null);
  };

  const handleSave = async () => {
    if (!selected || !selected.data) return;
    const cat = categories.find(c => c.key === selected.category);
    if (cat?.readOnly) {
      setToast({ msg: "이 카테고리는 읽기 전용입니다", type: "error" });
      return;
    }
    setSaving(true);
    try {
      const res = await saveItem(selected.category, selected.id, selected.data);
      setSelected(s => s ? { ...s, dirty: false, id: res?.data?.id || s.id } : null);
      setToast({ msg: "저장 완료", type: "success" });
      // 트리 새로고침
      await expandCategory(selected.category, true);
    } catch (e) {
      setToast({ msg: "저장 실패: " + e.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    const cat = categories.find(c => c.key === selected.category);
    if (cat?.readOnly) {
      setToast({ msg: "이 카테고리는 읽기 전용입니다", type: "error" });
      return;
    }
    if (!window.confirm(`'${selected.label}' 항목을 삭제할까요? 되돌릴 수 없습니다.`)) return;
    setDeleting(true);
    try {
      await deleteItem(selected.category, selected.id);
      setToast({ msg: "삭제 완료", type: "success" });
      setSelected(null);
      await expandCategory(selected.category, true);
    } catch (e) {
      setToast({ msg: "삭제 실패: " + e.message, type: "error" });
    } finally {
      setDeleting(false);
    }
  };

  const onUploadDone = ({ category }) => {
    setToast({ msg: "업로드 완료", type: "success" });
    expandCategory(category, true);
  };

  const selectedCat = selected ? categories.find(c => c.key === selected.category) : null;
  const selectedReadOnly = selectedCat?.readOnly === true;

  return (
    <AdminLayout>
      <div className="ldb-page">
        <div className="ldb-v2-topbar">
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>학습 자료DB</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="ldb-btn ldb-btn-primary"
              onClick={() => setShowUpload(true)}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 4 }}>upload</span>
              JSON 업로드
            </button>
          </div>
        </div>
        <div className="ldb-v2-workspace">
          <LDBTreePanel
            categories={categories}
            trees={trees}
            loadingCats={loadingCats}
            onExpand={expandCategory}
            onSelectItem={selectItem}
            selectedNodeId={selected?.fullNodeId || null}
          />
          <div className="ldb-v2-editor">
            {!selected && (
              <div className="ldb-editor-empty">
                좌측 트리에서 항목을 선택하거나 우측 상단 [JSON 업로드] 로 새 자료를 추가하세요.
              </div>
            )}
            {selected && loadingItem && (
              <div className="ldb-editor-empty">불러오는 중...</div>
            )}
            {selected && !loadingItem && selected.data !== null && selected.data !== undefined && (
              <JsonVisualEditor
                data={typeof selected.data === "object" && selected.data !== null && !Array.isArray(selected.data)
                  ? selected.data
                  : { 값: selected.data }}
                onChange={onEditorChange}
                title={selected.label}
                actions={
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="ldb-pill">{selected.category}</span>
                    {selectedReadOnly && <span className="ldb-pill" style={{ background: "#fdecea", color: "#c0392b" }}>읽기 전용</span>}
                    {selected.dirty && <span className="ldb-pill" style={{ background: "#fff3cd", color: "#856404" }}>변경됨</span>}
                    {!selectedReadOnly && (
                      <>
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
                      </>
                    )}
                  </div>
                }
              />
            )}
          </div>
        </div>
        {showUpload && (
          <LDBUploadModal
            categories={categories}
            onClose={() => setShowUpload(false)}
            onDone={(payload) => { setShowUpload(false); onUploadDone(payload); }}
          />
        )}
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </AdminLayout>
  );
}

export default AdminLearningDBPage;
