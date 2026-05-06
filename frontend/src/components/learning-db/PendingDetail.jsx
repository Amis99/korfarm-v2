import { useState, useEffect } from "react";
import {
  classifyOne, approvePending, rejectPending, searchCorpus,
} from "../../utils/learningCorpusApi";
import { ITEM_TYPES, modalBackdrop, modalBox, Label, unwrap } from "./CorpusDetail";

/** 임시 체크포인트 한 건 — AI 분류·승인·거부 UI */
export default function PendingDetail({ pending, onChanged, onToast }) {
  const [busy, setBusy] = useState(false);
  const [showApprove, setShowApprove] = useState(false);

  const handleClassify = async () => {
    setBusy(true);
    try {
      await classifyOne(pending.id);
      onToast?.({ msg: "AI 분류 완료", type: "success" });
      onChanged?.();
    } catch (e) {
      onToast?.({ msg: "분류 실패: " + e.message, type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm("거부 처리할까요?")) return;
    try {
      await rejectPending(pending.id);
      onToast?.({ msg: "거부됨", type: "success" });
      onChanged?.();
    } catch (e) {
      onToast?.({ msg: "거부 실패: " + e.message, type: "error" });
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ margin: "0 0 8px" }}>
        임시 체크포인트
        <span style={{
          marginLeft: 8, fontSize: 11, padding: "2px 6px",
          background: statusColor(pending.status).bg, color: statusColor(pending.status).fg,
          borderRadius: 3,
        }}>{pending.status}</span>
      </h3>

      <div style={{ background: "#fff", padding: 12, border: "1px solid #ddd", whiteSpace: "pre-wrap", marginBottom: 12, fontSize: 14 }}>
        {pending.textMd}
      </div>

      {pending.contextMd && (
        <details style={{ marginBottom: 12 }}>
          <summary style={{ cursor: "pointer", color: "#666", fontSize: 12 }}>주변 본문 보기</summary>
          <div style={{ background: "#f9fafb", padding: 8, marginTop: 4, fontSize: 12, whiteSpace: "pre-wrap" }}>{pending.contextMd}</div>
        </details>
      )}

      {pending.suggestedCorpusId && (
        <div style={{ background: "#fef3c7", padding: 8, marginBottom: 12, fontSize: 13, border: "1px solid #fcd34d" }}>
          <div><b>AI 제안</b> — corpus={pending.suggestedCorpusId} / type={pending.suggestedItemType} / 신뢰도={pending.aiConfidence?.toFixed?.(2) ?? "-"}</div>
          <div style={{ color: "#666", marginTop: 4 }}>이유: {pending.aiReason || "-"}</div>
        </div>
      )}

      <div style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>
        <div>출처 콘텐츠: {pending.sourceContentId}</div>
        {pending.sourceOrgId && <div>orgId: {pending.sourceOrgId}</div>}
        {pending.sourceUserId && <div>userId: {pending.sourceUserId}</div>}
        <div>등록: {pending.createdAt}</div>
        {pending.approvedAt && <div>처리: {pending.approvedAt} / by {pending.approvedBy}</div>}
        {pending.approvedCorpusId && <div>승인된 corpus: {pending.approvedCorpusId} / item: {pending.approvedItemId}</div>}
      </div>

      {(pending.status === "pending" || pending.status === "classified") && (
        <div style={{ display: "flex", gap: 8 }}>
          {pending.status === "pending" && (
            <button className="ldb-btn ldb-btn-ghost" disabled={busy} onClick={handleClassify}>
              AI 분류
            </button>
          )}
          <button className="ldb-btn ldb-btn-primary" onClick={() => setShowApprove(true)}>
            승인 → corpus 로
          </button>
          <button className="ldb-btn ldb-btn-ghost" style={{ color: "#c0392b" }} onClick={handleReject}>
            거부
          </button>
        </div>
      )}

      {showApprove && (
        <ApproveModal
          pending={pending}
          onClose={() => setShowApprove(false)}
          onApproved={() => { setShowApprove(false); onToast?.({ msg: "승인 완료", type: "success" }); onChanged?.(); }}
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
      onApproved?.();
    } catch (e) {
      alert("승인 실패: " + e.message);
    }
  };

  return (
    <div style={modalBackdrop} onClick={onClose}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <h3>승인 — corpus 로 이동</h3>
        <p style={{ background: "#f9fafb", padding: 8, fontSize: 13 }}>{pending.textMd}</p>
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
          <button className="ldb-btn ldb-btn-ghost" onClick={onClose}>취소</button>
          <button className="ldb-btn ldb-btn-primary" onClick={submit}>승인</button>
        </div>
      </div>
    </div>
  );
}
