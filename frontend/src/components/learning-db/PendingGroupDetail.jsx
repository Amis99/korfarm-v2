import { useState, useEffect } from "react";
import {
  classifyOne, approvePending, rejectPending, searchCorpus,
  bulkApproveByContent,
} from "../../utils/learningCorpusApi";
import { ITEM_TYPES, modalBackdrop, modalBox, Label, unwrap } from "./CorpusDetail";

/**
 * 임시 체크리스트 한 그룹(같은 study_content 출처) — 파일처럼 우측 비주얼 에디터에 표시.
 * 그룹 안 체크리스트 리스트 + 항목별 분류·승인·거부 + 그룹 전체 머지(본 폴더로 이동) 액션.
 */
export default function PendingGroupDetail({ group, onChanged, onToast }) {
  const [showBulkApprove, setShowBulkApprove] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleClassify = async (id) => {
    setBusy(true);
    try {
      await classifyOne(id);
      onToast?.({ msg: "AI 분류 완료", type: "success" });
      onChanged?.();
    } catch (e) {
      onToast?.({ msg: "분류 실패: " + e.message, type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("이 항목을 거부 처리할까요?")) return;
    try {
      await rejectPending(id);
      onToast?.({ msg: "거부됨", type: "success" });
      onChanged?.();
    } catch (e) {
      onToast?.({ msg: "거부 실패: " + e.message, type: "error" });
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <h3 style={{ margin: 0, flex: 1 }}>{group.title}</h3>
        <span style={{ fontSize: 12, color: "#666" }}>{group.count}개</span>
        <button className="ldb-btn ldb-btn-primary" onClick={() => setShowBulkApprove(true)}>
          본 폴더로 이동(머지)
        </button>
      </div>
      <div style={{ background: "#f9fafb", padding: 8, marginBottom: 12, fontSize: 12, color: "#666" }}>
        출처 콘텐츠: {group.sourceContentId}
        {group.area && <span style={{ marginLeft: 8 }}>· 영역: {group.area}</span>}
        {group.subArea && <span style={{ marginLeft: 8 }}>· 세부: {group.subArea}</span>}
        {group.creatorId && <span style={{ marginLeft: 8 }}>· 작성자: {group.creatorId}</span>}
        {group.ownerOrgId && <span style={{ marginLeft: 8 }}>· orgId: {group.ownerOrgId}</span>}
      </div>

      <h4 style={{ margin: "12px 0 6px" }}>체크리스트 ({group.items.length})</h4>
      {group.items.map((p, idx) => (
        <div key={p.id} style={{ background: "#fff", padding: 10, marginBottom: 6, border: "1px solid #ddd" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: "#888" }}>#{idx + 1}</span>
            <span style={{
              fontSize: 11, padding: "1px 6px",
              background: statusColor(p.status).bg, color: statusColor(p.status).fg,
              borderRadius: 3,
            }}>{p.status}</span>
            {p.aiConfidence != null && (
              <span style={{ fontSize: 11, color: "#666" }}>
                AI 추천 corpus={p.suggestedCorpusId} type={p.suggestedItemType} 신뢰도={p.aiConfidence?.toFixed?.(2)}
              </span>
            )}
          </div>
          <div style={{ whiteSpace: "pre-wrap", fontSize: 14, marginBottom: 6 }}>{p.textMd}</div>
          {p.aiReason && (
            <div style={{ fontSize: 11, color: "#92400e", background: "#fef3c7", padding: 4, marginBottom: 6 }}>
              AI 이유: {p.aiReason}
            </div>
          )}
          {(p.status === "pending" || p.status === "classified") && (
            <div style={{ display: "flex", gap: 6, fontSize: 12 }}>
              {p.status === "pending" && (
                <button className="ldb-btn ldb-btn-ghost" disabled={busy} onClick={() => handleClassify(p.id)}>
                  AI 분류
                </button>
              )}
              <button className="ldb-btn ldb-btn-ghost" style={{ color: "#c0392b" }} onClick={() => handleReject(p.id)}>
                거부
              </button>
            </div>
          )}
        </div>
      ))}

      {showBulkApprove && (
        <BulkApproveModal
          group={group}
          onClose={() => setShowBulkApprove(false)}
          onApproved={() => { setShowBulkApprove(false); onToast?.({ msg: "머지 완료", type: "success" }); onChanged?.(); }}
        />
      )}
    </div>
  );
}

function statusColor(s) {
  if (s === "pending") return { bg: "#fee2e2", fg: "#991b1b" };
  if (s === "classified") return { bg: "#fef3c7", fg: "#92400e" };
  if (s === "approved") return { bg: "#d1fae5", fg: "#065f46" };
  if (s === "rejected") return { bg: "#e5e7eb", fg: "#374151" };
  return { bg: "#e5e7eb", fg: "#374151" };
}

function BulkApproveModal({ group, onClose, onApproved }) {
  const [corpusList, setCorpusList] = useState([]);
  const [corpusId, setCorpusId] = useState("");
  const [itemType, setItemType] = useState("checkpoint");
  const [keyword, setKeyword] = useState(group.title || "");

  useEffect(() => {
    searchCorpus({ keyword, area: group.area || "", size: 50 })
      .then(r => setCorpusList(unwrap(r) || []))
      .catch(() => setCorpusList([]));
  }, [keyword, group.area]);

  const submit = async () => {
    if (!corpusId) { alert("머지할 작품·지문을 선택하세요"); return; }
    if (!window.confirm(`${group.count}개 체크리스트 모두를 선택한 작품에 머지합니다. 계속할까요?`)) return;
    try {
      const r = await bulkApproveByContent(group.sourceContentId, corpusId, itemType);
      const d = unwrap(r);
      alert(`머지 완료 — 승인 ${d.approved} / 오류 ${d.errors}`);
      onApproved?.();
    } catch (e) {
      alert("머지 실패: " + e.message);
    }
  };

  return (
    <div style={modalBackdrop} onClick={onClose}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <h3>본 폴더로 이동(머지) — {group.title}</h3>
        <p style={{ background: "#f9fafb", padding: 8, fontSize: 13 }}>
          {group.count}개 체크리스트를 작품·지문 corpus 한 곳에 일괄 추가(머지)합니다.
          항목 종류는 모두 같게 적용됩니다 (다른 종류로 섞어 승인하려면 항목별 거부 후 개별 처리).
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 8 }}>
          <Label>작품 검색</Label>
          <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="제목·작가 검색" />
          <Label>대상 작품</Label>
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
          <button className="ldb-btn ldb-btn-ghost" onClick={onClose}>취소</button>
          <button className="ldb-btn ldb-btn-primary" onClick={submit}>머지</button>
        </div>
      </div>
    </div>
  );
}
