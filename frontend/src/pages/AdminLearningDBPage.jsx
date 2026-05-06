import { useEffect, useState, useCallback, useMemo } from "react";
import AdminLayout from "../components/AdminLayout";
import { useRequireRole } from "../hooks/useRequireRole";
import Toast from "../components/learning-db/Toast";
import LDBTreePanel from "../components/learning-db/LDBTreePanel";
import CorpusDetail, { AREAS, ITEM_TYPES, modalBackdrop, modalBox, Label, unwrap } from "../components/learning-db/CorpusDetail";
import PendingDetail from "../components/learning-db/PendingDetail";
import {
  searchCorpus, fetchCorpus, createCorpus,
  fetchPending, fetchPendingStats,
  classifyAll, importLegacy,
} from "../utils/learningCorpusApi";
import "../styles/learning-db.css";

/**
 * 학습자료 DB — 작품·지문 corpus 마스터 + 임시 체크포인트 풀.
 *
 * 좌측 트리: 영역(7) → 세부영역 → 작품·지문(파일처럼) + 별도 [임시 체크리스트] 폴더(파일처럼)
 * 우측 패널: 선택한 corpus 의 메타·본문·누적 항목 편집 / 또는 pending 의 분류·승인·거부
 */
function AdminLearningDBPage() {
  useRequireRole("HQ_ADMIN");
  const [corpusList, setCorpusList] = useState([]);
  const [pendingList, setPendingList] = useState([]);
  const [pendingStats, setPendingStats] = useState(null);
  const [loadingTree, setLoadingTree] = useState(false);
  const [selected, setSelected] = useState(null); // { kind: "corpus"|"pending", path, label, data }
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [toast, setToast] = useState(null);
  const [showCreateCorpus, setShowCreateCorpus] = useState(false);
  const [busy, setBusy] = useState(false);

  const reloadTree = useCallback(async () => {
    setLoadingTree(true);
    try {
      const [r1, r2, r3] = await Promise.all([
        searchCorpus({ size: 500 }),
        fetchPending("pending"),
        fetchPendingStats(),
      ]);
      setCorpusList(unwrap(r1) || []);
      setPendingList(unwrap(r2) || []);
      setPendingStats(unwrap(r3));
    } catch (e) {
      setToast({ msg: "트리 로드 실패: " + e.message, type: "error" });
    } finally {
      setLoadingTree(false);
    }
  }, []);

  useEffect(() => { reloadTree(); }, [reloadTree]);

  // ── 트리 빌드 — 영역 → 세부영역 → 작품(파일) + [임시 체크리스트] 폴더(파일들) ──
  const tree = useMemo(() => {
    const areaNodes = AREAS.map(a => {
      const corpusInArea = corpusList.filter(c => c.area === a.key);
      // 세부영역 distinct
      const subAreas = [...new Set(corpusInArea.map(c => c.subArea || "(미지정)"))].sort();
      const children = subAreas.map(sub => {
        const corpusInSub = corpusInArea.filter(c => (c.subArea || "(미지정)") === sub);
        return {
          type: "subArea",
          key: `${a.key}/${sub}`,
          label: sub,
          path: `area/${a.key}/${sub}`,
          children: corpusInSub.map(c => ({
            type: "file",
            key: c.id,
            label: c.title + (c.author ? ` — ${c.author}` : ""),
            path: `corpus/${c.id}`,
          })),
        };
      });
      return {
        type: "area",
        key: a.key,
        label: a.label,
        path: `area/${a.key}`,
        children,
      };
    });

    // 임시 체크리스트 폴더 — 파일처럼 노출
    const pendingNode = {
      type: "subArea",
      key: "__pending__",
      label: `임시 체크리스트${pendingStats?.pending ? ` (대기 ${pendingStats.pending})` : ""}`,
      path: "pending",
      children: pendingList.map(p => ({
        type: "file",
        key: p.id,
        label: p.textMd.slice(0, 60).replace(/\n/g, " ") + (p.textMd.length > 60 ? "…" : ""),
        path: `pending/${p.id}`,
      })),
    };

    return {
      type: "root",
      key: "root",
      label: "학습 자료",
      path: "",
      children: [...areaNodes, pendingNode],
    };
  }, [corpusList, pendingList, pendingStats]);

  // 항목 선택 ── path 형식: corpus/{id} 또는 pending/{id}
  const selectFile = async (path, label) => {
    setSelected({ path, label, data: null });
    setLoadingDetail(true);
    try {
      if (path.startsWith("corpus/")) {
        const id = path.replace("corpus/", "");
        const r = await fetchCorpus(id);
        setSelected({ kind: "corpus", path, label, data: unwrap(r) });
      } else if (path.startsWith("pending/")) {
        const id = path.replace("pending/", "");
        const found = pendingList.find(p => p.id === id);
        setSelected({ kind: "pending", path, label, data: found || null });
      }
    } catch (e) {
      setToast({ msg: "상세 로드 실패: " + e.message, type: "error" });
    } finally {
      setLoadingDetail(false);
    }
  };

  const refreshSelected = () => {
    if (!selected) return reloadTree();
    selectFile(selected.path, selected.label).then(reloadTree);
  };

  const handleClassifyAll = async () => {
    if (pendingList.length === 0) { setToast({ msg: "분류할 대기 항목이 없습니다", type: "info" }); return; }
    if (!window.confirm(`pending ${pendingList.length}건을 일괄 AI 분류합니다. 계속할까요?`)) return;
    setBusy(true);
    try {
      const r = await classifyAll();
      const d = unwrap(r);
      setToast({ msg: `분류 완료 — ${d.classified}/${d.total} 성공, 오류 ${d.errors}`, type: "success" });
      reloadTree();
    } catch (e) {
      setToast({ msg: "분류 실패: " + e.message, type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async () => {
    if (!window.confirm("./data/learning-data 폴더의 기존 JSON 파일을 corpus DB로 일괄 import 합니다. 계속할까요?")) return;
    setBusy(true);
    try {
      const r = await importLegacy(false);
      const d = unwrap(r);
      setToast({ msg: `import 완료 — corpus ${d.corpusCreated} / items ${d.itemsAdded} / 오류 ${d.errors?.length || 0}`, type: "success" });
      reloadTree();
    } catch (e) {
      setToast({ msg: "import 실패: " + e.message, type: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminLayout>
      <div className="ldb-page">
        <div className="ldb-v2-topbar">
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>학습자료 DB</h2>
            <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
              작품·지문 + 누적 항목(체크리스트·출제포인트·구절해석) + 임시 체크포인트 풀
              {pendingStats && (
                <span style={{ marginLeft: 8 }}>
                  · 대기 {pendingStats.pending} / 분류 {pendingStats.classified} / 승인 {pendingStats.approved}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="ldb-btn ldb-btn-primary" onClick={() => setShowCreateCorpus(true)}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 4 }}>add</span>
              + 작품·지문
            </button>
            <button className="ldb-btn ldb-btn-ghost" onClick={handleClassifyAll} disabled={busy}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 4 }}>auto_awesome</span>
              AI 일괄 분류
            </button>
            <button className="ldb-btn ldb-btn-ghost" onClick={handleImport} disabled={busy}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 4 }}>upload_file</span>
              Legacy import
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
                좌측에서 영역 → 세부영역 → 작품·지문 을 펼쳐 선택하세요.<br />
                또는 [임시 체크리스트] 폴더에서 분류 대기 항목을 골라 처리하세요.
              </div>
            )}
            {selected && loadingDetail && (
              <div className="ldb-editor-empty">불러오는 중…</div>
            )}
            {selected && !loadingDetail && selected.kind === "corpus" && selected.data && (
              <CorpusDetail
                detail={selected.data}
                onChanged={refreshSelected}
                onDeleted={() => { setSelected(null); reloadTree(); }}
                onToast={setToast}
              />
            )}
            {selected && !loadingDetail && selected.kind === "pending" && selected.data && (
              <PendingDetail
                pending={selected.data}
                onChanged={() => { setSelected(null); reloadTree(); }}
                onToast={setToast}
              />
            )}
          </div>
        </div>

        {showCreateCorpus && (
          <CorpusCreateModal
            onClose={() => setShowCreateCorpus(false)}
            onCreated={(id) => {
              setShowCreateCorpus(false);
              setToast({ msg: "작품·지문 생성됨", type: "success" });
              reloadTree();
              if (id) selectFile(`corpus/${id}`, "");
            }}
          />
        )}
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </AdminLayout>
  );
}

function CorpusCreateModal({ onClose, onCreated }) {
  const [draft, setDraft] = useState({ area: "literature", title: "" });
  const submit = async () => {
    if (!draft.title?.trim()) { alert("제목을 입력하세요"); return; }
    try {
      const r = await createCorpus(draft);
      const ent = unwrap(r);
      onCreated?.(ent?.id);
    } catch (e) {
      alert("생성 실패: " + e.message);
    }
  };
  return (
    <div style={modalBackdrop} onClick={onClose}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <h3>작품·지문 추가</h3>
        <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 8 }}>
          <Label>영역 *</Label>
          <select value={draft.area} onChange={e => setDraft(d => ({ ...d, area: e.target.value }))}>
            {AREAS.map(a => <option key={a.key} value={a.key}>{a.label}</option>)}
          </select>
          <Label>세부영역</Label>
          <input value={draft.subArea || ""} onChange={e => setDraft(d => ({ ...d, subArea: e.target.value }))} placeholder="현대시 / 고전시 / 논설 등" />
          <Label>제목 *</Label>
          <input value={draft.title || ""} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} />
          <Label>출처</Label>
          <input value={draft.source || ""} onChange={e => setDraft(d => ({ ...d, source: e.target.value }))} />
          <Label>작가</Label>
          <input value={draft.author || ""} onChange={e => setDraft(d => ({ ...d, author: e.target.value }))} />
          <Label>시대</Label>
          <input value={draft.era || ""} onChange={e => setDraft(d => ({ ...d, era: e.target.value }))} />
          <Label>장르</Label>
          <input value={draft.genre || ""} onChange={e => setDraft(d => ({ ...d, genre: e.target.value }))} />
          <Label>주제</Label>
          <input value={draft.topic || ""} onChange={e => setDraft(d => ({ ...d, topic: e.target.value }))} />
          <Label>분야</Label>
          <input value={draft.field || ""} onChange={e => setDraft(d => ({ ...d, field: e.target.value }))} />
          <Label>본문(선택)</Label>
          <textarea rows={6} value={draft.bodyMd || ""} onChange={e => setDraft(d => ({ ...d, bodyMd: e.target.value }))} />
        </div>
        <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="ldb-btn ldb-btn-ghost" onClick={onClose}>취소</button>
          <button className="ldb-btn ldb-btn-primary" onClick={submit}>생성</button>
        </div>
      </div>
    </div>
  );
}

export default AdminLearningDBPage;
