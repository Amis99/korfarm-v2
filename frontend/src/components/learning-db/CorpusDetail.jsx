import { useState, useEffect } from "react";
import {
  updateCorpus, deleteCorpus, deleteItem, addItem,
} from "../../utils/learningCorpusApi";
import { useClassificationCatalog } from "./useClassificationCatalog";
import MultiSelectField from "./MultiSelectField";
import MarkdownEditField from "../editor/MarkdownEditField";

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
  // primary 단일 + meta 의 배열로 복수 분류 지원
  const initDraft = (corpus) => ({
    ...corpus,
    areas: corpus.meta?.areas?.length ? corpus.meta.areas : [corpus.area || "literature"],
    subAreas: corpus.meta?.subAreas?.length ? corpus.meta.subAreas : (corpus.subArea ? [corpus.subArea] : []),
    topics: corpus.meta?.topics?.length ? corpus.meta.topics : (corpus.topic ? [corpus.topic] : []),
  });
  const [draft, setDraft] = useState(initDraft(c));
  const [showAddItem, setShowAddItem] = useState(false);
  const catalog = useClassificationCatalog();
  const primaryArea = draft.areas?.[0] || draft.area;
  const primarySubArea = draft.subAreas?.[0] || draft.subArea;
  const subAreas = catalog.subAreasFor(primaryArea);
  const themes = catalog.themesFor(primaryArea, primarySubArea);

  useEffect(() => { setDraft(initDraft(c)); setEditMode(false); }, [c.id]);

  const save = async () => {
    try {
      const areasArr = (draft.areas || []).filter(Boolean);
      const subAreasArr = (draft.subAreas || []).filter(Boolean);
      const topicsArr = (draft.topics || []).filter(Boolean);
      const meta = {
        ...(draft.meta || {}),
        areas: areasArr,
        subAreas: subAreasArr,
        topics: topicsArr,
      };
      await updateCorpus(c.id, {
        area: areasArr[0] || draft.area,
        subArea: subAreasArr[0] || null,
        title: draft.title,
        source: draft.source, author: draft.author, era: draft.era,
        genre: draft.genre,
        topic: topicsArr[0] || null,
        field: draft.field,
        bodyMd: draft.bodyMd, levelMin: draft.levelMin, levelMax: draft.levelMax,
        meta,
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
            <Label>영역</Label>
            <Val>{(c.meta?.areas?.length ? c.meta.areas : [c.area]).map(k => AREAS.find(a => a.key === k)?.label || k).join(", ")}</Val>
            <Label>세부영역</Label>
            <Val>{(c.meta?.subAreas?.length ? c.meta.subAreas : [c.subArea].filter(Boolean)).join(", ") || "-"}</Val>
            <Label>출처</Label><Val>{c.source || "-"}</Val>
            <Label>작가</Label><Val>{c.author || "-"}</Val>
            <Label>시대·장르</Label><Val>{[c.era, c.genre].filter(Boolean).join(" / ") || "-"}</Val>
            <Label>주제</Label>
            <Val>{(c.meta?.topics?.length ? c.meta.topics : [c.topic].filter(Boolean)).join(", ") || "-"}</Val>
            <Label>분야</Label><Val>{c.field || "-"}</Val>
            <Label>레벨</Label><Val>{c.levelMin || c.levelMax ? `${c.levelMin ?? ""} ~ ${c.levelMax ?? ""}` : "-"}</Val>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", rowGap: 6, fontSize: 13 }}>
            <Label>영역</Label>
            <MultiSelectField
              values={draft.areas || []}
              onChange={(arr) => setDraft(d => ({ ...d, areas: arr, subAreas: [], topics: [] }))}
              options={AREAS.map(a => ({ code: a.key, labelKo: a.label }))}
            />
            <Label>세부영역</Label>
            <MultiSelectField
              values={draft.subAreas || []}
              onChange={(arr) => setDraft(d => ({ ...d, subAreas: arr, topics: [] }))}
              options={subAreas}
              placeholder="자유 입력"
            />
            <Label>제목</Label>
            <input value={draft.title || ""} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} />
            <Label>출처</Label>
            <input value={draft.source || ""} onChange={e => setDraft(d => ({ ...d, source: e.target.value }))} />
            <Label>작가</Label>
            <input value={draft.author || ""} onChange={e => setDraft(d => ({ ...d, author: e.target.value }))} />
            <Label>시대</Label>
            <input value={draft.era || ""} onChange={e => setDraft(d => ({ ...d, era: e.target.value }))} placeholder="고전 / 근대 / 현대 등" />
            <Label>장르</Label>
            <input value={draft.genre || ""} onChange={e => setDraft(d => ({ ...d, genre: e.target.value }))} placeholder="시 / 소설 / 수필 등" />
            <Label>주제</Label>
            <MultiSelectField
              values={draft.topics || []}
              onChange={(arr) => setDraft(d => ({ ...d, topics: arr }))}
              options={themes}
              placeholder={primarySubArea ? "분류 마스터에 등록된 주제 없음 — 자유 입력" : "세부영역을 먼저 선택"}
            />
            <Label>분야</Label>
            <input value={draft.field || ""} onChange={e => setDraft(d => ({ ...d, field: e.target.value }))} placeholder="과학/사회/인문 등 (비문학)" />
          </div>
        )}
      </div>

      <h4 style={{ margin: "16px 0 6px" }}>본문</h4>
      {!editMode ? (
        <div style={{ background: "#fff", padding: 12, border: "1px solid #ddd", whiteSpace: "pre-wrap", maxHeight: 320, overflow: "auto", fontSize: 13 }}>
          {c.bodyMd || <span style={{ color: "#999" }}>본문 없음</span>}
        </div>
      ) : (
        <MarkdownEditField
          value={draft.bodyMd || ""}
          onChange={(text) => setDraft(d => ({ ...d, bodyMd: text }))}
          placeholder="본문 (마크다운). 이미지 업로드 가능"
          minHeight={240}
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
  const [draft, setDraft] = useState({ itemType: "checkpoint", textMd: "", customKey: "" });
  const isOther = draft.itemType === "other";
  const submit = async () => {
    if (!draft.textMd?.trim()) { alert("본문을 입력하세요"); return; }
    if (isOther && !draft.customKey?.trim()) { alert("기타 종류는 키 값을 입력하세요"); return; }
    try {
      const meta = isOther ? { customKey: draft.customKey } : undefined;
      await addItem(corpusId, { itemType: draft.itemType, textMd: draft.textMd, meta });
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
          {isOther && (
            <>
              <Label>키 값 *</Label>
              <input
                value={draft.customKey || ""}
                onChange={e => setDraft(d => ({ ...d, customKey: e.target.value }))}
                placeholder="예: 인용문 / 핵심어 / 비교 대상 등"
              />
            </>
          )}
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
