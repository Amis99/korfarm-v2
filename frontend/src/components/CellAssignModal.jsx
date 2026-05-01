import { useState } from "react";
import { apiPatch } from "../utils/api";
import KorfarmContentSearchModal from "./KorfarmContentSearchModal";
import TestSearchModal from "./TestSearchModal";
import "../styles/admin-detail.css";

const ASSET_LABELS = {
  korfarm: "국어농장 학습",
  activity: "학습 활동",
  test: "테스트",
  writing: "글쓰기",
};

/** 오늘 +N 일 yyyy-MM-dd */
function todayPlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * 학습 계획표 셀 배정 모달.
 * Phase 1: activity (자유 텍스트) + korfarm (콘텐츠 검색) + 공통 마감일.
 * Phase 2/3: test, writing 검색은 후속 단계에서 추가.
 *
 * Props:
 *   cell, scope, asset
 *   onClose()
 *   onAssigned()  배정 성공 후 부모가 매트릭스 새로고침
 */
export default function CellAssignModal({ cell, scope, asset, onClose, onAssigned }) {
  const assetType = asset?.assetType || cell?.assetType;
  const [label, setLabel] = useState(cell?.assignedLabel || "");
  const [refId, setRefId] = useState(cell?.cellRefId || "");
  const [refLabel, setRefLabel] = useState(""); // 검색 결과 표시명
  const [dueDate, setDueDate] = useState(() => {
    if (cell?.dueAt) {
      try { return new Date(cell.dueAt).toISOString().slice(0, 10); } catch { /* noop */ }
    }
    return todayPlus(7);
  });
  const [showContentSearch, setShowContentSearch] = useState(false);
  const [showTestSearch, setShowTestSearch] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleContentSelected = (content) => {
    setRefId(content.contentId);
    setRefLabel(content.title);
    if (!label) setLabel(content.title);
    setShowContentSearch(false);
  };

  const handleTestSelected = (test) => {
    setRefId(test.testId);
    setRefLabel(test.title);
    if (!label) setLabel(test.title);
    setShowTestSearch(false);
  };

  const handleSubmit = async () => {
    setError("");
    // 자산 종류별 검증
    if (assetType === "activity") {
      if (!label.trim()) { setError("활동 이름을 입력해 주세요."); return; }
    } else if (assetType === "korfarm") {
      if (!refId) { setError("콘텐츠를 선택해 주세요."); return; }
    } else if (assetType === "test") {
      if (!refId) { setError("테스트를 선택해 주세요."); return; }
    } else if (assetType === "writing") {
      if (!refId && !label.trim()) { setError("주제 또는 자유주제 제목을 입력해 주세요."); return; }
    }
    if (!dueDate) { setError("마감 기한을 선택해 주세요."); return; }
    setSaving(true);
    try {
      await apiPatch(`/v1/admin/study-plans/cells/${cell.cellId}/assign`, {
        cellRefId: refId || null,
        assignedLabel: label.trim() || null,
        dueAt: dueDate, // yyyy-MM-dd → 백엔드가 23:59 로 보정
      });
      onAssigned?.();
      onClose?.();
    } catch (e) {
      setError(e?.message || "배정 실패");
    } finally {
      setSaving(false);
    }
  };

  const close = () => { if (!saving) onClose?.(); };

  return (
    <>
      {showContentSearch && (
        <KorfarmContentSearchModal
          onSelect={handleContentSelected}
          onClose={() => setShowContentSearch(false)}
        />
      )}
      {showTestSearch && (
        <TestSearchModal
          onSelect={handleTestSelected}
          onClose={() => setShowTestSearch(false)}
        />
      )}
      <div className="admin-detail-modal-backdrop" onClick={close}>
        <div className="admin-detail-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
          <div className="admin-detail-modal-header">
            <h3>셀 배정 — {ASSET_LABELS[assetType] || assetType}</h3>
            <button className="admin-detail-modal-close" onClick={close}>×</button>
          </div>
          <div className="admin-detail-modal-body">
            <p style={{ color: "var(--admin-muted)", fontSize: 13, marginTop: 0 }}>
              {scope?.label} · {asset?.label}
            </p>

            {/* 자산 종류별 입력 */}
            {assetType === "activity" && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  활동 이름 <span style={{ color: "#c0392b" }}>*</span>
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="예: 받아쓰기 시험, 독서록 작성"
                  style={inputStyle}
                  autoFocus
                />
              </div>
            )}

            {assetType === "korfarm" && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  콘텐츠 <span style={{ color: "#c0392b" }}>*</span>
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    value={refLabel || refId}
                    placeholder="콘텐츠를 검색해 선택하세요"
                    style={{ ...inputStyle, flex: 1, background: "#f5f9f3" }}
                    readOnly
                  />
                  <button className="admin-detail-btn" onClick={() => setShowContentSearch(true)}>
                    검색
                  </button>
                </div>
                <label style={{ display: "block", fontSize: 12, color: "var(--admin-muted)", marginTop: 8 }}>
                  표시 라벨 (선택)
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="학생에게 보일 이름"
                  style={inputStyle}
                />
              </div>
            )}

            {assetType === "test" && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  테스트 <span style={{ color: "#c0392b" }}>*</span>
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    value={refLabel || refId}
                    placeholder="테스트를 검색해 선택하세요 (진단 제외)"
                    style={{ ...inputStyle, flex: 1, background: "#f5f9f3" }}
                    readOnly
                  />
                  <button className="admin-detail-btn" onClick={() => setShowTestSearch(true)}>
                    검색
                  </button>
                </div>
                <label style={{ display: "block", fontSize: 12, color: "var(--admin-muted)", marginTop: 8 }}>
                  표시 라벨 (선택)
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="학생에게 보일 이름"
                  style={inputStyle}
                />
              </div>
            )}

            {assetType === "writing" && (
              <div style={{
                marginBottom: 14,
                padding: 10,
                background: "rgba(255,193,7,0.1)",
                border: "1px dashed rgba(255,193,7,0.5)",
                borderRadius: 6,
                fontSize: 12,
                color: "#8a6d00",
              }}>
                지식과 지혜 주제 검색·자유주제 기능은 다음 단계에서 추가됩니다.
              </div>
            )}

            {/* 마감 기한 */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                마감 기한 <span style={{ color: "#c0392b" }}>*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={inputStyle}
              />
              <div style={{ fontSize: 11, color: "var(--admin-muted)", marginTop: 4 }}>
                기본값: 오늘로부터 일주일 뒤
              </div>
            </div>

            {error && (
              <div style={{ color: "#c0392b", fontSize: 13, marginTop: 10 }}>{error}</div>
            )}
          </div>
          <div className="admin-detail-modal-footer">
            <button className="admin-detail-btn" onClick={close} disabled={saving}>취소</button>
            <button
              className="admin-detail-btn primary"
              onClick={handleSubmit}
              disabled={saving || assetType === "writing"}
            >
              {saving ? "배정 중..." : "배정"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

const inputStyle = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: 6,
  border: "1px solid rgba(31,58,44,0.18)",
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
};
