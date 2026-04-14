import { useSearchParams, useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { COMMUNITY_BOARDS } from "../data/communityBoards";
import { apiPost, apiUploadFile } from "../utils/api";
import "../styles/community.css";

const formatBytes = (size) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

function PostWritePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { isLoggedIn, user, isPremium } = useAuth();
  const isAdmin = user?.roles?.includes("ADMIN") || user?.roles?.includes("HQ_ADMIN") || user?.roles?.includes("ORG_ADMIN");

  const boardId = params.get("board") || "qna";
  const board = COMMUNITY_BOARDS.find((b) => b.id === boardId) || COMMUNITY_BOARDS[0];

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);

  // qna, materials 게시판은 첨부 가능
  const supportsAttachments = board.id === "materials" || board.id === "qna";
  const isQna = board.id === "qna";

  const handleFilePick = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    for (const file of files) {
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      setAttachments((prev) => [
        ...prev,
        { tempId, fileId: null, name: file.name, size: file.size, mime: file.type, uploading: true, error: null },
      ]);
      try {
        const presign = await apiPost("/v1/files/presign", {
          purpose: "board_attachment",
          filename: file.name,
          mime: file.type || "application/octet-stream",
          size: file.size,
        });
        const fileId = presign.fileId || presign.file_id;
        await apiUploadFile(fileId, file);
        setAttachments((prev) =>
          prev.map((a) => (a.tempId === tempId ? { ...a, fileId, uploading: false } : a))
        );
      } catch (err) {
        setAttachments((prev) =>
          prev.map((a) => (a.tempId === tempId ? { ...a, uploading: false, error: err.message || "업로드 실패" } : a))
        );
      }
    }
  };

  const removeAttachment = (tempId) => {
    setAttachments((prev) => prev.filter((a) => a.tempId !== tempId));
  };

  const handleSubmit = async () => {
    if (board.writeRole === "admin" && !isAdmin) {
      setError("관리자만 작성할 수 있는 게시판입니다.");
      return;
    }
    if (!title.trim()) { setError("제목을 입력하세요."); return; }
    if (!content.trim()) { setError("내용을 입력하세요."); return; }
    if (attachments.some((a) => a.uploading)) {
      setError("파일 업로드가 끝날 때까지 기다려 주세요.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const attachmentIds = attachments
        .filter((a) => a.fileId && !a.error)
        .map((a) => a.fileId);
      await apiPost(`/v1/boards/${boardId}/posts`, {
        title: title.trim(),
        content: content.trim(),
        attachmentIds,
      });
      navigate(`/community?board=${boardId}`);
    } catch (e) {
      setError(e.message || "게시글 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="comm-write-page">
        <div className="comm-write-card">
          <p style={{ textAlign: "center", padding: "40px 0", color: "#888" }}>
            게시글을 작성하려면 로그인이 필요합니다.
          </p>
          <button className="comm-write-submit" onClick={() => navigate("/login")}>
            로그인하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="comm-write-page">
      <div className="comm-write-card">
        <div className="comm-write-top">
          <button
            type="button"
            className="comm-write-back"
            onClick={() => navigate(`/community?board=${boardId}`)}
          >
            ← {board.name}으로 돌아가기
          </button>
          <h2>게시글 작성</h2>
          <p className="comm-write-board-name">{board.name}</p>
        </div>

        {isQna && (
          <div className="comm-write-notice">
            문제 질문을 올릴 때에는 해당 문제와 지문을 잘 보이게 찍어서 함께 올려주세요.
          </div>
        )}

        <div className="comm-write-form">
          <input
            className="comm-write-title"
            type="text"
            placeholder="제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="comm-write-content"
            placeholder="내용을 입력하세요"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
          />

          {supportsAttachments && (
            <div className="comm-write-attach">
              <div className="comm-write-attach-header">
                <span className="comm-write-attach-label">
                  {isQna ? "이미지 첨부" : "파일 첨부"}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={isQna ? "image/*" : undefined}
                  style={{ display: "none" }}
                  onChange={handleFilePick}
                />
                <button
                  type="button"
                  className="comm-write-attach-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isQna ? "이미지 선택" : "파일 선택"}
                </button>
              </div>
              {attachments.length > 0 && (
                <ul className="comm-write-attach-list">
                  {attachments.map((a) => (
                    <li key={a.tempId} className="comm-write-attach-item">
                      <span className="comm-write-attach-name">{a.name}</span>
                      <span className="comm-write-attach-size">{formatBytes(a.size)}</span>
                      {a.uploading && <span className="comm-write-attach-status">업로드 중...</span>}
                      {a.error && <span className="comm-write-attach-error">실패</span>}
                      {a.fileId && !a.uploading && <span className="comm-write-attach-ok">✓</span>}
                      <button type="button" className="comm-write-attach-remove" onClick={() => removeAttachment(a.tempId)}>×</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {error && <p className="comm-write-error">{error}</p>}

          <div className="comm-write-actions">
            <button
              type="button"
              className="comm-write-cancel"
              onClick={() => navigate(`/community?board=${boardId}`)}
            >
              취소
            </button>
            <button
              type="button"
              className="comm-write-submit"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "등록 중..." : "등록하기"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PostWritePage;
