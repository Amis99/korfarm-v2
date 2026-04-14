import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { COMMUNITY_BOARDS } from "../data/communityBoards";
import { apiPost, apiUploadFile } from "../utils/api";
import "../styles/community.css";

const DEFAULT_BOARD_ID = "community";

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

  const boardId = params.get("board") || DEFAULT_BOARD_ID;
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  // 첨부 파일: [{ fileId, name, size, mime, uploading, error }]
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);

  const board =
    COMMUNITY_BOARDS.find((item) => item.id === boardId) || COMMUNITY_BOARDS[0];

  // 학습 자료 게시판이면 파일 업로드 활성화
  const supportsAttachments = board.id === "materials";

  const handleFilePick = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (files.length === 0) return;
    for (const file of files) {
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      setAttachments((prev) => [
        ...prev,
        { tempId, fileId: null, name: file.name, size: file.size, mime: file.type, uploading: true, error: null },
      ]);
      try {
        // 1) presign으로 fileId 발급
        const presign = await apiPost("/v1/files/presign", {
          purpose: "board_attachment",
          filename: file.name,
          mime: file.type || "application/octet-stream",
          size: file.size,
        });
        const fileId = presign.fileId || presign.file_id;
        // 2) 실제 파일 업로드
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
    if (board.requiresPaid && !isPremium && !isAdmin) {
      setError("유료 회원만 작성할 수 있는 게시판입니다.");
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
      const data = await apiPost(`/v1/boards/${boardId}/posts`, {
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
      <div className="community-page post-editor">
        <div className="community-wrap">
          <div className="post-header">
            <Link to="/community">커뮤니티로 돌아가기</Link>
            <h1>로그인이 필요합니다</h1>
          </div>
          <p style={{ textAlign: "center", padding: "40px 0" }}>
            게시글을 작성하려면 로그인이 필요합니다.
          </p>
          <div style={{ textAlign: "center" }}>
            <Link to="/login" className="community-btn" style={{ display: "inline-block" }}>
              로그인하기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="community-page post-editor">
      <div className="community-wrap">
        <div className="post-header">
          <Link to={`/community?board=${board.id}`}>게시판으로 돌아가기</Link>
          <h1>게시글 작성</h1>
        </div>
        <form onSubmit={(e) => e.preventDefault()}>
          <p className="community-helper" style={{ marginBottom: 12 }}>
            <strong>{board.name}</strong>에 글을 작성합니다.
          </p>

          <input
            type="text"
            placeholder="제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            placeholder="내용을 입력하세요"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          {supportsAttachments && (
            <div style={{ marginTop: 12, padding: 12, background: "#f8f4ec", borderRadius: 6, border: "1px solid #d8c4a8" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <strong style={{ fontSize: 14 }}>첨부 파일</strong>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  style={{ display: "none" }}
                  onChange={handleFilePick}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ padding: "4px 12px", fontSize: 13, cursor: "pointer" }}
                >
                  파일 선택
                </button>
              </div>
              {attachments.length > 0 && (
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
                  {attachments.map((a) => (
                    <li
                      key={a.tempId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "4px 8px",
                        background: "#fff",
                        borderRadius: 4,
                        fontSize: 13,
                      }}
                    >
                      <span style={{ flex: 1 }}>{a.name}</span>
                      <span style={{ color: "#888" }}>{formatBytes(a.size)}</span>
                      {a.uploading && <span style={{ color: "#888" }}>업로드 중...</span>}
                      {a.error && <span style={{ color: "#e74c3c" }}>실패: {a.error}</span>}
                      {a.fileId && !a.uploading && <span style={{ color: "#4a8030" }}>✓</span>}
                      <button type="button" onClick={() => removeAttachment(a.tempId)} style={{ cursor: "pointer" }}>
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {error && <p className="community-helper" style={{ color: "#e74c3c" }}>{error}</p>}

          <button
            className="community-btn"
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "등록 중..." : "등록하기"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PostWritePage;
