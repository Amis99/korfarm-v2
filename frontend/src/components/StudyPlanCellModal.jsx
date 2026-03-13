import { useState, useEffect } from "react";
import { apiGet, apiPatch, API_BASE, TOKEN_KEY } from "../utils/api";
import CellStatusBadge from "./CellStatusBadge";
import KorfarmContentSearchModal from "./KorfarmContentSearchModal";
import "../styles/admin-study-plan.css";

export default function StudyPlanCellModal({ cell, scope, asset, onClose, onUpdated }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState(cell?.adminNote || "");
  const [score, setScore] = useState(cell?.score ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showContentSearch, setShowContentSearch] = useState(false);

  useEffect(() => {
    if (!cell?.cellId) return;
    setLoading(true);
    apiGet(`/v1/admin/study-plans/cells/${cell.cellId}/files`)
      .then(setFiles)
      .catch(() => setFiles([]))
      .finally(() => setLoading(false));
  }, [cell?.cellId]);

  const assetType = asset?.assetType || cell?.assetType;
  const isTest = assetType === "test";
  const isKorfarm = assetType === "korfarm";
  const isActivity = assetType === "activity";

  // 통합 상태 변경 API
  const handleStatusChange = async (status, extraData = {}) => {
    setSaving(true);
    setError(null);
    try {
      await apiPatch(`/v1/admin/study-plans/cells/${cell.cellId}/status`, {
        status,
        adminNote: note || null,
        ...extraData,
      });
      onUpdated?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // 국어농장 콘텐츠 배정 API
  const handleAssignContent = async (content) => {
    setSaving(true);
    setError(null);
    try {
      await apiPatch(`/v1/admin/study-plans/cells/${cell.cellId}/assign`, {
        cellRefId: content.contentId,
      });
      setShowContentSearch(false);
      onUpdated?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const fileUrl = (fileId) => {
    const token = localStorage.getItem(TOKEN_KEY);
    return `${API_BASE}/v1/files/${fileId}/download?token=${token}`;
  };

  if (!cell) return null;

  return (
    <div className="asp-modal-overlay" onClick={onClose}>
      <div className="asp-modal asp-cell-modal" onClick={(e) => e.stopPropagation()}>
        {showContentSearch && (
          <KorfarmContentSearchModal
            onSelect={handleAssignContent}
            onClose={() => setShowContentSearch(false)}
          />
        )}

        <h2>
          <span className="material-symbols-outlined">
            {isTest ? "grading" : isKorfarm ? "eco" : "task_alt"}
          </span>
          셀 상세
        </h2>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: "0.82rem", color: "#8a7468", marginBottom: 4 }}>
            {scope?.label} / {asset?.label}
          </div>
          <CellStatusBadge
            status={cell.status}
            score={cell.score}
            assetType={assetType}
          />
          {cell.submissionCount > 0 && (
            <span style={{ marginLeft: 8, fontSize: "0.75rem", color: "#888" }}>
              (제출 {cell.submissionCount}회)
            </span>
          )}
        </div>

        {/* ── 국어농장 unassigned: 콘텐츠 배정 ── */}
        {isKorfarm && cell.status === "unassigned" && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: "0.82rem", color: "#aaa", marginBottom: 8 }}>
              아직 콘텐츠가 배정되지 않았습니다.
            </p>
            <button
              className="asp-add-btn"
              onClick={() => setShowContentSearch(true)}
              disabled={saving}
              style={{ width: "100%", textAlign: "center", padding: "10px" }}
            >
              콘텐츠 배정
            </button>
          </div>
        )}

        {/* ── 국어농장 기타: 배정된 콘텐츠 정보 ── */}
        {isKorfarm && cell.status !== "unassigned" && (
          <div style={{ fontSize: "0.82rem", color: "#aaa", marginBottom: 12 }}>
            배정 콘텐츠: {cell.cellRefId || asset?.refId || "-"}
          </div>
        )}

        {/* ── 학습활동 unassigned: 배부 버튼 ── */}
        {isActivity && cell.status === "unassigned" && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: "0.82rem", color: "#aaa", marginBottom: 8 }}>
              아직 배부되지 않았습니다.
            </p>
            <button
              className="asp-btn-approve"
              onClick={() => handleStatusChange("pending")}
              disabled={saving}
              style={{ width: "100%", padding: "10px" }}
            >
              배부
            </button>
          </div>
        )}

        {/* ── 첨부파일 (submitted 상태 등) ── */}
        {cell.status !== "unassigned" && (
          <>
            {loading ? (
              <div className="asp-loading">파일 불러오는 중...</div>
            ) : files.length > 0 ? (
              <div className="asp-cell-files">
                {files.map((f) => (
                  <a key={f.id} href={fileUrl(f.fileId)} target="_blank" rel="noreferrer">
                    <img className="asp-cell-file-thumb" src={fileUrl(f.fileId)} alt="제출물" />
                  </a>
                ))}
              </div>
            ) : (
              !isKorfarm && (
                <div style={{ fontSize: "0.82rem", color: "#888", marginBottom: 12 }}>
                  첨부파일 없음
                </div>
              )
            )}
          </>
        )}

        {error && <div className="asp-error">{error}</div>}

        {/* ── 관리자 메모 (배정 전 제외) ── */}
        {cell.status !== "unassigned" && (
          <div className="asp-form-group">
            <label>관리자 메모</label>
            <textarea
              className="asp-textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="메모 입력"
              rows={2}
            />
          </div>
        )}

        {/* ── 학습활동 submitted: 완료/일부 완료 ── */}
        {isActivity && cell.status === "submitted" && (
          <div className="asp-cell-actions">
            <button
              className="asp-btn-approve"
              onClick={() => handleStatusChange("completed")}
              disabled={saving}
            >
              완료
            </button>
            <button
              className="asp-btn-retry"
              onClick={() => handleStatusChange("partial")}
              disabled={saving}
            >
              일부 완료
            </button>
          </div>
        )}

        {/* ── 테스트 pending: 응시 전 표시 ── */}
        {isTest && cell.status === "pending" && (
          <div style={{ fontSize: "0.82rem", color: "#aaa", marginBottom: 12 }}>
            아직 응시 전입니다.
          </div>
        )}

        {/* ── 테스트 scored: 점수 표시 + 통과/재시험 ── */}
        {isTest && cell.status === "scored" && (
          <>
            <div className="asp-form-group">
              <label>점수</label>
              <input
                className="asp-input"
                type="number"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="점수 수정"
              />
            </div>
            <div className="asp-cell-actions">
              <button
                className="asp-btn-pass"
                onClick={() => handleStatusChange("passed", { score: score !== "" ? Number(score) : null })}
                disabled={saving}
              >
                통과
              </button>
              <button
                className="asp-btn-retry"
                onClick={() => handleStatusChange("retry", { score: score !== "" ? Number(score) : null })}
                disabled={saving}
              >
                재시험
              </button>
            </div>
          </>
        )}

        {/* ── 테스트 retry: 재시험 대기 + 점수 수정 ── */}
        {isTest && cell.status === "retry" && (
          <>
            <div style={{ fontSize: "0.82rem", color: "#ffa726", marginBottom: 12 }}>
              재시험 대기 중
            </div>
            <div className="asp-form-group">
              <label>점수</label>
              <input
                className="asp-input"
                type="number"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="점수 수정"
              />
            </div>
          </>
        )}

        {/* ── 테스트 passed: 통과 표시 ── */}
        {isTest && cell.status === "passed" && (
          <div style={{ fontSize: "0.82rem", color: "#66bb6a", marginBottom: 12 }}>
            통과 처리됨 {cell.score != null && `(${cell.score}점)`}
          </div>
        )}

        <div style={{ textAlign: "right", marginTop: 16 }}>
          <button
            className="asp-btn-prev"
            onClick={onClose}
            style={{ padding: "8px 20px" }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
