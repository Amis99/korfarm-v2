import { useState, useEffect } from "react";
import { apiGet, apiPatch, API_BASE, TOKEN_KEY } from "../utils/api";
import CellStatusBadge from "./CellStatusBadge";
import "../styles/admin-study-plan.css";

export default function StudyPlanCellModal({ cell, scope, asset, onClose, onUpdated }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState(cell?.adminNote || "");
  const [score, setScore] = useState(cell?.score ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!cell?.cellId) return;
    setLoading(true);
    apiGet(`/v1/admin/study-plans/cells/${cell.cellId}/files`)
      .then(setFiles)
      .catch(() => setFiles([]))
      .finally(() => setLoading(false));
  }, [cell?.cellId]);

  const isStudy = (asset?.assetKind || cell?.assetKind) === "study";
  const isTest = (asset?.assetKind || cell?.assetKind) === "test";

  const handleReview = async (status) => {
    setSaving(true);
    setError(null);
    try {
      await apiPatch(`/v1/admin/study-plans/cells/${cell.cellId}/review`, {
        status,
        adminNote: note || null,
      });
      onUpdated?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleGrade = async (status) => {
    setSaving(true);
    setError(null);
    try {
      await apiPatch(`/v1/admin/study-plans/cells/${cell.cellId}/grade`, {
        status,
        score: score !== "" ? Number(score) : null,
        adminNote: note || null,
      });
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
        <h2>
          <span className="material-symbols-outlined">
            {isTest ? "grading" : "task_alt"}
          </span>
          셀 상세
        </h2>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: "0.82rem", color: "#8a7468", marginBottom: 4 }}>
            {scope?.label} / {asset?.label}
          </div>
          <CellStatusBadge status={cell.status} score={cell.score} />
          {cell.submissionCount > 0 && (
            <span style={{ marginLeft: 8, fontSize: "0.75rem", color: "#888" }}>
              (제출 {cell.submissionCount}회)
            </span>
          )}
        </div>

        {/* 첨부파일 */}
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
          <div style={{ fontSize: "0.82rem", color: "#888", marginBottom: 12 }}>
            첨부파일 없음
          </div>
        )}

        {error && <div className="asp-error">{error}</div>}

        {/* 코멘트 */}
        <div className="asp-form-group">
          <label>관리자 메모</label>
          <textarea
            className="asp-textarea"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="거부 사유 또는 메모"
            rows={2}
          />
        </div>

        {/* 테스트: 점수 입력 */}
        {isTest && (
          <div className="asp-form-group">
            <label>점수</label>
            <input
              className="asp-input"
              type="number"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="점수 입력"
            />
          </div>
        )}

        {/* 학습활동: 승인/거부 */}
        {isStudy && (
          <div className="asp-cell-actions">
            <button
              className="asp-btn-approve"
              onClick={() => handleReview("approved")}
              disabled={saving}
            >
              승인
            </button>
            <button
              className="asp-btn-reject"
              onClick={() => handleReview("rejected")}
              disabled={saving}
            >
              거부
            </button>
          </div>
        )}

        {/* 테스트: 통과/재시/미통과 */}
        {isTest && (
          <div className="asp-cell-actions">
            <button
              className="asp-btn-pass"
              onClick={() => handleGrade("passed")}
              disabled={saving}
            >
              통과
            </button>
            <button
              className="asp-btn-retry"
              onClick={() => handleGrade("retry")}
              disabled={saving}
            >
              재시
            </button>
            <button
              className="asp-btn-fail"
              onClick={() => handleGrade("failed")}
              disabled={saving}
            >
              미통과
            </button>
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
