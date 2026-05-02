import { useState, useEffect } from "react";
import { apiPatch } from "../utils/api";
import { apiPost, apiDelete } from "../utils/adminApi";
import KorfarmContentSearchModal from "./KorfarmContentSearchModal";
import TestSearchModal from "./TestSearchModal";
import WisdomTopicSearchModal from "./WisdomTopicSearchModal";
import { isFreeTopic } from "../constants/wisdomFreeTopic";
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
  const [showTopicSearch, setShowTopicSearch] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 국어농장 복수 배정 — assignments 리스트
  const [assignments, setAssignments] = useState(cell?.assignments || []);
  useEffect(() => { setAssignments(cell?.assignments || []); }, [cell]);

  const isKorfarm = assetType === "korfarm";

  const handleAddKorfarmAssignment = async (content) => {
    setError("");
    setSaving(true);
    try {
      if (assignments.length === 0) {
        // 첫 배정 — assignCellContent (dueAt 필수)
        if (!dueDate) { setError("첫 배정은 마감일을 먼저 선택해 주세요."); setSaving(false); return; }
        await apiPatch(`/v1/admin/study-plans/cells/${cell.cellId}/assign`, {
          cellRefId: content.contentId,
          assignedLabel: content.title,
          dueAt: dueDate,
        });
      } else {
        // 추가 배정
        await apiPost(`/v1/admin/study-plans/cells/${cell.cellId}/assignments`, {
          refId: content.contentId,
          label: content.title,
        });
      }
      setAssignments((prev) => [...prev, {
        id: `tmp_${Date.now()}`,
        refId: content.contentId,
        assignedLabel: content.title,
        status: "pending",
      }]);
      setShowContentSearch(false);
      onAssigned?.();
    } catch (e) {
      setError(e?.message || "배정 실패");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    if (!window.confirm("이 콘텐츠 배정을 제거할까요?")) return;
    setError("");
    try {
      await apiDelete(`/v1/admin/study-plans/cells/${cell.cellId}/assignments/${assignmentId}`);
      setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
      onAssigned?.();
    } catch (e) {
      setError(e?.message || "제거 실패");
    }
  };

  const handleContentSelected = (content) => {
    if (isKorfarm) {
      // 국어농장 — 즉시 추가 배정 호출
      handleAddKorfarmAssignment(content);
      return;
    }
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

  const handleTopicSelected = (topic) => {
    // topic.topicKey 가 free_topic 이면 자유 주제. 학생이 본인 제목 입력하게 됨.
    setRefId(topic.topicKey);
    setRefLabel(topic.topicLabel);
    if (!label) setLabel(topic.topicLabel);
    setShowTopicSearch(false);
  };

  const handleSubmit = async () => {
    setError("");
    // korfarm 은 즉시 배정 흐름 — [닫기] 만 처리
    if (isKorfarm) {
      onClose?.();
      return;
    }
    // 자산 종류별 검증
    if (assetType === "activity") {
      if (!label.trim()) { setError("활동 이름을 입력해 주세요."); return; }
    } else if (assetType === "test") {
      if (!refId) { setError("테스트를 선택해 주세요."); return; }
    } else if (assetType === "writing") {
      if (!refId) { setError("주제를 선택해 주세요."); return; }
    }
    if (!dueDate) { setError("마감 기한을 선택해 주세요."); return; }
    setSaving(true);
    try {
      await apiPatch(`/v1/admin/study-plans/cells/${cell.cellId}/assign`, {
        cellRefId: refId || null,
        assignedLabel: label.trim() || null,
        dueAt: dueDate,
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
      {showTopicSearch && (
        <WisdomTopicSearchModal
          onSelect={handleTopicSelected}
          onClose={() => setShowTopicSearch(false)}
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
                  콘텐츠 (복수 배정 가능) <span style={{ color: "#c0392b" }}>*</span>
                </label>
                {assignments.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                    {assignments.map((a) => (
                      <span key={a.id} style={chipStyle(a.status)}>
                        {a.status === "completed" && <span style={{ marginRight: 4 }}>✓</span>}
                        {a.assignedLabel || a.refId}
                        {!String(a.id).startsWith("tmp_") && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAssignment(a.id)}
                            disabled={saving}
                            title="제거"
                            style={chipRemoveStyle}
                          >×</button>
                        )}
                      </span>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  className="admin-detail-btn"
                  onClick={() => setShowContentSearch(true)}
                  disabled={saving || (assignments.length === 0 && !dueDate)}
                  style={{ width: "100%" }}
                >
                  + 콘텐츠 추가
                </button>
                {assignments.length === 0 && !dueDate && (
                  <p style={{ fontSize: 11, color: "#c0392b", marginTop: 6 }}>
                    첫 배정 전에 마감 기한을 먼저 선택해 주세요.
                  </p>
                )}
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
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  글쓰기 주제 <span style={{ color: "#c0392b" }}>*</span>
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    value={refLabel || refId}
                    placeholder="주제를 검색해 선택하세요 (자유 주제 포함)"
                    style={{ ...inputStyle, flex: 1, background: "#f5f9f3" }}
                    readOnly
                  />
                  <button className="admin-detail-btn" onClick={() => setShowTopicSearch(true)}>
                    검색
                  </button>
                </div>
                {isFreeTopic(refId) && (
                  <div style={{
                    marginTop: 8,
                    padding: 8,
                    background: "rgba(255,193,7,0.1)",
                    border: "1px dashed rgba(255,167,38,0.4)",
                    borderRadius: 6,
                    fontSize: 12,
                    color: "#8a6d00",
                  }}>
                    자유 주제로 배정됩니다. 학생이 글을 쓸 때 본인이 직접 주제(제목)를 입력합니다.
                  </div>
                )}
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
            {isKorfarm ? (
              <button className="admin-detail-btn primary" onClick={close} disabled={saving}>
                완료
              </button>
            ) : (
              <>
                <button className="admin-detail-btn" onClick={close} disabled={saving}>취소</button>
                <button
                  className="admin-detail-btn primary"
                  onClick={handleSubmit}
                  disabled={saving}
                >
                  {saving ? "배정 중..." : "배정"}
                </button>
              </>
            )}
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

function chipStyle(status) {
  const colors = {
    completed: { bg: "#d4edda", border: "#28a745", color: "#155724" },
    in_progress: { bg: "#fff3cd", border: "#ffc107", color: "#856404" },
    pending: { bg: "#e7f1ff", border: "#3b82f6", color: "#1e3a8a" },
  };
  const c = colors[status] || colors.pending;
  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 8px 4px 10px",
    fontSize: 12,
    fontWeight: 500,
    background: c.bg,
    color: c.color,
    border: `1px solid ${c.border}`,
    borderRadius: 12,
    gap: 4,
  };
}

const chipRemoveStyle = {
  marginLeft: 4,
  background: "transparent",
  border: "none",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 700,
  lineHeight: 1,
  color: "inherit",
  padding: "0 4px",
};
