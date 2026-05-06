import { useEffect, useState, useCallback } from "react";
import AdminLayout from "../components/AdminLayout";
import { useRequireRole } from "../hooks/useRequireRole";
import {
  searchCorpus, fetchCorpus, createCorpus, updateCorpus, deleteCorpus,
  addItem, updateItem, deleteItem,
  fetchPending, fetchPendingStats,
  classifyOne, classifyAll, approvePending, rejectPending, extractPending,
  importLegacy,
} from "../utils/learningCorpusApi";

const AREAS = [
  { key: "reading", label: "독서(비문학)" },
  { key: "literature", label: "문학" },
  { key: "grammar", label: "문법" },
  { key: "vocab", label: "어휘" },
  { key: "speaking", label: "화법" },
  { key: "writing", label: "작문" },
  { key: "media", label: "매체" },
];

const ITEM_TYPES = [
  { key: "checkpoint", label: "체크리스트" },
  { key: "exam_point", label: "출제 포인트" },
  { key: "passage_note", label: "구절 해석" },
  { key: "background", label: "배경지식" },
  { key: "character", label: "등장인물" },
  { key: "vocabulary", label: "어휘" },
  { key: "other", label: "기타" },
];

function unwrap(res) {
  return res?.data ?? res;
}

export default function AdminLearningCorpusPage() {
  useRequireRole("HQ_ADMIN");
  const [tab, setTab] = useState("corpus");

  return (
    <AdminLayout>
      <div style={{ padding: 16 }}>
        <h2 style={{ margin: 0 }}>학습 자료 DB v2 — 작품·지문</h2>
        <p style={{ color: "#666", marginTop: 4 }}>
          작품·지문 단위로 누적되는 학습 자료 마스터. 체크리스트·출제포인트·구절해석을 영역별로 누적해 AI 출제·교재 빌드에 활용.
        </p>

        <div style={{ display: "flex", gap: 8, borderBottom: "1px solid #ddd", marginTop: 16 }}>
          {[
            { key: "corpus", label: "작품·지문 DB" },
            { key: "pending", label: "임시 체크포인트 풀" },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: "8px 16px",
                background: tab === t.key ? "#fff" : "#f3f4f6",
                border: "1px solid #ddd",
                borderBottom: tab === t.key ? "1px solid #fff" : "1px solid #ddd",
                marginBottom: -1,
                cursor: "pointer",
                fontWeight: tab === t.key ? 700 : 400,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          {tab === "corpus" && <CorpusTab />}
          {tab === "pending" && <PendingTab />}
        </div>
      </div>
    </AdminLayout>
  );
}

// ─────────────────────────────────────────────
// 작품·지문 DB 탭
// ─────────────────────────────────────────────
function CorpusTab() {
  const [filter, setFilter] = useState({ area: "", subArea: "", keyword: "" });
  const [list, setList] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [importing, setImporting] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const r = await searchCorpus({ ...filter, size: 100 });
      setList(unwrap(r) || []);
    } catch (e) {
      alert("로드 실패: " + e.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { reload(); }, [reload]);

  const loadDetail = async (id) => {
    setSelectedId(id);
    if (!id) { setDetail(null); return; }
    try {
      const r = await fetchCorpus(id);
      setDetail(unwrap(r));
    } catch (e) {
      alert("상세 로드 실패: " + e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("정말 삭제할까요? (soft delete — archived 처리)")) return;
    try {
      await deleteCorpus(id);
      if (selectedId === id) { setSelectedId(null); setDetail(null); }
      reload();
    } catch (e) {
      alert("삭제 실패: " + e.message);
    }
  };

  const handleImport = async () => {
    if (!window.confirm("./data/learning-data 폴더의 기존 JSON 파일들을 corpus DB로 일괄 import 합니다. 계속할까요?")) return;
    setImporting(true);
    try {
      const r = await importLegacy(false);
      const d = unwrap(r);
      alert(`import 완료\n- 스캔: ${d.scanned}\n- corpus 생성: ${d.corpusCreated}\n- items 추가: ${d.itemsAdded}\n- 오류: ${d.errors?.length || 0}`);
      reload();
    } catch (e) {
      alert("import 실패: " + e.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 16 }}>
      {/* 좌측 — 검색 + 목록 */}
      <div>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <button onClick={() => setShowCreate(true)} style={btnPrimary}>+ 작품·지문 추가</button>
          <button onClick={handleImport} disabled={importing} style={btnSecondary}>
            {importing ? "import…" : "Legacy import"}
          </button>
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
          <select
            value={filter.area}
            onChange={e => setFilter(f => ({ ...f, area: e.target.value }))}
            style={{ padding: 6 }}
          >
            <option value="">영역 전체</option>
            {AREAS.map(a => <option key={a.key} value={a.key}>{a.label}</option>)}
          </select>
          <input
            placeholder="검색어 (제목·작가·주제)"
            value={filter.keyword}
            onChange={e => setFilter(f => ({ ...f, keyword: e.target.value }))}
            style={{ flex: 1, padding: 6 }}
          />
        </div>
        <div style={{ border: "1px solid #ddd", maxHeight: "70vh", overflowY: "auto" }}>
          {loading && <div style={{ padding: 12, color: "#666" }}>로딩…</div>}
          {!loading && list.length === 0 && (
            <div style={{ padding: 12, color: "#999" }}>작품·지문이 없습니다.</div>
          )}
          {list.map(c => (
            <div
              key={c.id}
              onClick={() => loadDetail(c.id)}
              style={{
                padding: 8,
                borderBottom: "1px solid #eee",
                cursor: "pointer",
                background: selectedId === c.id ? "#eff6ff" : "transparent",
              }}
            >
              <div style={{ fontSize: 11, color: "#888" }}>
                {AREAS.find(a => a.key === c.area)?.label || c.area}
                {c.subArea ? ` · ${c.subArea}` : ""}
              </div>
              <div style={{ fontWeight: 600 }}>{c.title}</div>
              <div style={{ fontSize: 11, color: "#666" }}>
                {[c.author, c.era, c.genre, c.field].filter(Boolean).join(" / ")}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 우측 — 상세 + 항목 누적 */}
      <div>
        {!detail && (
          <div style={{ padding: 24, color: "#999", border: "1px dashed #ddd" }}>
            좌측에서 작품·지문을 선택하세요.
          </div>
        )}
        {detail && (
          <CorpusDetail detail={detail} onChanged={() => loadDetail(selectedId)} onDeleted={() => handleDelete(detail.corpus.id)} />
        )}
      </div>

      {showCreate && (
        <CorpusCreateModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); reload(); }}
        />
      )}
    </div>
  );
}

function CorpusDetail({ detail, onChanged, onDeleted }) {
  const c = detail.corpus;
  const items = detail.items || [];
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState({ ...c });
  const [showAddItem, setShowAddItem] = useState(false);

  useEffect(() => { setDraft({ ...c }); setEditMode(false); }, [c.id]);

  const save = async () => {
    try {
      await updateCorpus(c.id, {
        area: draft.area, subArea: draft.subArea, title: draft.title,
        source: draft.source, author: draft.author, era: draft.era,
        genre: draft.genre, topic: draft.topic, field: draft.field,
        bodyMd: draft.bodyMd, levelMin: draft.levelMin, levelMax: draft.levelMax,
      });
      setEditMode(false);
      onChanged();
    } catch (e) {
      alert("저장 실패: " + e.message);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <h3 style={{ margin: 0, flex: 1 }}>{c.title}</h3>
        {!editMode && <button onClick={() => setEditMode(true)} style={btnSecondary}>편집</button>}
        {editMode && <button onClick={save} style={btnPrimary}>저장</button>}
        {editMode && <button onClick={() => { setEditMode(false); setDraft({ ...c }); }} style={btnSecondary}>취소</button>}
        <button onClick={onDeleted} style={btnDanger}>삭제</button>
      </div>

      <div style={{ background: "#f9fafb", padding: 12, marginBottom: 8 }}>
        {!editMode ? (
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", rowGap: 4 }}>
            <Label>영역</Label><Val>{AREAS.find(a => a.key === c.area)?.label || c.area} {c.subArea && `/ ${c.subArea}`}</Val>
            <Label>출처</Label><Val>{c.source || "-"}</Val>
            <Label>작가</Label><Val>{c.author || "-"}</Val>
            <Label>시대·장르</Label><Val>{[c.era, c.genre].filter(Boolean).join(" / ") || "-"}</Val>
            <Label>주제·분야</Label><Val>{[c.topic, c.field].filter(Boolean).join(" / ") || "-"}</Val>
            <Label>레벨</Label><Val>{c.levelMin || c.levelMax ? `${c.levelMin ?? ""} ~ ${c.levelMax ?? ""}` : "-"}</Val>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", rowGap: 6 }}>
            <Label>영역</Label>
            <select value={draft.area} onChange={e => setDraft(d => ({ ...d, area: e.target.value }))}>
              {AREAS.map(a => <option key={a.key} value={a.key}>{a.label}</option>)}
            </select>
            <Label>세부영역</Label>
            <input value={draft.subArea || ""} onChange={e => setDraft(d => ({ ...d, subArea: e.target.value }))} />
            <Label>제목</Label>
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
          </div>
        )}
      </div>

      <h4>본문</h4>
      {!editMode ? (
        <div style={{ background: "#fff", padding: 12, border: "1px solid #ddd", whiteSpace: "pre-wrap", maxHeight: 280, overflow: "auto" }}>
          {c.bodyMd || <span style={{ color: "#999" }}>본문 없음</span>}
        </div>
      ) : (
        <textarea
          value={draft.bodyMd || ""}
          onChange={e => setDraft(d => ({ ...d, bodyMd: e.target.value }))}
          rows={12}
          style={{ width: "100%", padding: 8 }}
        />
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
        <h4 style={{ margin: 0 }}>누적 항목 ({items.length})</h4>
        <button onClick={() => setShowAddItem(true)} style={btnPrimary}>+ 항목 추가</button>
      </div>

      {ITEM_TYPES.map(t => {
        const subset = items.filter(i => i.itemType === t.key);
        if (subset.length === 0) return null;
        return (
          <div key={t.key} style={{ marginTop: 12 }}>
            <h5 style={{ margin: "8px 0 4px", color: "#374151" }}>{t.label} ({subset.length})</h5>
            {subset.map(it => (
              <div key={it.id} style={{ background: "#f9fafb", padding: 8, marginBottom: 4, border: "1px solid #eee", display: "flex", gap: 8 }}>
                <div style={{ flex: 1, whiteSpace: "pre-wrap" }}>{it.textMd}</div>
                <button onClick={async () => {
                  if (!window.confirm("이 항목을 삭제할까요?")) return;
                  await deleteItem(it.id);
                  onChanged();
                }} style={btnDanger}>삭제</button>
              </div>
            ))}
          </div>
        );
      })}

      {showAddItem && (
        <ItemAddModal
          corpusId={c.id}
          onClose={() => setShowAddItem(false)}
          onAdded={() => { setShowAddItem(false); onChanged(); }}
        />
      )}
    </div>
  );
}

function CorpusCreateModal({ onClose, onCreated }) {
  const [draft, setDraft] = useState({ area: "literature", title: "" });
  const submit = async () => {
    if (!draft.title?.trim()) { alert("제목을 입력하세요"); return; }
    try {
      await createCorpus(draft);
      onCreated();
    } catch (e) {
      alert("생성 실패: " + e.message);
    }
  };
  return (
    <div style={modalBackdrop} onClick={onClose}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <h3>작품·지문 추가</h3>
        <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 8 }}>
          <Label>영역</Label>
          <select value={draft.area} onChange={e => setDraft(d => ({ ...d, area: e.target.value }))}>
            {AREAS.map(a => <option key={a.key} value={a.key}>{a.label}</option>)}
          </select>
          <Label>세부영역</Label>
          <input value={draft.subArea || ""} onChange={e => setDraft(d => ({ ...d, subArea: e.target.value }))} />
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
          <button onClick={onClose} style={btnSecondary}>취소</button>
          <button onClick={submit} style={btnPrimary}>생성</button>
        </div>
      </div>
    </div>
  );
}

function ItemAddModal({ corpusId, onClose, onAdded }) {
  const [draft, setDraft] = useState({ itemType: "checkpoint", textMd: "" });
  const submit = async () => {
    if (!draft.textMd?.trim()) { alert("본문을 입력하세요"); return; }
    try {
      await addItem(corpusId, draft);
      onAdded();
    } catch (e) {
      alert("추가 실패: " + e.message);
    }
  };
  return (
    <div style={modalBackdrop} onClick={onClose}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <h3>항목 추가</h3>
        <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 8 }}>
          <Label>종류</Label>
          <select value={draft.itemType} onChange={e => setDraft(d => ({ ...d, itemType: e.target.value }))}>
            {ITEM_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
          <Label>본문 *</Label>
          <textarea rows={8} value={draft.textMd} onChange={e => setDraft(d => ({ ...d, textMd: e.target.value }))} />
        </div>
        <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onClose} style={btnSecondary}>취소</button>
          <button onClick={submit} style={btnPrimary}>추가</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 임시 체크포인트 풀 탭
// ─────────────────────────────────────────────
function PendingTab() {
  const [status, setStatus] = useState("pending");
  const [list, setList] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [approving, setApproving] = useState(null); // pending row to approve

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([fetchPending(status), fetchPendingStats()]);
      setList(unwrap(r1) || []);
      setStats(unwrap(r2));
    } catch (e) {
      alert("로드 실패: " + e.message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { reload(); }, [reload]);

  const handleClassifyAll = async () => {
    if (!window.confirm("pending 항목 전체를 AI 분류합니다. 계속할까요?")) return;
    setBusy(true);
    try {
      const r = await classifyAll();
      const d = unwrap(r);
      alert(`분류 완료\n- 전체: ${d.total}\n- 성공: ${d.classified}\n- 오류: ${d.errors}`);
      reload();
    } catch (e) {
      alert("분류 실패: " + e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleClassifyOne = async (id) => {
    setBusy(true);
    try {
      await classifyOne(id);
      reload();
    } catch (e) {
      alert("분류 실패: " + e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("이 항목을 거부할까요?")) return;
    await rejectPending(id);
    reload();
  };

  const handleExtract = async () => {
    const cid = window.prompt("내용 숙지 학습 contentId 를 입력하세요");
    if (!cid) return;
    try {
      const r = await extractPending(cid);
      const d = unwrap(r);
      alert(`추출 완료\n- inserted: ${d.inserted}\n- skipped: ${d.skipped}`);
      reload();
    } catch (e) {
      alert("추출 실패: " + e.message);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <select value={status} onChange={e => setStatus(e.target.value)} style={{ padding: 6 }}>
          <option value="pending">대기 중 (pending)</option>
          <option value="classified">AI 분류됨 (classified)</option>
          <option value="approved">승인됨 (approved)</option>
          <option value="rejected">거부됨 (rejected)</option>
        </select>
        <button onClick={handleExtract} style={btnSecondary}>+ 학습 콘텐츠에서 추출</button>
        <button onClick={handleClassifyAll} disabled={busy} style={btnPrimary}>AI 일괄 분류</button>
        <button onClick={reload} style={btnSecondary}>새로고침</button>
        {stats && (
          <span style={{ marginLeft: "auto", color: "#666", fontSize: 13 }}>
            대기 {stats.pending} / 분류 {stats.classified} / 승인 {stats.approved} / 거부 {stats.rejected}
          </span>
        )}
      </div>

      {loading && <div>로딩…</div>}
      {!loading && list.length === 0 && (
        <div style={{ padding: 24, color: "#999", border: "1px dashed #ddd" }}>
          {status === "pending" ? "대기 중인 항목이 없습니다." : `${status} 항목이 없습니다.`}
        </div>
      )}
      {list.map(p => (
        <div key={p.id} style={{ background: "#fff", padding: 12, marginBottom: 8, border: "1px solid #ddd" }}>
          <div style={{ whiteSpace: "pre-wrap", marginBottom: 6 }}>{p.textMd}</div>
          {p.contextMd && (
            <details style={{ marginBottom: 6 }}>
              <summary style={{ cursor: "pointer", color: "#666", fontSize: 12 }}>주변 본문 보기</summary>
              <div style={{ background: "#f9fafb", padding: 8, marginTop: 4, fontSize: 12 }}>{p.contextMd}</div>
            </details>
          )}
          {p.suggestedCorpusId && (
            <div style={{ background: "#fef3c7", padding: 6, marginBottom: 6, fontSize: 13 }}>
              AI 제안 — corpus={p.suggestedCorpusId} / type={p.suggestedItemType} / 신뢰도={p.aiConfidence?.toFixed?.(2) ?? "-"}
              <br />이유: {p.aiReason || "-"}
            </div>
          )}
          <div style={{ display: "flex", gap: 6, fontSize: 12, color: "#666" }}>
            <span>출처: {p.sourceContentId}</span>
            {p.sourceOrgId && <span>orgId: {p.sourceOrgId}</span>}
            {p.sourceUserId && <span>userId: {p.sourceUserId}</span>}
            <span style={{ marginLeft: "auto" }}>{p.createdAt}</span>
          </div>
          {(status === "pending" || status === "classified") && (
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              {status === "pending" && (
                <button onClick={() => handleClassifyOne(p.id)} disabled={busy} style={btnSecondary}>AI 분류</button>
              )}
              <button onClick={() => setApproving(p)} style={btnPrimary}>승인 → corpus 로</button>
              <button onClick={() => handleReject(p.id)} style={btnDanger}>거부</button>
            </div>
          )}
        </div>
      ))}

      {approving && (
        <ApproveModal
          pending={approving}
          onClose={() => setApproving(null)}
          onApproved={() => { setApproving(null); reload(); }}
        />
      )}
    </div>
  );
}

function ApproveModal({ pending, onClose, onApproved }) {
  const [corpusList, setCorpusList] = useState([]);
  const [corpusId, setCorpusId] = useState(pending.suggestedCorpusId || "");
  const [itemType, setItemType] = useState(pending.suggestedItemType || "checkpoint");
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    searchCorpus({ keyword, size: 50 })
      .then(r => setCorpusList(unwrap(r) || []))
      .catch(() => setCorpusList([]));
  }, [keyword]);

  const submit = async () => {
    if (!corpusId) { alert("corpus 를 선택하세요"); return; }
    try {
      await approvePending(pending.id, corpusId, itemType);
      onApproved();
    } catch (e) {
      alert("승인 실패: " + e.message);
    }
  };

  return (
    <div style={modalBackdrop} onClick={onClose}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <h3>승인 — corpus 로 이동</h3>
        <p style={{ background: "#f9fafb", padding: 8 }}>{pending.textMd}</p>
        <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 8 }}>
          <Label>corpus 검색</Label>
          <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="제목·작가 검색" />
          <Label>corpus 선택</Label>
          <select value={corpusId} onChange={e => setCorpusId(e.target.value)}>
            <option value="">— 선택 —</option>
            {corpusList.map(c => (
              <option key={c.id} value={c.id}>{c.title} ({c.area}{c.subArea ? ` / ${c.subArea}` : ""})</option>
            ))}
          </select>
          <Label>항목 종류</Label>
          <select value={itemType} onChange={e => setItemType(e.target.value)}>
            {ITEM_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
        </div>
        <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onClose} style={btnSecondary}>취소</button>
          <button onClick={submit} style={btnPrimary}>승인</button>
        </div>
      </div>
    </div>
  );
}

// ─── 스타일 ───
const btnPrimary = { padding: "6px 12px", background: "#2563eb", color: "#fff", border: 0, cursor: "pointer" };
const btnSecondary = { padding: "6px 12px", background: "#fff", color: "#374151", border: "1px solid #ddd", cursor: "pointer" };
const btnDanger = { padding: "6px 12px", background: "#fff", color: "#b91c1c", border: "1px solid #fca5a5", cursor: "pointer" };
const modalBackdrop = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 };
const modalBox = { background: "#fff", padding: 20, minWidth: 480, maxWidth: 720, maxHeight: "90vh", overflow: "auto" };

function Label({ children }) { return <div style={{ fontWeight: 600, color: "#374151" }}>{children}</div>; }
function Val({ children }) { return <div>{children}</div>; }
