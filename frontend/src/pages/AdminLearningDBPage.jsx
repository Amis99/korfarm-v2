import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import Toast from "../components/learning-db/Toast";
import LDBManuscriptTab from "../components/learning-db/LDBManuscriptTab";
import LDBExamTab from "../components/learning-db/LDBExamTab";
import LDBCommentaryTab from "../components/learning-db/LDBCommentaryTab";
import LDBQuestionBankTab from "../components/learning-db/LDBQuestionBankTab";
import LDBTreePanel from "../components/learning-db/LDBTreePanel";
import JsonVisualEditor from "../components/learning-db/JsonVisualEditor";
import { fetchCategories, fetchTree, fetchItem } from "../utils/learningDbApi";
import "../styles/learning-db.css";
import "../styles/question-bank.css";

const TABS = [
  { key: "manuscripts", label: "교재 원고", icon: "auto_stories" },
  { key: "exams", label: "시험지", icon: "assignment" },
  { key: "commentary", label: "해설서", icon: "menu_book" },
  { key: "question-bank", label: "문제은행", icon: "quiz" },
];

// ─── v2 워크스페이스 (좌측 트리 + 우측 비주얼 에디터) ───
function LdbV2Workspace({ setToast }) {
  const [categories, setCategories] = useState([]);
  const [trees, setTrees] = useState({});
  const [loadingCats, setLoadingCats] = useState(new Set());
  const [selected, setSelected] = useState(null);
  const [loadingItem, setLoadingItem] = useState(false);

  useEffect(() => {
    fetchCategories()
      .then(res => setCategories(res?.data || []))
      .catch(e => setToast?.({ msg: "카테고리 로드 실패: " + e.message, type: "error" }));
  }, [setToast]);

  const expandCategory = async (catKey) => {
    if (trees[catKey]) return;
    setLoadingCats(prev => new Set(prev).add(catKey));
    try {
      const res = await fetchTree(catKey);
      setTrees(prev => ({ ...prev, [catKey]: res?.data }));
    } catch (e) {
      setToast?.({ msg: `'${catKey}' 트리 로드 실패: ${e.message}`, type: "error" });
    } finally {
      setLoadingCats(prev => {
        const next = new Set(prev);
        next.delete(catKey);
        return next;
      });
    }
  };

  const selectItem = async (catKey, itemId, label, fullNodeId) => {
    setSelected({ category: catKey, id: itemId, label, fullNodeId, data: null });
    setLoadingItem(true);
    try {
      const res = await fetchItem(catKey, itemId);
      setSelected({ category: catKey, id: itemId, label, fullNodeId, data: res?.data?.data });
    } catch (e) {
      setToast?.({ msg: `항목 로드 실패: ${e.message}`, type: "error" });
    } finally {
      setLoadingItem(false);
    }
  };

  return (
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
          <div className="ldb-editor-empty">좌측 트리에서 항목을 선택하세요.</div>
        )}
        {selected && loadingItem && (
          <div className="ldb-editor-empty">불러오는 중...</div>
        )}
        {selected && !loadingItem && selected.data && (
          <JsonVisualEditor
            data={typeof selected.data === "object" && selected.data !== null && !Array.isArray(selected.data)
              ? selected.data
              : { 값: selected.data }}
            onChange={() => {}}
            title={selected.label}
            actions={
              <span className="ldb-pill">{selected.category} · 읽기 전용 (1차)</span>
            }
          />
        )}
        {selected && !loadingItem && !selected.data && (
          <div className="ldb-editor-empty">데이터가 비어 있습니다.</div>
        )}
      </div>
    </div>
  );
}

function AdminLearningDBPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const layout = searchParams.get("layout") || "v1";
  const activeTab = searchParams.get("tab") || "manuscripts";
  const [toast, setToast] = useState(null);

  const handleTabChange = (key) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", key);
    setSearchParams(next);
  };

  const switchLayout = (target) => {
    const next = new URLSearchParams(searchParams);
    if (target === "v2") next.set("layout", "v2");
    else next.delete("layout");
    setSearchParams(next);
  };

  if (layout === "v2") {
    return (
      <AdminLayout>
        <div className="ldb-page">
          <div className="ldb-v2-topbar">
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              학습 자료DB <span className="ldb-pill" style={{ marginLeft: 6 }}>v2 베타</span>
            </h2>
            <button type="button" className="ldb-btn ldb-btn-ghost" onClick={() => switchLayout("v1")}>
              구버전(4탭)으로
            </button>
          </div>
          <LdbV2Workspace setToast={setToast} />
        </div>
        {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="ldb-page">
        <div className="ldb-tabs">
          {TABS.map(t => (
            <button key={t.key}
              className={`ldb-tab ${activeTab === t.key ? "active" : ""}`}
              onClick={() => handleTabChange(t.key)}>
              <span className="material-symbols-outlined">{t.icon}</span>
              {t.label}
            </button>
          ))}
          <button type="button" className="ldb-btn ldb-btn-ghost"
            style={{ marginLeft: "auto" }}
            onClick={() => switchLayout("v2")}>
            새 통합 화면(v2 베타) →
          </button>
        </div>

        {activeTab === "manuscripts" && <LDBManuscriptTab setToast={setToast} />}
        {activeTab === "exams" && <LDBExamTab setToast={setToast} />}
        {activeTab === "commentary" && <LDBCommentaryTab setToast={setToast} />}
        {activeTab === "question-bank" && <LDBQuestionBankTab />}
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </AdminLayout>
  );
}

export default AdminLearningDBPage;
