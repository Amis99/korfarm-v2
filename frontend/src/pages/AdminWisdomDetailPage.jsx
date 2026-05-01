import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { apiGet, apiGetCamel, apiPost, apiPostDeep, apiDelete } from "../utils/adminApi";
import { API_BASE } from "../utils/api";
import ManuscriptGrid from "../components/ManuscriptGrid";
import ManuscriptReview from "../components/ManuscriptReview";
import AdminLayout from "../components/AdminLayout";
import "../styles/wisdom.css";

const GRID_CONFIG = {
  saussure1: { cols: 16, rows: 20 },
  saussure2: { cols: 16, rows: 20 },
  saussure3: { cols: 16, rows: 20 },
  frege1: { cols: 20, rows: 25 },
  frege2: { cols: 20, rows: 25 },
  frege3: { cols: 20, rows: 25 },
  russell1: { cols: 20, rows: 25 },
  russell2: { cols: 20, rows: 25 },
  russell3: { cols: 20, rows: 25 },
  wittgenstein1: { cols: 20, rows: 25 },
  wittgenstein2: { cols: 20, rows: 25 },
  wittgenstein3: { cols: 20, rows: 25 },
};

function AdminWisdomDetailPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  // 글쓰기 리스트(학습 계획표 글쓰기 탭 등) 에서 진입했는지 — 돌아가기 동작
  const fromPath = useMemo(() => {
    const p = new URLSearchParams(location.search).get("from");
    return p || "";
  }, [location.search]);
  const handleBack = () => {
    navigate(fromPath || "/admin/wisdom");
  };
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [annotations, setAnnotations] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrText, setOcrText] = useState(null);

  useEffect(() => {
    apiGet(`/v1/admin/wisdom/posts/${postId}`)
      .then((data) => {
        setPost(data);
        if (data.feedback) {
          setComment(data.feedback.comment || "");
          if (data.feedback.correction) {
            try {
              const parsed = JSON.parse(data.feedback.correction);
              if (Array.isArray(parsed)) setAnnotations(parsed);
            } catch {
              // 레거시 텍스트
            }
          }
        }
      })
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [postId]);

  const handleSave = async () => {
    if (!comment.trim() && annotations.length === 0) {
      setMsg("코멘트 또는 첨삭 어노테이션을 입력해주세요.");
      return;
    }
    const emptyAnn = annotations.find((a) => !a.comment.trim());
    if (emptyAnn) {
      setMsg(`${emptyAnn.id}번 첨삭 코멘트를 입력해주세요.`);
      return;
    }
    setSaving(true);
    setMsg("");
    try {
      await apiPost(`/v1/admin/wisdom/posts/${postId}/feedback`, {
        comment: comment || "",
        correction:
          annotations.length > 0 ? JSON.stringify(annotations) : null,
      });
      setMsg("저장되었습니다.");
      const updated = await apiGet(`/v1/admin/wisdom/posts/${postId}`);
      setPost(updated);
    } catch (err) {
      setMsg(err.message || "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleAiFeedback = async () => {
    if (post.feedback && !confirm("기존 첨삭이 있습니다. AI 첨삭으로 덮어쓰시겠습니까?")) return;
    setAiLoading(true);
    setMsg("AI 분석 시작…");
    try {
      // 1) 비동기 enqueue → jobId 즉시 수신 (백엔드 SNAKE_CASE → camel 자동 변환)
      const enqueueRes = await apiPostDeep(`/v1/admin/wisdom/posts/${postId}/ai-feedback`);
      const jobId = enqueueRes.jobId;
      if (!jobId) {
        throw new Error("작업 생성 실패");
      }

      // 2) 2초 간격 polling (최대 5분)
      const start = Date.now();
      const TIMEOUT_MS = 5 * 60 * 1000;
      const POLL_MS = 2000;
      let lastStatus = enqueueRes.status || "PENDING";

      while (true) {
        if (Date.now() - start > TIMEOUT_MS) {
          throw new Error("AI 첨삭이 5분을 초과했습니다. 잠시 후 다시 시도해주세요.");
        }
        await new Promise((r) => setTimeout(r, POLL_MS));
        const elapsedSec = Math.floor((Date.now() - start) / 1000);
        const job = await apiGetCamel(`/v1/admin/wisdom/ai-feedback/jobs/${jobId}`);
        lastStatus = job.status;
        if (job.status === "COMPLETED") {
          if (job.comment) setComment(job.comment);
          if (job.correction) {
            try {
              const parsed = JSON.parse(job.correction);
              if (Array.isArray(parsed)) setAnnotations(parsed);
            } catch {
              // fallback
            }
          }
          setMsg("AI 첨삭 완료. 검토 후 '피드백 저장'을 눌러주세요.");
          return;
        }
        if (job.status === "FAILED") {
          throw new Error(job.errorMessage || "AI 첨삭이 실패했습니다.");
        }
        // PENDING / RUNNING — 상태 표시만 갱신
        setMsg(`AI 분석 중… (${elapsedSec}초 / ${lastStatus})`);
      }
    } catch (err) {
      setMsg(err.message || "AI 첨삭에 실패했습니다.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleOcr = async () => {
    if (post.content && !confirm("기존 텍스트가 있습니다. OCR 결과로 덮어쓰시겠습니까?")) return;
    setOcrLoading(true);
    setMsg("");
    try {
      const res = await apiPost(`/v1/admin/wisdom/posts/${postId}/ocr`);
      if (res.text) {
        setOcrText(res.text);
        setPost((prev) => ({ ...prev, content: res.text, submission_type: "manuscript" }));
        setMsg("OCR 변환 완료. 원고지에서 텍스트를 확인/수정한 후 AI 첨삭을 실행하세요.");
      } else {
        setMsg("OCR 결과가 비어 있습니다. 이미지를 확인해주세요.");
      }
    } catch (err) {
      setMsg(err.message || "OCR 변환에 실패했습니다.");
    } finally {
      setOcrLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm("이 댓글을 삭제하시겠습니까?")) return;
    try {
      await apiDelete(`/v1/admin/wisdom/comments/${commentId}`);
      setPost((prev) => ({
        ...prev,
        comments: (prev.comments || []).filter((c) => c.comment_id !== commentId),
      }));
    } catch (err) {
      alert(err.message || "댓글 삭제에 실패했습니다.");
    }
  };

  const fmtDate = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  };

  const fmtDateTime = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    return `${fmtDate(d)} ${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <AdminLayout>
        <p style={{ padding: 24, color: "#888" }}>불러오는 중...</p>
      </AdminLayout>
    );
  }

  if (!post) {
    return (
      <AdminLayout>
        <p style={{ padding: 24, color: "#888" }}>글을 찾을 수 없습니다.</p>
      </AdminLayout>
    );
  }

  const comments = post.comments || [];
  const gridCols = GRID_CONFIG[post.level_id]?.cols || 20;
  const gridRows = GRID_CONFIG[post.level_id]?.rows || 25;
  const isUpload = post.submission_type !== "manuscript";
  const hasContent = post.content && post.content.trim().length > 0;

  return (
    <AdminLayout>
      <div className="admin-topbar">
        <div>
          {fromPath && (
            <button
              type="button"
              onClick={handleBack}
              style={{
                background: "none",
                border: "none",
                color: "#2d6a4f",
                fontSize: 13,
                cursor: "pointer",
                padding: 0,
                marginBottom: 4,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
              글쓰기 리스트로
            </button>
          )}
          <h1>첨삭 작성</h1>
          <p>{post.topic_label} · {post.author_name || post.author_id}</p>
        </div>
      </div>

      <section style={{ padding: "0 24px 40px" }}>
            <div className="admin-card" style={{ marginBottom: 24 }}>
              <h2>글 정보</h2>
              <table className="admin-table">
                <tbody>
                  <tr><td style={{ fontWeight: 700, width: 100 }}>레벨</td><td>{post.level_id}</td></tr>
                  <tr><td style={{ fontWeight: 700 }}>주제</td><td>{post.topic_label}</td></tr>
                  <tr><td style={{ fontWeight: 700 }}>작성자</td><td>{post.author_name || post.author_id}</td></tr>
                  <tr><td style={{ fontWeight: 700 }}>유형</td><td>{post.submission_type === "manuscript" ? "원고지" : "파일 업로드"}</td></tr>
                  <tr><td style={{ fontWeight: 700 }}>상태</td><td>{post.status}</td></tr>
                  <tr><td style={{ fontWeight: 700 }}>작성일</td><td>{fmtDate(post.created_at)}</td></tr>
                </tbody>
              </table>
            </div>

            {/* 파일 업로드 타입: 첨부파일 표시 + OCR 버튼 */}
            {isUpload && post.attachments && post.attachments.length > 0 && (
              <div className="admin-card" style={{ marginBottom: 24 }}>
                <h2>첨부파일</h2>
                <div style={{ padding: 16 }}>
                  {post.attachments.map((att) => (
                    <a
                      key={att.file_id}
                      href={`${API_BASE}/v1/files/${att.file_id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="wis-attachment-link"
                    >
                      <span className="material-symbols-outlined">
                        {att.mime === "application/pdf" ? "picture_as_pdf" : "image"}
                      </span>
                      {att.name}
                    </a>
                  ))}
                  <div style={{ marginTop: 12 }}>
                    <button
                      className="admin-action"
                      style={{ background: "#2980b9" }}
                      onClick={handleOcr}
                      disabled={ocrLoading}
                    >
                      {ocrLoading ? "OCR 변환 중..." : "OCR → 원고지 변환"}
                    </button>
                    <span style={{ fontSize: 12, color: "#888", marginLeft: 8 }}>
                      이미지의 손글씨를 텍스트로 변환합니다
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 원고지 첨삭 영역 (원래 원고지 타입이거나 OCR 변환 후) */}
            {hasContent && (
              <div className="admin-card" style={{ marginBottom: 24 }}>
                <h2>원고지 첨삭{ocrText ? " (OCR 변환됨)" : ""}</h2>
                <p style={{ padding: "0 16px", fontSize: 13, color: "#7b6a62" }}>
                  셀을 드래그하여 첨삭 영역을 선택하세요. 선택 후 아래 줄에 코멘트를 입력합니다.
                </p>
                <div style={{ padding: 16 }}>
                  <ManuscriptReview
                    value={post.content}
                    cols={gridCols}
                    rows={gridRows}
                    annotations={annotations}
                    onAnnotationsChange={setAnnotations}
                    readOnly={false}
                  />
                </div>
              </div>
            )}

            {/* 원고지가 아니고 아직 OCR도 안 한 경우 기존 ManuscriptGrid 표시 */}
            {!hasContent && !isUpload && post.content && (
              <div className="admin-card" style={{ marginBottom: 24 }}>
                <h2>내용</h2>
                <div style={{ padding: 16 }}>
                  <ManuscriptGrid
                    value={post.content}
                    readOnly
                    cols={gridCols}
                    rows={gridRows}
                  />
                </div>
              </div>
            )}

            {/* Comments section */}
            {comments.length > 0 && (
              <div className="admin-card" style={{ marginBottom: 24 }}>
                <h2>댓글 ({comments.length})</h2>
                <div style={{ padding: "0 16px 16px" }}>
                  {comments.map((c) => (
                    <div key={c.comment_id} className="wis-comment-item">
                      <div className="wis-comment-header">
                        <span className="wis-comment-author">{c.author_name || "알 수 없음"}</span>
                        <span className="wis-comment-date">{fmtDateTime(c.created_at)}</span>
                        <button
                          className="wis-comment-delete"
                          onClick={() => handleDeleteComment(c.comment_id)}
                        >
                          삭제
                        </button>
                      </div>
                      <div className="wis-comment-content">{c.content}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="admin-card">
              <h2>코멘트</h2>
              <div className="wis-admin-feedback-form" style={{ padding: "0 16px 16px" }}>
                <div className="wis-form-group">
                  <label>코멘트 (선택)</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="전반적인 코멘트를 작성하세요..."
                  />
                </div>

                {msg && (
                  <p style={{
                    color: msg.includes("실패") || msg.includes("입력") || msg.includes("오류") ? "#e74c3c" : "#6da475",
                    fontSize: 14,
                    marginBottom: 12,
                  }}>
                    {msg}
                  </p>
                )}

                <div className="wisdom-action-bar" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="admin-action" onClick={handleSave} disabled={saving}>
                    {saving ? "저장 중..." : post.feedback ? "수정 저장" : "피드백 저장"}
                  </button>
                  <button
                    className="admin-action"
                    style={{ background: "#8e44ad" }}
                    onClick={handleAiFeedback}
                    disabled={aiLoading || !hasContent}
                    title={!hasContent ? "글 내용이 없습니다. 파일 업로드 글은 먼저 OCR 변환이 필요합니다." : ""}
                  >
                    {aiLoading ? "AI 첨삭 중..." : "AI 첨삭"}
                  </button>
                  <button
                    className="admin-action"
                    style={{ background: "#2d6a4f" }}
                    onClick={() => window.print()}
                    title="첨삭이 표시된 원고지를 인쇄합니다."
                  >
                    인쇄
                  </button>
                  <button
                    className="admin-action"
                    style={{ background: "#555" }}
                    onClick={handleBack}
                  >
                    {fromPath ? "글쓰기 리스트로" : "목록으로"}
                  </button>
                </div>
              </div>
            </div>
      </section>
    </AdminLayout>
  );
}

export default AdminWisdomDetailPage;
