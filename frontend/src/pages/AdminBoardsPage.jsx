import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import Pagination from "../components/Pagination";
import usePagination from "../hooks/usePagination";
import { useRequireRole } from "../hooks/useRequireRole";
import { apiGet, apiPost, apiPatch, apiDelete } from "../utils/adminApi";
import { camelize } from "../utils/api";
import "../styles/admin-detail.css";

// "community" 는 게시판이 아니라 채팅방으로 라우팅되므로 게시판 관리에서 제외.
// 채팅 권한 관리는 별도 (현재 단순 인증된 회원 누구나).
const BOARD_TYPE_LABELS = {
  qna: "질문 답변",
  materials: "학습 자료",
  learning_request: "학습 신청",
  inquiry: "문의/상담",
};

const ROLE_OPTIONS = [
  { value: "FREE", label: "무료 회원 이상" },
  { value: "PAID", label: "유료 회원 이상" },
  { value: "ORG_ADMIN", label: "기관 관리자 이상" },
  { value: "HQ_ADMIN", label: "본사 관리자만" },
];
const ROLE_LABEL = Object.fromEntries(ROLE_OPTIONS.map((r) => [r.value, r.label]));

function AdminBoardsPage() {
  useRequireRole("HQ_ADMIN");
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // 신규 작성 폼
  const [newBoardId, setNewBoardId] = useState("");
  const [newBoardType, setNewBoardType] = useState("community");
  const [newView, setNewView] = useState("FREE");
  const [newWrite, setNewWrite] = useState("FREE");
  const [newComment, setNewComment] = useState("FREE");

  // 편집 폼
  const [editType, setEditType] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editView, setEditView] = useState("FREE");
  const [editWrite, setEditWrite] = useState("FREE");
  const [editComment, setEditComment] = useState("FREE");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const list = await apiGet("/v1/admin/board-management");
      // adminApi는 응답을 변환하지 않음 — Spring이 snake_case로 직렬화하므로 camelize 변환 필요
      setBoards(camelize(list || []));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!newBoardId.trim()) {
      alert("게시판 ID를 입력하세요");
      return;
    }
    try {
      await apiPost("/v1/admin/board-management", {
        boardId: newBoardId,
        boardType: newBoardType,
        status: "active",
        viewMinRole: newView,
        writeMinRole: newWrite,
        commentMinRole: newComment,
      });
      setNewBoardId("");
      setNewBoardType("community");
      setNewView("FREE");
      setNewWrite("FREE");
      setNewComment("FREE");
      setShowCreate(false);
      await load();
    } catch (e) {
      alert("생성 실패: " + e.message);
    }
  };

  const startEdit = (board) => {
    setEditingId(board.boardId);
    setEditType(board.boardType);
    setEditStatus(board.status);
    setEditView(board.viewMinRole || "FREE");
    setEditWrite(board.writeMinRole || "FREE");
    setEditComment(board.commentMinRole || "FREE");
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (boardId) => {
    try {
      await apiPatch(`/v1/admin/board-management/${boardId}`, {
        boardType: editType,
        status: editStatus,
        viewMinRole: editView,
        writeMinRole: editWrite,
        commentMinRole: editComment,
      });
      setEditingId(null);
      await load();
    } catch (e) {
      alert("수정 실패: " + e.message);
    }
  };

  const { page, setPage, totalPages, paged: pagedBoards } = usePagination(boards, 15);

  const handleDelete = async (board) => {
    if (board.postCount > 0) {
      if (!window.confirm(`이 게시판에는 게시글이 ${board.postCount}개 남아있습니다.\n삭제 대신 비활성화(inactive)로 전환됩니다. 진행할까요?`)) return;
    } else {
      if (!window.confirm(`'${board.boardId}' 게시판을 삭제할까요? 게시글이 없으므로 완전 삭제됩니다.`)) return;
    }
    try {
      const res = await apiDelete(`/v1/admin/board-management/${board.boardId}`);
      const msg = res.deleted ? "삭제 완료" : `비활성화 완료 (게시글 ${res.remainingPosts}개 보존)`;
      alert(msg);
      await load();
    } catch (e) {
      alert("삭제 실패: " + e.message);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>게시판 관리</h1>
          <div className="admin-detail-header-actions">
            <Link
              to="/admin/boards/chat-archives"
              className="admin-detail-btn secondary"
            >
              💬 채팅 첨부 보관함
            </Link>
            <button
              type="button"
              className="admin-detail-btn"
              onClick={() => setShowCreate(!showCreate)}
            >
              {showCreate ? "닫기" : "＋ 신규 게시판"}
            </button>
          </div>
        </div>

        {showCreate && (
          <div className="admin-detail-card">
            <h3>신규 게시판 작성</h3>
            <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
              <label>
                <div style={{ fontSize: 13, fontWeight: 600 }}>게시판 ID *</div>
                <input
                  type="text"
                  value={newBoardId}
                  onChange={(e) => setNewBoardId(e.target.value)}
                  placeholder="예: board_announcements 또는 announcements"
                  style={{ width: "100%", padding: 8 }}
                />
                <div style={{ fontSize: 12, color: "var(--admin-muted)", marginTop: 2 }}>
                  ID는 영어/숫자/언더스코어만, 한번 정하면 변경 불가
                </div>
              </label>
              <label>
                <div style={{ fontSize: 13, fontWeight: 600 }}>게시판 유형</div>
                <select value={newBoardType} onChange={(e) => setNewBoardType(e.target.value)} style={{ padding: 8 }}>
                  <option value="qna">질문 답변</option>
                  <option value="materials">학습 자료</option>
                  <option value="learning_request">학습 신청</option>
                  <option value="inquiry">문의/상담</option>
                </select>
              </label>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>권한 매트릭스 (최소 등급)</div>
                <div style={{ display: "grid", gap: 6 }}>
                  <label style={{ display: "grid", gridTemplateColumns: "100px 1fr", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "var(--admin-muted)" }}>열람</span>
                    <select value={newView} onChange={(e) => setNewView(e.target.value)} style={{ padding: 6 }}>
                      {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </label>
                  <label style={{ display: "grid", gridTemplateColumns: "100px 1fr", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "var(--admin-muted)" }}>글쓰기</span>
                    <select value={newWrite} onChange={(e) => setNewWrite(e.target.value)} style={{ padding: 6 }}>
                      {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </label>
                  <label style={{ display: "grid", gridTemplateColumns: "100px 1fr", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "var(--admin-muted)" }}>댓글·좋아요</span>
                    <select value={newComment} onChange={(e) => setNewComment(e.target.value)} style={{ padding: 6 }}>
                      {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </label>
                </div>
                <p style={{ fontSize: 11, color: "var(--admin-muted)", margin: "4px 0 0" }}>
                  본사 관리자(HQ_ADMIN)는 모든 권한을 항상 가집니다. 학생이 유료 구독하면 연결된 학부모도 자동으로 유료로 인정됩니다.
                </p>
              </div>
              <button
                type="button"
                className="admin-detail-btn"
                onClick={handleCreate}
                style={{ alignSelf: "flex-start" }}
              >
                생성
              </button>
            </div>
          </div>
        )}

        {error && <div className="admin-error">{error}</div>}

        <div className="admin-detail-card">
        {loading ? (
          <p>불러오는 중...</p>
        ) : boards.length === 0 ? (
          <p style={{ color: "var(--admin-muted)" }}>등록된 게시판이 없습니다.</p>
        ) : (
          <table className="admin-detail-table">
            <thead>
              <tr>
                <th>게시판 ID</th>
                <th>유형</th>
                <th>열람</th>
                <th>글쓰기</th>
                <th>댓글·좋아요</th>
                <th>상태</th>
                <th>게시글</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {pagedBoards.map((b) => {
                const isEditing = editingId === b.boardId;
                return (
                  <tr key={b.boardId}>
                    <td><code>{b.boardId}</code></td>
                    <td>
                      {isEditing ? (
                        <select value={editType} onChange={(e) => setEditType(e.target.value)}>
                          <option value="qna">질문 답변</option>
                          <option value="materials">학습 자료</option>
                          <option value="learning_request">학습 신청</option>
                          <option value="inquiry">문의/상담</option>
                        </select>
                      ) : (
                        BOARD_TYPE_LABELS[b.boardType] || b.boardType
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <select value={editView} onChange={(e) => setEditView(e.target.value)}>
                          {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                      ) : (
                        <span style={{ fontSize: 12 }}>{ROLE_LABEL[b.viewMinRole] || b.viewMinRole}</span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <select value={editWrite} onChange={(e) => setEditWrite(e.target.value)}>
                          {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                      ) : (
                        <span style={{ fontSize: 12 }}>{ROLE_LABEL[b.writeMinRole] || b.writeMinRole}</span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <select value={editComment} onChange={(e) => setEditComment(e.target.value)}>
                          {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                      ) : (
                        <span style={{ fontSize: 12 }}>{ROLE_LABEL[b.commentMinRole] || b.commentMinRole}</span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                          <option value="active">활성</option>
                          <option value="inactive">비활성</option>
                        </select>
                      ) : (
                        b.status === "active" ? "활성" : "비활성"
                      )}
                    </td>
                    <td>{b.postCount}</td>
                    <td>
                      {isEditing ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button type="button" className="admin-detail-btn xs" onClick={() => saveEdit(b.boardId)}>저장</button>
                          <button type="button" className="admin-detail-btn ghost xs" onClick={cancelEdit}>취소</button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button type="button" className="admin-detail-btn secondary xs" onClick={() => startEdit(b)}>편집</button>
                          <button type="button" className="admin-detail-btn danger xs" onClick={() => handleDelete(b)}>삭제</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminBoardsPage;
