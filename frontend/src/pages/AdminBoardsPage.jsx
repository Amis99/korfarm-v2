import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { apiGet, apiPost, apiPatch, apiDelete } from "../utils/adminApi";
import "../styles/admin-detail.css";

const BOARD_TYPE_LABELS = {
  community: "커뮤니티",
  qna: "질문 답변",
  materials: "학습 자료",
  learning_request: "학습 신청",
  inquiry: "문의/상담",
};

function AdminBoardsPage() {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // 신규 작성 폼
  const [newBoardId, setNewBoardId] = useState("");
  const [newBoardType, setNewBoardType] = useState("community");
  const [newOrgScope, setNewOrgScope] = useState("public");

  // 편집 폼
  const [editType, setEditType] = useState("");
  const [editScope, setEditScope] = useState("");
  const [editStatus, setEditStatus] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const list = await apiGet("/v1/admin/board-management");
      setBoards(list || []);
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
        orgScope: newOrgScope,
        status: "active",
      });
      setNewBoardId("");
      setNewBoardType("community");
      setNewOrgScope("public");
      setShowCreate(false);
      await load();
    } catch (e) {
      alert("생성 실패: " + e.message);
    }
  };

  const startEdit = (board) => {
    setEditingId(board.boardId);
    setEditType(board.boardType);
    setEditScope(board.orgScope);
    setEditStatus(board.status);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (boardId) => {
    try {
      await apiPatch(`/v1/admin/board-management/${boardId}`, {
        boardType: editType,
        orgScope: editScope,
        status: editStatus,
      });
      setEditingId(null);
      await load();
    } catch (e) {
      alert("수정 실패: " + e.message);
    }
  };

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
          <button
            type="button"
            className="ldb-btn ldb-btn-primary"
            onClick={() => setShowCreate(!showCreate)}
          >
            {showCreate ? "닫기" : "＋ 신규 게시판"}
          </button>
        </div>

        {showCreate && (
          <div className="admin-card" style={{ padding: 20, marginBottom: 24 }}>
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
                <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                  ID는 영어/숫자/언더스코어만, 한번 정하면 변경 불가
                </div>
              </label>
              <label>
                <div style={{ fontSize: 13, fontWeight: 600 }}>게시판 유형</div>
                <select value={newBoardType} onChange={(e) => setNewBoardType(e.target.value)} style={{ padding: 8 }}>
                  <option value="community">커뮤니티</option>
                  <option value="qna">질문 답변</option>
                  <option value="materials">학습 자료</option>
                  <option value="learning_request">학습 신청</option>
                  <option value="inquiry">문의/상담</option>
                </select>
              </label>
              <label>
                <div style={{ fontSize: 13, fontWeight: 600 }}>접근 범위</div>
                <select value={newOrgScope} onChange={(e) => setNewOrgScope(e.target.value)} style={{ padding: 8 }}>
                  <option value="public">전체 공개</option>
                  <option value="org">기관 한정</option>
                </select>
              </label>
              <button
                type="button"
                className="ldb-btn ldb-btn-primary"
                onClick={handleCreate}
                style={{ alignSelf: "flex-start" }}
              >
                생성
              </button>
            </div>
          </div>
        )}

        {error && <div style={{ color: "#a00", marginBottom: 16 }}>{error}</div>}

        {loading ? (
          <p>불러오는 중...</p>
        ) : boards.length === 0 ? (
          <p style={{ color: "#888" }}>등록된 게시판이 없습니다.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>게시판 ID</th>
                <th>유형</th>
                <th>범위</th>
                <th>상태</th>
                <th>게시글 수</th>
                <th>생성일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {boards.map((b) => {
                const isEditing = editingId === b.boardId;
                return (
                  <tr key={b.boardId}>
                    <td><code>{b.boardId}</code></td>
                    <td>
                      {isEditing ? (
                        <select value={editType} onChange={(e) => setEditType(e.target.value)}>
                          <option value="community">커뮤니티</option>
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
                        <select value={editScope} onChange={(e) => setEditScope(e.target.value)}>
                          <option value="public">전체 공개</option>
                          <option value="org">기관 한정</option>
                        </select>
                      ) : (
                        b.orgScope === "public" ? "전체" : "기관"
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
                    <td>{b.createdAt?.slice(0, 10)}</td>
                    <td>
                      {isEditing ? (
                        <>
                          <button type="button" className="ldb-btn ldb-btn-primary" onClick={() => saveEdit(b.boardId)}>저장</button>
                          <button type="button" className="ldb-btn ldb-btn-ghost" onClick={cancelEdit}>취소</button>
                        </>
                      ) : (
                        <>
                          <button type="button" className="ldb-btn ldb-btn-ghost" onClick={() => startEdit(b)}>편집</button>
                          <button type="button" className="ldb-btn ldb-btn-ghost" onClick={() => handleDelete(b)} style={{ color: "#a00" }}>삭제</button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminBoardsPage;
