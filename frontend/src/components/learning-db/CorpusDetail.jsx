import { useState, useEffect } from "react";
import {
  updateCorpus, deleteCorpus, deleteItem, addItem,
} from "../../utils/learningCorpusApi";

export const AREAS = [
  { key: "reading", label: "독서(비문학)" },
  { key: "literature", label: "문학" },
  { key: "grammar", label: "문법" },
  { key: "vocab", label: "어휘" },
  { key: "speaking", label: "화법" },
  { key: "writing", label: "작문" },
  { key: "media", label: "매체" },
];

export const ITEM_TYPES = [
  { key: "checkpoint", label: "체크리스트" },
  { key: "exam_point", label: "출제 포인트" },
  { key: "passage_note", label: "구절 해석" },
  { key: "background", label: "배경지식" },
  { key: "character", label: "등장인물" },
  { key: "vocabulary", label: "어휘" },
  { key: "other", label: "기타" },
];

export function unwrap(res) {
  return res?.data ?? res;
}

/** 작품·지문 corpus 상세 + items 누적 편집 */
export default function CorpusDetail({ detail, onChanged, onDeleted, onToast }) {
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
      onToast?.({ msg: "저장 완료", type: "success" });
      onChanged?.();
    } catch (e) {
      onToast?.({ msg: "저장 실패: " + e.message, type: "error" });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("정말 삭제할까요? (soft delete — archived 처리)")) return;
    try {
      await deleteCorpus(c.id);
      onToast?.({ msg: "삭제됨", type: "success" });
      onDeleted?.();
    } catch (e) {
      onToast?.({ msg: "삭제 실패: " + e.message, type: "error" });
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <h3 style={{ margin: 0, flex: 1 }}>{c.title}</h3>
        {!editMode && <button className="ldb-btn ldb-btn-ghost" onClick={() => setEditMode(true)}>편집</button>}
        {editMode && <button className="ldb-btn ldb-btn-primary" onClick={save}>저장</button>}
        {editMode && <button className="ldb-btn ldb-btn-ghost" onClick={() => { setEditMode(false); setDraft({ ...c }); }}>취소</button>}
        <button className="ldb-btn ldb-btn-ghost" style={{ color: "#c0392b" }} onClick={handleDelete}>삭제</button>
      </div>

      <div style={{ background: "#f9fafb", padding: 12, marginBottom: 12, border: "1px solid #eee" }}>
        {!editMode ? (
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", rowGap: 4, fontSize: 13 }}>
            <Label>영역</Label><Val>{AREAS.find(a => a.key === c.area)?.label || c.area} {c.subArea && `/ ${c.subArea}`}</Val>
            <Label>출처</Label><Val>{c.source || "-"}</Val>
            <Label>작가</Label><Val>{c.author || "-"}</Val>
            <Label>시대·장르</Label><Val>{[c.era, c.genre].filter(Boolean).join(" / ") || "-"}</Val>
            <Label>주제·분야</Label><Val>{[c.topic, c.field].filter(Boolean).join(" / ") || "-"}</Val>
            <Label>레벨</Label><Val>{c.levelMin || c.levelMax ? `${c.levelMin ?? ""} ~ ${c.levelMax ?? ""}` : "-"}</Val>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", rowGap: 6, fontSize: 13 }}>
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

      <h4 style={{ margin: "16px 0 6px" }}>본문</h4>
      {!editMode ? (
        <div style={{ background: "#fff", padding: 12, border: "1px solid #ddd", whiteSpace: "pre-wrap", maxHeight: 320, overflow: "auto", fontSize: 13 }}>
          {c.bodyMd || <span style={{ color: "#999" }}>본문 없음</span>}
        </div>
      ) : (
        <textarea
          value={draft.bodyMd || ""}
          onChange={e => setDraft(d => ({ ...d, bodyMd: e.target.value }))}
          rows={12}
          style={{ width: "100%", padding: 8, fontFamily: "inherit", fontSize: 13 }}
        />
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20 }}>
        <h4 style={{ margin: 0 }}>누적 항목 ({items.length})</h4>
        <button className="ldb-btn ldb-btn-primary" onClick={() => setShowAddItem(true)}>+ 항목 추가</button>
      </div>

      {ITEM_TYPES.map(t => {
        const subset = items.filter(i => i.itemType === t.key);
        if (subset.length === 0) return null;
        return (
          <div key={t.key} style={{ marginTop: 12 }}>
            <h5 style={{ margin: "8px 0 4px", color: "#374151", fontSize: 13 }}>{t.label} ({subset.length})</h5>
            {subset.map(it => (
              <div key={it.id} style={{ background: "#f9fafb", padding: 8, marginBottom: 4, border: "1px solid #eee", display: "flex", gap: 8, fontSize: 13 }}>
                <div style={{ flex: 1, whiteSpace: "pre-wrap" }}>{it.textMd}</div>
                <button
                  className="ldb-btn ldb-btn-ghost"
                  style={{ color: "#c0392b" }}
                  onClick={async () => {
                    if (!window.confirm("이 항목을 삭제할까요?")) return;
                    await deleteItem(it.id);
                    onChanged?.();
                  }}
                >삭제</button>
              </div>
            ))}
          </div>
        );
      })}

      {showAddItem && (
        <ItemAddModal
          corpusId={c.id}
          onClose={() => setShowAddItem(false)}
          onAdded={() => { setShowAddItem(false); onChanged?.(); }}
        />
      )}
    </div>
  );
}

export function ItemAddModal({ corpusId, onClose, onAdded }) {
  const [draft, setDraft] = useState({ itemType: "checkpoint", textMd: "" });
  const submit = async () => {
    if (!draft.textMd?.trim()) { alert("본문을 입력하세요"); return; }
    try {
      await addItem(corpusId, draft);
      onAdded?.();
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
          <button className="ldb-btn ldb-btn-ghost" onClick={onClose}>취소</button>
          <button className="ldb-btn ldb-btn-primary" onClick={submit}>추가</button>
        </div>
      </div>
    </div>
  );
}

export const modalBackdrop = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 };
export const modalBox = { background: "#fff", padding: 20, minWidth: 480, maxWidth: 720, maxHeight: "90vh", overflow: "auto" };

export function Label({ children }) { return <div style={{ fontWeight: 600, color: "#374151" }}>{children}</div>; }
export function Val({ children }) { return <div>{children}</div>; }
