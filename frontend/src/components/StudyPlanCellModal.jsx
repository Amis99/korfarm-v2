import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPatch, API_BASE, TOKEN_KEY } from "../utils/api";
import { apiGetCamel } from "../utils/adminApi";
import CellStatusBadge from "./CellStatusBadge";
import KorfarmContentSearchModal from "./KorfarmContentSearchModal";
import CellPropagateModal from "./study-plan-dashboard/CellPropagateModal";
import "../styles/admin-study-plan.css";

// 셀 데이터에서 안전하게 config_json 을 추출 (다양한 필드 케이스 지원)
function extractConfig(asset, cell) {
  const action = cell?.cellAction || asset?.cellAction || null;
  if (action) return action;
  const raw = asset?.configJson ?? asset?.config_json ?? cell?.configJson ?? cell?.config_json;
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  return {};
}

export default function StudyPlanCellModal({ cell, scope, asset, onClose, onUpdated }) {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState(cell?.adminNote || "");
  const [score, setScore] = useState(cell?.score ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showContentSearch, setShowContentSearch] = useState(false);
  const [showPropagate, setShowPropagate] = useState(false);

  useEffect(() => {
    if (!cell?.cellId) return;
    setLoading(true);
    apiGet(`/v1/admin/study-plans/cells/${cell.cellId}/files`)
      .then(setFiles)
      .catch(() => setFiles([]))
      .finally(() => setLoading(false));
  }, [cell?.cellId]);

  // 국어농장 학습 히스토리
  const [learningHistory, setLearningHistory] = useState(null);
  useEffect(() => {
    setLearningHistory(null);
    const isFarm = (asset?.assetType || cell?.assetType) === "korfarm";
    if (!isFarm) return;
    const cId = cell?.cellRefId;
    const sId = cell?.userId || cell?.user_id;
    if (!cId || !sId) return;
    apiGetCamel(`/v1/admin/students/${sId}/content/${cId}/history`)
      .then(setLearningHistory)
      .catch(() => setLearningHistory({ totalAttempts: 0, attempts: [] }));
  }, [cell?.cellId, cell?.cellRefId, asset?.assetType]);

  const assetType = asset?.assetType || cell?.assetType;
  const isTest = assetType === "test";
  const isKorfarm = assetType === "korfarm";
  const isActivity = assetType === "activity";
  const isWriting = assetType === "writing";

  // 어드민용 셀 액션 분기 (작업 3) ─ 백엔드 cellAction 응답 모델이 오면 우선 사용,
  // 없으면 cell/asset 의 기존 필드를 fallback 으로 활용해 신규 페이지 없이 기존 페이지로 점프.
  const cellConfig = extractConfig(asset, cell);
  const refId =
    cell?.cellRefId ||
    cell?.cellAction?.contentId ||
    cell?.cellAction?.testId ||
    cell?.cellAction?.refId ||
    asset?.refId ||
    cellConfig?.contentId ||
    cellConfig?.testId ||
    cellConfig?.refId ||
    null;
  const userId = cell?.userId || cell?.user_id || null;
  const wisdomPostId =
    cell?.wisdomPostId ||
    cell?.wisdom_post_id ||
    cell?.cellAction?.wisdomPostId ||
    cellConfig?.wisdomPostId ||
    cellConfig?.wisdom_post_id ||
    null;
  const testPdfFileId =
    cell?.testPdfFileId ||
    cell?.test_pdf_file_id ||
    cell?.cellAction?.testPdfFileId ||
    asset?.testPdfFileId ||
    asset?.test_pdf_file_id ||
    cellConfig?.pdfFileId ||
    cellConfig?.testPdfFileId ||
    null;
  const answerPdfFileId =
    cell?.answerPdfFileId ||
    cell?.answer_pdf_file_id ||
    cell?.cellAction?.answerPdfFileId ||
    asset?.answerPdfFileId ||
    asset?.answer_pdf_file_id ||
    cellConfig?.answerPdfFileId ||
    null;
  const hasSubmitted = !!cell?.submissionCount && cell.submissionCount > 0;
  // 테스트 응시 여부 — submissionCount 또는 status 로 판정
  const testTaken = isTest && (
    hasSubmitted ||
    cell?.status === "scored" ||
    cell?.status === "passed" ||
    cell?.status === "retry"
  );

  const openFile = (fileId) => {
    if (!fileId) return;
    const token = sessionStorage.getItem(TOKEN_KEY);
    const url = `${API_BASE}/v1/files/${fileId}/download${token ? `?token=${token}` : ""}`;
    window.open(url, "_blank");
  };

  const handleViewLearningHistory = () => {
    if (!userId) return;
    const params = new URLSearchParams({ tab: "learning" });
    if (refId) params.set("contentId", refId);
    // 돌아가기 시 학습 계획표 대시보드로 복귀하도록 from 전달
    const from = window.location.pathname + window.location.search;
    if (from) params.set("from", from);
    navigate(`/admin/students/${userId}?${params.toString()}`);
  };

  const handlePrintContent = () => {
    if (!refId) return;
    const url = `/admin/print-content?ids=${encodeURIComponent(refId)}`;
    window.open(url, "_blank");
  };

  const handleOpenWisdomFeedback = () => {
    if (!wisdomPostId) return;
    navigate(`/admin/wisdom/posts/${wisdomPostId}`);
  };

  const handleViewTestReport = () => {
    if (!refId) return;
    if (userId) {
      navigate(`/admin/tests/${refId}/statistics?studentId=${userId}`);
    } else {
      navigate(`/admin/tests/${refId}/statistics`);
    }
  };

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

  // V0147 / Rev.2 — 셀 비활성화 / 복원
  const isDisabled = cell?.status === "disabled" || cell?.isDisabled;
  const handleToggleDisabled = async () => {
    const confirmMsg = isDisabled
      ? "이 셀을 다시 활성화하시겠습니까?"
      : "이 셀을 비활성화하시겠습니까?\n진행률 분모에서 제외되고, 학생·학부모 화면에서 회색으로 표시됩니다.";
    if (!window.confirm(confirmMsg)) return;
    setSaving(true);
    setError(null);
    try {
      const endpoint = isDisabled ? "enable" : "disable";
      await apiPatch(`/v1/admin/study-plans/cells/${cell.cellId}/${endpoint}`, {});
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
    const token = sessionStorage.getItem(TOKEN_KEY);
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

        {showPropagate && (
          <CellPropagateModal
            cell={cell}
            scope={scope}
            asset={asset}
            currentUserId={cell?.userId}
            onClose={() => setShowPropagate(false)}
            onApplied={() => { setShowPropagate(false); onUpdated?.(); }}
          />
        )}

        <h2>
          <span className="material-symbols-outlined">
            {isTest ? "grading" : isKorfarm ? "eco" : isWriting ? "edit_note" : "task_alt"}
          </span>
          {isActivity ? "제출물 확인"
            : isKorfarm ? "학습 결과 확인"
            : isTest ? "테스트 결과 확인"
            : isWriting ? "글쓰기 첨삭"
            : "셀 상세"}
        </h2>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: "0.82rem", color: "#8a7468", marginBottom: 4 }}>
            {scope?.label} / {asset?.label}
            {cell.assignedLabel && cell.assignedLabel !== asset?.label && (
              <span style={{ marginLeft: 6, color: "#5d4037" }}>· {cell.assignedLabel}</span>
            )}
          </div>
          <CellStatusBadge
            status={cell.status}
            isOverdue={cell.isOverdue}
            assetType={asset?.assetType || cell?.assetType}
          />
          {cell.dueAt && (
            <span style={{ marginLeft: 8, fontSize: "0.75rem", color: "#888" }}>
              마감: {String(cell.dueAt).slice(0, 10)}
            </span>
          )}
          {isActivity && cell.submissionCount > 0 && (
            <span style={{ marginLeft: 8, fontSize: "0.75rem", color: "#888" }}>
              (제출 {cell.submissionCount}회)
            </span>
          )}
          {cell.score != null && (
            <span style={{ marginLeft: 8, fontSize: "0.75rem", color: "#888" }}>
              점수 {cell.score}
            </span>
          )}
        </div>

        {/* ── 셀 액션 분기 (어드민) ── */}
        <div className="asp-cell-quick-actions">
          {isKorfarm && userId && (
            <button
              type="button"
              className="asp-btn-jump"
              onClick={handleViewLearningHistory}
              title="학생의 학습 히스토리 화면으로 이동"
            >
              <span className="material-symbols-outlined">history</span>
              학습 히스토리 보기
            </button>
          )}

          {isKorfarm && refId && (
            <button
              type="button"
              className="asp-btn-jump"
              onClick={handlePrintContent}
              title="이 학습 콘텐츠를 PDF 로 인쇄"
            >
              <span className="material-symbols-outlined">print</span>
              PDF 인쇄
            </button>
          )}

          {isWriting && (
            wisdomPostId ? (
              <button
                type="button"
                className="asp-btn-jump"
                onClick={handleOpenWisdomFeedback}
                title="첨삭 화면으로 이동"
              >
                <span className="material-symbols-outlined">edit_note</span>
                첨삭 화면 열기
              </button>
            ) : (
              <button
                type="button"
                className="asp-btn-jump"
                disabled
                title="학생이 아직 글을 제출하지 않았습니다"
              >
                <span className="material-symbols-outlined">hourglass_empty</span>
                학생 미제출
              </button>
            )
          )}

          {isTest && (
            <>
              <button
                type="button"
                className="asp-btn-jump"
                onClick={() => openFile(testPdfFileId)}
                disabled={!testPdfFileId}
                title={testPdfFileId ? "시험지 PDF 다운로드" : "이 시험지에 등록된 PDF가 없습니다"}
              >
                <span className="material-symbols-outlined">picture_as_pdf</span>
                시험지 PDF
              </button>
              <button
                type="button"
                className="asp-btn-jump"
                onClick={() => openFile(answerPdfFileId)}
                disabled={!answerPdfFileId}
                title={answerPdfFileId ? "정답·해설 PDF 다운로드" : "정답·해설 PDF가 없습니다"}
              >
                <span className="material-symbols-outlined">fact_check</span>
                정답·해설 PDF
              </button>
              <button
                type="button"
                className="asp-btn-jump"
                onClick={handleViewTestReport}
                disabled={!testTaken || !refId}
                title={testTaken ? "성적표 보기" : "학생이 아직 응시하지 않았습니다"}
              >
                <span className="material-symbols-outlined">analytics</span>
                성적표 보기
              </button>
            </>
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

        {/* ── 국어농장 복수 배정 콘텐츠 리스트 (assignment > 1 일 때만 노출) ── */}
        {isKorfarm && (cell.assignments?.length || 0) > 1 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: "var(--admin-muted, #666)", marginBottom: 6, fontWeight: 600 }}>
              배정된 콘텐츠 ({cell.assignments.filter((a) => a.status === "completed").length}/{cell.assignments.length} 완료)
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
              {cell.assignments.map((a) => (
                <li
                  key={a.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "6px 10px",
                    background: a.status === "completed" ? "#d4edda" : "#f5f9f3",
                    border: `1px solid ${a.status === "completed" ? "#28a745" : "rgba(45,106,79,0.2)"}`,
                    borderRadius: 6, fontSize: 12,
                  }}
                >
                  <span style={{ flex: 1 }}>
                    {a.status === "completed" && <span style={{ marginRight: 6 }}>✓</span>}
                    {a.assignedLabel || a.refId}
                  </span>
                  <span style={{ fontSize: 10, color: a.status === "completed" ? "#155724" : "#666" }}>
                    {a.status === "completed" ? "완료" : a.status === "in_progress" ? "진행중" : "미수행"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── 국어농장 학습 히스토리 ── */}
        {isKorfarm && cell.status !== "unassigned" && (
          <div style={{ marginBottom: 12, padding: 12, background: "#f5f9f3", borderRadius: 8, fontSize: 13 }}>
            {!learningHistory ? (
              <span style={{ color: "#888" }}>학습 히스토리 불러오는 중...</span>
            ) : learningHistory.totalAttempts === 0 ? (
              <span style={{ color: "#888" }}>아직 학습 기록이 없습니다.</span>
            ) : (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6, marginBottom: 8 }}>
                  <div><strong>총 시도:</strong> {learningHistory.totalAttempts}회</div>
                  <div><strong>완료:</strong> {learningHistory.completedAttempts}회</div>
                  {learningHistory.bestScore != null && (
                    <div><strong>최고 점수:</strong> {learningHistory.bestScore}점</div>
                  )}
                  {learningHistory.bestAccuracy != null && (
                    <div><strong>최고 정답률:</strong> {learningHistory.bestAccuracy}%</div>
                  )}
                  <div><strong>획득 씨앗:</strong> {learningHistory.totalSeed}</div>
                  {learningHistory.lastStartedAt && (
                    <div><strong>마지막 학습:</strong> {String(learningHistory.lastStartedAt).slice(0, 10)}</div>
                  )}
                </div>
                {learningHistory.attempts.length > 0 && (
                  <details>
                    <summary style={{ cursor: "pointer", color: "#5d4037" }}>시도별 상세 ({learningHistory.attempts.length}건)</summary>
                    <ul style={{ margin: "8px 0 0", padding: "0 0 0 18px", maxHeight: 160, overflowY: "auto" }}>
                      {learningHistory.attempts.map((a) => (
                        <li key={a.attemptId} style={{ fontSize: 12, marginBottom: 4 }}>
                          {String(a.startedAt).slice(0, 16).replace("T", " ")} · {a.status}
                          {a.score != null ? ` · 점수 ${a.score}` : ""}
                          {a.accuracy != null ? ` · 정답률 ${a.accuracy}%` : ""}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}
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

        {/* ── 학습 활동 자산만 첨부파일(제출물) 표시 ── */}
        {isActivity && cell.status !== "unassigned" && (
          <>
            {loading ? (
              <div className="asp-loading">파일 불러오는 중...</div>
            ) : files.length > 0 ? (
              <div className="asp-cell-files">
                {files.map((f) => {
                  const url = fileUrl(f.fileId);
                  const isPdf = f.mime === "application/pdf" || f.fileId?.endsWith(".pdf");
                  return (
                    <div key={f.id} className="asp-cell-file-preview">
                      {isPdf ? (
                        <object data={url} type="application/pdf" className="asp-cell-pdf-preview">
                          <a href={url} target="_blank" rel="noreferrer">PDF 보기</a>
                        </object>
                      ) : (
                        <img className="asp-cell-img-preview" src={url} alt="제출물" onClick={() => window.open(url, "_blank")} />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: "0.82rem", color: "#888", marginBottom: 12 }}>
                첨부파일 없음 (학생이 아직 업로드하지 않았습니다)
              </div>
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

        {/* ── 학습활동 학생 제출(submitted/partial): 관리자 확인 완료/일부 확인 ── */}
        {isActivity && (cell.status === "submitted" || cell.status === "partial") && (
          <>
            <div style={{ fontSize: "0.82rem", color: "#8a7468", marginBottom: 6 }}>
              학생 자기보고: {cell.status === "submitted" ? "수행 완료" : "일부 완료"}
            </div>
            <div className="asp-cell-actions">
              <button
                className="asp-btn-approve"
                onClick={() => handleStatusChange("completed")}
                disabled={saving}
              >
                확인 완료
              </button>
              <button
                className="asp-btn-retry"
                onClick={() => handleStatusChange("reviewed")}
                disabled={saving}
              >
                일부 확인
              </button>
            </div>
          </>
        )}

        {/* ── 학습활동 관리자 확인 후(completed/reviewed): 상태 표시 + 재확인 버튼 ── */}
        {isActivity && (cell.status === "completed" || cell.status === "reviewed") && (
          <>
            <div style={{ fontSize: "0.82rem", color: "#2c7a3f", marginBottom: 6 }}>
              관리자 확인: {cell.status === "completed" ? "확인 완료" : "일부 확인"}
            </div>
            <div className="asp-cell-actions">
              <button
                className="asp-btn-approve"
                onClick={() => handleStatusChange(cell.status === "completed" ? "reviewed" : "completed")}
                disabled={saving}
              >
                {cell.status === "completed" ? "일부 확인으로 변경" : "확인 완료로 변경"}
              </button>
            </div>
          </>
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

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, gap: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {/* V0147 / Rev.2 — 셀 비활성화 / 복원 (HQ_ADMIN / ORG_ADMIN 전용) */}
            <button
              className={isDisabled ? "asp-btn-approve" : "asp-btn-retry"}
              onClick={handleToggleDisabled}
              disabled={saving}
              title={isDisabled ? "이 셀을 다시 활성화합니다" : "이 셀을 비활성화 — 진행률 분모 제외"}
              style={{ padding: "8px 16px" }}
            >
              <span className="material-symbols-outlined" style={{ verticalAlign: "middle", fontSize: 16, marginRight: 4 }}>
                {isDisabled ? "play_circle" : "block"}
              </span>
              {isDisabled ? "셀 활성화 복원" : "이 셀 비활성화"}
            </button>
            {/* Rev.2 — 셀 단위 복제 (비활성/배정 전 셀은 제외) */}
            {!isDisabled && cell?.status !== "unassigned" && (
              <button
                className="asp-btn-jump"
                onClick={() => setShowPropagate(true)}
                title="이 셀의 학습 내용을 다른 학생에게 복제 (결과·산출물 제외)"
                style={{ padding: "8px 16px" }}
              >
                <span className="material-symbols-outlined" style={{ verticalAlign: "middle", fontSize: 16, marginRight: 4 }}>
                  group_add
                </span>
                이 셀 다른 학생에게 복제
              </button>
            )}
          </div>
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
